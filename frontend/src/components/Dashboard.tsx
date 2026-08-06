"use client";

import { useState } from "react";
import { Coins, Flag, PiggyBank, AlertTriangle, Info, ArrowUpRight } from "lucide-react";
import { ConnectButton } from "./ConnectButton";
import { FaucetButton } from "./FaucetButton";
import { EscrowPanel } from "./EscrowPanel";
import { MilestonesPanel } from "./MilestonesPanel";
import { MaintenancePoolPanel } from "./MaintenancePoolPanel";
import { StatsBar } from "./StatsBar";
import { HowItWorks } from "./HowItWorks";
import { ActivityFeed } from "./ActivityFeed";
import { isDeployed, isLocalDemo } from "@/lib/contracts";
import { activeChain } from "@/lib/chains";

const TABS = [
  { id: "escrow", label: "Escrow", blurb: "Single-issue bounty", icon: Coins },
  { id: "milestones", label: "Milestones", blurb: "Release-scoped budget", icon: Flag },
  { id: "pool", label: "Maintenance Pool", blurb: "Ongoing repo funding", icon: PiggyBank },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Dashboard() {
  const [tab, setTab] = useState<TabId>("escrow");

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-ink-200 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-usdc-500 text-sm font-bold text-white">A</div>
            <div>
              <p className="text-sm font-semibold leading-none text-ink-900">ArcFi</p>
              <p className="text-xs leading-none text-ink-400">{activeChain.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FaucetButton />
            <ConnectButton />
          </div>
        </div>
      </header>

      {!isDeployed && (
        <div className="flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-center text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Contract addresses aren&rsquo;t configured. Set the <code className="font-mono">NEXT_PUBLIC_*_ADDRESS</code> vars in{" "}
          <code className="font-mono">frontend/.env.local</code>.
        </div>
      )}
      {isLocalDemo && isDeployed && (
        <div className="flex items-center justify-center gap-2 border-b border-usdc-100 bg-usdc-50 px-6 py-2.5 text-center text-sm text-usdc-700">
          <Info className="h-4 w-4 shrink-0" />
          Running against a local Anvil chain with mock USDC — set <code className="font-mono">NEXT_PUBLIC_CHAIN=arc</code> for the real Arc testnet.
        </div>
      )}

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="mb-12">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-usdc-200 bg-usdc-50 px-3 py-1 text-xs font-medium text-usdc-700">
            Built for the Arc DeFi Track
          </span>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Programmable USDC payouts for open-source funding
          </h1>
          <p className="mt-3 max-w-xl text-ink-500">
            Sponsor a GitHub issue, reserve a release budget, or keep a repo&rsquo;s maintenance pool topped up. Every payout is USDC, released the
            moment an oracle attests a PR merged — conditional, automated, and final in seconds.
          </p>

          <div className="mt-8">
            <StatsBar />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-400">How it works</h2>
          <HowItWorks />
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-6 flex gap-1 rounded-xl border border-ink-200 bg-white p-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex flex-1 items-center gap-2.5 rounded-lg px-4 py-2.5 text-left transition ${
                    tab === t.id ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-50"
                  }`}
                >
                  <t.icon className={`h-4 w-4 shrink-0 ${tab === t.id ? "text-usdc-400" : "text-ink-400"}`} />
                  <span>
                    <span className="block text-sm font-semibold">{t.label}</span>
                    <span className={`block text-xs ${tab === t.id ? "text-ink-300" : "text-ink-400"}`}>{t.blurb}</span>
                  </span>
                </button>
              ))}
            </div>

            {tab === "escrow" && <EscrowPanel />}
            {tab === "milestones" && <MilestonesPanel />}
            {tab === "pool" && <MaintenancePoolPanel />}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <ActivityFeed />
          </aside>
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
