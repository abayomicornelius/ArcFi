import Link from "next/link";
import { GitBranch, Coins, Flag, ArrowUpRight, Plus, Megaphone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Pill, type PillTone } from "@/components/ui";
import { PageHero } from "@/components/PageHero";
import { CtaBand } from "@/components/CtaBand";
import { Reveal } from "@/components/Reveal";

export const dynamic = "force-dynamic";

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

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATS = [
  { status: "funded", label: "Open", tone: "text-usdc-600" },
  { status: "pending_recipient", label: "Awaiting wallet", tone: "text-amber-600" },
  { status: "released", label: "Paid out", tone: "text-emerald-600" },
  { status: "refunded", label: "Refunded", tone: "text-ink-400" },
] as const;

export default async function BountiesPage() {
  const [bounties, requests] = await Promise.all([
    prisma.bounty.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.bountyRequest.findMany({
      where: { status: "open" },
      orderBy: { createdAt: "desc" },
      include: { requestedBy: { select: { githubLogin: true } } },
    }),
  ]);

  const repoKeys = [...new Set([...bounties, ...requests].map((b) => `${b.githubOwner}/${b.githubRepo}`))].map((key) => {
    const [githubOwner, githubRepo] = key.split("/");
    return { githubOwner, githubRepo };
  });
  const sponsorIds = [...new Set(bounties.map((b) => b.createdByUserId).filter((id): id is string => Boolean(id)))];

  const [sponsors, repos] = await Promise.all([
    sponsorIds.length ? prisma.user.findMany({ where: { id: { in: sponsorIds } }, select: { id: true, githubLogin: true } }) : [],
    repoKeys.length
      ? prisma.repo.findMany({
          where: { OR: repoKeys },
          select: { githubOwner: true, githubRepo: true, avatarUrl: true, primaryLanguage: true },
        })
      : [],
  ]);
  const sponsorByUserId = new Map(sponsors.map((s) => [s.id, s.githubLogin]));
  const repoByKey = new Map(repos.map((r) => [`${r.githubOwner}/${r.githubRepo}`, r]));

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <PageHero
        eyebrow={`${bounties.length} bount${bounties.length === 1 ? "y" : "ies"} tracked`}
        eyebrowDot="bg-usdc-400"
        title="Funded GitHub issues"
        subtitle="Every issue here already has USDC escrowed on Arc. Merge the linked PR and the payout fires automatically — no invoicing, no chasing a sponsor."
        action={
          <Link
            href="/bounties/request"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-ink-300"
          >
            <Plus className="h-4 w-4" /> Request funding
          </Link>
        }
      />
      <div className="mt-8">
      {requests.length > 0 && (
        <Reveal className="mb-10">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink-900">
            <Megaphone className="h-4 w-4 text-gold-600" /> Open requests
          </h2>
          <div className="space-y-3">
            {requests.map((r) => {
              const repo = repoByKey.get(`${r.githubOwner}/${r.githubRepo}`);
              const fundHref = `/app?tab=${r.contractType}&owner=${encodeURIComponent(r.githubOwner)}&repo=${encodeURIComponent(
                r.githubRepo,
              )}&issue=${r.githubIssueNumber}${r.suggestedAmount ? `&amount=${encodeURIComponent(r.suggestedAmount.replace(/[^\d.]/g, ""))}` : ""}&requestId=${r.id}`;
              return (
                <div key={r.id} className="flex items-start gap-3 rounded-md border border-gold-200 bg-gold-50/40 p-4">
                  {repo?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={repo.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-md" />
                  ) : (
                    <div className="h-9 w-9 shrink-0 rounded-md bg-ink-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink-900">
                      {r.title}
                      <span className="font-mono text-xs font-normal text-ink-400">
                        {r.githubOwner}/{r.githubRepo}#{r.githubIssueNumber}
                      </span>
                    </p>
                    {r.description && <p className="mt-0.5 line-clamp-2 text-sm text-ink-600">{r.description}</p>}
                    <p className="mt-1 text-xs text-ink-400">
                      requested by @{r.requestedBy.githubLogin ?? "unknown"}
                      {r.suggestedAmount && ` · suggested ${r.suggestedAmount}`}
                    </p>
                  </div>
                  <Link
                    href={fundHref}
                    className="btn-glow shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110"
                  >
                    Fund this
                  </Link>
                </div>
              );
            })}
          </div>
        </Reveal>
      )}

      {bounties.length > 0 && (
        <Reveal delay={0.05} className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.status} className="rounded-md border border-ink-200 bg-paper-raised p-4">
              <p className={`font-mono text-2xl font-semibold ${stat.tone}`}>{bounties.filter((b) => b.status === stat.status).length}</p>
              <p className="mt-0.5 text-xs text-ink-400">{stat.label}</p>
            </div>
          ))}
        </Reveal>
      )}

      {bounties.length === 0 && requests.length === 0 ? (
        <Reveal className="rounded-md border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No bounties funded yet.</p>
          <Link href="/app" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
            Fund the first one →
          </Link>
        </Reveal>
      ) : bounties.length === 0 ? null : (
        <Reveal delay={0.1} className="overflow-hidden rounded-lg border border-ink-200">
          <div className="hidden gap-4 border-b border-ink-100 bg-ink-50 px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-ink-400 sm:grid sm:grid-cols-[1fr_auto_auto_auto]">
            <span>Issue</span>
            <span>Type</span>
            <span>Status</span>
            <span>Funded</span>
          </div>
          {bounties.map((bounty) => {
            const sponsorLogin = bounty.createdByUserId ? sponsorByUserId.get(bounty.createdByUserId) : null;
            const repo = repoByKey.get(`${bounty.githubOwner}/${bounty.githubRepo}`);
            const TypeIcon = bounty.contractType === "milestone" ? Flag : Coins;
            return (
              <Link
                key={bounty.id}
                href={`/bounties/${bounty.id}`}
                className="flex flex-col gap-2.5 border-b border-ink-100 px-4 py-3.5 transition last:border-b-0 hover:bg-ink-50 sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-4"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  {repo?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={repo.avatarUrl} alt="" className="h-6 w-6 shrink-0 rounded" />
                  ) : (
                    <GitBranch className="h-4 w-4 shrink-0 text-ink-300" />
                  )}
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink-900">
                      <span className="truncate">
                        {bounty.githubOwner}/{bounty.githubRepo}
                      </span>
                      <span className="text-ink-400">#{bounty.githubIssueNumber}</span>
                      <ArrowUpRight className="h-3 w-3 shrink-0 text-ink-300" />
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      {sponsorLogin && <span className="text-xs text-ink-400">funded by @{sponsorLogin}</span>}
                      {repo?.primaryLanguage && (
                        <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">{repo.primaryLanguage}</span>
                      )}
                    </span>
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-3 sm:contents">
                  <span className="flex items-center gap-1 text-xs text-ink-500">
                    <TypeIcon className="h-3.5 w-3.5" />
                    {bounty.contractType === "milestone" ? "Milestone" : "Escrow"}
                  </span>
                  <Pill tone={STATUS_TONE[bounty.status] ?? "neutral"}>{STATUS_LABEL[bounty.status] ?? bounty.status}</Pill>
                  <span className="whitespace-nowrap text-xs text-ink-400 sm:hidden">{formatDate(bounty.createdAt)}</span>
                </span>
                <span className="hidden whitespace-nowrap text-xs text-ink-400 sm:block">{formatDate(bounty.createdAt)}</span>
              </Link>
            );
          })}
        </Reveal>
      )}
      </div>

      <CtaBand
        title="Fund the next one"
        subtitle="Browse a repo, fund an issue, or ask a sponsor to fund yours — all of it settles automatically."
        primaryHref="/app"
        primaryLabel="Fund a bounty"
        secondaryHref="/bounties/request"
        secondaryLabel="Request funding"
      />
    </main>
  );
}
