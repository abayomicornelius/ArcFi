import "server-only";
import { createPublicClient, http } from "viem";
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

async function getLogsFor(kind: "escrow" | "milestones" | "pool") {
  const source =
    kind === "escrow" ? contracts.escrow : kind === "milestones" ? contracts.milestones : contracts.maintenancePool;
  const latest = await publicClient.getBlockNumber();
  const fromBlock = latest > 50_000n ? latest - 50_000n : 0n;
  const logs = await publicClient.getContractEvents({
    address: source.address,
    abi: source.abi,
    fromBlock,
    toBlock: "latest",
  });
  return logs as unknown as DecodedLog[];
}

/** Scans every ArcFi contract's event history and buckets USDC flow per address. */
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
