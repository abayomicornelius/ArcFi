import "server-only";
import { createPublicClient, http } from "viem";
import { activeChain } from "./chains";
import { contracts } from "./contracts";

const publicClient = createPublicClient({ chain: activeChain, transport: http() });

const ESCROW_STATUS_FUNDED = 1;
const MILESTONE_ISSUE_STATUS_ALLOCATED = 1;

/**
 * Confirms a single-issue escrow is genuinely funded on-chain for the given
 * issue, rather than trusting a client's self-reported `fundedTxHash`. A
 * bogus or stale claim reads back `status !== Funded` and is rejected.
 */
export async function verifyEscrowFunded(onChainIssueId: string): Promise<{ sponsor: `0x${string}`; amount: bigint } | null> {
  let issueId: bigint;
  try {
    issueId = BigInt(onChainIssueId);
  } catch {
    return null;
  }

  const escrow = (await publicClient.readContract({
    address: contracts.escrow.address,
    abi: contracts.escrow.abi,
    functionName: "getEscrow",
    args: [issueId],
  })) as { sponsor: `0x${string}`; amount: bigint; status: number };

  if (escrow.status !== ESCROW_STATUS_FUNDED) return null;
  return { sponsor: escrow.sponsor, amount: escrow.amount };
}

/**
 * Confirms a milestone issue allocation genuinely exists on-chain — same
 * trust boundary as `verifyEscrowFunded`, for the milestone contract.
 */
export async function verifyMilestoneAllocated(
  milestoneId: string,
  onChainIssueId: string,
): Promise<{ amount: bigint } | null> {
  let milestoneIdBig: bigint;
  let issueIdBig: bigint;
  try {
    milestoneIdBig = BigInt(milestoneId);
    issueIdBig = BigInt(onChainIssueId);
  } catch {
    return null;
  }

  const status = (await publicClient.readContract({
    address: contracts.milestones.address,
    abi: contracts.milestones.abi,
    functionName: "issueStatus",
    args: [milestoneIdBig, issueIdBig],
  })) as number;

  if (status !== MILESTONE_ISSUE_STATUS_ALLOCATED) return null;

  const amount = (await publicClient.readContract({
    address: contracts.milestones.address,
    abi: contracts.milestones.abi,
    functionName: "allocations",
    args: [milestoneIdBig, issueIdBig],
  })) as bigint;

  return { amount };
}
