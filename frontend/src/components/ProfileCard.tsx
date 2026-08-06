import Link from "next/link";
import { formatUnits } from "viem";
import { GitBranch } from "lucide-react";
import { Identicon } from "./Identicon";
import type { DirectoryEntry } from "@/lib/directory";

function short(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ProfileCard({
  entry,
  statLabel,
  statValue,
}: {
  entry: DirectoryEntry;
  statLabel?: string;
  statValue?: bigint;
}) {
  const displayName = entry.githubLogin ? `@${entry.githubLogin}` : entry.name ?? (entry.address ? short(entry.address) : "Anonymous");
  const href = entry.address ? `/profile/${entry.address}` : undefined;

  const content = (
    <>
      <div className="flex items-center gap-3">
        {entry.githubAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.githubAvatarUrl} alt="" className="h-10 w-10 rounded-full" />
        ) : entry.address ? (
          <Identicon address={entry.address} size={40} />
        ) : (
          <div className="h-10 w-10 rounded-full bg-ink-100" />
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink-900">
            {displayName}
            {entry.githubLogin && <GitBranch className="h-3 w-3 shrink-0 text-ink-300" />}
          </p>
          {entry.address && <p className="truncate font-mono text-xs text-ink-400">{short(entry.address)}</p>}
        </div>
      </div>

      {entry.bio && <p className="mt-3 line-clamp-2 text-sm text-ink-500">{entry.bio}</p>}

      {statLabel && statValue !== undefined && (
        <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
          <span className="text-xs text-ink-400">{statLabel}</span>
          <span className="font-mono text-sm font-semibold text-ink-900">{formatUnits(statValue, 6)} USDC</span>
        </div>
      )}
    </>
  );

  const cardClass = "block rounded-xl border border-ink-200 bg-paper-raised p-5 transition hover:border-usdc-300";

  return href ? (
    <Link href={href} className={cardClass}>
      {content}
    </Link>
  ) : (
    <div className={cardClass}>{content}</div>
  );
}
