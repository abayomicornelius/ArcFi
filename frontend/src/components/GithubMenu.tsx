"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { GitBranch, ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useGithubConfigured } from "@/lib/github-config-context";

export function GithubMenu({ dark = false }: { dark?: boolean }) {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const githubConfigured = useGithubConfigured();

  if (status === "authenticated" && session.user) {
    return (
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className={`flex w-full items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 text-sm transition ${
            dark ? "border-white/15 bg-white/5 text-white hover:border-white/25" : "border-ink-200 bg-white text-ink-800 hover:border-ink-300"
          }`}
        >
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="h-6 w-6 rounded-full" />
          ) : (
            <div className={`h-6 w-6 rounded-full ${dark ? "bg-white/10" : "bg-ink-200"}`} />
          )}
          <span className="max-w-[100px] truncate">{session.user.githubLogin ?? session.user.name}</span>
          <ChevronDown className={`h-3.5 w-3.5 ${dark ? "text-white/40" : "text-ink-400"}`} />
        </button>
        {menuOpen && (
          <div
            className="absolute bottom-full left-0 mb-2 w-44 overflow-hidden rounded-md border border-ink-200 bg-white py-1 shadow-lg sm:bottom-auto sm:left-auto sm:right-0 sm:top-full sm:mb-0 sm:mt-2"
            onMouseLeave={() => setMenuOpen(false)}
          >
            <Link href="/onboarding" className="block px-3.5 py-2 text-sm text-ink-700 hover:bg-ink-50">
              Edit profile
            </Link>
            {session.user.walletAddress && (
              <Link href={`/profile/${session.user.walletAddress}`} className="block px-3.5 py-2 text-sm text-ink-700 hover:bg-ink-50">
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
    );
  }

  return (
    <button
      onClick={() => {
        if (!githubConfigured) {
          toast.error("GitHub sign-in isn't configured yet", {
            description: "Set AUTH_GITHUB_ID / AUTH_GITHUB_SECRET in frontend/.env.local — see the README.",
          });
          return;
        }
        signIn("github", { callbackUrl: "/onboarding" });
      }}
      title={githubConfigured ? undefined : "GitHub sign-in isn't configured yet — see the README"}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
        dark
          ? "border border-white/15 text-white hover:bg-white/10"
          : githubConfigured
            ? "bg-ink-900 text-white hover:bg-ink-700"
            : "bg-ink-100 text-ink-400 hover:bg-ink-200"
      }`}
    >
      <GitBranch className="h-4 w-4" />
      Connect GitHub
    </button>
  );
}
