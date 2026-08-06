"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { activeChain } from "@/lib/chains";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  if (isConnected && address) {
    const wrongNetwork = chainId !== activeChain.id;

    return (
      <div className="flex items-center gap-2">
        {wrongNetwork && (
          <button
            onClick={() => switchChain({ chainId: activeChain.id })}
            className="rounded-full border border-amber-400/60 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-400/20"
          >
            Switch to {activeChain.name}
          </button>
        )}
        <button
          onClick={() => disconnect()}
          className="rounded-full border border-ink-200 bg-white px-4 py-1.5 text-sm font-medium text-ink-800 shadow-sm hover:border-ink-300"
        >
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500 align-middle" />
          {shortAddress(address)}
        </button>
      </div>
    );
  }

  const connector = connectors[0];

  return (
    <button
      onClick={() => connector && connect({ connector })}
      disabled={!connector || isPending}
      className="rounded-full bg-ink-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-700 disabled:opacity-50"
    >
      {isPending ? "Connecting…" : connector ? "Connect Wallet" : "No wallet found"}
    </button>
  );
}
