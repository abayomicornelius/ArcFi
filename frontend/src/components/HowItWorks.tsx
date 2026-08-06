import { Wallet, GitPullRequest, Banknote } from "lucide-react";

const STEPS = [
  {
    icon: Wallet,
    title: "1. Sponsor deposits USDC",
    body: "A sponsor locks USDC in escrow against a GitHub issue, a release milestone, or an ongoing maintenance pool — the terms are set once, on-chain.",
  },
  {
    icon: GitPullRequest,
    title: "2. Work happens, off-chain",
    body: "Contributors do the work exactly as they would on any repo. GitHub stays the system of record for who opened what and who merged what.",
  },
  {
    icon: Banknote,
    title: "3. Payout releases automatically",
    body: "The moment the oracle attests the linked PR merged, funds split across the team and settle in USDC — no invoices, no manual approval queue.",
  },
];

export function HowItWorks() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {STEPS.map((step) => (
        <div key={step.title} className="rounded-xl border border-ink-200 bg-paper-raised p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 text-white">
            <step.icon className="h-4 w-4" />
          </div>
          <h4 className="mb-1 text-sm font-semibold text-ink-900">{step.title}</h4>
          <p className="text-sm leading-relaxed text-ink-500">{step.body}</p>
        </div>
      ))}
    </div>
  );
}
