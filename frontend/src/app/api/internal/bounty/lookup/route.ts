import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInternalSecret } from "@/lib/internal-auth";

/**
 * Called by the oracle backend when a PR merges: is this GitHub issue
 * backed by an active (still-funded) ArcFi bounty? Most recent funded match
 * wins, so re-funding after a refund works without a unique-constraint fight.
 */
export async function POST(req: Request) {
  const authError = requireInternalSecret(req);
  if (authError) return authError;

  const { githubOwner, githubRepo, githubIssueNumber } = (await req.json()) as {
    githubOwner?: string;
    githubRepo?: string;
    githubIssueNumber?: number;
  };

  if (!githubOwner || !githubRepo || !Number.isInteger(githubIssueNumber)) {
    return NextResponse.json({ error: "Missing githubOwner/githubRepo/githubIssueNumber" }, { status: 400 });
  }

  const bounty = await prisma.bounty.findFirst({
    where: { githubOwner, githubRepo, githubIssueNumber, status: "funded" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bounty });
}
