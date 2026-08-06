import { Users } from "lucide-react";
import { getContributors } from "@/lib/directory";
import { ProfileCard } from "@/components/ProfileCard";

// Reads live on-chain + database state on every request — must not be cached as static.
export const dynamic = "force-dynamic";

export default async function ContributorsPage() {
  const contributors = await getContributors();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Contributors</h1>
          <p className="text-sm text-ink-500">The people who ship merged PRs and get paid in USDC the moment they land.</p>
        </div>
      </div>

      {contributors.length === 0 ? (
        <p className="rounded-md border border-dashed border-ink-200 p-10 text-center text-sm text-ink-400">
          No contributors yet — <a href="/onboarding" className="text-emerald-600 underline">set up a contributor profile</a> to appear here once
          you&rsquo;ve been paid out.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contributors.map((c) => (
            <ProfileCard key={c.key} entry={c} statLabel="Total received" statValue={c.receivedUsdc} accent="contributor" />
          ))}
        </div>
      )}
    </main>
  );
}
