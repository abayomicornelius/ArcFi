import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Records the GitHub issue a sponsor just funded/allocated on-chain, so the
 * oracle backend has something to look up when the linked PR merges. Called
 * from EscrowPanel (after `fund`) and MilestonesPanel (after `allocate`) —
 * the on-chain tx itself always succeeds independently of this; if the
 * sponsor isn't GitHub-signed-in, the caller just skips this call.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = (await req.json()) as {
    contractType?: "escrow" | "milestone";
    onChainIssueId?: string;
    milestoneId?: string;
    githubOwner?: string;
    githubRepo?: string;
    githubIssueNumber?: number;
    fundedTxHash?: string;
  };

  const { contractType, onChainIssueId, milestoneId, githubOwner, githubRepo, githubIssueNumber, fundedTxHash } =
    body;

  if (
    (contractType !== "escrow" && contractType !== "milestone") ||
    !onChainIssueId ||
    !githubOwner ||
    !githubRepo ||
    !Number.isInteger(githubIssueNumber)
  ) {
    return NextResponse.json({ error: "Missing or invalid bounty fields" }, { status: 400 });
  }
  if (contractType === "milestone" && !milestoneId) {
    return NextResponse.json({ error: "milestoneId is required for milestone bounties" }, { status: 400 });
  }

  const bounty = await prisma.bounty.create({
    data: {
      contractType,
      onChainIssueId,
      milestoneId: contractType === "milestone" ? milestoneId : null,
      githubOwner,
      githubRepo,
      githubIssueNumber: githubIssueNumber!,
      fundedTxHash,
      createdByUserId: session.user.id,
    },
  });

  return NextResponse.json({ ok: true, bounty });
}
