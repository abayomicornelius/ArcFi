"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { contracts, isDeployed, isLocalDemo } from "@/lib/contracts";
import { useTx } from "@/lib/hooks";
import { Button } from "./ui";

/** Local-demo only: MockUSDC exposes an open `mint`, real USDC never would. */
export function FaucetButton() {
  const { address, isConnected } = useAccount();
  const mintTx = useTx();

  const { data: balance, refetch } = useReadContract({
    address: contracts.usdc.address,
    abi: contracts.usdc.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isDeployed },
  });

  if (!isConnected || !isDeployed || !isLocalDemo) return null;

  return (
    <div className="flex items-center gap-3 rounded-full border border-ink-200 bg-white py-1.5 pl-4 pr-1.5 text-sm">
      <span className="text-ink-500">
        Balance <span className="font-mono text-ink-800">{balance !== undefined ? formatUnits(balance as bigint, 6) : "—"} USDC</span>
      </span>
      <Button
        variant="secondary"
        className="!px-3 !py-1 text-xs"
        onClick={async () => {
          if (!address) return;
          await mintTx.send({
            address: contracts.usdc.address,
            abi: contracts.usdc.abi,
            functionName: "mint",
            args: [address, parseUnits("10000", 6)],
          });
          refetch();
        }}
        disabled={mintTx.state === "pending" || mintTx.state === "confirming"}
      >
        {mintTx.state === "pending" || mintTx.state === "confirming" ? "Minting…" : "+ 10,000 test USDC"}
      </Button>
    </div>
  );
}
