"use client";

import { useState } from "react";
import Link from "next/link";
import { Coins, Flag, PiggyBank, AlertTriangle, Info, HandCoins, Wrench, Users, ArrowLeft } from "lucide-react";
import { EscrowPanel } from "@/components/EscrowPanel";
import { MilestonesPanel } from "@/components/MilestonesPanel";
import { MaintenancePoolPanel } from "@/components/MaintenancePoolPanel";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ConnectButton } from "@/components/ConnectButton";
import { FaucetButton } from "@/components/FaucetButton";
import { GithubMenu } from "@/components/GithubMenu";
import { Logo } from "@/components/Logo";
import { isDeployed, isLocalDemo } from "@/lib/contracts";

const TABS = [
  { id: "escrow", label: "Escrow", blurb: "Single-issue bounty", icon: Coins, dot: "bg-usdc-400" },
  { id: "milestones", label: "Milestones", blurb: "Release-scoped budget", icon: Flag, dot: "bg-gold-400" },
  { id: "pool", label: "Maintenance Pool", blurb: "Ongoing repo funding", icon: PiggyBank, dot: "bg-emerald-400" },
] as const;

const DIRECTORY_LINKS = [
  { href: "/sponsors", label: "Sponsors", icon: HandCoins },
  { href: "/maintainers", label: "Maintainers", icon: Wrench },
  { href: "/contributors", label: "Contributors", icon: Users },
];

type TabId = (typeof TABS)[number]["id"];

export default function AppPage() {
  const [tab, setTab] = useState<TabId>("escrow");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-ink-900 lg:flex">
        <Link href="/" className="flex items-center gap-2 px-5 py-5 text-white/70 transition hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" />
          <Logo size={22} />
          <span className="font-display text-sm font-semibold">ArcFi</span>
        </Link>

        <nav className="flex-1 space-y-6 px-3 py-2">
          <div>
            <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">Products</p>
            <div className="space-y-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition ${
                    tab === t.id ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white/80"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tab === t.id ? t.dot : "bg-white/20"}`} />
                  <t.icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">Directory</p>
            <div className="space-y-1">
              {DIRECTORY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-white/50 transition hover:bg-white/5 hover:text-white/80"
                >
                  <link.icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="space-y-2 border-t border-white/5 p-3">
          <FaucetButton />
          <ConnectButton />
          <GithubMenu dark />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
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
            Running against a local Anvil chain with mock USDC — set <code className="font-mono">NEXT_PUBLIC_CHAIN=arc</code> for the real Arc
            testnet.
          </div>
        )}

        <div className="flex items-center justify-between border-b border-ink-200 px-6 py-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={26} />
            <span className="font-display text-sm font-semibold text-ink-900">ArcFi</span>
          </Link>
          <div className="flex items-center gap-2">
            <ConnectButton />
          </div>
        </div>

        <main className="mx-auto max-w-5xl px-6 py-10">
          <div className="mb-8 flex flex-wrap items-center gap-2 lg:hidden">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  tab === t.id ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-600"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="mb-8 max-w-2xl">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">{TABS.find((t) => t.id === tab)?.blurb}</p>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Fund, allocate, and release USDC payouts</h1>
          </div>

          <section className="grid gap-8 xl:grid-cols-[1fr_320px]">
            <div>
              {tab === "escrow" && <EscrowPanel />}
              {tab === "milestones" && <MilestonesPanel />}
              {tab === "pool" && <MaintenancePoolPanel />}
            </div>

            <aside className="xl:sticky xl:top-10 xl:self-start">
              <ActivityFeed />
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
