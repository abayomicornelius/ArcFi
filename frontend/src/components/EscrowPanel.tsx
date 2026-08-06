"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { contracts } from "@/lib/contracts";
import { useApproveAndSend, useTx } from "@/lib/hooks";
import { Card, Field, Input, Button, TxStatus, Pill, Skeleton } from "./ui";

const STATUS_LABEL = ["None", "Funded", "Paid", "Refunded"] as const;

function toUnixSeconds(datetimeLocal: string) {
  return BigInt(Math.floor(new Date(datetimeLocal).getTime() / 1000));
}

export function EscrowPanel() {
  const { isConnected } = useAccount();
  const [issueId, setIssueId] = useState("1");
  const [amount, setAmount] = useState("100");
  const [deadline, setDeadline] = useState("");
  const [recipient, setRecipient] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  const fundTx = useApproveAndSend();
  const releaseTx = useTx();
  const refundTx = useTx();
  const extendTx = useTx();

  const issueIdBig = issueId ? BigInt(issueId) : undefined;

  const { data: escrow, isLoading: escrowLoading, refetch } = useReadContract({
    address: contracts.escrow.address,
    abi: contracts.escrow.abi,
    functionName: "getEscrow",
    args: issueIdBig !== undefined ? [issueIdBig] : undefined,
    query: { enabled: issueIdBig !== undefined },
  });

  const escrowData = escrow as
    | { sponsor: `0x${string}`; amount: bigint; status: number; createdAt: bigint; deadline: bigint }
    | undefined;
  const status = escrowData ? STATUS_LABEL[escrowData.status] : undefined;

  async function handleFund() {
    if (!issueIdBig || !deadline) return;
    const amountWei = parseUnits(amount || "0", 6);
    try {
      await fundTx.send({
        token: contracts.usdc,
        spender: contracts.escrow.address,
        amount: amountWei,
        action: {
          address: contracts.escrow.address,
          abi: contracts.escrow.abi,
          functionName: "fund",
          args: [issueIdBig, amountWei, toUnixSeconds(deadline)],
        },
        label: `Fund issue #${issueId}`,
      });
      refetch();
    } catch {
      /* toast already reported */
    }
  }

  async function handleRelease() {
    if (!issueIdBig || !recipient) return;
    try {
      await releaseTx.send(
        {
          address: contracts.escrow.address,
          abi: contracts.escrow.abi,
          functionName: "release",
          args: [issueIdBig, [{ account: recipient, bps: 10_000 }]],
        },
        `Release issue #${issueId}`,
      );
      refetch();
    } catch {
      /* toast already reported */
    }
  }

  async function handleRefund() {
    if (!issueIdBig) return;
    try {
      await refundTx.send(
        {
          address: contracts.escrow.address,
          abi: contracts.escrow.abi,
          functionName: "refund",
          args: [issueIdBig],
        },
        `Refund issue #${issueId}`,
      );
      refetch();
    } catch {
      /* toast already reported */
    }
  }

  async function handleExtend() {
    if (!issueIdBig || !newDeadline) return;
    try {
      await extendTx.send(
        {
          address: contracts.escrow.address,
          abi: contracts.escrow.abi,
          functionName: "extendDeadline",
          args: [issueIdBig, toUnixSeconds(newDeadline)],
        },
        `Extend issue #${issueId} deadline`,
      );
      refetch();
    } catch {
      /* toast already reported */
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <h3 className="mb-1 text-base font-semibold text-ink-900">Look up an issue escrow</h3>
        <p className="mb-4 text-sm text-ink-500">Every bounty is keyed by a GitHub issue ID.</p>
        <Field label="Issue ID">
          <Input value={issueId} onChange={(e) => setIssueId(e.target.value)} placeholder="e.g. 1042" inputMode="numeric" />
        </Field>

        {escrowLoading && (
          <div className="mt-4 space-y-3 rounded-xl bg-ink-50 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {!escrowLoading && escrowData && status && (
          <div className="mt-4 space-y-2 rounded-xl bg-ink-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Status</span>
              <Pill tone={status === "Funded" ? "warn" : status === "Paid" ? "good" : "neutral"}>{status}</Pill>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Sponsor</span>
              <span className="font-mono text-xs text-ink-700">{escrowData.sponsor}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Amount</span>
              <span className="font-mono text-ink-700">{formatUnits(escrowData.amount, 6)} USDC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Deadline</span>
              <span className="font-mono text-xs text-ink-700">
                {escrowData.deadline > 0n ? new Date(Number(escrowData.deadline) * 1000).toLocaleString() : "—"}
              </span>
            </div>
          </div>
        )}
      </Card>

      <div className="space-y-6">
        <Card>
          <h3 className="mb-4 text-base font-semibold text-ink-900">1. Sponsor: fund a bounty</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount (USDC)">
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Deadline">
              <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </Field>
          </div>
          <Button
            className="mt-4"
            onClick={handleFund}
            loading={fundTx.state === "pending" || fundTx.state === "confirming"}
            disabled={!isConnected || fundTx.state === "pending" || fundTx.state === "confirming"}
          >
            {fundTx.state === "pending" ? "Approving…" : fundTx.state === "confirming" ? "Funding…" : "Approve & Fund"}
          </Button>
          <TxStatus {...fundTx} />
        </Card>

        <Card>
          <h3 className="mb-4 text-base font-semibold text-ink-900">2. Oracle: release on PR merge</h3>
          <Field label="Contributor address">
            <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x…" />
          </Field>
          <p className="mt-2 text-xs text-ink-400">Only the configured admin/oracle address can call this.</p>
          <div className="mt-4 flex gap-3">
            <Button
              onClick={handleRelease}
              loading={releaseTx.state === "pending" || releaseTx.state === "confirming"}
              disabled={!isConnected || releaseTx.state === "pending" || releaseTx.state === "confirming"}
            >
              Release payout
            </Button>
            <Button
              variant="danger"
              onClick={handleRefund}
              loading={refundTx.state === "pending" || refundTx.state === "confirming"}
              disabled={!isConnected || refundTx.state === "pending" || refundTx.state === "confirming"}
            >
              Refund
            </Button>
          </div>
          <TxStatus {...releaseTx} />
          <TxStatus {...refundTx} />
        </Card>

        <Card>
          <h3 className="mb-4 text-base font-semibold text-ink-900">3. Sponsor: extend deadline</h3>
          <Field label="New deadline" hint="Must be later than the current deadline.">
            <Input type="datetime-local" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
          </Field>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={handleExtend}
            loading={extendTx.state === "pending" || extendTx.state === "confirming"}
            disabled={!isConnected || extendTx.state === "pending" || extendTx.state === "confirming"}
          >
            Extend
          </Button>
          <TxStatus {...extendTx} />
        </Card>
      </div>
    </div>
  );
}
