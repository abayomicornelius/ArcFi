import { Wrench, Bot } from "lucide-react";
import { getMaintainers } from "@/lib/directory";
import { ProfileCard } from "@/components/ProfileCard";
import { Identicon } from "@/components/Identicon";

// Reads live database state on every request — must not be cached as static.
export const dynamic = "force-dynamic";

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;

export default async function MaintainersPage() {
  const maintainers = await getMaintainers();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-gold-50 text-gold-600">
          <Wrench className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Maintainers</h1>
          <p className="text-sm text-ink-500">Repo owners who scope bounties, allocate milestone budgets, and vouch for merged work.</p>
        </div>
      </div>

      {ADMIN_ADDRESS && (
        <div className="mb-8 flex items-start gap-4 rounded-md border border-ink-200 bg-ink-900 p-5 text-white">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Protocol oracle</p>
            <p className="mt-1 text-sm text-ink-300">
              The address authorized to call <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">release</code>,{" "}
              <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">allocate</code>, and{" "}
              <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">withdraw</code> once GitHub webhooks confirm merged work.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5">
              <Identicon address={ADMIN_ADDRESS} size={20} />
              <span className="font-mono text-xs text-ink-200">{ADMIN_ADDRESS}</span>
            </div>
          </div>
        </div>
      )}

      {maintainers.length === 0 ? (
        <p className="rounded-md border border-dashed border-ink-200 p-10 text-center text-sm text-ink-400">
          No repo maintainers registered yet — <a href="/onboarding" className="text-gold-600 underline">set up a maintainer profile</a>.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {maintainers.map((m) => (
            <ProfileCard key={m.key} entry={m} accent="maintainer" />
          ))}
        </div>
      )}
    </main>
  );
}
