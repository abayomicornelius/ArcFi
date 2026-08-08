import type { Address } from "viem";
import { BaseError, ContractFunctionRevertedError } from "viem";
import type { MergedPullRequestEvent } from "./github.js";
import { fetchPullRequestContributors } from "./github.js";
import { lookupBounty, lookupWallet, updateBountyStatus } from "./api-client.js";
import { releaseEscrow, releaseMilestoneIssue, waitForReceipt, type ReleaseRecipient } from "./chain.js";
import { splitEvenlyBps } from "./splits.js";
import { env } from "./env.js";

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

/**
 * Resolves every commit author on the merged PR to a linked wallet and
 * splits the bounty evenly across whichever ones actually have one — a
 * multi-commit-author PR pays the whole team in one transaction instead of
 * defaulting 100% to the PR opener. Contributors without a linked wallet are
 * simply left out of the split; if none of them have one, the caller falls
 * back to the existing pending_recipient flow.
 */
async function resolveRecipients(event: MergedPullRequestEvent): Promise<ReleaseRecipient[]> {
  const contributors = await fetchPullRequestContributors(event.owner, event.repo, event.prNumber, event.authorLogin, env.githubToken);

  const wallets = new Map<string, Address>(); // lowercased address -> checksummed-as-received address
  for (const login of contributors) {
    const { walletAddress } = await lookupWallet(login);
    if (walletAddress) wallets.set(walletAddress.toLowerCase(), walletAddress as Address);
  }

  const accounts = [...wallets.values()];
  if (accounts.length === 0) return [];

  const bps = splitEvenlyBps(accounts.length);
  return accounts.map((account, i) => ({ account, bps: bps[i] }));
}

async function releaseMany(bounty: Awaited<ReturnType<typeof lookupBounty>>, recipients: ReleaseRecipient[]) {
  if (!bounty) return;

  try {
    const hash =
      bounty.contractType === "escrow"
        ? await releaseEscrow(BigInt(bounty.onChainIssueId), recipients)
        : await releaseMilestoneIssue(BigInt(bounty.milestoneId!), BigInt(bounty.onChainIssueId), recipients);

    console.log(`[oracle] release tx sent for bounty ${bounty.id}: ${hash}`);
    await waitForReceipt(hash);
    await updateBountyStatus(bounty.id, "released", hash);
    const summary = recipients.map((r) => `${r.account} (${(r.bps / 100).toFixed(2)}%)`).join(", ");
    console.log(`[oracle] bounty ${bounty.id} released to ${summary} (${hash})`);
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

    const recipients = await resolveRecipients(event);
    if (recipients.length === 0) {
      console.log(
        `[oracle] bounty ${bounty.id}: no contributor on PR #${event.prNumber} has a linked wallet — marking pending_recipient`,
      );
      await updateBountyStatus(bounty.id, "pending_recipient");
      continue;
    }

    await releaseMany(bounty, recipients);
  }
}
