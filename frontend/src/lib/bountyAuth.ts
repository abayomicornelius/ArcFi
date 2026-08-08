import "server-only";
import { prisma } from "./prisma";

/**
 * Who can approve applications / decide on a bounty: the registered repo's
 * verified maintainer if one exists, otherwise the sponsor who funded it —
 * so review authority always traces back to someone who proved GitHub access
 * or put USDC behind the issue, never an arbitrary third party.
 */
export async function getBountyApproverId(githubOwner: string, githubRepo: string, fallbackUserId: string | null) {
  const repo = await prisma.repo.findUnique({
    where: { githubOwner_githubRepo: { githubOwner, githubRepo } },
    select: { addedByUserId: true },
  });
  return repo?.addedByUserId ?? fallbackUserId;
}
