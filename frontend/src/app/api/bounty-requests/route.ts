import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = (await req.json()) as {
    contractType?: "escrow" | "milestone";
    githubOwner?: string;
    githubRepo?: string;
    githubIssueNumber?: number;
    title?: string;
    description?: string;
    suggestedAmount?: string;
  };

  const { contractType, githubOwner, githubRepo, githubIssueNumber, title } = body;
  if (
    (contractType !== "escrow" && contractType !== "milestone") ||
    !githubOwner ||
    !githubRepo ||
    !Number.isInteger(githubIssueNumber) ||
    !title?.trim()
  ) {
    return NextResponse.json({ error: "Missing or invalid request fields" }, { status: 400 });
  }

  // Only the repo's verified maintainer can post a funding ask against it.
  const repo = await prisma.repo.findUnique({ where: { githubOwner_githubRepo: { githubOwner, githubRepo } } });
  if (!repo || repo.addedByUserId !== session.user.id) {
    return NextResponse.json({ error: "You can only request funding for a repo you've verified and listed" }, { status: 403 });
  }

  const request = await prisma.bountyRequest.create({
    data: {
      contractType,
      githubOwner,
      githubRepo,
      githubIssueNumber: githubIssueNumber!,
      title: title.trim().slice(0, 140),
      description: body.description?.trim().slice(0, 1000) || null,
      suggestedAmount: body.suggestedAmount?.trim().slice(0, 40) || null,
      requestedByUserId: session.user.id,
    },
  });

  return NextResponse.json({ ok: true, request });
}
