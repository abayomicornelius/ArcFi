"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { Coins } from "lucide-react";
import { contracts, isDeployed } from "@/lib/contracts";

export function WalletBalance() {
  const { address, isConnected } = useAccount();

  const { data: balance } = useReadContract({
    address: contracts.usdc.address,
    abi: contracts.usdc.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) && isDeployed, refetchInterval: 15_000 },
  });

  if (!isConnected || !isDeployed) return null;

  return (
    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5">
      <span className="flex items-center gap-1.5 text-xs text-white/50">
        <Coins className="h-3.5 w-3.5" /> USDC balance
      </span>
      <span className="font-mono text-sm font-semibold text-white">{balance !== undefined ? formatUnits(balance as bigint, 6) : "—"}</span>
    </div>
  );
}
