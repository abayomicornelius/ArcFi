import type { Address, Abi } from "viem";
import escrowAbi from "./ArcFiEscrow.abi.json";
import milestonesAbi from "./ArcFiMilestones.abi.json";
import maintenancePoolAbi from "./ArcFiMaintenancePool.abi.json";
import usdcAbi from "./MockUSDC.abi.json";

const ZERO_ADDRESS: Address = "0x0000000000000000000000000000000000000000";

function optionalAddress(envVar: string | undefined): Address {
  return (envVar as Address) ?? ZERO_ADDRESS;
}

export const contracts = {
  usdc: {
    address: optionalAddress(process.env.NEXT_PUBLIC_USDC_ADDRESS),
    abi: usdcAbi as Abi,
  },
  escrow: {
    address: optionalAddress(process.env.NEXT_PUBLIC_ESCROW_ADDRESS),
    abi: escrowAbi as Abi,
  },
  milestones: {
    address: optionalAddress(process.env.NEXT_PUBLIC_MILESTONES_ADDRESS),
    abi: milestonesAbi as Abi,
  },
  maintenancePool: {
    address: optionalAddress(process.env.NEXT_PUBLIC_MAINTENANCE_POOL_ADDRESS),
    abi: maintenancePoolAbi as Abi,
  },
} as const;

export const isDeployed =
  contracts.usdc.address !== ZERO_ADDRESS &&
  contracts.escrow.address !== ZERO_ADDRESS &&
  contracts.milestones.address !== ZERO_ADDRESS &&
  contracts.maintenancePool.address !== ZERO_ADDRESS;

export const isLocalDemo = process.env.NEXT_PUBLIC_CHAIN !== "arc";

export const BPS_DENOMINATOR = 10_000;
