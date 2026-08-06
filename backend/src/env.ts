import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  githubWebhookSecret: required("GITHUB_WEBHOOK_SECRET"),
  adminPrivateKey: required("ADMIN_PRIVATE_KEY") as `0x${string}`,
  rpcUrl: process.env.RPC_URL ?? "http://127.0.0.1:8545",
  escrowAddress: required("ESCROW_ADDRESS") as `0x${string}`,
  milestonesAddress: required("MILESTONES_ADDRESS") as `0x${string}`,
  internalApiSecret: required("INTERNAL_API_SECRET"),
  frontendInternalUrl: process.env.FRONTEND_INTERNAL_URL ?? "http://localhost:3000",
  port: Number(process.env.PORT ?? 4100),
};
