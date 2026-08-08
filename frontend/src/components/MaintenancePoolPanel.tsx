"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { toast } from "sonner";
import { contracts } from "@/lib/contracts";
import { useApproveAndSend, useTx } from "@/lib/hooks";
import { Card, Field, Input, Button, TxStatus, ActionTabs } from "./ui";

type ActionTab = "deposit" | "withdraw";
const TABS: { id: ActionTab; label: string }[] = [
  { id: "deposit", label: "Deposit" },
  { id: "withdraw", label: "Withdraw" },
];

export function MaintenancePoolPanel() {
  const { isConnected } = useAccount();
  const [tab, setTab] = useState<ActionTab>("deposit");
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
    if (!poolIdBig) {
      toast.error("Enter a pool ID first");
      return;
    }
    const amountWei = parseUnits(depositAmount || "0", 6);
    try {
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
        label: `Deposit to pool #${poolId}`,
      });
      refetch();
    } catch {
      /* toast already reported */
    }
  }

  async function handleWithdraw() {
    if (!poolIdBig) {
      toast.error("Enter a pool ID first");
      return;
    }
    if (!withdrawRecipient || !withdrawAmount) {
      toast.error("Enter both a recipient address and an amount");
      return;
    }
    try {
      await withdrawTx.send(
        {
          address: contracts.maintenancePool.address,
          abi: contracts.maintenancePool.abi,
          functionName: "withdraw",
          args: [poolIdBig, withdrawRecipient, parseUnits(withdrawAmount, 6)],
        },
        `Withdraw from pool #${poolId}`,
      );
      refetch();
    } catch {
      /* toast already reported */
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Field
            label="Pool ID"
            hint={
              <>
                Recurring funding for a repo/org, keyed by an off-chain <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">poolId</code> —
                not tied to any single issue.
              </>
            }
          >
            <Input value={poolId} onChange={(e) => setPoolId(e.target.value)} inputMode="numeric" className="w-36" />
          </Field>
        </div>

        {poolData && (
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink-100 pt-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-ink-400">Balance</span>
              <span className="font-mono text-ink-700">{formatUnits(poolData.balance, 6)} USDC</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-ink-400">Total deposited</span>
              <span className="font-mono text-ink-700">{formatUnits(poolData.totalDeposited, 6)} USDC</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-ink-400">Total withdrawn</span>
              <span className="font-mono text-ink-700">{formatUnits(poolData.totalWithdrawn, 6)} USDC</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-ink-400">Deposits recorded</span>
              <span className="font-mono text-ink-700">{poolData.depositCount}</span>
            </span>
          </div>
        )}
      </Card>

      <Card>
        <ActionTabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === "deposit" && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-400">Sponsor action</p>
            <p className="mb-4 text-sm text-ink-500">Any sponsor can deposit, any time — the pool is created on first deposit.</p>
            <Field label="Amount (USDC)">
              <Input value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} inputMode="decimal" />
            </Field>
            <Button
              className="mt-4"
              onClick={handleDeposit}
              loading={depositTx.state === "pending" || depositTx.state === "confirming"}
              disabled={!isConnected || depositTx.state === "pending" || depositTx.state === "confirming"}
              title={!isConnected ? "Connect a wallet first" : undefined}
            >
              {depositTx.state === "pending" ? "Approving…" : depositTx.state === "confirming" ? "Depositing…" : "Approve & Deposit"}
            </Button>
            <TxStatus {...depositTx} />
          </div>
        )}

        {tab === "withdraw" && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-400">Oracle action</p>
            <p className="mb-4 text-sm text-ink-500">Not tied to a specific PR — the oracle vouches for off-chain-adjudicated maintenance work.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Recipient address">
                <Input value={withdrawRecipient} onChange={(e) => setWithdrawRecipient(e.target.value)} placeholder="0x…" />
              </Field>
              <Field label="Amount (USDC)">
                <Input value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} inputMode="decimal" />
              </Field>
            </div>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={handleWithdraw}
              loading={withdrawTx.state === "pending" || withdrawTx.state === "confirming"}
              disabled={!isConnected || withdrawTx.state === "pending" || withdrawTx.state === "confirming"}
              title={!isConnected ? "Connect a wallet first" : undefined}
            >
              Withdraw
            </Button>
            <TxStatus {...withdrawTx} />
          </div>
        )}
      </Card>
    </div>
  );
}
