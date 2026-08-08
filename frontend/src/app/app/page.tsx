"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { Coins, Flag, PiggyBank, AlertTriangle, Info, Wallet, HandCoins, Wrench, Users, ArrowLeft } from "lucide-react";
import { EscrowPanel } from "@/components/EscrowPanel";
import { MilestonesPanel } from "@/components/MilestonesPanel";
import { MaintenancePoolPanel } from "@/components/MaintenancePoolPanel";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ConnectButton } from "@/components/ConnectButton";
import { FaucetButton } from "@/components/FaucetButton";
import { GithubMenu } from "@/components/GithubMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { WalletBalance } from "@/components/WalletBalance";
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
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "escrow";
  const [tab, setTab] = useState<TabId>(initialTab);
  const { isConnected } = useAccount();

  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-64 shrink-0 flex-col overflow-hidden border-r border-white/5 bg-ink-900 lg:flex">
        <div
          className="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(124,92,224,0.5), transparent 70%)" }}
        />
        <Link href="/" className="relative flex items-center gap-2 px-5 py-5 text-white/70 transition hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" />
          <Logo size={22} />
          <span className="font-display text-sm font-semibold">ArcFi</span>
        </Link>

        <nav className="relative flex-1 space-y-6 px-3 py-2">
          <div>
            <p className="mb-2 px-2.5 font-mono text-[10px] font-medium uppercase tracking-wider text-white/30">Products</p>
            <div className="space-y-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors duration-200 ${
                    tab === t.id ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white/80"
                  }`}
                >
                  {tab === t.id && <span className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full ${t.dot}`} />}
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${tab === t.id ? t.dot : "bg-white/20"}`} />
                  <t.icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 px-2.5 font-mono text-[10px] font-medium uppercase tracking-wider text-white/30">Directory</p>
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

        <div className="flex items-center justify-end px-3 pt-3">
          <NotificationBell dark />
        </div>
        <div className="space-y-2 border-t border-white/5 p-3">
          <WalletBalance />
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
        {!isConnected && (
          <div className="flex items-center justify-center gap-2 border-b border-ink-200 bg-ink-50 px-6 py-2.5 text-center text-sm text-ink-600">
            <Wallet className="h-4 w-4 shrink-0" />
            Connect a wallet to fund, allocate, or release payouts — lookups and browsing work without one.
          </div>
        )}

        <div className="flex items-center justify-between border-b border-border px-6 py-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={26} />
            <span className="font-display text-sm font-semibold text-foreground">ArcFi</span>
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
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  tab === t.id ? "bg-foreground text-background shadow-sm" : "bg-secondary text-foreground/70 hover:bg-secondary/70"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          <div className="mb-8 max-w-2xl">
            <p className="mb-1.5 flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span className={`h-1.5 w-1.5 rounded-full ${TABS.find((t) => t.id === tab)?.dot}`} />
              {TABS.find((t) => t.id === tab)?.blurb}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Fund, allocate, and release USDC payouts</h1>
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
