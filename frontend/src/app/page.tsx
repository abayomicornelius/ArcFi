import Link from "next/link";
import { ArrowRight, ArrowUpRight, Users, Wrench, HandCoins } from "lucide-react";
import { StatsBar } from "@/components/StatsBar";
import { HowItWorks } from "@/components/HowItWorks";

export default function Home() {
  return (
    <div>
      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="mb-14">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-usdc-200 bg-usdc-50 px-3 py-1 text-xs font-medium text-usdc-700">
            Built for the Arc DeFi Track
          </span>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Programmable USDC payouts for open-source funding
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-500">
            Sponsor a GitHub issue, reserve a release budget, or keep a repo&rsquo;s maintenance pool topped up. Every payout is USDC, released the
            moment an oracle attests a PR merged — conditional, automated, and final in seconds.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-full bg-usdc-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-usdc-600"
            >
              Launch the app <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sponsors"
              className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-800 transition hover:border-ink-300"
            >
              Explore the directory
            </Link>
          </div>

          <div className="mt-10">
            <StatsBar />
          </div>
        </section>

        <section className="mb-14">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-400">How it works</h2>
          <HowItWorks />
        </section>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-400">Who&rsquo;s on ArcFi</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/sponsors" className="group rounded-xl border border-ink-200 bg-paper-raised p-5 transition hover:border-usdc-300">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-usdc-50 text-usdc-600">
                <HandCoins className="h-4 w-4" />
              </div>
              <h3 className="mb-1 flex items-center gap-1 text-sm font-semibold text-ink-900">
                Sponsors <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </h3>
              <p className="text-sm text-ink-500">Individuals and companies funding issues, milestones, and maintenance pools in USDC.</p>
            </Link>
            <Link href="/maintainers" className="group rounded-xl border border-ink-200 bg-paper-raised p-5 transition hover:border-usdc-300">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-usdc-50 text-usdc-600">
                <Wrench className="h-4 w-4" />
              </div>
              <h3 className="mb-1 flex items-center gap-1 text-sm font-semibold text-ink-900">
                Maintainers <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </h3>
              <p className="text-sm text-ink-500">Repo owners who scope bounties, allocate milestone budgets, and vouch for merged work.</p>
            </Link>
            <Link href="/contributors" className="group rounded-xl border border-ink-200 bg-paper-raised p-5 transition hover:border-usdc-300">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-usdc-50 text-usdc-600">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="mb-1 flex items-center gap-1 text-sm font-semibold text-ink-900">
                Contributors <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </h3>
              <p className="text-sm text-ink-500">The people who ship the merged PRs and get paid in USDC the moment they land.</p>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink-200 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-ink-400 sm:flex-row">
          <p>Built for the Arc DeFi Track — Programmable Money Accelerator hackathon.</p>
          <a
            href="https://www.circle.com/arc"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-ink-500 hover:text-ink-700"
          >
            Learn about Arc <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}
