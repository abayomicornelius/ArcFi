import Link from "next/link";
import { ArrowRight, ArrowUpRight, Users, Wrench, HandCoins, Coins, Zap, Layers, Landmark, ShieldCheck, Lock } from "lucide-react";
import { StatsBar } from "@/components/StatsBar";
import { HowItWorks } from "@/components/HowItWorks";
import { HeroFlow } from "@/components/HeroFlow";
import { AppPreview } from "@/components/AppPreview";
import { ActivityFeed } from "@/components/ActivityFeed";
import { getSponsors, getMaintainers, getContributors } from "@/lib/directory";

// Directory counts below read live database + on-chain state — must not be cached as static.
export const dynamic = "force-dynamic";

const TRACK_FIT = [
  {
    icon: Coins,
    title: "Meaningful use of Arc & USDC",
    body: "Every escrow, milestone, and pool balance is denominated directly in USDC — deposit, gas, and payout never leave the stablecoin.",
  },
  {
    icon: Zap,
    title: "Conditional payments",
    body: "Release and refund only fire once a specific, verifiable condition — a PR merge, or a deadline passing — is met.",
  },
  {
    icon: ShieldCheck,
    title: "Onchain automation",
    body: "A single oracle address, watching GitHub webhooks, is the only one authorized to trigger a payout. No manual multisig per bounty.",
  },
  {
    icon: Layers,
    title: "Multi-step settlement",
    body: "Milestones reserve a budget once, then release it across many issues over time. Pools take indefinite recurring deposits and draw-downs.",
  },
  {
    icon: Landmark,
    title: "Treasury infrastructure",
    body: "A protocol fee sweeps to the treasury in the same transaction as every payout — no separate step to forget.",
  },
];

const FAQ = [
  {
    q: "Is ArcFi custodial?",
    a: "No. Funds sit in the escrow/milestone/pool smart contracts on Arc, not in a wallet ArcFi controls. The only privileged action is the oracle triggering a release once it has verified a PR merged — it can never redirect funds to itself.",
  },
  {
    q: "What happens if a sponsor's issue never gets solved?",
    a: "Every escrow has a deadline. The sponsor (or ArcFi's oracle) can refund it any time before the deadline; after the deadline, anyone can trigger the refund — but it always pays the original sponsor, never the caller.",
  },
  {
    q: "How are team bounties split?",
    a: "A release specifies a list of recipients with basis-point shares that must sum to 100%. The split uses largest-remainder rounding, so the full amount is always distributed with no dust left behind.",
  },
  {
    q: "Do I need a GitHub account to use the app?",
    a: "No — /app works with just a wallet. A GitHub-linked profile is what gets you listed in the public sponsor/maintainer/contributor directories.",
  },
];

