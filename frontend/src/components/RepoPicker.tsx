"use client";

import { useEffect, useState } from "react";
import { GitBranch } from "lucide-react";
import { Input } from "./ui";

type RepoOption = { githubOwner: string; githubRepo: string; avatarUrl: string | null; description: string | null };

/** Search-as-you-type over registered repos, with freeform owner/repo typing as a fallback for unlisted ones. */
export function RepoPicker({ owner, repo, onChange }: { owner: string; repo: string; onChange: (owner: string, repo: string) => void }) {
  const [query, setQuery] = useState(owner && repo ? `${owner}/${repo}` : "");
  const [results, setResults] = useState<RepoOption[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      fetch(`/api/repos?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data: { repos: RepoOption[] }) => setResults(data.repos))
        .catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(handle);
  }, [query, open]);

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
          setOpen(true);
          const [o, r] = value.split("/");
          onChange(o?.trim() ?? "", r?.trim() ?? "");
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search registered projects, or type owner/repo"
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-ink-200 bg-white shadow-lg">
          {results.map((r) => (
            <button
              key={`${r.githubOwner}/${r.githubRepo}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQuery(`${r.githubOwner}/${r.githubRepo}`);
                onChange(r.githubOwner, r.githubRepo);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-ink-50"
            >
              {r.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.avatarUrl} alt="" className="h-5 w-5 shrink-0 rounded" />
              ) : (
                <GitBranch className="h-4 w-4 shrink-0 text-ink-300" />
              )}
              <span className="min-w-0 flex-1 truncate font-medium text-ink-800">
                {r.githubOwner}/{r.githubRepo}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
