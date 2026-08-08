import { getContributors } from "@/lib/directory";
import { ProfileCard } from "@/components/ProfileCard";
import { PageHero } from "@/components/PageHero";
import { CtaBand } from "@/components/CtaBand";
import { Reveal } from "@/components/Reveal";

// Reads live on-chain + database state on every request — must not be cached as static.
export const dynamic = "force-dynamic";

export default async function ContributorsPage() {
  const contributors = await getContributors();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <PageHero
        eyebrow="Getting paid to ship"
        eyebrowDot="bg-emerald-400"
        title="Contributors"
        subtitle="The people who ship merged PRs and get paid in USDC the moment they land."
      />

      <Reveal className="mt-8">
        {contributors.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
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
      </Reveal>

      <CtaBand
        title="Find something to work on"
        subtitle="Browse funded issues, apply, and get paid the moment your PR merges — no invoicing, ever."
        primaryHref="/bounties"
        primaryLabel="Browse bounties"
      />
    </main>
  );
}
