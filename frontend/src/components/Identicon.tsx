function hashAddress(address: string) {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash << 5) - hash + address.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const PALETTE = [
  ["#2775CA", "#174A83"],
  ["#0EA5E9", "#0369A1"],
  ["#14B8A6", "#0F766E"],
  ["#8B5CF6", "#5B21B6"],
  ["#F59E0B", "#B45309"],
  ["#EF4444", "#991B1B"],
  ["#22C55E", "#15803D"],
];

/** Deterministic gradient avatar for a wallet address, no external identicon service required. */
export function Identicon({ address, size = 32, className = "" }: { address: string; size?: number; className?: string }) {
  const hash = hashAddress(address.toLowerCase());
  const [from, to] = PALETTE[hash % PALETTE.length];
  const gradientId = `grad-${address.slice(2, 10)}`;

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={`rounded-full ${className}`} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" fill={`url(#${gradientId})`} />
    </svg>
  );
}
