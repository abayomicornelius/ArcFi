import { HandCoins } from "lucide-react";
import { getSponsors } from "@/lib/directory";
import { ProfileCard } from "@/components/ProfileCard";

// Reads live on-chain + database state on every request — must not be cached as static.
export const dynamic = "force-dynamic";

export default async function SponsorsPage() {
  const sponsors = await getSponsors();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-usdc-50 text-usdc-600">
          <HandCoins className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Sponsors</h1>
          <p className="text-sm text-ink-500">Individuals and companies funding issues, milestones, and maintenance pools in USDC.</p>
        </div>
      </div>

      {sponsors.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-200 p-10 text-center text-sm text-ink-400">
          No sponsors yet — be the first to <a href="/onboarding" className="text-usdc-600 underline">set up a sponsor profile</a>.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((s) => (
            <ProfileCard key={s.key} entry={s} statLabel="Total funded" statValue={s.fundedUsdc} accent="sponsor" />
          ))}
        </div>
      )}
    </main>
  );
}
