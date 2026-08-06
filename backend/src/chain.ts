import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createPublicClient, createWalletClient, http, defineChain, type Address, type Hash } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { env } from "./env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read as plain JSON rather than a JS import attribute — portable across
// tsx/tsc/node versions without relying on `with { type: "json" }` support.
const escrowAbi = JSON.parse(readFileSync(join(__dirname, "abi/ArcFiEscrow.abi.json"), "utf-8"));
const milestonesAbi = JSON.parse(readFileSync(join(__dirname, "abi/ArcFiMilestones.abi.json"), "utf-8"));

const account = privateKeyToAccount(env.adminPrivateKey);
const transport = http(env.rpcUrl);

let cachedChain: ReturnType<typeof defineChain> | undefined;

/**
 * Discovers the chain id from the RPC at startup rather than hardcoding it,
 * so the same build runs against local Anvil (31337) or Arc testnet
 * (5042002) purely by swapping RPC_URL.
 */
async function getChain() {
  if (cachedChain) return cachedChain;
  const probe = createPublicClient({ transport });
  const id = await probe.getChainId();
  cachedChain = defineChain({
    id,
    name: `chain-${id}`,
    nativeCurrency: { name: "Native", symbol: "NATIVE", decimals: 18 },
    rpcUrls: { default: { http: [env.rpcUrl] } },
  });
  return cachedChain;
}

async function getWalletClient() {
  const chain = await getChain();
  return createWalletClient({ account, chain, transport });
}

async function getPublicClient() {
  const chain = await getChain();
  return createPublicClient({ chain, transport });
}

export const oracleAddress: Address = account.address;

export async function releaseEscrow(issueId: bigint, recipient: Address): Promise<Hash> {
  const wallet = await getWalletClient();
  return wallet.writeContract({
    chain: wallet.chain,
    address: env.escrowAddress,
    abi: escrowAbi,
    functionName: "release",
    args: [issueId, [{ account: recipient, bps: 10_000 }]],
  });
}

export async function releaseMilestoneIssue(milestoneId: bigint, issueId: bigint, recipient: Address): Promise<Hash> {
  const wallet = await getWalletClient();
  return wallet.writeContract({
    chain: wallet.chain,
    address: env.milestonesAddress,
    abi: milestonesAbi,
    functionName: "releaseIssue",
    args: [milestoneId, issueId, [{ account: recipient, bps: 10_000 }]],
  });
}

export async function waitForReceipt(hash: Hash) {
  const client = await getPublicClient();
  return client.waitForTransactionReceipt({ hash });
}
