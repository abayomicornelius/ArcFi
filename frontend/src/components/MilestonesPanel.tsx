"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { toast } from "sonner";
import { contracts } from "@/lib/contracts";
import { useApproveAndSend, useTx } from "@/lib/hooks";
import { registerBounty } from "@/lib/bounties";
import { Card, Field, Input, Button, TxStatus, Pill, ActionTabs } from "./ui";
import { RepoPicker } from "./RepoPicker";

const ISSUE_STATUS_LABEL = ["None", "Allocated", "Released"] as const;

type ActionTab = "create" | "allocate" | "release";
const TABS: { id: ActionTab; label: string }[] = [
  { id: "create", label: "Create" },
  { id: "allocate", label: "Allocate" },
  { id: "release", label: "Release & cancel" },
];

export function MilestonesPanel() {
  const { isConnected } = useAccount();
  const [tab, setTab] = useState<ActionTab>("create");
  const [milestoneId, setMilestoneId] = useState("1");
  const [budget, setBudget] = useState("5000");
  const [allocIssueId, setAllocIssueId] = useState("");
  const [allocAmount, setAllocAmount] = useState("");
  const [releaseIssueId, setReleaseIssueId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [githubOwner, setGithubOwner] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubIssueNumber, setGithubIssueNumber] = useState("");

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
    if (!milestoneIdBig) {
      toast.error("Enter a milestone ID first");
      return;
    }
    const amountWei = parseUnits(budget || "0", 6);
    try {
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
        label: `Create milestone #${milestoneId}`,
      });
      refetchMilestone();
    } catch {
      /* toast already reported */
    }
  }

  async function handleAllocate() {
    if (!milestoneIdBig) {
      toast.error("Enter a milestone ID first");
      return;
    }
    if (!allocIssueId || !allocAmount) {
      toast.error("Enter both an issue ID and an amount");
      return;
    }
    try {
      const txHash = await allocateTx.send(
        {
          address: contracts.milestones.address,
          abi: contracts.milestones.abi,
          functionName: "allocate",
          args: [milestoneIdBig, BigInt(allocIssueId), parseUnits(allocAmount, 6)],
        },
        `Allocate issue #${allocIssueId}`,
      );
      refetchMilestone();
      registerBounty({
        contractType: "milestone",
        onChainIssueId: allocIssueId,
        milestoneId,
        githubOwner,
        githubRepo,
        githubIssueNumber: Number(githubIssueNumber),
        fundedTxHash: txHash,
      });
    } catch {
      /* toast already reported */
    }
  }

  async function handleRelease() {
    if (!milestoneIdBig) {
      toast.error("Enter a milestone ID first");
      return;
    }
    if (!releaseIssueId || !recipient) {
      toast.error("Enter both an issue ID and the contributor's address");
      return;
    }
    try {
      await releaseTx.send(
        {
          address: contracts.milestones.address,
          abi: contracts.milestones.abi,
          functionName: "releaseIssue",
          args: [milestoneIdBig, BigInt(releaseIssueId), [{ account: recipient, bps: 10_000 }]],
        },
        `Release issue #${releaseIssueId}`,
      );
      refetchMilestone();
    } catch {
      /* toast already reported */
    }
  }

  async function handleCancel() {
    if (!milestoneIdBig) {
      toast.error("Enter a milestone ID first");
      return;
    }
    try {
      await cancelTx.send(
        {
          address: contracts.milestones.address,
          abi: contracts.milestones.abi,
          functionName: "cancelMilestone",
          args: [milestoneIdBig],
        },
        `Cancel milestone #${milestoneId}`,
      );
      refetchMilestone();
    } catch {
      /* toast already reported */
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Field label="Milestone ID" hint="A lump-sum budget shared across a release&rsquo;s issues.">
            <Input value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} inputMode="numeric" className="w-36" />
          </Field>
        </div>

        {milestoneData && milestoneData.sponsor !== "0x0000000000000000000000000000000000000000" && (
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink-100 pt-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-ink-400">Status</span>
              <Pill tone={milestoneData.closed ? "neutral" : "warn"}>{milestoneData.closed ? "Closed" : "Open"}</Pill>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-ink-400">Total budget</span>
              <span className="font-mono text-ink-700">{formatUnits(milestoneData.totalBudget, 6)} USDC</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-ink-400">Remaining</span>
              <span className="font-mono text-ink-700">{formatUnits(milestoneData.remainingBudget, 6)} USDC</span>
            </span>
          </div>
        )}

        {releaseIssueId && issueStatus !== undefined && (
          <div className="mt-3 flex items-center gap-1.5 border-t border-ink-100 pt-3 text-sm">
            <span className="text-ink-400">Issue {releaseIssueId} status</span>
            <Pill>{ISSUE_STATUS_LABEL[issueStatus as number]}</Pill>
          </div>
        )}
      </Card>

      <Card>
        <ActionTabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === "create" && (
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-ink-400">Sponsor action</p>
            <Field label="Total budget (USDC)">
              <Input value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="decimal" />
            </Field>
            <Button
              className="mt-4"
              onClick={handleCreate}
              loading={createTx.state === "pending" || createTx.state === "confirming"}
              disabled={!isConnected || createTx.state === "pending" || createTx.state === "confirming"}
              title={!isConnected ? "Connect a wallet first" : undefined}
            >
              {createTx.state === "pending" ? "Approving…" : createTx.state === "confirming" ? "Creating…" : "Approve & Create"}
            </Button>
            <TxStatus {...createTx} />
          </div>
        )}

        {tab === "allocate" && (
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-ink-400">Oracle action</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Issue ID">
                <Input value={allocIssueId} onChange={(e) => setAllocIssueId(e.target.value)} inputMode="numeric" />
              </Field>
              <Field label="Amount (USDC)">
                <Input value={allocAmount} onChange={(e) => setAllocAmount(e.target.value)} inputMode="decimal" />
              </Field>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr]">
              <Field label="Project" hint="Optional — links this to a real issue.">
                <RepoPicker
                  owner={githubOwner}
                  repo={githubRepo}
                  onChange={(o, r) => {
                    setGithubOwner(o);
                    setGithubRepo(r);
                  }}
                />
              </Field>
              <Field label="Issue #">
                <Input
                  value={githubIssueNumber}
                  onChange={(e) => setGithubIssueNumber(e.target.value)}
                  inputMode="numeric"
                  placeholder="1042"
                />
              </Field>
            </div>
            <p className="mt-2 text-xs text-ink-400">
              Filling these in lets ArcFi&rsquo;s oracle release this issue automatically the moment the linked PR
              merges.
            </p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={handleAllocate}
              loading={allocateTx.state === "pending" || allocateTx.state === "confirming"}
              disabled={!isConnected || allocateTx.state === "pending" || allocateTx.state === "confirming"}
              title={!isConnected ? "Connect a wallet first" : undefined}
            >
              Allocate
            </Button>
            <TxStatus {...allocateTx} />
          </div>
        )}

        {tab === "release" && (
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-ink-400">Oracle action</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Issue ID">
                <Input value={releaseIssueId} onChange={(e) => setReleaseIssueId(e.target.value)} inputMode="numeric" />
              </Field>
              <Field label="Contributor address">
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x…" />
              </Field>
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                onClick={handleRelease}
                loading={releaseTx.state === "pending" || releaseTx.state === "confirming"}
                disabled={!isConnected || releaseTx.state === "pending" || releaseTx.state === "confirming"}
                title={!isConnected ? "Connect a wallet first" : undefined}
              >
                Release payout
              </Button>
              <Button
                variant="danger"
                onClick={handleCancel}
                loading={cancelTx.state === "pending" || cancelTx.state === "confirming"}
                disabled={!isConnected || cancelTx.state === "pending" || cancelTx.state === "confirming"}
                title={!isConnected ? "Connect a wallet first" : undefined}
              >
                Cancel milestone
              </Button>
            </div>
            <TxStatus {...releaseTx} />
            <TxStatus {...cancelTx} />
          </div>
        )}
      </Card>
    </div>
  );
}
