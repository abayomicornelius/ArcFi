const BPS_DENOMINATOR = 10_000;

/**
 * Splits 10,000 bps evenly across `n` recipients, largest-remainder style —
 * the first `10000 % n` recipients get one extra bp so the total is always
 * exactly `BPS_DENOMINATOR`. Mirrors `Splits.sol`'s guarantee that the sum
 * must be exact; the contract itself handles turning bps into exact USDC
 * amounts with no stranded dust.
 */
export function splitEvenlyBps(n: number): number[] {
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`splitEvenlyBps: n must be a positive integer, got ${n}`);
  }
  const base = Math.floor(BPS_DENOMINATOR / n);
  const remainder = BPS_DENOMINATOR - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
}
