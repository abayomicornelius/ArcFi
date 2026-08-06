"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "./ConnectButton";
import { FaucetButton } from "./FaucetButton";
import { GithubMenu } from "./GithubMenu";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/app", label: "App" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/maintainers", label: "Maintainers" },
  { href: "/contributors", label: "Contributors" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-ink-200 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="font-display text-sm font-semibold text-ink-900">ArcFi</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  pathname === link.href ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <FaucetButton />
          <ConnectButton />
          <GithubMenu />
        </div>
      </div>
    </header>
  );
}
