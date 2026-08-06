import { Wallet, GitPullRequest, Banknote } from "lucide-react";

const STEPS = [
  {
    icon: Wallet,
    title: "Sponsor deposits USDC",
    body: "Locked in escrow against a GitHub issue, a release milestone, or an ongoing maintenance pool — terms set once, on-chain.",
    dot: "bg-usdc-500",
    ring: "ring-usdc-100",
    iconColor: "text-usdc-600",
  },
  {
    icon: GitPullRequest,
    title: "Work happens, off-chain",
    body: "Contributors ship exactly as they would on any repo. GitHub stays the system of record for who opened and merged what.",
    dot: "bg-gold-500",
    ring: "ring-gold-100",
    iconColor: "text-gold-600",
  },
  {
    icon: Banknote,
    title: "Payout releases automatically",
    body: "The moment the oracle attests the PR merged, funds split across the team and settle in USDC — no invoices, no approval queue.",
    dot: "bg-emerald-500",
    ring: "ring-emerald-100",
    iconColor: "text-emerald-600",
  },
];

export function HowItWorks() {
  return (
    <div className="relative">
      <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-usdc-200 via-gold-200 to-emerald-200 sm:block" />
      <div className="grid gap-8 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="relative">
            <div className={`relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white ring-4 ${step.ring}`}>
              <span className={`absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full ${step.dot} text-[10px] font-bold text-white`}>
                {i + 1}
              </span>
              <step.icon className={`h-5 w-5 ${step.iconColor}`} />
            </div>
            <h4 className="mb-1.5 text-sm font-semibold text-ink-900">{step.title}</h4>
            <p className="text-sm leading-relaxed text-ink-500">{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