export default async function Home() {
  const [sponsors, maintainers, contributors] = await Promise.all([getSponsors(), getMaintainers(), getContributors()]);

  return (
    <div>
      <section className="hero-mesh relative overflow-hidden">
        <div className="hero-grid absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
                Built for the Arc DeFi Track
              </span>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                Programmable USDC payouts for open-source funding
              </h1>
              <p className="mt-5 max-w-lg text-lg text-white/60">
                Sponsor a GitHub issue, reserve a release budget, or keep a repo&rsquo;s maintenance pool topped up. Every payout is USDC, released
                the moment an oracle attests a PR merged.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/app"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-white/90"
                >
                  Launch the app <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Create a profile
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/40">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Non-custodial
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> Open source
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" /> Sub-second settlement on Arc
                </span>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <HeroFlow />
            </div>
          </div>

          <div className="mt-16">
            <StatsBar dark />
          </div>
        </div>
      </section>

      <main>
        <section className="border-b border-ink-200 bg-ink-50/60 px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="mb-1 font-mono text-xs font-medium uppercase tracking-wider text-ink-400">Live on Arc</h2>
                <p className="text-ink-500">Every fund, allocation, and payout below is a real event read straight off the deployed contracts.</p>
              </div>
              <Link href="/app" className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-usdc-600 hover:underline sm:inline-flex">
                Open the app <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <ActivityFeed />
              <AppPreview />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6 py-16">
          <section className="mb-16 grid gap-10 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <h2 className="mb-1 font-mono text-xs font-medium uppercase tracking-wider text-ink-400">Why this fits the DeFi track</h2>
              <p className="mb-6 max-w-md text-ink-500">Arc&rsquo;s DeFi track asks for advanced programmable money flows. Here&rsquo;s what ArcFi ships against each ask.</p>
              <ol className="space-y-5">
                {TRACK_FIT.map((item, i) => (
                  <li key={item.title} className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                        <item.icon className="h-3.5 w-3.5 text-usdc-500" />
                        {item.title}
                      </h3>
                      <p className="mt-0.5 text-sm text-ink-500">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-lg border border-ink-200 bg-ink-900 p-6">
              <p className="font-mono text-xs font-medium uppercase tracking-wider text-white/40">Core products used</p>
              <ul className="mt-4 space-y-3 text-sm text-white/80">
                <li className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-usdc-400" /> Arc — USDC-denominated gas, sub-second settlement
                </li>
                <li className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-400" /> USDC — the only settlement asset, end to end
                </li>
                <li className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Solidity + OpenZeppelin — audited primitives
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> GitHub OAuth — sponsor/maintainer/contributor identity
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="mb-6 font-mono text-xs font-medium uppercase tracking-wider text-ink-400">How it works</h2>
            <HowItWorks />
          </section>

          <section className="mb-16">
            <h2 className="mb-4 font-mono text-xs font-medium uppercase tracking-wider text-ink-400">Who&rsquo;s on ArcFi</h2>
            <div className="divide-y divide-ink-200 border border-ink-200 bg-paper-raised">
              <Link
                href="/sponsors"
                className="group flex items-center gap-4 border-l-4 border-l-usdc-500 px-5 py-4 transition hover:bg-usdc-50/40"
              >
                <HandCoins className="h-5 w-5 shrink-0 text-usdc-500" />
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-1 text-sm font-semibold text-ink-900">
                    Sponsors <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                  </h3>
                  <p className="truncate text-sm text-ink-500">Individuals and companies funding issues, milestones, and maintenance pools.</p>
                </div>
                <span className="font-mono text-2xl font-medium text-ink-900">{sponsors.length}</span>
              </Link>
              <Link
                href="/maintainers"
                className="group flex items-center gap-4 border-l-4 border-l-gold-500 px-5 py-4 transition hover:bg-gold-50/40"
              >
                <Wrench className="h-5 w-5 shrink-0 text-gold-500" />
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-1 text-sm font-semibold text-ink-900">
                    Maintainers <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                  </h3>
                  <p className="truncate text-sm text-ink-500">Repo owners who scope bounties and vouch for merged work.</p>
                </div>
                <span className="font-mono text-2xl font-medium text-ink-900">{maintainers.length}</span>
              </Link>
              <Link
                href="/contributors"
                className="group flex items-center gap-4 border-l-4 border-l-emerald-500 px-5 py-4 transition hover:bg-emerald-50/40"
              >
                <Users className="h-5 w-5 shrink-0 text-emerald-500" />
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-1 text-sm font-semibold text-ink-900">
                    Contributors <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                  </h3>
                  <p className="truncate text-sm text-ink-500">The people who ship merged PRs and get paid in USDC the moment they land.</p>
                </div>
                <span className="font-mono text-2xl font-medium text-ink-900">{contributors.length}</span>
              </Link>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="mb-4 font-mono text-xs font-medium uppercase tracking-wider text-ink-400">Questions</h2>
            <div className="divide-y divide-ink-200 rounded-md border border-ink-200 bg-paper-raised">
              {FAQ.map((item) => (
                <details key={item.q} className="group p-5">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-ink-900 marker:content-none">
                    <span className="flex items-center justify-between gap-4">
                      {item.q}
                      <span className="text-ink-300 transition group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-ink-500">{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="hero-mesh relative overflow-hidden rounded-lg px-8 py-14 text-center">
            <div className="hero-grid absolute inset-0" />
            <div className="relative">
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">Ready to fund or get funded?</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
                Connect a wallet in the app, or set up a GitHub-backed profile to appear in the directory.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/app"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-white/90"
                >
                  Launch the app <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Create a profile
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
