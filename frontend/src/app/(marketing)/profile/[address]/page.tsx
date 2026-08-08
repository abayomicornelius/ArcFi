import { isAddress, getAddress, formatUnits } from "viem";
import { notFound } from "next/navigation";
import { ArrowUpRight, HandCoins, Wrench, Users, GitBranch, Star, Coins, Flag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getParticipantStats } from "@/lib/onchain";
import { activeChain } from "@/lib/chains";
import { Identicon } from "@/components/Identicon";
import { Pill, type PillTone } from "@/components/ui";
import { Reveal } from "@/components/Reveal";

const STATUS_LABEL: Record<string, string> = {
  funded: "Open",
  pending_recipient: "Awaiting wallet",
  released: "Paid out",
  refunded: "Refunded",
};

const STATUS_TONE: Record<string, PillTone> = {
  funded: "sponsor",
  pending_recipient: "warn",
  released: "good",
  refunded: "neutral",
};

export default async function ProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address: rawAddress } = await params;
  if (!isAddress(rawAddress)) notFound();
  const address = getAddress(rawAddress);

  const [user, stats] = await Promise.all([
    prisma.user.findUnique({ where: { walletAddress: address } }),
    getParticipantStats(address),
  ]);

  const [fundedBounties, ownedRepos] = user
    ? await Promise.all([
        prisma.bounty.findMany({ where: { createdByUserId: user.id }, orderBy: { createdAt: "desc" } }),
        prisma.repo.findMany({ where: { addedByUserId: user.id }, orderBy: { stars: "desc" } }),
      ])
    : [[], []];

  const repoKeys = [...new Set(fundedBounties.map((b) => `${b.githubOwner}/${b.githubRepo}`))].map((key) => {
    const [githubOwner, githubRepo] = key.split("/");
    return { githubOwner, githubRepo };
  });
  const bountyRepoAvatars = repoKeys.length
    ? await prisma.repo.findMany({ where: { OR: repoKeys }, select: { githubOwner: true, githubRepo: true, avatarUrl: true } })
    : [];
  const avatarByRepo = new Map(bountyRepoAvatars.map((r) => [`${r.githubOwner}/${r.githubRepo}`, r.avatarUrl]));

  const displayName = user?.githubLogin ? `@${user.githubLogin}` : user?.name ?? `${address.slice(0, 6)}…${address.slice(-4)}`;
  const explorerUrl = activeChain.blockExplorers?.default.url ? `${activeChain.blockExplorers.default.url}/address/${address}` : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Reveal className="mb-8 flex items-center gap-4">
        {user?.githubAvatarUrl ?? user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user?.githubAvatarUrl ?? user?.image ?? ""} alt="" className="h-16 w-16 rounded-full" />
        ) : (
          <Identicon address={address} size={64} />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            {displayName}
            {user?.githubLogin && (
              <a href={`https://github.com/${user.githubLogin}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                <GitBranch className="h-4 w-4" />
              </a>
            )}
          </h1>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{address}</p>
          {explorerUrl && (
            <a href={explorerUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
              View on {activeChain.blockExplorers?.default.name} <ArrowUpRight className="h-3 w-3" />
            </a>
          )}
        </div>
      </Reveal>

      {user && (
        <div className="mb-6 flex flex-wrap gap-2">
          {user.isSponsor && (
            <Pill tone="sponsor">
              <HandCoins className="mr-1 inline h-3 w-3" /> Sponsor
            </Pill>
          )}
          {user.isMaintainer && (
            <Pill tone="maintainer">
              <Wrench className="mr-1 inline h-3 w-3" /> Maintainer
            </Pill>
          )}
          {user.isContributor && (
            <Pill tone="contributor">
              <Users className="mr-1 inline h-3 w-3" /> Contributor
            </Pill>
          )}
        </div>
      )}

      {user?.bio && <p className="mb-8 max-w-xl text-muted-foreground">{user.bio}</p>}

      <Reveal delay={0.06} className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-ink-200 bg-paper-raised p-5">
          <p className="font-mono text-xs uppercase tracking-wider text-ink-400">Total funded</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-ink-900">{formatUnits(stats?.fundedUsdc ?? 0n, 6)} USDC</p>
          <p className="mt-1 text-xs text-ink-400">across {stats?.fundedCount ?? 0} deposit{stats?.fundedCount === 1 ? "" : "s"}</p>
        </div>
        <div className="rounded-md border border-ink-200 bg-paper-raised p-5">
          <p className="font-mono text-xs uppercase tracking-wider text-ink-400">Total received</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-ink-900">{formatUnits(stats?.receivedUsdc ?? 0n, 6)} USDC</p>
          <p className="mt-1 text-xs text-ink-400">across {stats?.receivedCount ?? 0} payout{stats?.receivedCount === 1 ? "" : "s"}</p>
        </div>
      </Reveal>

      {ownedRepos.length > 0 && (
        <Reveal delay={0.12} className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Projects maintained</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {ownedRepos.map((repo) => (
              <a
                key={repo.id}
                href={`https://github.com/${repo.githubOwner}/${repo.githubRepo}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-md border border-ink-200 bg-paper-raised p-4 transition hover:border-gold-400"
              >
                {repo.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={repo.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-md" />
                ) : (
                  <div className="h-8 w-8 shrink-0 rounded-md bg-ink-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {repo.githubOwner}/{repo.githubRepo}
                  </p>
                  {repo.description && <p className="truncate text-xs text-ink-500">{repo.description}</p>}
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-ink-400">
                  <Star className="h-3 w-3" /> {repo.stars}
                </span>
              </a>
            ))}
          </div>
        </Reveal>
      )}

      {fundedBounties.length > 0 && (
        <Reveal delay={0.18} className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Issues funded</h2>
          <div className="overflow-hidden rounded-lg border border-ink-200">
            {fundedBounties.map((bounty) => {
              const avatarUrl = avatarByRepo.get(`${bounty.githubOwner}/${bounty.githubRepo}`);
              const TypeIcon = bounty.contractType === "milestone" ? Flag : Coins;
              return (
                <a
                  key={bounty.id}
                  href={`https://github.com/${bounty.githubOwner}/${bounty.githubRepo}/issues/${bounty.githubIssueNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 border-b border-ink-100 bg-paper-raised p-4 transition last:border-b-0 hover:bg-ink-50"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-7 w-7 shrink-0 rounded" />
                  ) : (
                    <GitBranch className="h-4 w-4 shrink-0 text-ink-300" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">
                    {bounty.githubOwner}/{bounty.githubRepo} <span className="text-ink-400">#{bounty.githubIssueNumber}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-ink-400">
                    <TypeIcon className="h-3.5 w-3.5" />
                  </span>
                  <Pill tone={STATUS_TONE[bounty.status] ?? "neutral"}>{STATUS_LABEL[bounty.status] ?? bounty.status}</Pill>
                </a>
              );
            })}
          </div>
        </Reveal>
      )}

      {!user && (
        <p className="mt-8 rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          This wallet hasn&rsquo;t claimed a profile yet. Is this you?{" "}
          <a href="/onboarding" className="text-primary underline">
            Connect GitHub and link it
          </a>
          .
        </p>
      )}
    </main>
  );
}
