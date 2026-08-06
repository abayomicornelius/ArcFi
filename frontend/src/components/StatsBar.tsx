"use client";

import { useReadContract } from "wagmi";
import { Zap, Coins, Percent, ShieldCheck } from "lucide-react";
import { contracts, isDeployed } from "@/lib/contracts";
import { activeChain } from "@/lib/chains";

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-paper-raised px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-usdc-50 text-usdc-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-ink-400">{label}</p>
        <p className="truncate text-sm font-semibold text-ink-900">{value}</p>
      </div>
    </div>
  );
}

export function StatsBar() {
  const { data: feeBps } = useReadContract({
    address: contracts.escrow.address,
    abi: contracts.escrow.abi,
    functionName: "feeBps",
    query: { enabled: isDeployed },
  });

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile icon={Zap} label="Network" value={activeChain.name} />
      <StatTile icon={Coins} label="Settlement asset" value="USDC" />
      <StatTile icon={Percent} label="Protocol fee" value={feeBps !== undefined ? `${Number(feeBps) / 100}%` : "—"} />
      <StatTile icon={ShieldCheck} label="Contracts live" value={isDeployed ? "3 / 3" : "0 / 3"} />
    </div>
  );
}
