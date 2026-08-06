import { env } from "./env.js";

export interface Bounty {
  id: string;
  contractType: "escrow" | "milestone";
  onChainIssueId: string;
  milestoneId: string | null;
  githubOwner: string;
  githubRepo: string;
  githubIssueNumber: number;
  status: string;
}

async function internalFetch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${env.frontendInternalUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": env.internalApiSecret,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${path} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

/** Is this GitHub issue backed by an active (still-funded) ArcFi bounty? */
export async function lookupBounty(githubOwner: string, githubRepo: string, githubIssueNumber: number) {
  const { bounty } = await internalFetch<{ bounty: Bounty | null }>("/api/internal/bounty/lookup", {
    githubOwner,
    githubRepo,
    githubIssueNumber,
  });
  return bounty;
}

/** Resolves a merged PR's author to a linked payout wallet, if any. */
export async function lookupWallet(githubLogin: string) {
  return internalFetch<{ walletAddress: string | null; isContributor: boolean }>("/api/internal/wallet/lookup", {
    githubLogin,
  });
}

export async function updateBountyStatus(bountyId: string, status: string, releaseTxHash?: string) {
  return internalFetch<{ ok: true; bounty: Bounty }>("/api/internal/bounty/status", {
    bountyId,
    status,
    releaseTxHash,
  });
}
