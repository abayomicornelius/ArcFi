"use client";

import { useCallback, useState } from "react";
import { useWriteContract, usePublicClient, useAccount } from "wagmi";
import type { Address, Abi } from "viem";

export type TxState = "idle" | "pending" | "confirming" | "success" | "error";

/**
 * Wraps a single contract write in submit -> mined lifecycle state, since
 * every action in ArcFi (approve, fund, release, deposit, withdraw...) needs
 * the same "submitted / confirming / confirmed / failed" UI treatment.
 */
export function useTx() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [state, setState] = useState<TxState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<`0x${string}` | null>(null);

  const send = useCallback(
    async (params: Parameters<typeof writeContractAsync>[0]) => {
      setState("pending");
      setError(null);
      try {
        const txHash = await writeContractAsync(params);
        setHash(txHash);
        setState("confirming");
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: txHash });
        }
        setState("success");
        return txHash;
      } catch (err) {
        setState("error");
        setError(err instanceof Error ? err.message : "Transaction failed");
        throw err;
      }
    },
    [writeContractAsync, publicClient],
  );

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
    setHash(null);
  }, []);

  return { send, state, error, hash, reset };
}

export function isZeroAddress(address: Address | undefined) {
  return !address || address === "0x0000000000000000000000000000000000000000";
}

/**
 * ArcFi's three deposit entrypoints (fund / createMilestone / deposit) all
 * pull USDC via transferFrom, so they all need "approve if the allowance is
 * short, then call" before the actual write. One hook covers all three.
 */
export function useApproveAndSend() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<TxState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<`0x${string}` | null>(null);

  const send = useCallback(
    async ({
      token,
      spender,
      amount,
      action,
    }: {
      token: { address: Address; abi: Abi };
      spender: Address;
      amount: bigint;
      action: Parameters<typeof writeContractAsync>[0];
    }) => {
      if (!address || !publicClient) throw new Error("Connect a wallet first");
      setState("pending");
      setError(null);
      try {
        const allowance = (await publicClient.readContract({
          address: token.address,
          abi: token.abi,
          functionName: "allowance",
          args: [address, spender],
        })) as bigint;

        if (allowance < amount) {
          const approveHash = await writeContractAsync({
            address: token.address,
            abi: token.abi,
            functionName: "approve",
            args: [spender, amount],
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }

        setState("confirming");
        const txHash = await writeContractAsync(action);
        setHash(txHash);
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        setState("success");
        return txHash;
      } catch (err) {
        setState("error");
        setError(err instanceof Error ? err.message : "Transaction failed");
        throw err;
      }
    },
    [address, publicClient, writeContractAsync],
  );

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
    setHash(null);
  }, []);

  return { send, state, error, hash, reset };
}
