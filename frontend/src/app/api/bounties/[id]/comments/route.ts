import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id } = await params;
  const bounty = await prisma.bounty.findUnique({ where: { id }, select: { id: true } });
  if (!bounty) {
    return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
  }

  const { message } = (await req.json()) as { message?: string };
  const trimmed = message?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const comment = await prisma.bountyComment.create({
    data: { bountyId: id, userId: session.user.id, message: trimmed.slice(0, 1000) },
    include: { user: { select: { githubLogin: true, githubAvatarUrl: true, image: true } } },
  });

  return NextResponse.json({ ok: true, comment });
}
