import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchUserRepos, GithubRepoError } from "@/lib/github";

/** The signed-in user's own GitHub repos (owned or via an org), for the "pick instead of type" import list. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
    select: { access_token: true },
  });
  if (!account?.access_token) {
    return NextResponse.json({ error: "No GitHub access token on file — sign out and back in with GitHub." }, { status: 401 });
  }

  try {
    const [repos, alreadyListed] = await Promise.all([
      fetchUserRepos(account.access_token),
      prisma.repo.findMany({ select: { githubOwner: true, githubRepo: true } }),
    ]);
    const listedKeys = new Set(alreadyListed.map((r) => `${r.githubOwner}/${r.githubRepo}`.toLowerCase()));

    return NextResponse.json({
      repos: repos.map((r) => ({ ...r, alreadyListed: listedKeys.has(`${r.owner}/${r.repo}`.toLowerCase()) })),
    });
  } catch (err) {
    if (err instanceof GithubRepoError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.code === "insufficient_scope" ? 403 : 502 });
    }
    return NextResponse.json({ error: "Could not reach GitHub" }, { status: 502 });
  }
}
