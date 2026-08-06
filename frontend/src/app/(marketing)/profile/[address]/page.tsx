import { isAddress, getAddress, formatUnits } from "viem";
import { notFound } from "next/navigation";
import { ArrowUpRight, HandCoins, Wrench, Users, GitBranch } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getParticipantStats } from "@/lib/onchain";
import { activeChain } from "@/lib/chains";
import { Identicon } from "@/components/Identicon";
import { Pill } from "@/components/ui";

export default async function ProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address: rawAddress } = await params;
  if (!isAddress(rawAddress)) notFound();
  const address = getAddress(rawAddress);

  const [user, stats] = await Promise.all([
    prisma.user.findUnique({ where: { walletAddress: address } }),
    getParticipantStats(address),
  ]);

  const displayName = user?.githubLogin ? `@${user.githubLogin}` : user?.name ?? `${address.slice(0, 6)}…${address.slice(-4)}`;
  const explorerUrl = activeChain.blockExplorers?.default.url ? `${activeChain.blockExplorers.default.url}/address/${address}` : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center gap-4">
        {user?.githubAvatarUrl ?? user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user?.githubAvatarUrl ?? user?.image ?? ""} alt="" className="h-16 w-16 rounded-full" />
        ) : (
          <Identicon address={address} size={64} />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink-900">
            {displayName}
            {user?.githubLogin && (
              <a href={`https://github.com/${user.githubLogin}`} target="_blank" rel="noreferrer" className="text-ink-300 hover:text-ink-600">
                <GitBranch className="h-4 w-4" />
              </a>
            )}
          </h1>
          <p className="mt-0.5 font-mono text-xs text-ink-400">{address}</p>
          {explorerUrl && (
            <a href={explorerUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-usdc-600 hover:underline">
              View on {activeChain.blockExplorers?.default.name} <ArrowUpRight className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

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

      {user?.bio && <p className="mb-8 max-w-xl text-ink-600">{user.bio}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      {!user && (
        <p className="mt-8 rounded-md border border-dashed border-ink-200 p-6 text-center text-sm text-ink-400">
          This wallet hasn&rsquo;t claimed a profile yet. Is this you?{" "}
          <a href="/onboarding" className="text-usdc-600 underline">
            Connect GitHub and link it
          </a>
          .
        </p>
      )}
    </main>
  );
}
