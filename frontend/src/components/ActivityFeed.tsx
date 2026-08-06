"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { Activity, ArrowDownToLine, CheckCircle2, Undo2, Clock, Flag, PackageCheck, Ban, PiggyBank, ArrowUpFromLine } from "lucide-react";
import { contracts, isDeployed } from "@/lib/contracts";
import { describeLog, type ActivityItem, type ActivityKind } from "@/lib/activity";

type DecodedLog = {
  eventName: string;
  args: Record<string, unknown>;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  logIndex: number;
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Escrow funded": ArrowDownToLine,
  "Bounty released": CheckCircle2,
  "Escrow refunded": Undo2,
  "Deadline extended": Clock,
  "Milestone created": Flag,
  "Issue allocated": PackageCheck,
  "Milestone issue released": CheckCircle2,
  "Milestone cancelled": Ban,
  "Pool deposit": PiggyBank,
  "Pool draw-down": ArrowUpFromLine,
};

const SOURCES: { kind: ActivityKind; address: `0x${string}`; abi: (typeof contracts)["escrow"]["abi"] }[] = [
  { kind: "escrow", address: contracts.escrow.address, abi: contracts.escrow.abi },
  { kind: "milestones", address: contracts.milestones.address, abi: contracts.milestones.abi },
  { kind: "pool", address: contracts.maintenancePool.address, abi: contracts.maintenancePool.abi },
];

export function ActivityFeed() {
  const publicClient = usePublicClient();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(isDeployed);

  useEffect(() => {
    if (!publicClient || !isDeployed) {
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      if (!publicClient) return;
      const latest = await publicClient.getBlockNumber();
      const fromBlock = latest > 50_000n ? latest - 50_000n : 0n;

      const all = (
        await Promise.all(
          SOURCES.map(({ kind, address, abi }) =>
            publicClient
              .getContractEvents({ address, abi, fromBlock, toBlock: "latest" })
              .then((logs) =>
                logs
                  .map((log) =>
                    describeLog(
                      kind,
                      log.eventName as string,
                      log.args as Record<string, unknown>,
                      log.transactionHash as `0x${string}`,
                      log.blockNumber as bigint,
                      log.logIndex ?? 0,
                    ),
                  )
                  .filter((x): x is ActivityItem => x !== null),
              ),
          ),
        )
      ).flat();

      all.sort((a, b) => (b.blockNumber === a.blockNumber ? b.logIndex - a.logIndex : Number(b.blockNumber - a.blockNumber)));

      if (!cancelled) {
        setItems(all.slice(0, 25));
        setLoading(false);
      }
    }

    loadHistory();

    const unwatchers = SOURCES.map(({ kind, address, abi }) =>
      publicClient.watchContractEvent({
        address,
        abi,
        onLogs: (logs) => {
          const newItems = (logs as unknown as DecodedLog[])
            .map((log) => describeLog(kind, log.eventName, log.args, log.transactionHash, log.blockNumber, log.logIndex ?? 0))
            .filter((x): x is ActivityItem => x !== null);

          if (newItems.length === 0) return;
          setItems((prev) => {
            const merged = [...newItems, ...prev.filter((p) => !newItems.some((n) => n.key === p.key))];
            merged.sort((a, b) => (b.blockNumber === a.blockNumber ? b.logIndex - a.logIndex : Number(b.blockNumber - a.blockNumber)));
            return merged.slice(0, 25);
          });
        },
      }),
    );

    return () => {
      cancelled = true;
      unwatchers.forEach((unwatch) => unwatch());
    };
  }, [publicClient]);

  return (
    <div className="rounded-2xl border border-ink-200 bg-paper-raised shadow-[0_1px_2px_rgba(20,24,31,0.04)]">
      <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-4">
        <Activity className="h-4 w-4 text-usdc-500" />
        <h3 className="text-sm font-semibold text-ink-900">Live on-chain activity</h3>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-ink-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          watching
        </span>
      </div>

      <div className="max-h-96 divide-y divide-ink-100 overflow-y-auto">
        {loading && (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-ink-50" />
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <p className="p-5 text-sm text-ink-400">No activity yet — fund an escrow or deposit to a pool to see it appear here in real time.</p>
        )}

        {items.map((item) => {
          const Icon = ICONS[item.label] ?? Activity;
          return (
            <a
              key={item.key}
              href={`#`}
              onClick={(e) => e.preventDefault()}
              className="flex items-start gap-3 px-5 py-3 text-sm transition hover:bg-ink-50"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-usdc-50 text-usdc-600">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-800">{item.label}</p>
                <p className="truncate text-xs text-ink-500">{item.detail}</p>
              </div>
              <span className="mt-1 shrink-0 font-mono text-[10px] text-ink-300">{item.txHash.slice(0, 6)}…</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
