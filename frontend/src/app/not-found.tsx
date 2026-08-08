import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo size={48} />
      <p className="mt-6 font-mono text-sm font-medium uppercase tracking-wider text-ink-400">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">This page doesn&rsquo;t exist</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The bounty, profile, or page you&rsquo;re looking for isn&rsquo;t here — it may have moved, or the link&rsquo;s
        just wrong.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="btn-glow inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
        >
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
        <Link
          href="/bounties"
          className="inline-flex items-center gap-2 rounded-full border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-ink-300"
        >
          <Search className="h-4 w-4" /> Browse bounties
        </Link>
      </div>
    </main>
  );
}
