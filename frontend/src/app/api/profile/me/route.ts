import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      bio: true,
      twitterUrl: true,
      linkedinUrl: true,
      telegramUrl: true,
      githubJoinedAt: true,
      walletLinkedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user });
}
