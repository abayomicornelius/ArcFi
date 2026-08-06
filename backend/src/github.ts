import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies GitHub's `X-Hub-Signature-256` header against the raw request
 * body. Must run against the raw bytes, not a re-serialized JSON.stringify
 * of the parsed body — key ordering/whitespace differences would break the
 * HMAC even for a genuine payload.
 */
export function verifySignature(rawBody: Buffer, signatureHeader: string | undefined, secret: string): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }
  const expectedHex = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(`sha256=${expectedHex}`);
  const provided = Buffer.from(signatureHeader);
  if (expected.length !== provided.length) {
    return false;
  }
  return timingSafeEqual(expected, provided);
}

// GitHub's own PR-closing keyword syntax: https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue
const CLOSING_KEYWORDS = "close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved";
const CLOSING_ISSUE_RE = new RegExp(`\\b(?:${CLOSING_KEYWORDS})\\b\\s*:?\\s*#(\\d+)`, "gi");

/**
 * Finds same-repo issue numbers a PR body closes via GitHub's linking
 * keywords (`closes #12`, `Fixes #7`). Cross-repo references
 * (`owner/repo#12`) aren't handled — out of scope for v1.
 */
export function extractClosingIssueNumbers(prBody: string | null | undefined): number[] {
  if (!prBody) return [];
  const numbers = new Set<number>();
  for (const match of prBody.matchAll(CLOSING_ISSUE_RE)) {
    numbers.add(Number(match[1]));
  }
  return [...numbers];
}

export interface MergedPullRequestEvent {
  owner: string;
  repo: string;
  prNumber: number;
  authorLogin: string;
  closingIssueNumbers: number[];
}

/**
 * Interprets a `pull_request` webhook payload. Returns null for anything
 * that isn't a genuinely merged PR (opened, synchronize, closed-without-
 * merge, etc.) or that closes no linked issue — both are "nothing to do,"
 * not errors.
 */
export function parseMergedPullRequestEvent(eventName: string, payload: unknown): MergedPullRequestEvent | null {
  if (eventName !== "pull_request") return null;

  const p = payload as {
    action?: string;
    pull_request?: { merged?: boolean; number?: number; body?: string | null; user?: { login?: string } };
    repository?: { name?: string; owner?: { login?: string } };
  };

  if (p.action !== "closed" || p.pull_request?.merged !== true) return null;

  const owner = p.repository?.owner?.login;
  const repo = p.repository?.name;
  const prNumber = p.pull_request?.number;
  const authorLogin = p.pull_request?.user?.login;
  if (!owner || !repo || prNumber === undefined || !authorLogin) return null;

  const closingIssueNumbers = extractClosingIssueNumbers(p.pull_request?.body);
  if (closingIssueNumbers.length === 0) return null;

  return { owner, repo, prNumber, authorLogin, closingIssueNumbers };
}
