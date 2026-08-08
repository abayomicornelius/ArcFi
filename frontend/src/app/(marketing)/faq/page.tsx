import { PageHero } from "@/components/PageHero";
import { CtaBand } from "@/components/CtaBand";
import { Reveal } from "@/components/Reveal";

export const metadata = { title: "FAQ — ArcFi" };

const FAQS: { q: string; a: string }[] = [
  {
    q: "How does the payout actually happen?",
    a: "A sponsor funds a GitHub issue in USDC through an on-chain escrow, milestone, or maintenance-pool contract. ArcFi's oracle backend watches for the linked pull request to merge. Once it does, the oracle calls the contract's release function, which pays the contributor directly — no invoice, no manual approval step, no ArcFi-held funds at any point.",
  },
  {
    q: "Does ArcFi ever hold my money?",
    a: "No. Funds sit in the smart contract from the moment they're deposited until they're released or refunded. ArcFi's backend can trigger a release once it's verified a merge, but it can't redirect funds anywhere except the contract's own release logic allows — sponsor deposits, contributor payouts, or a refund back to the sponsor after a missed deadline.",
  },
  {
    q: "What's the difference between Escrow, Milestones, and a Maintenance Pool?",
    a: "Escrow funds a single GitHub issue with its own deadline. Milestones let a sponsor commit a lump-sum budget for a release, then allocate pieces of it to individual issues as they're scoped. A Maintenance Pool is ongoing, not tied to any one issue — sponsors deposit over time, and a maintainer draws down for work that isn't naturally tied to a single PR.",
  },
  {
    q: "What if the linked PR never merges?",
    a: "Every escrow and milestone allocation has a deadline. Once it passes without a merge, the sponsor can reclaim the funds with a refund call — the contract enforces this, so a sponsor isn't stuck waiting indefinitely on stalled work.",
  },
  {
    q: "Does listing a repo require anything beyond signing in?",
    a: "Yes — listing a repo checks your actual GitHub permissions on it via the GitHub API using your own OAuth token. You need admin or maintain access to the repo. This is what stops anyone from listing a project they don't control.",
  },
  {
    q: "Do bounty applications gate who gets paid?",
    a: "No. Applying to a bounty and getting approved just signals to other contributors that someone's already working on it — it sets an “assigned” label. The actual payout is still purely a function of whose merged PR the oracle detects as linked to the funded issue, regardless of application status.",
  },
  {
    q: "What wallet do I need?",
    a: "Any browser extension wallet that injects an EIP-1193 provider — MetaMask is the most common. ArcFi doesn't run a custodial wallet or ask for a private key at any point.",
  },
  {
    q: "Is there a fee?",
    a: "A flat protocol fee is deducted from each release, funding the treasury that keeps the oracle and infrastructure running. There's no separate charge for creating an escrow, listing a repo, or browsing — the fee only applies to money that actually moves.",
  },
  {
    q: "Why build this on Arc instead of Ethereum mainnet or another chain?",
    a: "Arc is a stablecoin-native chain — USDC is the native gas asset, not a bridged ERC-20 with its own liquidity risk. For a protocol whose entire purpose is moving USDC reliably, settling on the chain USDC is native to removes a whole category of bridging and liquidity failure modes.",
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHero
        eyebrow="Questions"
        title="Frequently asked questions"
        subtitle="How the escrow, oracle, and payout mechanics actually work."
      />

      <Reveal className="mt-8 divide-y divide-ink-100 overflow-hidden rounded-lg border border-ink-200 bg-paper-raised">
        {FAQS.map((item) => (
          <details key={item.q} className="group px-5 py-4 open:bg-ink-50/50">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink-900">
              {item.q}
              <span className="shrink-0 text-ink-300 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{item.a}</p>
          </details>
        ))}
      </Reveal>

      <CtaBand title="Still have questions?" subtitle="The fastest way to understand it is to try it — funding a testnet issue costs nothing." />
    </main>
  );
}
