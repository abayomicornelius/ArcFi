import "server-only";

export type GithubRepoInfo = {
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  avatarUrl: string | null;
};

export class GithubRepoError extends Error {
  code: "not_found" | "insufficient_scope" | "no_access" | "rate_limited" | "unknown";

  constructor(code: GithubRepoError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Fetches a repo from GitHub using the signed-in user's own OAuth token, and
 * confirms they actually have admin/maintain access to it — so listing a
 * project on ArcFi requires proving you control it, not just typing its name.
 */
export async function fetchRepoWithPermissions(owner: string, repo: string, accessToken: string): Promise<GithubRepoInfo> {
  const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (res.status === 404) {
    throw new GithubRepoError("not_found", `${owner}/${repo} wasn't found on GitHub — check spelling, and that it's public.`);
  }
  if (res.status === 401 || res.status === 403) {
    const body = await res.json().catch(() => null);
    if (body?.message?.toLowerCase().includes("rate limit")) {
      throw new GithubRepoError("rate_limited", "Hit GitHub's API rate limit — try again in a minute.");
    }
    throw new GithubRepoError("insufficient_scope", "Reconnect GitHub to grant repo access, then try again.");
  }
  if (!res.ok) {
    throw new GithubRepoError("unknown", `GitHub returned an unexpected ${res.status} for ${owner}/${repo}.`);
  }

  const data = (await res.json()) as {
    description: string | null;
    language: string | null;
    topics?: string[];
    stargazers_count: number;
    owner?: { avatar_url?: string };
    permissions?: { admin?: boolean; maintain?: boolean };
  };

  if (!data.permissions) {
    // Present on the repo but the response has no `permissions` block — the
    // token doesn't carry enough scope to see it, even though the request
    // itself succeeded (GitHub only includes `permissions` for sufficiently
    // scoped, authenticated requests).
    throw new GithubRepoError("insufficient_scope", "Reconnect GitHub to grant repo access, then try again.");
  }
  if (!data.permissions.admin && !data.permissions.maintain) {
    throw new GithubRepoError("no_access", `You need admin or maintain access to ${owner}/${repo} on GitHub to list it here.`);
  }

  return {
    description: data.description ?? null,
    language: data.language ?? null,
    topics: Array.isArray(data.topics) ? data.topics.slice(0, 6) : [],
    stars: data.stargazers_count ?? 0,
    avatarUrl: data.owner?.avatar_url ?? null,
  };
}

export type GithubOwnedRepo = {
  owner: string;
  repo: string;
  description: string | null;
  language: string | null;
  stars: number;
  avatarUrl: string | null;
  isOrg: boolean;
};

/**
 * Lists public repos (owned personally or via an org) the signed-in user has
 * admin/maintain access to — so they can pick one instead of typing it.
 */
export async function fetchUserRepos(accessToken: string): Promise<GithubOwnedRepo[]> {
  const repos: GithubOwnedRepo[] = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(
      `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner,organization_member&visibility=public`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      if (page === 1) {
        throw new GithubRepoError(res.status === 401 || res.status === 403 ? "insufficient_scope" : "unknown", "Could not load your GitHub repos.");
      }
      break;
    }

    const data = (await res.json()) as Array<{
      name: string;
      description: string | null;
      language: string | null;
      stargazers_count: number;
      owner: { login: string; avatar_url: string; type: string };
      permissions?: { admin?: boolean; maintain?: boolean };
    }>;

    if (data.length === 0) break;

    for (const r of data) {
      if (!r.permissions?.admin && !r.permissions?.maintain) continue;
      repos.push({
        owner: r.owner.login,
        repo: r.name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        avatarUrl: r.owner.avatar_url,
        isOrg: r.owner.type === "Organization",
      });
    }

    if (data.length < 100) break;
  }

  return repos;
}
