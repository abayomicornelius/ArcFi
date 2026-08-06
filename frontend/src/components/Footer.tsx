import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/app", label: "Launch app" },
      { href: "/onboarding", label: "Create a profile" },
    ],
  },
  {
    title: "Directory",
    links: [
      { href: "/sponsors", label: "Sponsors" },
      { href: "/maintainers", label: "Maintainers" },
      { href: "/contributors", label: "Contributors" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "https://github.com/abayomicornelius/ArcFi", label: "GitHub repo", external: true },
      { href: "https://www.circle.com/arc", label: "About Arc", external: true },
      { href: "https://developers.circle.com", label: "Circle developer docs", external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-paper-raised">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <span className="font-display text-sm font-semibold text-ink-900">ArcFi</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-ink-500">
              Programmable USDC escrow, milestone, and maintenance-pool payouts for open-source funding, built on Arc.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-usdc-200 bg-usdc-50 px-3 py-1 text-xs font-medium text-usdc-700">
              Built for the Arc DeFi Track
            </span>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-3 font-mono text-xs font-medium uppercase tracking-wider text-ink-400">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((link) =>
                  "external" in link && link.external ? (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900"
                      >
                        {link.label} <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </li>
                  ) : (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-ink-600 hover:text-ink-900">
                        {link.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-ink-100 pt-6 text-xs text-ink-400 sm:flex-row">
          <p>Programmable Money Accelerator hackathon — DeFi track.</p>
          <p>Escrow, milestones, and maintenance pools, settled in USDC.</p>
        </div>
      </div>
    </footer>
  );
}
