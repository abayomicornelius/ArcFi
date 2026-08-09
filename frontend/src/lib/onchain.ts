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

// Arc's public RPC also enforces a short-window request budget, independent
// of the per-call block-range cap above ("Request exceeds defined limit") —
// scanning all three contracts at once (each up to 1 + MAX_CHUNKS calls)
// fires enough requests within the same tick to exhaust it even though every
// individual call is well-formed. A stagger between requests keeps this well
// under that burst limit, and a retry with backoff absorbs the odd hiccup
// instead of the whole scan going quietly empty (e.g. the homepage reporting
// zero sponsors) the moment it's hit.
const RPC_REQUEST_STAGGER_MS = 300;
const RPC_RETRY_DELAYS_MS = [400, 900];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= RPC_RETRY_DELAYS_MS.length) throw err;
      await sleep(RPC_RETRY_DELAYS_MS[attempt]);
    }
  }
}

async function getRecentLogs(address: Address, abi: Abi): Promise<DecodedLog[]> {
  const latest = await publicClient.getBlockNumber();
  const allLogs: DecodedLog[] = [];
  let toBlock = latest;

  for (let i = 0; i < MAX_CHUNKS; i++) {
    const fromBlock = toBlock > LOG_CHUNK_SIZE ? toBlock - LOG_CHUNK_SIZE + 1n : 0n;
    try {
      if (i > 0) await sleep(RPC_REQUEST_STAGGER_MS);
      const logs = await withRetry(() => publicClient.getContractEvents({ address, abi, fromBlock, toBlock }));
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

async function scanParticipants(): Promise<ParticipantStats[]> {
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

  // Sequential, not Promise.all — three contracts scanned concurrently would
  // still burst the RPC even with per-call staggering inside each scan.
  const escrowLogs = await getLogsFor("escrow");
  await sleep(RPC_REQUEST_STAGGER_MS);
  const milestoneLogs = await getLogsFor("milestones");
  await sleep(RPC_REQUEST_STAGGER_MS);
  const poolLogs = await getLogsFor("pool");

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

// This scan is expensive (up to 1 + 3*(1 + MAX_CHUNKS) RPC calls) and USDC
// funding activity doesn't change second-to-second, so every page render
// re-running it from scratch is both wasteful and — against a rate-limited
// public RPC — the exact thing that causes the whole scan to come back
// empty under real traffic (multiple pages/visitors within the same short
// window). Cached across requests for a short TTL, keyed on the in-flight
// promise so concurrent callers during a cache miss share one scan instead
// of each starting their own.
const PARTICIPANTS_CACHE_TTL_MS = 90_000;
let cachedParticipants: { promise: Promise<ParticipantStats[]>; expiresAt: number } | null = null;

/** Scans every ArcFi contract's recent event history and buckets USDC flow per address. */
export function getAllParticipants(): Promise<ParticipantStats[]> {
  const now = Date.now();
  if (!cachedParticipants || cachedParticipants.expiresAt < now) {
    const promise = scanParticipants().catch((err) => {
      // Don't let a failed scan poison the cache for the full TTL — the next
      // caller should get a fresh attempt, not a cached rejection.
      if (cachedParticipants?.promise === promise) cachedParticipants = null;
      throw err;
    });
    cachedParticipants = { promise, expiresAt: now + PARTICIPANTS_CACHE_TTL_MS };
  }
  return cachedParticipants.promise;
}

export async function getParticipantStats(address: string): Promise<ParticipantStats | null> {
  const all = await getAllParticipants();
  return all.find((p) => p.address.toLowerCase() === address.toLowerCase()) ?? null;
}
