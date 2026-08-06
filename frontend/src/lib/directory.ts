import "server-only";
import { prisma } from "./prisma";
import { getAllParticipants } from "./onchain";

export type DirectoryEntry = {
  key: string;
  address: string | null;
  githubLogin: string | null;
  githubAvatarUrl: string | null;
  name: string | null;
  bio: string | null;
  fundedUsdc: bigint;
  fundedCount: number;
  receivedUsdc: bigint;
  receivedCount: number;
};

async function buildEntries(role: "isSponsor" | "isMaintainer" | "isContributor", statsField: "fundedUsdc" | "receivedUsdc" | null) {
  const [participants, users] = await Promise.all([
    statsField ? getAllParticipants() : Promise.resolve([]),
    prisma.user.findMany({ where: { [role]: true } }),
  ]);

  const byWallet = new Map<string, DirectoryEntry>();

  for (const user of users) {
    const key = (user.walletAddress ?? user.id).toLowerCase();
    byWallet.set(key, {
      key,
      address: user.walletAddress,
      githubLogin: user.githubLogin,
      githubAvatarUrl: user.githubAvatarUrl ?? user.image,
      name: user.name,
      bio: user.bio,
      fundedUsdc: 0n,
      fundedCount: 0,
      receivedUsdc: 0n,
      receivedCount: 0,
    });
  }

  if (statsField) {
    for (const p of participants) {
      if ((statsField === "fundedUsdc" && p.fundedCount === 0) || (statsField === "receivedUsdc" && p.receivedCount === 0)) continue;
      const key = p.address.toLowerCase();
      const existing = byWallet.get(key);
      if (existing) {
        existing.fundedUsdc = p.fundedUsdc;
        existing.fundedCount = p.fundedCount;
        existing.receivedUsdc = p.receivedUsdc;
        existing.receivedCount = p.receivedCount;
      } else {
        byWallet.set(key, {
          key,
          address: p.address,
          githubLogin: null,
          githubAvatarUrl: null,
          name: null,
          bio: null,
          fundedUsdc: p.fundedUsdc,
          fundedCount: p.fundedCount,
          receivedUsdc: p.receivedUsdc,
          receivedCount: p.receivedCount,
        });
      }
    }
  }

  return [...byWallet.values()].sort((a, b) => {
    const aTotal = a.fundedUsdc + a.receivedUsdc;
    const bTotal = b.fundedUsdc + b.receivedUsdc;
    return bTotal > aTotal ? 1 : bTotal < aTotal ? -1 : 0;
  });
}

export function getSponsors() {
  return buildEntries("isSponsor", "fundedUsdc");
}

export function getContributors() {
  return buildEntries("isContributor", "receivedUsdc");
}

export function getMaintainers() {
  return buildEntries("isMaintainer", null);
}
