"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { contracts } from "@/lib/contracts";
import { useApproveAndSend, useTx } from "@/lib/hooks";
import { Card, Field, Input, Button, TxStatus } from "./ui";

export function MaintenancePoolPanel() {
  const { isConnected } = useAccount();
  const [poolId, setPoolId] = useState("1");
  const [depositAmount, setDepositAmount] = useState("50");
  const [withdrawRecipient, setWithdrawRecipient] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const depositTx = useApproveAndSend();
  const withdrawTx = useTx();

  const poolIdBig = poolId ? BigInt(poolId) : undefined;

  const { data: pool, refetch } = useReadContract({
    address: contracts.maintenancePool.address,
    abi: contracts.maintenancePool.abi,
    functionName: "getPool",
    args: poolIdBig !== undefined ? [poolIdBig] : undefined,
    query: { enabled: poolIdBig !== undefined },
  });

  const poolData = pool as
    | { balance: bigint; totalDeposited: bigint; totalWithdrawn: bigint; createdAt: bigint; depositCount: number }
    | undefined;

  async function handleDeposit() {
    if (!poolIdBig) return;
    const amountWei = parseUnits(depositAmount || "0", 6);
    await depositTx.send({
      token: contracts.usdc,
      spender: contracts.maintenancePool.address,
      amount: amountWei,
      action: {
        address: contracts.maintenancePool.address,
        abi: contracts.maintenancePool.abi,
        functionName: "deposit",
        args: [poolIdBig, amountWei],
      },
    });
    refetch();
  }

  async function handleWithdraw() {
    if (!poolIdBig || !withdrawRecipient || !withdrawAmount) return;
    await withdrawTx.send({
      address: contracts.maintenancePool.address,
      abi: contracts.maintenancePool.abi,
      functionName: "withdraw",
      args: [poolIdBig, withdrawRecipient, parseUnits(withdrawAmount, 6)],
    });
    refetch();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <h3 className="mb-1 text-base font-semibold text-ink-900">Look up a maintenance pool</h3>
        <p className="mb-4 text-sm text-ink-500">
          Recurring funding for a repo/org, keyed by an off-chain <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">poolId</code> — not tied
          to any single issue.
        </p>
        <Field label="Pool ID">
          <Input value={poolId} onChange={(e) => setPoolId(e.target.value)} inputMode="numeric" />
        </Field>

        {poolData && (
          <div className="mt-4 space-y-2 rounded-xl bg-ink-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Balance</span>
              <span className="font-mono text-ink-700">{formatUnits(poolData.balance, 6)} USDC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Total deposited</span>
              <span className="font-mono text-ink-700">{formatUnits(poolData.totalDeposited, 6)} USDC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Total withdrawn</span>
              <span className="font-mono text-ink-700">{formatUnits(poolData.totalWithdrawn, 6)} USDC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Deposits recorded</span>
              <span className="font-mono text-ink-700">{poolData.depositCount}</span>
            </div>
          </div>
        )}
      </Card>

      <div className="space-y-6">
        <Card>
          <h3 className="mb-4 text-base font-semibold text-ink-900">Sponsor: fund ongoing maintenance</h3>
          <p className="mb-4 text-sm text-ink-500">Any sponsor can deposit, any time — the pool is created on first deposit.</p>
          <Field label="Amount (USDC)">
            <Input value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} inputMode="decimal" />
          </Field>
          <Button className="mt-4" onClick={handleDeposit} disabled={!isConnected || depositTx.state === "pending" || depositTx.state === "confirming"}>
            {depositTx.state === "pending" ? "Approving…" : depositTx.state === "confirming" ? "Depositing…" : "Approve & Deposit"}
          </Button>
          <TxStatus {...depositTx} />
        </Card>

        <Card>
          <h3 className="mb-4 text-base font-semibold text-ink-900">Oracle: authorize a maintainer draw-down</h3>
          <p className="mb-4 text-sm text-ink-500">Not tied to a specific PR — the oracle vouches for off-chain-adjudicated maintenance work.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Recipient address">
              <Input value={withdrawRecipient} onChange={(e) => setWithdrawRecipient(e.target.value)} placeholder="0x…" />
            </Field>
            <Field label="Amount (USDC)">
              <Input value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} inputMode="decimal" />
            </Field>
          </div>
          <Button variant="secondary" className="mt-4" onClick={handleWithdraw} disabled={!isConnected || withdrawTx.state === "pending" || withdrawTx.state === "confirming"}>
            Withdraw
          </Button>
          <TxStatus {...withdrawTx} />
        </Card>
      </div>
    </div>
  );
}
