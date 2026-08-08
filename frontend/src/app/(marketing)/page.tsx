import Link from "next/link";
import { ArrowRight, ArrowUpRight, Users, Wrench, HandCoins, Coins, Zap, Layers, Landmark, ShieldCheck, Lock, BookOpen } from "lucide-react";
import { StatsBar } from "@/components/StatsBar";
import { HowItWorks } from "@/components/HowItWorks";
import { HeroIllustration } from "@/components/HeroIllustration";
import { AppPreview } from "@/components/AppPreview";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Reveal } from "@/components/Reveal";
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
      <section className="relative overflow-hidden pb-20 pt-16 sm:pt-24">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -z-10 h-[640px]"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, color-mix(in oklab, var(--color-primary) 16%, transparent), transparent)" }}
        />
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-2">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-1.5 rounded-full border-transparent bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                Built for the Arc DeFi Track
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="text-balance mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                Programmable USDC payouts for open-source funding
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
                Sponsor a GitHub issue, reserve a release budget, or keep a repo&rsquo;s maintenance pool topped up. Every payout is USDC, released
                the moment an oracle attests a PR merged.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="/app"
                  className="btn-glow group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_8px_20px_-8px_hsl(var(--shadow-color)/0.5)] transition-all hover:brightness-110 active:brightness-95"
                >
                  Launch the app <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-transparent px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  <BookOpen className="h-4 w-4" /> Create a profile
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.32}>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
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
            </Reveal>
          </div>

          <HeroIllustration />
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40 py-14">
        <div className="mx-auto max-w-6xl px-6">
          <StatsBar />
        </div>
      </section>

      <main>
        <section className="border-b border-border bg-secondary/40 px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <h2 className="mb-1 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Live on Arc</h2>
                  <p className="text-muted-foreground">Every fund, allocation, and payout below is a real event read straight off the deployed contracts.</p>
                </div>
                <Link href="/app" className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex">
                  Open the app <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Reveal>
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Reveal delay={0.05}>
                <ActivityFeed />
              </Reveal>
              <Reveal delay={0.12}>
                <AppPreview />
              </Reveal>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6 py-16">
          <section className="mb-16 grid gap-10 lg:grid-cols-[1fr_0.8fr]">
            <Reveal>
              <h2 className="mb-1 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Why this fits the DeFi track</h2>
              <p className="mb-6 max-w-md text-muted-foreground">Arc&rsquo;s DeFi track asks for advanced programmable money flows. Here&rsquo;s what ArcFi ships against each ask.</p>
              <ol className="space-y-5">
                {TRACK_FIT.map((item, i) => (
                  <li key={item.title} className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <item.icon className="h-3.5 w-3.5 text-primary" />
                        {item.title}
                      </h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={0.15} className="relative overflow-hidden rounded-lg border border-white/10 bg-ink-900 p-6">
              <div
                className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
                style={{ background: "radial-gradient(circle, rgba(124,92,224,0.5), transparent 70%)" }}
              />
              <p className="relative font-mono text-xs font-medium uppercase tracking-wider text-white/40">Core products used</p>
              <ul className="relative mt-4 space-y-3 text-sm text-white/80">
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
            </Reveal>
          </section>

          <section className="mb-16">
            <Reveal>
              <h2 className="mb-6 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">How it works</h2>
            </Reveal>
            <HowItWorks />
          </section>

          <section className="mb-16">
            <Reveal>
              <h2 className="mb-4 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Who&rsquo;s on ArcFi</h2>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-3">
              <Reveal delay={0}>
                <Link
                  href="/sponsors"
                  className="card-lift group flex h-full flex-col gap-3 rounded-lg border border-ink-200 border-l-4 border-l-usdc-500 bg-paper-raised px-5 py-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-usdc-50 text-usdc-600">
                      <HandCoins className="h-4 w-4" />
                    </span>
                    <span className="font-mono text-2xl font-medium text-ink-900">{sponsors.length}</span>
                  </div>
                  <div>
                    <h3 className="flex items-center gap-1 text-sm font-semibold text-ink-900">
                      Sponsors <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                    </h3>
                    <p className="mt-0.5 text-sm text-ink-500">Individuals and companies funding issues, milestones, and maintenance pools.</p>
                  </div>
                </Link>
              </Reveal>
              <Reveal delay={0.08}>
                <Link
                  href="/maintainers"
                  className="card-lift group flex h-full flex-col gap-3 rounded-lg border border-ink-200 border-l-4 border-l-gold-500 bg-paper-raised px-5 py-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-50 text-gold-600">
                      <Wrench className="h-4 w-4" />
                    </span>
                    <span className="font-mono text-2xl font-medium text-ink-900">{maintainers.length}</span>
                  </div>
                  <div>
                    <h3 className="flex items-center gap-1 text-sm font-semibold text-ink-900">
                      Maintainers <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                    </h3>
                    <p className="mt-0.5 text-sm text-ink-500">Repo owners who scope bounties and vouch for merged work.</p>
                  </div>
                </Link>
              </Reveal>
              <Reveal delay={0.16}>
                <Link
                  href="/contributors"
                  className="card-lift group flex h-full flex-col gap-3 rounded-lg border border-ink-200 border-l-4 border-l-emerald-500 bg-paper-raised px-5 py-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Users className="h-4 w-4" />
                    </span>
                    <span className="font-mono text-2xl font-medium text-ink-900">{contributors.length}</span>
                  </div>
                  <div>
                    <h3 className="flex items-center gap-1 text-sm font-semibold text-ink-900">
                      Contributors <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                    </h3>
                    <p className="mt-0.5 text-sm text-ink-500">The people who ship merged PRs and get paid in USDC the moment they land.</p>
                  </div>
                </Link>
              </Reveal>
            </div>
          </section>

          <section className="mb-16">
            <Reveal>
              <h2 className="mb-4 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Questions</h2>
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
            </Reveal>
          </section>

          <Reveal className="hero-mesh relative overflow-hidden rounded-lg px-8 py-14 text-center">
            <div className="hero-grid absolute inset-0" />
            <div
              className="hero-orb pointer-events-none absolute -bottom-16 left-1/4 h-64 w-64 rounded-full opacity-40 blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(124,92,224,0.4), transparent 70%)" }}
            />
            <div className="relative">
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">Ready to fund or get funded?</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
                Connect a wallet in the app, or set up a GitHub-backed profile to appear in the directory.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/app"
                  className="btn-glow inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-white/90"
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
          </Reveal>
        </div>
      </main>
    </div>
  );
}
