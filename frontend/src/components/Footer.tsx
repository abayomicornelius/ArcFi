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
      { href: "/analytics", label: "Analytics" },
      { href: "/faq", label: "FAQ" },
      { href: "/roadmap", label: "Roadmap" },
      { href: "https://github.com/abayomicornelius/ArcFi", label: "GitHub repo", external: true },
      { href: "https://www.circle.com/arc", label: "About Arc", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <span className="font-display text-sm font-semibold text-foreground">ArcFi</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Programmable USDC escrow, milestone, and maintenance-pool payouts for open-source funding, built on Arc.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border-transparent bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Built for the Arc DeFi Track
            </span>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-3 font-display text-sm font-semibold text-foreground">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) =>
                  "external" in link && link.external ? (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label} <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </li>
                  ) : (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {link.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>Programmable Money Accelerator hackathon — DeFi track.</p>
          <p>Escrow, milestones, and maintenance pools, settled in USDC.</p>
        </div>
      </div>
    </footer>
  );
}
