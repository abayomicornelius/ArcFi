import type { Address } from "viem";
import { BaseError, ContractFunctionRevertedError } from "viem";
import type { MergedPullRequestEvent } from "./github.js";
import { lookupBounty, lookupWallet, updateBountyStatus } from "./api-client.js";
import { releaseEscrow, releaseMilestoneIssue, waitForReceipt } from "./chain.js";

// Contract errors that mean "this was already paid out" — a legitimate race
// (e.g. someone manually released it first), not a failure. Anything else
// is a real problem and gets left as "funded" for retry/investigation.
const ALREADY_RELEASED_ERRORS = new Set(["AlreadyPaid", "IssueAlreadyReleased"]);

function revertReason(err: unknown): string | undefined {
  if (err instanceof BaseError) {
    const revertError = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revertError instanceof ContractFunctionRevertedError) {
      return revertError.data?.errorName;
    }
  }
  return undefined;
}

async function releaseOne(bounty: Awaited<ReturnType<typeof lookupBounty>>, recipient: Address) {
  if (!bounty) return;

  try {
    const hash =
      bounty.contractType === "escrow"
        ? await releaseEscrow(BigInt(bounty.onChainIssueId), recipient)
        : await releaseMilestoneIssue(BigInt(bounty.milestoneId!), BigInt(bounty.onChainIssueId), recipient);

    console.log(`[oracle] release tx sent for bounty ${bounty.id}: ${hash}`);
    await waitForReceipt(hash);
    await updateBountyStatus(bounty.id, "released", hash);
    console.log(`[oracle] bounty ${bounty.id} released to ${recipient} (${hash})`);
  } catch (err) {
    const reason = revertReason(err);
    if (reason && ALREADY_RELEASED_ERRORS.has(reason)) {
      console.log(`[oracle] bounty ${bounty.id} already released on-chain (${reason}) — marking released`);
      await updateBountyStatus(bounty.id, "released");
      return;
    }
    console.error(`[oracle] release failed for bounty ${bounty.id}:`, err);
    // Left as "funded" — safe to retry (contract-level idempotency covers a
    // resend) whether that's a redelivered webhook or a manual follow-up.
  }
}

/**
 * Given a merged PR, releases every ArcFi bounty it closes. Runs in the
 * background after the webhook handler has already ack'd the HTTP request —
 * tx confirmation can take longer than GitHub's delivery timeout allows.
 */
export async function handleMergedPullRequest(event: MergedPullRequestEvent) {
  for (const issueNumber of event.closingIssueNumbers) {
    const bounty = await lookupBounty(event.owner, event.repo, issueNumber);
    if (!bounty) {
      console.log(`[oracle] ${event.owner}/${event.repo}#${issueNumber} has no active ArcFi bounty — skipping`);
      continue;
    }

    const { walletAddress } = await lookupWallet(event.authorLogin);
    if (!walletAddress) {
      console.log(
        `[oracle] bounty ${bounty.id}: PR author ${event.authorLogin} has no linked wallet — marking pending_recipient`,
      );
      await updateBountyStatus(bounty.id, "pending_recipient");
      continue;
    }

    await releaseOne(bounty, walletAddress as Address);
  }
}
