import { Bot, Star, GitBranch, Plus } from "lucide-react";
import { getMaintainers, getAllRepos } from "@/lib/directory";
import { ProfileCard } from "@/components/ProfileCard";
import { Identicon } from "@/components/Identicon";
import { Pill } from "@/components/ui";
import { PageHero } from "@/components/PageHero";
import { CtaBand } from "@/components/CtaBand";
import { Reveal } from "@/components/Reveal";

// Reads live database state on every request — must not be cached as static.
export const dynamic = "force-dynamic";

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;

export default async function MaintainersPage() {
  const [maintainers, repos] = await Promise.all([getMaintainers(), getAllRepos()]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <PageHero
        eyebrow="Repo owners"
        eyebrowDot="bg-gold-400"
        title="Maintainers"
        subtitle="Repo owners who scope bounties, allocate milestone budgets, and vouch for merged work."
        action={
          <a
            href="/maintainers/submit"
            className="btn-glow inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> Submit a project
          </a>
        }
      />

      <Reveal className="mb-10 mt-8">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Registered projects</h2>
        {repos.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No projects listed yet — <a href="/maintainers/submit" className="text-gold-600 underline">verify one you maintain</a>.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {repos.map((repo) => {
              const topics = repo.topics ? repo.topics.split(",").filter(Boolean) : [];
              return (
                <a
                  key={repo.id}
                  href={`https://github.com/${repo.githubOwner}/${repo.githubRepo}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-md border border-ink-200 bg-paper-raised p-5 transition hover:border-gold-400"
                >
                  <div className="flex items-center gap-3">
                    {repo.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={repo.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-md" />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-md bg-ink-100" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink-900">
                        <GitBranch className="h-3.5 w-3.5 shrink-0 text-ink-300" />
                        {repo.githubOwner}/{repo.githubRepo}
                      </p>
                      {repo.addedBy.githubLogin && <p className="truncate text-xs text-ink-400">listed by @{repo.addedBy.githubLogin}</p>}
                    </div>
                  </div>

                  {repo.description && <p className="mt-3 line-clamp-2 text-sm text-ink-500">{repo.description}</p>}

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {repo.primaryLanguage && <Pill>{repo.primaryLanguage}</Pill>}
                    {topics.slice(0, 2).map((topic) => (
                      <Pill key={topic}>{topic}</Pill>
                    ))}
                    <span className="ml-auto flex items-center gap-1 text-xs text-ink-400">
                      <Star className="h-3 w-3" /> {repo.stars}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </Reveal>

      {ADMIN_ADDRESS && (
        <Reveal delay={0.05} className="mb-8 flex items-start gap-4 rounded-md border border-ink-200 bg-ink-900 p-5 text-white">
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
        </Reveal>
      )}

      <Reveal delay={0.1}>
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Maintainer profiles</h2>
        {maintainers.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No repo maintainers registered yet — <a href="/onboarding" className="text-gold-600 underline">set up a maintainer profile</a>.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {maintainers.map((m) => (
              <ProfileCard key={m.key} entry={m} accent="maintainer" />
            ))}
          </div>
        )}
      </Reveal>

      <CtaBand
        title="Own a repo?"
        subtitle="Verify it and let sponsors fund your issues — no manual invoicing, ever."
        primaryHref="/maintainers/submit"
        primaryLabel="Submit a project"
      />
    </main>
  );
}
