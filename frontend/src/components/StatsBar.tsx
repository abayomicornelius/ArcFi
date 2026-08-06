"use client";

import { useReadContract } from "wagmi";
import { contracts, isDeployed } from "@/lib/contracts";
import { activeChain } from "@/lib/chains";

function Stat({ label, value, dark = false }: { label: string; value: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`flex flex-1 flex-col gap-1 px-5 py-4 ${dark ? "" : "border-ink-200"}`}>
      <span className={`font-mono text-[10px] uppercase tracking-wider ${dark ? "text-white/40" : "text-ink-400"}`}>{label}</span>
      <span className={`font-mono text-lg font-medium ${dark ? "text-white" : "text-ink-900"}`}>{value}</span>
    </div>
  );
}

export function StatsBar({ dark = false }: { dark?: boolean }) {
  const { data: feeBps } = useReadContract({
    address: contracts.escrow.address,
    abi: contracts.escrow.abi,
    functionName: "feeBps",
    query: { enabled: isDeployed },
  });

  return (
    <div
      className={`flex flex-wrap divide-x ${
        dark ? "divide-white/10 border border-white/10 bg-white/[0.03]" : "divide-ink-200 border border-ink-200 bg-paper-raised"
      }`}
    >
      <Stat dark={dark} label="Network" value={activeChain.name} />
      <Stat dark={dark} label="Settlement asset" value="USDC" />
      <Stat dark={dark} label="Protocol fee" value={feeBps !== undefined ? `${Number(feeBps) / 100}%` : "—"} />
      <Stat dark={dark} label="Contracts live" value={isDeployed ? "3/3" : "0/3"} />
    </div>
  );
}
