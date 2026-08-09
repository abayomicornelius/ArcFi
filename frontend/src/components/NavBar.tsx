"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { ConnectButton } from "./ConnectButton";
import { FaucetButton } from "./FaucetButton";
import { GithubMenu } from "./GithubMenu";
import { NotificationBell } from "./NotificationBell";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/bounties", label: "Bounties" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/analytics", label: "Analytics" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/maintainers", label: "Maintainers" },
  { href: "/contributors", label: "Contributors" },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard next-themes hydration guard
    setMounted(true);
  }, []);

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
    >
      {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function NavBar() {
  const pathname = usePathname();
  const { status } = useSession();
  const signedUp = status === "authenticated";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // The active-link pill's presence/absence is a conditional child, not just
    // a class diff — mismatching that between SSR and the client's first paint
    // throws a hard hydration error, not just a warning. Gating it behind mount
    // keeps first paint identical to the server, then lets it appear.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard hydration guard, same pattern as ThemeToggle above
    setMounted(true);
  }, []);

  return (
    <header
      className={`sticky top-0 z-20 w-full transition-all duration-300 ${
        scrolled || mobileOpen ? "glass-panel border-b shadow-sm" : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 transition-transform active:scale-95">
            <Logo size={30} />
            <span className="font-display text-sm font-semibold text-foreground">ArcFi</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active ? "text-foreground" : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {mounted && active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-secondary"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {signedUp && <NotificationBell />}
          <FaucetButton />
          <ConnectButton />
          <GithubMenu />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          {signedUp && <NotificationBell />}
          <ConnectButton />
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Fades + slides rather than animating height, so GithubMenu's own popover
          isn't clipped by an overflow-hidden ancestor once this panel is open. */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="glass-panel border-t border-border md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    pathname === link.href ? "bg-secondary text-foreground" : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                <FaucetButton />
                <GithubMenu />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
