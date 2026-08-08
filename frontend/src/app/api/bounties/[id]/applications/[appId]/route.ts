import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBountyApproverId } from "@/lib/bountyAuth";
import { notify } from "@/lib/notifications";

export async function POST(req: Request, { params }: { params: Promise<{ id: string; appId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id, appId } = await params;
  const { decision } = (await req.json()) as { decision?: "approved" | "rejected" };
  if (decision !== "approved" && decision !== "rejected") {
    return NextResponse.json({ error: "decision must be 'approved' or 'rejected'" }, { status: 400 });
  }

  const bounty = await prisma.bounty.findUnique({ where: { id } });
  if (!bounty) {
    return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
  }

  const approverId = await getBountyApproverId(bounty.githubOwner, bounty.githubRepo, bounty.createdByUserId);
  if (approverId !== session.user.id) {
    return NextResponse.json({ error: "Only this bounty's maintainer or sponsor can decide on applications" }, { status: 403 });
  }

  const application = await prisma.bountyApplication.findUnique({ where: { id: appId } });
  if (!application || application.bountyId !== id) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  await prisma.bountyApplication.update({ where: { id: appId }, data: { status: decision } });

  const bountyLabel = `${bounty.githubOwner}/${bounty.githubRepo}#${bounty.githubIssueNumber}`;

  if (decision === "approved") {
    // Only one assignee at a time — approving this one silently supersedes
    // any other still-pending applications for the same bounty.
    await prisma.$transaction([
      prisma.bounty.update({ where: { id }, data: { assignedUserId: application.userId } }),
      prisma.bountyApplication.updateMany({
        where: { bountyId: id, id: { not: appId }, status: "pending" },
        data: { status: "rejected" },
      }),
    ]);
    await notify(application.userId, "application_approved", `You're assigned to ${bountyLabel}`, "The maintainer approved your application.", `/bounties/${id}`);
  } else {
    await notify(application.userId, "application_rejected", `Application declined for ${bountyLabel}`, undefined, `/bounties/${id}`);
  }

  return NextResponse.json({ ok: true });
}
