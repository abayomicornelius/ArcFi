import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInternalSecret } from "@/lib/internal-auth";

/**
 * Called by the oracle backend to resolve a merged PR's author (a GitHub
 * login) to a linked payout wallet.
 */
export async function POST(req: Request) {
  const authError = requireInternalSecret(req);
  if (authError) return authError;

  const { githubLogin } = (await req.json()) as { githubLogin?: string };
  if (!githubLogin) {
    return NextResponse.json({ error: "Missing githubLogin" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { githubLogin },
    select: { walletAddress: true, isContributor: true },
  });

  return NextResponse.json({
    walletAddress: user?.walletAddress ?? null,
    isContributor: user?.isContributor ?? false,
  });
}
