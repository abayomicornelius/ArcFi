import { getSponsors } from "@/lib/directory";
import { ProfileCard } from "@/components/ProfileCard";
import { PageHero } from "@/components/PageHero";
import { CtaBand } from "@/components/CtaBand";
import { Reveal } from "@/components/Reveal";

// Reads live on-chain + database state on every request — must not be cached as static.
export const dynamic = "force-dynamic";

export default async function SponsorsPage() {
  const sponsors = await getSponsors();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <PageHero
        eyebrow="Funding the work"
        eyebrowDot="bg-usdc-400"
        title="Sponsors"
        subtitle="Individuals and companies funding issues, milestones, and maintenance pools in USDC."
      />

      <Reveal className="mt-8">
        {sponsors.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No sponsors yet — be the first to <a href="/onboarding" className="text-usdc-600 underline">set up a sponsor profile</a>.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sponsors.map((s) => (
              <ProfileCard key={s.key} entry={s} statLabel="Total funded" statValue={s.fundedUsdc} accent="sponsor" />
            ))}
          </div>
        )}
      </Reveal>

      <CtaBand
        title="Fund your first issue"
        subtitle="Pick a project, escrow USDC against an issue, and pay the moment a merged PR lands."
        primaryHref="/app"
        primaryLabel="Fund a bounty"
      />
    </main>
  );
}
