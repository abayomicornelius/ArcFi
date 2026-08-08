"use client";

import { useReadContract } from "wagmi";
import { Network, Coins, Percent, Blocks } from "lucide-react";
import { contracts, isDeployed } from "@/lib/contracts";
import { activeChain } from "@/lib/chains";

function Stat({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="group flex flex-1 items-center gap-3 px-5 py-4 transition-colors hover:bg-secondary/60">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-transform duration-300 group-hover:scale-110">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="font-mono text-lg font-medium text-foreground">{value}</span>
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
    <div className="flex flex-wrap divide-x divide-border rounded-2xl border border-border bg-card">
      <Stat icon={Network} label="Network" value={activeChain.name} />
      <Stat icon={Coins} label="Settlement asset" value="USDC" />
      <Stat icon={Percent} label="Protocol fee" value={feeBps !== undefined ? `${Number(feeBps) / 100}%` : "—"} />
      <Stat icon={Blocks} label="Contracts live" value={isDeployed ? "3/3" : "0/3"} />
    </div>
  );
}
