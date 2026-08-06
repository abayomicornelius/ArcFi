import Link from "next/link";
import { ArrowRight, ArrowUpRight, Users, Wrench, HandCoins, Check, Coins, Zap, Layers, Landmark, ShieldCheck } from "lucide-react";
import { StatsBar } from "@/components/StatsBar";
import { HowItWorks } from "@/components/HowItWorks";
import { HeroFlow } from "@/components/HeroFlow";

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

export default function Home() {
  return (
    <div>
      <section className="hero-mesh relative overflow-hidden">
        <div className="hero-grid absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
                Built for the Arc DeFi Track
              </span>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
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
            </div>

            <div className="flex justify-center lg:justify-end">
              <HeroFlow />
            </div>
          </div>

          <div className="mt-14">
            <StatsBar dark />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="mb-16">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-ink-400">Why this fits the DeFi track</h2>
          <p className="mb-6 max-w-2xl text-ink-500">Arc&rsquo;s DeFi track asks for advanced programmable money flows. Here&rsquo;s what ArcFi ships against each ask.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRACK_FIT.map((item) => (
              <div key={item.title} className="rounded-xl border border-ink-200 bg-paper-raised p-5">
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-usdc-50 text-usdc-600">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <Check className="h-4 w-4 text-emerald-500" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-ink-900">{item.title}</h3>
                <p className="text-sm text-ink-500">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-400">How it works</h2>
          <HowItWorks />
        </section>

        <section className="mb-16">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-400">Who&rsquo;s on ArcFi</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/sponsors"
              className="group rounded-xl border border-ink-200 bg-paper-raised p-5 transition hover:border-usdc-300 hover:shadow-[0_4px_16px_rgba(39,117,202,0.12)]"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-usdc-50 text-usdc-600">
                <HandCoins className="h-4 w-4" />
              </div>
              <h3 className="mb-1 flex items-center gap-1 text-sm font-semibold text-ink-900">
                Sponsors <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </h3>
              <p className="text-sm text-ink-500">Individuals and companies funding issues, milestones, and maintenance pools in USDC.</p>
            </Link>
            <Link
              href="/maintainers"
              className="group rounded-xl border border-ink-200 bg-paper-raised p-5 transition hover:border-gold-400 hover:shadow-[0_4px_16px_rgba(217,140,15,0.12)]"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gold-50 text-gold-600">
                <Wrench className="h-4 w-4" />
              </div>
              <h3 className="mb-1 flex items-center gap-1 text-sm font-semibold text-ink-900">
                Maintainers <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </h3>
              <p className="text-sm text-ink-500">Repo owners who scope bounties, allocate milestone budgets, and vouch for merged work.</p>
            </Link>
            <Link
              href="/contributors"
              className="group rounded-xl border border-ink-200 bg-paper-raised p-5 transition hover:border-emerald-300 hover:shadow-[0_4px_16px_rgba(16,185,129,0.12)]"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="mb-1 flex items-center gap-1 text-sm font-semibold text-ink-900">
                Contributors <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </h3>
              <p className="text-sm text-ink-500">The people who ship the merged PRs and get paid in USDC the moment they land.</p>
            </Link>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-400">Questions</h2>
          <div className="divide-y divide-ink-200 rounded-xl border border-ink-200 bg-paper-raised">
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

        <section className="rounded-2xl border border-ink-200 bg-ink-900 px-8 py-12 text-center">
          <h2 className="text-2xl font-semibold text-white">Ready to fund or get funded?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-300">Connect a wallet in the app, or set up a GitHub-backed profile to appear in the directory.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/app" className="inline-flex items-center gap-2 rounded-full bg-usdc-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-usdc-600">
              Launch the app <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/onboarding" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
              Create a profile
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
