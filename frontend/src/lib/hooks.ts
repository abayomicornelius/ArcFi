"use client";

import { useCallback, useState } from "react";
import { useWriteContract, usePublicClient, useAccount } from "wagmi";
import type { Address, Abi } from "viem";
import { toast } from "sonner";

export type TxState = "idle" | "pending" | "confirming" | "success" | "error";

function shortHash(hash: string) {
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

function errorMessage(err: unknown) {
  if (err instanceof Error) {
    // wagmi/viem errors often have a long "Details:" / "Docs:" tail — keep the first line.
    return err.message.split("\n")[0].slice(0, 140);
  }
  return "Transaction failed";
}

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
    async (params: Parameters<typeof writeContractAsync>[0], label = "Transaction") => {
      const toastId = toast.loading(`${label} — confirm in wallet…`);
      setState("pending");
      setError(null);
      try {
        const txHash = await writeContractAsync(params);
        setHash(txHash);
        setState("confirming");
        toast.loading(`${label} — waiting for confirmation…`, { id: toastId, description: shortHash(txHash) });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: txHash });
        }
        setState("success");
        toast.success(`${label} confirmed`, { id: toastId, description: shortHash(txHash) });
        return txHash;
      } catch (err) {
        setState("error");
        const message = errorMessage(err);
        setError(message);
        toast.error(`${label} failed`, { id: toastId, description: message });
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
      label = "Transaction",
    }: {
      token: { address: Address; abi: Abi };
      spender: Address;
      amount: bigint;
      action: Parameters<typeof writeContractAsync>[0];
      label?: string;
    }) => {
      if (!address || !publicClient) {
        toast.error("Connect a wallet first");
        throw new Error("Connect a wallet first");
      }
      const toastId = toast.loading(`${label} — checking USDC allowance…`);
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
          toast.loading(`${label} — approve USDC in wallet…`, { id: toastId });
          const approveHash = await writeContractAsync({
            address: token.address,
            abi: token.abi,
            functionName: "approve",
            args: [spender, amount],
          });
          toast.loading(`${label} — confirming approval…`, { id: toastId, description: shortHash(approveHash) });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }

        setState("confirming");
        toast.loading(`${label} — confirm in wallet…`, { id: toastId });
        const txHash = await writeContractAsync(action);
        setHash(txHash);
        toast.loading(`${label} — waiting for confirmation…`, { id: toastId, description: shortHash(txHash) });
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        setState("success");
        toast.success(`${label} confirmed`, { id: toastId, description: shortHash(txHash) });
        return txHash;
      } catch (err) {
        setState("error");
        const message = errorMessage(err);
        setError(message);
        toast.error(`${label} failed`, { id: toastId, description: message });
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
