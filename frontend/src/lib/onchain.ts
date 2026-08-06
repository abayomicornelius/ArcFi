import "server-only";
import { createPublicClient, http, type Abi, type Address } from "viem";
import { activeChain } from "./chains";
import { contracts, isDeployed } from "./contracts";

const publicClient = createPublicClient({ chain: activeChain, transport: http() });

export type ParticipantStats = {
  address: `0x${string}`;
  fundedUsdc: bigint;
  fundedCount: number;
  receivedUsdc: bigint;
  receivedCount: number;
};

type DecodedLog = {
  eventName: string;
  args: Record<string, unknown>;
};

// Public RPCs (Arc's included) cap how many blocks a single eth_getLogs call
// can span, unlike local Anvil which has no such limit. Fetch backward in
// small chunks and stop gracefully on the first failure (a stricter cap, a
// rate limit, whatever) instead of crashing the whole page.
const LOG_CHUNK_SIZE = 2_000n;
const MAX_CHUNKS = 5;

async function getRecentLogs(address: Address, abi: Abi): Promise<DecodedLog[]> {
  const latest = await publicClient.getBlockNumber();
  const allLogs: DecodedLog[] = [];
  let toBlock = latest;

  for (let i = 0; i < MAX_CHUNKS; i++) {
    const fromBlock = toBlock > LOG_CHUNK_SIZE ? toBlock - LOG_CHUNK_SIZE + 1n : 0n;
    try {
      const logs = await publicClient.getContractEvents({ address, abi, fromBlock, toBlock });
      allLogs.push(...(logs as unknown as DecodedLog[]));
    } catch {
      break;
    }
    if (fromBlock === 0n) break;
    toBlock = fromBlock - 1n;
  }

  return allLogs;
}

async function getLogsFor(kind: "escrow" | "milestones" | "pool") {
  const source =
    kind === "escrow" ? contracts.escrow : kind === "milestones" ? contracts.milestones : contracts.maintenancePool;
  return getRecentLogs(source.address, source.abi);
}

/** Scans every ArcFi contract's recent event history and buckets USDC flow per address. */
export async function getAllParticipants(): Promise<ParticipantStats[]> {
  if (!isDeployed) return [];

  const stats = new Map<string, ParticipantStats>();

  function bump(address: string, field: "fundedUsdc" | "receivedUsdc", amount: bigint) {
    const key = address.toLowerCase();
    const entry: ParticipantStats =
      stats.get(key) ?? { address: address as `0x${string}`, fundedUsdc: 0n, fundedCount: 0, receivedUsdc: 0n, receivedCount: 0 };
    if (field === "fundedUsdc") {
      entry.fundedUsdc += amount;
      entry.fundedCount += 1;
    } else {
      entry.receivedUsdc += amount;
      entry.receivedCount += 1;
    }
    stats.set(key, entry);
  }

  const [escrowLogs, milestoneLogs, poolLogs] = await Promise.all([
    getLogsFor("escrow"),
    getLogsFor("milestones"),
    getLogsFor("pool"),
  ]);

  for (const log of escrowLogs) {
    if (log.eventName === "Funded") {
      bump(log.args.sponsor as string, "fundedUsdc", log.args.amount as bigint);
    } else if (log.eventName === "Released") {
      const recipients = log.args.recipients as string[];
      const amounts = log.args.amounts as bigint[];
      recipients.forEach((r, i) => bump(r, "receivedUsdc", amounts[i]));
    }
  }

  for (const log of milestoneLogs) {
    if (log.eventName === "MilestoneCreated") {
      bump(log.args.sponsor as string, "fundedUsdc", log.args.totalBudget as bigint);
    } else if (log.eventName === "IssueReleased") {
      const recipients = log.args.recipients as string[];
      const amounts = log.args.amounts as bigint[];
      recipients.forEach((r, i) => bump(r, "receivedUsdc", amounts[i]));
    }
  }

  for (const log of poolLogs) {
    if (log.eventName === "Deposited") {
      bump(log.args.sponsor as string, "fundedUsdc", log.args.amount as bigint);
    } else if (log.eventName === "Withdrawn") {
      bump(log.args.recipient as string, "receivedUsdc", log.args.amount as bigint);
    }
  }

  return [...stats.values()];
}

export async function getParticipantStats(address: string): Promise<ParticipantStats | null> {
  const all = await getAllParticipants();
  return all.find((p) => p.address.toLowerCase() === address.toLowerCase()) ?? null;
}
