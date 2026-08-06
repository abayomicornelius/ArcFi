"use client";

import { useState } from "react";
import { ConnectButton } from "./ConnectButton";
import { FaucetButton } from "./FaucetButton";
import { EscrowPanel } from "./EscrowPanel";
import { MilestonesPanel } from "./MilestonesPanel";
import { MaintenancePoolPanel } from "./MaintenancePoolPanel";
import { isDeployed, isLocalDemo } from "@/lib/contracts";
import { activeChain } from "@/lib/chains";

const TABS = [
  { id: "escrow", label: "Escrow", blurb: "Single-issue bounty" },
  { id: "milestones", label: "Milestones", blurb: "Release-scoped budget" },
  { id: "pool", label: "Maintenance Pool", blurb: "Ongoing repo funding" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Dashboard() {
  const [tab, setTab] = useState<TabId>("escrow");

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-ink-200 bg-paper/95 backdrop-blur">
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
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-center text-sm text-amber-800">
          Contract addresses aren&rsquo;t configured. Set the <code className="font-mono">NEXT_PUBLIC_*_ADDRESS</code> vars in{" "}
          <code className="font-mono">frontend/.env.local</code>.
        </div>
      )}
      {isLocalDemo && isDeployed && (
        <div className="border-b border-usdc-100 bg-usdc-50 px-6 py-2.5 text-center text-sm text-usdc-700">
          Running against a local Anvil chain with mock USDC — for the real Arc testnet, set <code className="font-mono">NEXT_PUBLIC_CHAIN=arc</code>.
        </div>
      )}

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10 max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Programmable USDC payouts for open-source funding</h1>
          <p className="mt-2 text-ink-500">
            Sponsor a GitHub issue, reserve a release budget, or keep a repo&rsquo;s maintenance pool topped up — every payout is USDC, released the
            moment ArcFi&rsquo;s oracle attests a PR merged.
          </p>
        </div>

        <div className="mb-8 flex gap-1 rounded-xl border border-ink-200 bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-left transition ${
                tab === t.id ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-50"
              }`}
            >
              <span className="block text-sm font-semibold">{t.label}</span>
              <span className={`block text-xs ${tab === t.id ? "text-ink-300" : "text-ink-400"}`}>{t.blurb}</span>
            </button>
          ))}
        </div>

        {tab === "escrow" && <EscrowPanel />}
        {tab === "milestones" && <MilestonesPanel />}
        {tab === "pool" && <MaintenancePoolPanel />}
      </main>

      <footer className="border-t border-ink-200 px-6 py-8 text-center text-xs text-ink-400">
        Built for the Arc DeFi track. Contract design adapted from{" "}
        <a href="https://github.com/MergeFi" target="_blank" rel="noreferrer" className="underline hover:text-ink-600">
          MergeFi
        </a>
        .
      </footer>
    </div>
  );
}
