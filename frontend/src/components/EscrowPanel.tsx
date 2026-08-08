"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { toast } from "sonner";
import { contracts } from "@/lib/contracts";
import { useApproveAndSend, useTx } from "@/lib/hooks";
import { registerBounty, fulfillBountyRequest } from "@/lib/bounties";
import { Card, Field, Input, Button, TxStatus, Pill, Skeleton, ActionTabs } from "./ui";
import { RepoPicker } from "./RepoPicker";

const STATUS_LABEL = ["None", "Funded", "Paid", "Refunded"] as const;

type ActionTab = "fund" | "release" | "extend";
const TABS: { id: ActionTab; label: string }[] = [
  { id: "fund", label: "Fund" },
  { id: "release", label: "Release & refund" },
  { id: "extend", label: "Extend deadline" },
];

function toUnixSeconds(datetimeLocal: string) {
  return BigInt(Math.floor(new Date(datetimeLocal).getTime() / 1000));
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function EscrowPanel() {
  const { isConnected } = useAccount();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");
  const [tab, setTab] = useState<ActionTab>("fund");
  const [issueId, setIssueId] = useState(searchParams.get("issue") || "1");
  const [amount, setAmount] = useState(searchParams.get("amount") || "100");
  const [deadline, setDeadline] = useState("");
  const [recipient, setRecipient] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [githubOwner, setGithubOwner] = useState(searchParams.get("owner") ?? "");
  const [githubRepo, setGithubRepo] = useState(searchParams.get("repo") ?? "");
  const [githubIssueNumber, setGithubIssueNumber] = useState(searchParams.get("issue") ?? "");

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
    if (!issueIdBig) {
      toast.error("Enter an issue ID first");
      return;
    }
    if (!deadline) {
      toast.error("Pick a deadline before funding");
      return;
    }
    const amountWei = parseUnits(amount || "0", 6);
    try {
      const txHash = await fundTx.send({
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
      const bountyId = await registerBounty({
        contractType: "escrow",
        onChainIssueId: issueId,
        githubOwner,
        githubRepo,
        githubIssueNumber: Number(githubIssueNumber),
        fundedTxHash: txHash,
      });
      if (requestId && bountyId) fulfillBountyRequest(requestId, bountyId);
    } catch {
      /* toast already reported */
    }
  }

  async function handleRelease() {
    if (!issueIdBig) {
      toast.error("Enter an issue ID first");
      return;
    }
    if (!recipient) {
      toast.error("Enter the contributor's address");
      return;
    }
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
    if (!issueIdBig) {
      toast.error("Enter an issue ID first");
      return;
    }
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
    if (!issueIdBig) {
      toast.error("Enter an issue ID first");
      return;
    }
    if (!newDeadline) {
      toast.error("Pick a new deadline");
      return;
    }
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
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Field label="Issue ID" hint="Every bounty is keyed by a GitHub issue ID.">
            <Input value={issueId} onChange={(e) => setIssueId(e.target.value)} placeholder="e.g. 1042" inputMode="numeric" className="w-36" />
          </Field>
        </div>

        {escrowLoading && (
          <div className="mt-4 flex gap-6 border-t border-ink-100 pt-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
          </div>
        )}

        {!escrowLoading && escrowData && status && (
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink-100 pt-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-ink-400">Status</span>
              <Pill tone={status === "Funded" ? "warn" : status === "Paid" ? "good" : "neutral"}>{status}</Pill>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-ink-400">Sponsor</span>
              <span className="font-mono text-xs text-ink-700">{shortAddress(escrowData.sponsor)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-ink-400">Amount</span>
              <span className="font-mono text-ink-700">{formatUnits(escrowData.amount, 6)} USDC</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-ink-400">Deadline</span>
              <span className="font-mono text-xs text-ink-700">
                {escrowData.deadline > 0n ? new Date(Number(escrowData.deadline) * 1000).toLocaleString() : "—"}
              </span>
            </span>
          </div>
        )}

        {!escrowLoading && !escrowData && issueIdBig !== undefined && (
          <p className="mt-4 border-t border-ink-100 pt-4 text-sm text-ink-400">No escrow funded for issue #{issueId} yet — fund one below.</p>
        )}
      </Card>

      <Card>
        <ActionTabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === "fund" && (
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-ink-400">Sponsor action</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount (USDC)">
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
              </Field>
              <Field label="Deadline">
                <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
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
              Filling these in lets ArcFi&rsquo;s oracle release this bounty automatically the moment the linked PR
              merges, instead of waiting on a manual release.
            </p>
            <Button
              className="mt-4"
              onClick={handleFund}
              loading={fundTx.state === "pending" || fundTx.state === "confirming"}
              disabled={!isConnected || fundTx.state === "pending" || fundTx.state === "confirming"}
              title={!isConnected ? "Connect a wallet first" : undefined}
            >
              {fundTx.state === "pending" ? "Approving…" : fundTx.state === "confirming" ? "Funding…" : "Approve & Fund"}
            </Button>
            <TxStatus {...fundTx} />
          </div>
        )}

        {tab === "release" && (
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-ink-400">Oracle action</p>
            <Field label="Contributor address">
              <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x…" />
            </Field>
            <p className="mt-2 text-xs text-ink-400">Only the configured admin/oracle address can call this.</p>
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
                onClick={handleRefund}
                loading={refundTx.state === "pending" || refundTx.state === "confirming"}
                disabled={!isConnected || refundTx.state === "pending" || refundTx.state === "confirming"}
                title={!isConnected ? "Connect a wallet first" : undefined}
              >
                Refund
              </Button>
            </div>
            <TxStatus {...releaseTx} />
            <TxStatus {...refundTx} />
          </div>
        )}

        {tab === "extend" && (
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-ink-400">Sponsor action</p>
            <Field label="New deadline" hint="Must be later than the current deadline.">
              <Input type="datetime-local" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
            </Field>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={handleExtend}
              loading={extendTx.state === "pending" || extendTx.state === "confirming"}
              disabled={!isConnected || extendTx.state === "pending" || extendTx.state === "confirming"}
              title={!isConnected ? "Connect a wallet first" : undefined}
            >
              Extend
            </Button>
            <TxStatus {...extendTx} />
          </div>
        )}
      </Card>
    </div>
  );
}
