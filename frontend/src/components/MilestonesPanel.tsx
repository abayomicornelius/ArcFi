"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { contracts } from "@/lib/contracts";
import { useApproveAndSend, useTx } from "@/lib/hooks";
import { Card, Field, Input, Button, TxStatus, Pill } from "./ui";

const ISSUE_STATUS_LABEL = ["None", "Allocated", "Released"] as const;

export function MilestonesPanel() {
  const { isConnected } = useAccount();
  const [milestoneId, setMilestoneId] = useState("1");
  const [budget, setBudget] = useState("5000");
  const [allocIssueId, setAllocIssueId] = useState("");
  const [allocAmount, setAllocAmount] = useState("");
  const [releaseIssueId, setReleaseIssueId] = useState("");
  const [recipient, setRecipient] = useState("");

  const createTx = useApproveAndSend();
  const allocateTx = useTx();
  const releaseTx = useTx();
  const cancelTx = useTx();

  const milestoneIdBig = milestoneId ? BigInt(milestoneId) : undefined;

  const { data: milestone, refetch: refetchMilestone } = useReadContract({
    address: contracts.milestones.address,
    abi: contracts.milestones.abi,
    functionName: "getMilestone",
    args: milestoneIdBig !== undefined ? [milestoneIdBig] : undefined,
    query: { enabled: milestoneIdBig !== undefined },
  });

  const { data: issueStatus } = useReadContract({
    address: contracts.milestones.address,
    abi: contracts.milestones.abi,
    functionName: "getIssueStatus",
    args:
      milestoneIdBig !== undefined && releaseIssueId ? [milestoneIdBig, BigInt(releaseIssueId)] : undefined,
    query: { enabled: milestoneIdBig !== undefined && !!releaseIssueId },
  });

  const milestoneData = milestone as
    | { sponsor: `0x${string}`; totalBudget: bigint; remainingBudget: bigint; createdAt: bigint; closed: boolean }
    | undefined;

  async function handleCreate() {
    if (!milestoneIdBig) return;
    const amountWei = parseUnits(budget || "0", 6);
    await createTx.send({
      token: contracts.usdc,
      spender: contracts.milestones.address,
      amount: amountWei,
      action: {
        address: contracts.milestones.address,
        abi: contracts.milestones.abi,
        functionName: "createMilestone",
        args: [milestoneIdBig, amountWei],
      },
    });
    refetchMilestone();
  }

  async function handleAllocate() {
    if (!milestoneIdBig || !allocIssueId || !allocAmount) return;
    await allocateTx.send({
      address: contracts.milestones.address,
      abi: contracts.milestones.abi,
      functionName: "allocate",
      args: [milestoneIdBig, BigInt(allocIssueId), parseUnits(allocAmount, 6)],
    });
    refetchMilestone();
  }

  async function handleRelease() {
    if (!milestoneIdBig || !releaseIssueId || !recipient) return;
    await releaseTx.send({
      address: contracts.milestones.address,
      abi: contracts.milestones.abi,
      functionName: "releaseIssue",
      args: [milestoneIdBig, BigInt(releaseIssueId), [{ account: recipient, bps: 10_000 }]],
    });
    refetchMilestone();
  }

  async function handleCancel() {
    if (!milestoneIdBig) return;
    await cancelTx.send({
      address: contracts.milestones.address,
      abi: contracts.milestones.abi,
      functionName: "cancelMilestone",
      args: [milestoneIdBig],
    });
    refetchMilestone();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <h3 className="mb-1 text-base font-semibold text-ink-900">Look up a milestone</h3>
        <p className="mb-4 text-sm text-ink-500">A lump-sum budget shared across a release&rsquo;s issues.</p>
        <Field label="Milestone ID">
          <Input value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} inputMode="numeric" />
        </Field>

        {milestoneData && milestoneData.sponsor !== "0x0000000000000000000000000000000000000000" && (
          <div className="mt-4 space-y-2 rounded-xl bg-ink-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Status</span>
              <Pill tone={milestoneData.closed ? "neutral" : "warn"}>{milestoneData.closed ? "Closed" : "Open"}</Pill>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Total budget</span>
              <span className="font-mono text-ink-700">{formatUnits(milestoneData.totalBudget, 6)} USDC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Remaining</span>
              <span className="font-mono text-ink-700">{formatUnits(milestoneData.remainingBudget, 6)} USDC</span>
            </div>
          </div>
        )}

        {releaseIssueId && issueStatus !== undefined && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-sm">
            <span className="text-ink-500">Issue {releaseIssueId} status</span>
            <Pill>{ISSUE_STATUS_LABEL[issueStatus as number]}</Pill>
          </div>
        )}
      </Card>

      <div className="space-y-6">
        <Card>
          <h3 className="mb-4 text-base font-semibold text-ink-900">1. Sponsor: create a milestone</h3>
          <Field label="Total budget (USDC)">
            <Input value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="decimal" />
          </Field>
          <Button className="mt-4" onClick={handleCreate} disabled={!isConnected || createTx.state === "pending" || createTx.state === "confirming"}>
            {createTx.state === "pending" ? "Approving…" : createTx.state === "confirming" ? "Creating…" : "Approve & Create"}
          </Button>
          <TxStatus {...createTx} />
        </Card>

        <Card>
          <h3 className="mb-4 text-base font-semibold text-ink-900">2. Oracle: allocate to an issue</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Issue ID">
              <Input value={allocIssueId} onChange={(e) => setAllocIssueId(e.target.value)} inputMode="numeric" />
            </Field>
            <Field label="Amount (USDC)">
              <Input value={allocAmount} onChange={(e) => setAllocAmount(e.target.value)} inputMode="decimal" />
            </Field>
          </div>
          <Button variant="secondary" className="mt-4" onClick={handleAllocate} disabled={!isConnected || allocateTx.state === "pending" || allocateTx.state === "confirming"}>
            Allocate
          </Button>
          <TxStatus {...allocateTx} />
        </Card>

        <Card>
          <h3 className="mb-4 text-base font-semibold text-ink-900">3. Oracle: release on PR merge</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Issue ID">
              <Input value={releaseIssueId} onChange={(e) => setReleaseIssueId(e.target.value)} inputMode="numeric" />
            </Field>
            <Field label="Contributor address">
              <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x…" />
            </Field>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={handleRelease} disabled={!isConnected || releaseTx.state === "pending" || releaseTx.state === "confirming"}>
              Release payout
            </Button>
            <Button variant="danger" onClick={handleCancel} disabled={!isConnected || cancelTx.state === "pending" || cancelTx.state === "confirming"}>
              Cancel milestone
            </Button>
          </div>
          <TxStatus {...releaseTx} />
          <TxStatus {...cancelTx} />
        </Card>
      </div>
    </div>
  );
}
