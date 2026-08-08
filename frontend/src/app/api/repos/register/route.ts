import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchRepoWithPermissions, GithubRepoError } from "@/lib/github";

const STATUS_BY_CODE: Record<GithubRepoError["code"], number> = {
  not_found: 404,
  insufficient_scope: 403,
  no_access: 403,
  rate_limited: 429,
  unknown: 502,
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { githubOwner, githubRepo } = (await req.json()) as { githubOwner?: string; githubRepo?: string };
  const owner = githubOwner?.trim();
  const repo = githubRepo?.trim();
  if (!owner || !repo) {
    return NextResponse.json({ error: "Owner and repo are required" }, { status: 400 });
  }

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
    select: { access_token: true },
  });
  if (!account?.access_token) {
    return NextResponse.json({ error: "No GitHub access token on file — sign out and back in with GitHub." }, { status: 401 });
  }

  try {
    const info = await fetchRepoWithPermissions(owner, repo, account.access_token);

    const savedRepo = await prisma.repo.upsert({
      where: { githubOwner_githubRepo: { githubOwner: owner, githubRepo: repo } },
      create: {
        githubOwner: owner,
        githubRepo: repo,
        description: info.description,
        primaryLanguage: info.language,
        topics: info.topics.join(","),
        stars: info.stars,
        avatarUrl: info.avatarUrl,
        addedByUserId: session.user.id,
      },
      update: {
        description: info.description,
        primaryLanguage: info.language,
        topics: info.topics.join(","),
        stars: info.stars,
        avatarUrl: info.avatarUrl,
        addedByUserId: session.user.id,
      },
    });

    // Proving admin/maintain access to a real repo is a stronger maintainer
    // signal than a self-reported checkbox — flip it on automatically.
    await prisma.user.update({ where: { id: session.user.id }, data: { isMaintainer: true } });

    return NextResponse.json({ ok: true, repo: savedRepo });
  } catch (err) {
    if (err instanceof GithubRepoError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: STATUS_BY_CODE[err.code] });
    }
    return NextResponse.json({ error: "Could not verify this repo on GitHub" }, { status: 502 });
  }
}
