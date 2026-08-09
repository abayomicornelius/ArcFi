"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { toast } from "sonner";
import { activeChain } from "@/lib/chains";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function errorMessage(err: unknown) {
  if (err instanceof Error) return err.message.split("\n")[0].slice(0, 140);
  return "Could not connect wallet";
}

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connectAsync, connectors, isPending } = useConnect();
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
          className="inline-flex min-w-[160px] items-center justify-center rounded-full border border-ink-200 bg-white px-6 py-2 text-sm font-medium text-ink-800 shadow-sm transition hover:border-ink-300"
        >
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500 align-middle" />
          {shortAddress(address)}
        </button>
      </div>
    );
  }

  const connector = connectors[0];

  async function handleConnect() {
    if (!connector) return;
    try {
      await connectAsync({ connector });
    } catch (err) {
      if (err instanceof Error && err.name === "ProviderNotFoundError") {
        toast.error("No wallet extension found", {
          description: "Install MetaMask or another browser wallet, then try again.",
          action: { label: "Get MetaMask", onClick: () => window.open("https://metamask.io/download", "_blank") },
        });
        return;
      }
      toast.error("Could not connect wallet", { description: errorMessage(err) });
    }
  }

  return (
    <button
      onClick={handleConnect}
      disabled={!connector || isPending}
      className="btn-glow inline-flex min-w-[160px] items-center justify-center rounded-full bg-primary px-7 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 disabled:opacity-50"
    >
      {isPending ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
