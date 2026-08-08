"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import { GitBranch, Star, Trash2, Check, Building2, RefreshCw, ChevronDown } from "lucide-react";
import { Card, Field, Input, Button, Pill } from "@/components/ui";
import { PageHero } from "@/components/PageHero";

type Repo = {
  id: string;
  githubOwner: string;
  githubRepo: string;
  description: string | null;
  primaryLanguage: string | null;
  topics: string | null;
  stars: number;
  avatarUrl: string | null;
  createdAt: string;
};

type GithubRepo = {
  owner: string;
  repo: string;
  description: string | null;
  language: string | null;
  stars: number;
  avatarUrl: string | null;
  isOrg: boolean;
  alreadyListed: boolean;
};

export default function SubmitRepoPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="mx-auto max-w-xl px-6 py-20 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Submit your project</h1>
        <p className="mb-6 text-muted-foreground">Connect GitHub to pick a repo you maintain — no typing required.</p>
        <button
          onClick={() => signIn("github", { callbackUrl: "/maintainers/submit" })}
          className="btn-glow inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
        >
          <GitBranch className="h-4 w-4" />
          Connect GitHub
        </button>
      </div>
    );
  }

  return <SubmitForm />;
}

function SubmitForm() {
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [githubRepos, setGithubRepos] = useState<GithubRepo[] | null>(null);
  const [githubError, setGithubError] = useState<{ message: string; code?: string } | null>(null);
  const [loadingGithub, setLoadingGithub] = useState(true);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  function loadRepos() {
    fetch("/api/repos?mine=1")
      .then((res) => res.json())
      .then((data: { repos: Repo[] }) => setRepos(data.repos))
      .catch(() => setRepos([]));
  }

  function fetchGithubRepos() {
    return fetch("/api/github/repos")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setGithubError({ message: data.error ?? "Could not load your GitHub repos.", code: data.code });
          setGithubRepos([]);
          return;
        }
        setGithubRepos(data.repos);
      })
      .catch(() => setGithubError({ message: "Could not reach GitHub." }))
      .finally(() => setLoadingGithub(false));
  }

  function loadGithubRepos() {
    setLoadingGithub(true);
    setGithubError(null);
    fetchGithubRepos();
  }

  useEffect(() => {
    loadRepos();
    fetchGithubRepos();
  }, []);

  async function addRepo(owner: string, repo: string) {
    const key = `${owner}/${repo}`;
    setAddingKey(key);
    try {
      const res = await fetch("/api/repos/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubOwner: owner, githubRepo: repo }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "insufficient_scope") {
          toast.error("Needs a fresh GitHub connection", {
            description: "ArcFi didn't have repo-read access when you first signed in.",
            action: { label: "Reconnect", onClick: () => signIn("github", { callbackUrl: "/maintainers/submit" }) },
          });
        } else {
          toast.error(`Couldn't list ${key}`, { description: data.error ?? "Unknown error" });
        }
        return;
      }
      toast.success(`Listed ${key}`, { description: "It's now visible to sponsors and on the Maintainers page." });
      setGithubRepos((rs) => rs?.map((r) => (r.owner === owner && r.repo === repo ? { ...r, alreadyListed: true } : r)) ?? null);
      setManualInput("");
      loadRepos();
    } catch {
      toast.error("Could not reach ArcFi's API");
    } finally {
      setAddingKey(null);
    }
  }

  async function handleManualSubmit() {
    const trimmed = manualInput.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\/$/, "");
    const [owner, repo] = trimmed.split("/");
    if (!owner || !repo) {
      toast.error("Enter a repo as owner/repo", { description: "For example: facebook/react" });
      return;
    }
    setManualSubmitting(true);
    await addRepo(owner, repo);
    setManualSubmitting(false);
  }

  async function handleDelete(id: string) {
    const prev = repos;
    setRepos((r) => r?.filter((repo) => repo.id !== id) ?? null);
    const res = await fetch(`/api/repos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not remove that repo");
      setRepos(prev ?? null);
    }
  }

  const personalRepos = githubRepos?.filter((r) => !r.isOrg) ?? [];
  const orgRepos = githubRepos?.filter((r) => r.isOrg) ?? [];
  const orgNames = [...new Set(orgRepos.map((r) => r.owner))];

  function RepoRow({ repo }: { repo: GithubRepo }) {
    const key = `${repo.owner}/${repo.repo}`;
    return (
      <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3 last:border-b-0">
        {repo.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={repo.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-md" />
        ) : (
          <div className="h-8 w-8 shrink-0 rounded-md bg-ink-100" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-900">{key}</p>
          {repo.description && <p className="hidden truncate text-xs text-ink-500 sm:block">{repo.description}</p>}
        </div>
        {repo.language && (
          <span className="hidden sm:block">
            <Pill>{repo.language}</Pill>
          </span>
        )}
        <span className="hidden shrink-0 items-center gap-1 text-xs text-ink-400 sm:flex">
          <Star className="h-3 w-3" /> {repo.stars}
        </span>
        {repo.alreadyListed ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <Check className="h-3.5 w-3.5" /> Added
          </span>
        ) : (
          <Button
            variant="secondary"
            className="shrink-0"
            onClick={() => addRepo(repo.owner, repo.repo)}
            loading={addingKey === key}
            disabled={addingKey !== null}
          >
            Add
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <PageHero
        eyebrow="Maintainer"
        eyebrowDot="bg-gold-400"
        title="Submit your project"
        subtitle="Pick a repo below — we already know which ones you have admin or maintain access to on GitHub, personal or org-owned. One click, no typing."
        action={
          <button
            onClick={loadGithubRepos}
            disabled={loadingGithub}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:border-ink-300 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingGithub ? "animate-spin" : ""}`} /> Refresh
          </button>
        }
      />
      <div className="mt-8">

      {githubError ? (
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <p className="text-sm font-medium text-amber-800">{githubError.message}</p>
          {githubError.code === "insufficient_scope" && (
            <Button className="mt-3" onClick={() => signIn("github", { callbackUrl: "/maintainers/submit" })}>
              Reconnect GitHub
            </Button>
          )}
        </Card>
      ) : (
        <div className="mb-8 space-y-6">
          {loadingGithub && githubRepos === null && <p className="text-sm text-ink-400">Loading your repos from GitHub…</p>}

          {personalRepos.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Your repos</h2>
              <div className="overflow-hidden rounded-lg border border-ink-200 bg-paper-raised">
                {personalRepos.map((r) => (
                  <RepoRow key={`${r.owner}/${r.repo}`} repo={r} />
                ))}
              </div>
            </div>
          )}

          {orgNames.map((org) => (
            <div key={org}>
              <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400">
                <Building2 className="h-3.5 w-3.5" /> {org}
              </h2>
              <div className="overflow-hidden rounded-lg border border-ink-200 bg-paper-raised">
                {orgRepos
                  .filter((r) => r.owner === org)
                  .map((r) => (
                    <RepoRow key={`${r.owner}/${r.repo}`} repo={r} />
                  ))}
              </div>
            </div>
          ))}

          {githubRepos && githubRepos.length === 0 && !loadingGithub && (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No public repos found where you have admin or maintain access.
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => setManualOpen((v) => !v)}
        className="mb-8 flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-700"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${manualOpen ? "rotate-180" : ""}`} />
        Can&rsquo;t find it? Add by name
      </button>
      {manualOpen && (
        <Card className="mb-8">
          <Field label="Repo" hint="owner/repo, or paste a github.com URL.">
            <div className="flex gap-3">
              <Input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="facebook/react"
                onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                className="flex-1"
              />
              <Button onClick={handleManualSubmit} loading={manualSubmitting} disabled={manualSubmitting || !manualInput.trim()}>
                Verify & list
              </Button>
            </div>
          </Field>
        </Card>
      )}

      <h2 className="mb-4 text-sm font-semibold text-ink-900">Your projects on ArcFi</h2>

      {repos === null ? (
        <p className="text-sm text-ink-400">Loading…</p>
      ) : repos.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nothing listed yet — add one above.
        </p>
      ) : (
        <div className="space-y-3">
          {repos.map((repo) => (
            <div key={repo.id} className="flex items-center gap-3 rounded-md border border-ink-200 bg-paper-raised p-4">
              {repo.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={repo.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-md" />
              ) : (
                <div className="h-9 w-9 shrink-0 rounded-md bg-ink-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink-900">
                  <GitBranch className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                  {repo.githubOwner}/{repo.githubRepo}
                </p>
                {repo.description && <p className="hidden truncate text-xs text-ink-500 sm:block">{repo.description}</p>}
              </div>
              {repo.primaryLanguage && (
                <span className="hidden sm:block">
                  <Pill>{repo.primaryLanguage}</Pill>
                </span>
              )}
              <span className="hidden shrink-0 items-center gap-1 text-xs text-ink-400 sm:flex">
                <Star className="h-3 w-3" /> {repo.stars}
              </span>
              <button
                onClick={() => handleDelete(repo.id)}
                className="shrink-0 rounded-md p-1.5 text-ink-300 transition hover:bg-red-50 hover:text-red-600"
                title="Remove listing"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
