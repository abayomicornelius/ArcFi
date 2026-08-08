import { formatUnits } from "viem";
import { HandCoins, Wrench, Users, Lock, TrendingUp } from "lucide-react";
import { getAllParticipants } from "@/lib/onchain";
import { getSponsors, getMaintainers, getContributors, getAllRepos } from "@/lib/directory";
import { prisma } from "@/lib/prisma";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { PageHero } from "@/components/PageHero";
import { CtaBand } from "@/components/CtaBand";
import { Reveal } from "@/components/Reveal";

export const dynamic = "force-dynamic";

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export default async function AnalyticsPage() {
  const [participants, sponsors, maintainers, contributors, repos, bounties] = await Promise.all([
    getAllParticipants(),
    getSponsors(),
    getMaintainers(),
    getContributors(),
    getAllRepos(),
    prisma.bounty.findMany({ select: { createdAt: true, status: true }, orderBy: { createdAt: "asc" } }),
  ]);

  const totalFunded = participants.reduce((sum, p) => sum + p.fundedUsdc, 0n);
  const totalReceived = participants.reduce((sum, p) => sum + p.receivedUsdc, 0n);
  const currentlyLocked = totalFunded > totalReceived ? totalFunded - totalReceived : 0n;
  const totalDeposits = participants.reduce((sum, p) => sum + p.fundedCount, 0);

  // Last 8 weeks of bounty creation, bucketed — a real trend line from actual DB timestamps.
  const now = new Date();
  const weeks: { label: string; start: Date }[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = startOfWeek(new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000));
    weeks.push({ label: `${start.getUTCMonth() + 1}/${start.getUTCDate()}`, start });
  }
  const weeklyActivity = weeks.map((w, i) => {
    const end = i < weeks.length - 1 ? weeks[i + 1].start : new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const count = bounties.filter((b) => b.createdAt >= w.start && b.createdAt < end).length;
    return { week: w.label, bounties: count };
  });

  const statusCounts = ["funded", "pending_recipient", "released", "refunded"].map((status) => ({
    status,
    count: bounties.filter((b) => b.status === status).length,
  }));

  const topRepos = repos
    .map((r) => ({ name: `${r.githubOwner}/${r.githubRepo}`, stars: r.stars }))
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 6);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <PageHero
        eyebrow="Live protocol data"
        eyebrowDot="bg-usdc-400"
        title="Protocol analytics"
        subtitle="Live on-chain and platform data — nothing simulated."
      />

      <Reveal className="mb-8 mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-md border border-ink-200 bg-paper-raised p-5">
          <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-ink-400">
            <Lock className="h-3.5 w-3.5" /> Currently locked
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-usdc-600">{formatUnits(currentlyLocked, 6)}</p>
          <p className="mt-0.5 text-xs text-ink-400">USDC in escrow</p>
        </div>
        <div className="rounded-md border border-ink-200 bg-paper-raised p-5">
          <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-ink-400">
            <TrendingUp className="h-3.5 w-3.5" /> Total funded
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-ink-900">{formatUnits(totalFunded, 6)}</p>
          <p className="mt-0.5 text-xs text-ink-400">across {totalDeposits} deposits</p>
        </div>
        <div className="rounded-md border border-ink-200 bg-paper-raised p-5">
          <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-ink-400">
            <HandCoins className="h-3.5 w-3.5" /> Total paid out
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-emerald-600">{formatUnits(totalReceived, 6)}</p>
          <p className="mt-0.5 text-xs text-ink-400">to contributors</p>
        </div>
        <div className="rounded-md border border-ink-200 bg-paper-raised p-5">
          <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-ink-400">
            <Wrench className="h-3.5 w-3.5" /> Projects listed
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-ink-900">{repos.length}</p>
          <p className="mt-0.5 text-xs text-ink-400">verified repos</p>
        </div>
      </Reveal>

      <Reveal delay={0.05} className="mb-8 grid grid-cols-3 gap-4">
        <div className="rounded-md border border-ink-200 bg-paper-raised p-5 text-center">
          <HandCoins className="mx-auto h-4 w-4 text-usdc-600" />
          <p className="mt-2 font-mono text-xl font-semibold text-ink-900">{sponsors.length}</p>
          <p className="text-xs text-ink-400">Sponsors</p>
        </div>
        <div className="rounded-md border border-ink-200 bg-paper-raised p-5 text-center">
          <Wrench className="mx-auto h-4 w-4 text-gold-600" />
          <p className="mt-2 font-mono text-xl font-semibold text-ink-900">{maintainers.length}</p>
          <p className="text-xs text-ink-400">Maintainers</p>
        </div>
        <div className="rounded-md border border-ink-200 bg-paper-raised p-5 text-center">
          <Users className="mx-auto h-4 w-4 text-emerald-600" />
          <p className="mt-2 font-mono text-xl font-semibold text-ink-900">{contributors.length}</p>
          <p className="text-xs text-ink-400">Contributors</p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <AnalyticsCharts weeklyActivity={weeklyActivity} statusCounts={statusCounts} topRepos={topRepos} />
      </Reveal>

      <CtaBand title="Move the needle" subtitle="Every chart above updates the moment you fund an issue, list a repo, or ship a merged PR." />
    </main>
  );
}
