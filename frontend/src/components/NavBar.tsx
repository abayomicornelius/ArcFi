"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { GitBranch, ChevronDown } from "lucide-react";
import { useState } from "react";
import { ConnectButton } from "./ConnectButton";
import { FaucetButton } from "./FaucetButton";

const LINKS = [
  { href: "/app", label: "App" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/maintainers", label: "Maintainers" },
  { href: "/contributors", label: "Contributors" },
];

export function NavBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-ink-200 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-usdc-500 text-sm font-bold text-white">A</div>
            <span className="text-sm font-semibold text-ink-900">ArcFi</span>
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

          {status === "authenticated" && session.user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-ink-200 bg-white py-1 pl-1 pr-2.5 text-sm hover:border-ink-300"
              >
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="" className="h-6 w-6 rounded-full" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-ink-200" />
                )}
                <span className="max-w-[100px] truncate text-ink-800">{session.user.githubLogin ?? session.user.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-lg"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <Link href="/onboarding" className="block px-3.5 py-2 text-sm text-ink-700 hover:bg-ink-50">
                    Edit profile
                  </Link>
                  {session.user.walletAddress && (
                    <Link
                      href={`/profile/${session.user.walletAddress}`}
                      className="block px-3.5 py-2 text-sm text-ink-700 hover:bg-ink-50"
                    >
                      My public profile
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="block w-full px-3.5 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signIn("github", { callbackUrl: "/onboarding" })}
              className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-700"
            >
              <GitBranch className="h-4 w-4" />
              Connect GitHub
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
