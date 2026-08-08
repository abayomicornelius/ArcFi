import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBountyApproverId } from "@/lib/bountyAuth";
import { BountyDetail } from "@/components/BountyDetail";

export const dynamic = "force-dynamic";

export default async function BountyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const bounty = await prisma.bounty.findUnique({
    where: { id },
    include: {
      assignedUser: { select: { id: true, githubLogin: true, githubAvatarUrl: true, image: true } },
      applications: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, githubLogin: true, githubAvatarUrl: true, image: true } } },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, githubLogin: true, githubAvatarUrl: true, image: true } } },
      },
    },
  });
  if (!bounty) notFound();

  const [repo, sponsor, approverId] = await Promise.all([
    prisma.repo.findUnique({
      where: { githubOwner_githubRepo: { githubOwner: bounty.githubOwner, githubRepo: bounty.githubRepo } },
      select: { avatarUrl: true, description: true },
    }),
    bounty.createdByUserId ? prisma.user.findUnique({ where: { id: bounty.createdByUserId }, select: { githubLogin: true } }) : null,
    getBountyApproverId(bounty.githubOwner, bounty.githubRepo, bounty.createdByUserId),
  ]);

  return (
    <BountyDetail
      bounty={{
        id: bounty.id,
        githubOwner: bounty.githubOwner,
        githubRepo: bounty.githubRepo,
        githubIssueNumber: bounty.githubIssueNumber,
        contractType: bounty.contractType,
        status: bounty.status,
        createdAt: bounty.createdAt.toISOString(),
        avatarUrl: repo?.avatarUrl ?? null,
        repoDescription: repo?.description ?? null,
        sponsorLogin: sponsor?.githubLogin ?? null,
        assignedUser: bounty.assignedUser,
        approverId,
      }}
      applications={bounty.applications.map((a) => ({
        id: a.id,
        message: a.message,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
        user: a.user,
      }))}
      comments={bounty.comments.map((c) => ({
        id: c.id,
        message: c.message,
        createdAt: c.createdAt.toISOString(),
        user: c.user,
      }))}
    />
  );
}
