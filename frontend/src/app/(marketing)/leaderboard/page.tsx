import { formatUnits } from "viem";
import { HandCoins, Wrench, Users, GitBranch } from "lucide-react";
import { getSponsors, getMaintainers, getContributors } from "@/lib/directory";
import { Identicon } from "@/components/Identicon";
import { PageHero } from "@/components/PageHero";
import { CtaBand } from "@/components/CtaBand";
import { Reveal } from "@/components/Reveal";

export const dynamic = "force-dynamic";

const RANK_COLOR = ["text-gold-500", "text-ink-400", "text-amber-700"];

function short(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function Board({
  title,
  icon: Icon,
  accent,
  entries,
  render,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  entries: { key: string; address: string | null; githubLogin: string | null; githubAvatarUrl: string | null; name: string | null }[];
  render: (key: string) => React.ReactNode;
}) {
  return (
    <div>
      <h2 className={`mb-3 flex items-center gap-1.5 text-sm font-semibold ${accent}`}>
        <Icon className="h-4 w-4" /> {title}
      </h2>
      {entries.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">Nobody yet.</p>
      ) : (
        <ol className="overflow-hidden rounded-lg border border-ink-200">
          {entries.slice(0, 10).map((entry, i) => {
            const displayName = entry.githubLogin ? `@${entry.githubLogin}` : (entry.name ?? (entry.address ? short(entry.address) : "Anonymous"));
            return (
              <li
                key={entry.key}
                className="flex items-center gap-3 border-b border-ink-100 bg-paper-raised px-3 py-2.5 last:border-b-0"
              >
                <span className={`w-4 shrink-0 text-right font-mono text-xs font-semibold ${RANK_COLOR[i] ?? "text-ink-300"}`}>{i + 1}</span>
                {entry.githubAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entry.githubAvatarUrl} alt="" className="h-7 w-7 shrink-0 rounded-full" />
                ) : entry.address ? (
                  <Identicon address={entry.address} size={28} />
                ) : (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-ink-100" />
                )}
                <a
                  href={entry.address ? `/profile/${entry.address}` : undefined}
                  className="min-w-0 flex-1 truncate text-sm font-medium text-ink-800 hover:text-ink-950"
                >
                  {displayName}
                </a>
                <span className="shrink-0 font-mono text-xs font-semibold text-ink-900">{render(entry.key)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default async function LeaderboardPage() {
  const [sponsors, maintainers, contributors] = await Promise.all([getSponsors(), getMaintainers(), getContributors()]);

  const rankedMaintainers = [...maintainers].sort((a, b) => (b.repos?.length ?? 0) - (a.repos?.length ?? 0));

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <PageHero
        eyebrow="Live rankings"
        eyebrowDot="bg-gold-400"
        title="Leaderboard"
        subtitle="Ranked by real on-chain activity and verified repos — nothing self-reported."
      />

      <Reveal delay={0.05} className="mt-8 grid gap-8 lg:grid-cols-3">
        <Board title="Top sponsors" icon={HandCoins} accent="text-usdc-600" entries={sponsors} render={(key) => {
          const s = sponsors.find((x) => x.key === key)!;
          return `${formatUnits(s.fundedUsdc, 6)} USDC`;
        }} />
        <Board title="Top maintainers" icon={Wrench} accent="text-gold-600" entries={rankedMaintainers} render={(key) => {
          const m = rankedMaintainers.find((x) => x.key === key)!;
          const count = m.repos?.length ?? 0;
          return (
            <span className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" /> {count}
            </span>
          );
        }} />
        <Board title="Top contributors" icon={Users} accent="text-emerald-600" entries={contributors} render={(key) => {
          const c = contributors.find((x) => x.key === key)!;
          return `${formatUnits(c.receivedUsdc, 6)} USDC`;
        }} />
      </Reveal>

      <CtaBand
        title="Climb the board"
        subtitle="Fund an issue, list a repo, or ship a merged PR — every real action here is what moves your rank."
      />
    </main>
  );
}
