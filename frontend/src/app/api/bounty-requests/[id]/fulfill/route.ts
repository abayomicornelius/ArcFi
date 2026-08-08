import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

/** Called right after a sponsor's on-chain fund/allocate tx succeeds for a request's linked issue. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const { bountyId } = (await req.json()) as { bountyId?: string };
  if (!bountyId) {
    return NextResponse.json({ error: "bountyId is required" }, { status: 400 });
  }

  const request = await prisma.bountyRequest.findUnique({ where: { id } });
  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (request.status !== "open") {
    // Already fulfilled or withdrawn — not an error, just nothing to do.
    return NextResponse.json({ ok: true, alreadyResolved: true });
  }

  // The bounty itself was already verified on-chain at /api/bounties/register
  // — this just confirms it's actually the issue this request was about,
  // not an unrelated bounty passed in by mistake or in bad faith.
  const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
  if (
    !bounty ||
    bounty.githubOwner !== request.githubOwner ||
    bounty.githubRepo !== request.githubRepo ||
    bounty.githubIssueNumber !== request.githubIssueNumber
  ) {
    return NextResponse.json({ error: "That bounty doesn't match this request's issue" }, { status: 400 });
  }

  await prisma.bountyRequest.update({ where: { id }, data: { status: "funded", fundedBountyId: bountyId } });
  await notify(
    request.requestedByUserId,
    "request_fulfilled",
    `Your request for ${request.githubOwner}/${request.githubRepo}#${request.githubIssueNumber} was funded`,
    "A sponsor funded the issue you asked about.",
    `/bounties/${bountyId}`,
  );
  return NextResponse.json({ ok: true });
}
