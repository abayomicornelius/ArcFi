"use client";

import { toast } from "sonner";

export interface RegisterBountyInput {
  contractType: "escrow" | "milestone";
  onChainIssueId: string;
  milestoneId?: string;
  githubOwner: string;
  githubRepo: string;
  githubIssueNumber: number;
  fundedTxHash?: string;
}

/**
 * Links a just-funded/allocated on-chain issue to a real GitHub issue, so
 * the oracle backend can pay it out automatically when the linked PR
 * merges. Optional — the on-chain action this follows already succeeded on
 * its own; skipping the GitHub fields (or not being signed in) just means
 * this bounty stays manual-release-only, same as before this existed.
 */
export async function registerBounty(input: RegisterBountyInput) {
  if (!input.githubOwner || !input.githubRepo || !Number.isFinite(input.githubIssueNumber)) {
    return;
  }

  try {
    const res = await fetch("/api/bounties/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (res.status === 401) {
      toast.info("Sign in with GitHub to enable automatic payout on PR merge", {
        description: "The on-chain transaction already succeeded — this only affects the auto-release oracle.",
      });
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}) as { error?: string });
      toast.warning("Could not link this bounty to GitHub", {
        description: body.error ?? "You can still release it manually.",
      });
      return;
    }

    toast.success(`Linked to ${input.githubOwner}/${input.githubRepo}#${input.githubIssueNumber}`, {
      description: "Payout will fire automatically once the linked PR merges.",
    });
  } catch {
    toast.warning("Could not reach ArcFi's API to link this bounty to GitHub", {
      description: "You can still release it manually.",
    });
  }
}
