import { formatUnits } from "viem";
import type { Address } from "viem";

export type ActivityKind = "escrow" | "milestones" | "pool";

export type ActivityItem = {
  key: string;
  kind: ActivityKind;
  label: string;
  detail: string;
  txHash: `0x${string}`;
  blockNumber: bigint;
  logIndex: number;
};

function short(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function usdc(amount: bigint) {
  return `${formatUnits(amount, 6)} USDC`;
}

/** Turns a decoded contract log into a human line for the activity feed. */
export function describeLog(
  kind: ActivityKind,
  eventName: string,
  args: Record<string, unknown>,
  txHash: `0x${string}`,
  blockNumber: bigint,
  logIndex: number,
): ActivityItem | null {
  const key = `${txHash}-${logIndex}`;

  switch (eventName) {
    case "Funded":
      return {
        key,
        kind,
        label: "Escrow funded",
        detail: `Issue #${args.issueId} · ${usdc(args.amount as bigint)} by ${short(args.sponsor as string)}`,
        txHash,
        blockNumber,
        logIndex,
      };
    case "Released":
      return {
        key,
        kind,
        label: "Bounty released",
        detail: `Issue #${args.issueId} · fee ${usdc(args.feeAmount as bigint)}`,
        txHash,
        blockNumber,
        logIndex,
      };
    case "Refunded":
      return {
        key,
        kind,
        label: "Escrow refunded",
        detail: `Issue #${args.issueId} · ${usdc(args.amount as bigint)} back to ${short(args.sponsor as string)}`,
        txHash,
        blockNumber,
        logIndex,
      };
    case "DeadlineExtended":
      return {
        key,
        kind,
        label: "Deadline extended",
        detail: `Issue #${args.issueId} · new deadline ${new Date(Number(args.newDeadline as bigint) * 1000).toLocaleDateString()}`,
        txHash,
        blockNumber,
        logIndex,
      };
    case "MilestoneCreated":
      return {
        key,
        kind,
        label: "Milestone created",
        detail: `#${args.milestoneId} · ${usdc(args.totalBudget as bigint)} by ${short(args.sponsor as string)}`,
        txHash,
        blockNumber,
        logIndex,
      };
    case "Allocated":
      return {
        key,
        kind,
        label: "Issue allocated",
        detail: `Milestone #${args.milestoneId} → issue #${args.issueId} · ${usdc(args.amount as bigint)}`,
        txHash,
        blockNumber,
        logIndex,
      };
    case "IssueReleased":
      return {
        key,
        kind,
        label: "Milestone issue released",
        detail: `Milestone #${args.milestoneId} → issue #${args.issueId} · fee ${usdc(args.feeAmount as bigint)}`,
        txHash,
        blockNumber,
        logIndex,
      };
    case "MilestoneCancelled":
      return {
        key,
        kind,
        label: "Milestone cancelled",
        detail: `#${args.milestoneId} · ${usdc(args.refundedAmount as bigint)} refunded`,
        txHash,
        blockNumber,
        logIndex,
      };
    case "Deposited":
      return {
        key,
        kind,
        label: "Pool deposit",
        detail: `Pool #${args.poolId} · ${usdc(args.amount as bigint)} from ${short(args.sponsor as string)}`,
        txHash,
        blockNumber,
        logIndex,
      };
    case "Withdrawn":
      return {
        key,
        kind,
        label: "Pool draw-down",
        detail: `Pool #${args.poolId} · ${usdc(args.amount as bigint)} to ${short(args.recipient as Address)}`,
        txHash,
        blockNumber,
        logIndex,
      };
    default:
      return null;
  }
}

export const KIND_LABEL: Record<ActivityKind, string> = {
  escrow: "Escrow",
  milestones: "Milestones",
  pool: "Maintenance Pool",
};
