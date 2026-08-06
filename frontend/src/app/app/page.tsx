"use client";

import { useState } from "react";
import { Coins, Flag, PiggyBank, AlertTriangle, Info } from "lucide-react";
import { EscrowPanel } from "@/components/EscrowPanel";
import { MilestonesPanel } from "@/components/MilestonesPanel";
import { MaintenancePoolPanel } from "@/components/MaintenancePoolPanel";
import { ActivityFeed } from "@/components/ActivityFeed";
import { isDeployed, isLocalDemo } from "@/lib/contracts";

const TABS = [
  { id: "escrow", label: "Escrow", blurb: "Single-issue bounty", icon: Coins },
  { id: "milestones", label: "Milestones", blurb: "Release-scoped budget", icon: Flag },
  { id: "pool", label: "Maintenance Pool", blurb: "Ongoing repo funding", icon: PiggyBank },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AppPage() {
  const [tab, setTab] = useState<TabId>("escrow");

  return (
    <div>
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
        <div className="mb-8 max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Fund, allocate, and release USDC payouts</h1>
          <p className="mt-2 text-ink-500">Connect a wallet to sponsor a bounty, manage a milestone budget, or top up a maintenance pool.</p>
        </div>

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
    </div>
  );
}
