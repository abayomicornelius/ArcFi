import "server-only";
import { prisma } from "./prisma";
import { getAllParticipants } from "./onchain";

export type DirectoryEntry = {
  key: string;
  userId: string | null;
  address: string | null;
  githubLogin: string | null;
  githubAvatarUrl: string | null;
  name: string | null;
  bio: string | null;
  fundedUsdc: bigint;
  fundedCount: number;
  receivedUsdc: bigint;
  receivedCount: number;
  repos?: { githubOwner: string; githubRepo: string; avatarUrl: string | null }[];
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
      userId: user.id,
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
          userId: null,
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

export async function getMaintainers() {
  const entries = await buildEntries("isMaintainer", null);

  const userIds = entries.map((e) => e.userId).filter((id): id is string => Boolean(id));
  if (userIds.length === 0) return entries;

  const repos = await prisma.repo.findMany({
    where: { addedByUserId: { in: userIds } },
    select: { githubOwner: true, githubRepo: true, avatarUrl: true, addedByUserId: true },
  });
  const byUserId = new Map<string, DirectoryEntry["repos"]>();
  for (const repo of repos) {
    const list = byUserId.get(repo.addedByUserId) ?? [];
    list.push({ githubOwner: repo.githubOwner, githubRepo: repo.githubRepo, avatarUrl: repo.avatarUrl });
    byUserId.set(repo.addedByUserId, list);
  }

  for (const entry of entries) {
    if (entry.userId) entry.repos = byUserId.get(entry.userId);
  }

  return entries;
}

export async function getAllRepos() {
  return prisma.repo.findMany({
    orderBy: { stars: "desc" },
    include: { addedBy: { select: { githubLogin: true, githubAvatarUrl: true, walletAddress: true } } },
  });
}
