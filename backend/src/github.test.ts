import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifySignature, extractClosingIssueNumbers, parseMergedPullRequestEvent, fetchPullRequestContributors } from "./github.js";

test("verifySignature accepts a correctly-signed payload", () => {
  const secret = "test-secret";
  const body = Buffer.from(JSON.stringify({ hello: "world" }));
  const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  assert.equal(verifySignature(body, signature, secret), true);
});

test("verifySignature rejects a tampered payload", () => {
  const secret = "test-secret";
  const body = Buffer.from(JSON.stringify({ hello: "world" }));
  const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  const tampered = Buffer.from(JSON.stringify({ hello: "world!" }));
  assert.equal(verifySignature(tampered, signature, secret), false);
});

test("verifySignature rejects the wrong secret", () => {
  const body = Buffer.from(JSON.stringify({ hello: "world" }));
  const signature = `sha256=${createHmac("sha256", "correct-secret").update(body).digest("hex")}`;
  assert.equal(verifySignature(body, signature, "wrong-secret"), false);
});

test("verifySignature rejects a missing or malformed header", () => {
  const body = Buffer.from("{}");
  assert.equal(verifySignature(body, undefined, "secret"), false);
  assert.equal(verifySignature(body, "not-a-signature", "secret"), false);
  assert.equal(verifySignature(body, "sha1=deadbeef", "secret"), false);
});

test("extractClosingIssueNumbers finds every supported keyword, case-insensitively", () => {
  const body = "Closes #12, also fixes #7 and Resolved:#99. Unrelated #4 stays out.";
  assert.deepEqual(extractClosingIssueNumbers(body).sort((a, b) => a - b), [7, 12, 99]);
});

test("extractClosingIssueNumbers dedupes repeated references", () => {
  assert.deepEqual(extractClosingIssueNumbers("closes #12, also closes #12 again"), [12]);
});

test("extractClosingIssueNumbers returns empty for no body or no keyword match", () => {
  assert.deepEqual(extractClosingIssueNumbers(null), []);
  assert.deepEqual(extractClosingIssueNumbers(""), []);
  assert.deepEqual(extractClosingIssueNumbers("just a plain PR with #12 mentioned, not closing it"), []);
});

function mergedPrPayload(overrides: Partial<{ action: string; merged: boolean; body: string | null }> = {}) {
  return {
    action: overrides.action ?? "closed",
    pull_request: {
      merged: overrides.merged ?? true,
      number: 42,
      body: overrides.body ?? "Closes #12",
      user: { login: "octocat" },
    },
    repository: { name: "widget", owner: { login: "acme-oss" } },
  };
}

test("parseMergedPullRequestEvent extracts a genuinely merged PR", () => {
  const event = parseMergedPullRequestEvent("pull_request", mergedPrPayload());
  assert.deepEqual(event, {
    owner: "acme-oss",
    repo: "widget",
    prNumber: 42,
    authorLogin: "octocat",
    closingIssueNumbers: [12],
  });
});

test("parseMergedPullRequestEvent ignores non pull_request events", () => {
  assert.equal(parseMergedPullRequestEvent("issues", mergedPrPayload()), null);
});

test("parseMergedPullRequestEvent ignores closed-but-not-merged PRs", () => {
  assert.equal(parseMergedPullRequestEvent("pull_request", mergedPrPayload({ merged: false })), null);
});

test("parseMergedPullRequestEvent ignores non-closed actions (opened, synchronize)", () => {
  assert.equal(parseMergedPullRequestEvent("pull_request", mergedPrPayload({ action: "opened" })), null);
});

test("parseMergedPullRequestEvent ignores a merged PR that closes no issue", () => {
  assert.equal(parseMergedPullRequestEvent("pull_request", mergedPrPayload({ body: "no linked issue here" })), null);
});

test("fetchPullRequestContributors dedupes commit authors and always includes the PR author first", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    new Response(
      JSON.stringify([
        { author: { login: "octocat", type: "User" } },
        { author: { login: "hubot", type: "User" } },
        { author: { login: "octocat", type: "User" } },
      ]),
      { status: 200 },
    ),
  );

  const logins = await fetchPullRequestContributors("acme-oss", "widget", 42, "octocat");
  assert.deepEqual(logins, ["octocat", "hubot"]);
});

test("fetchPullRequestContributors skips bot authors and unlinked (null) commit authors", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    new Response(
      JSON.stringify([
        { author: { login: "dependabot", type: "Bot" } },
        { author: null },
        { author: { login: "hubot", type: "User" } },
      ]),
      { status: 200 },
    ),
  );

  const logins = await fetchPullRequestContributors("acme-oss", "widget", 42, "octocat");
  assert.deepEqual(logins, ["octocat", "hubot"]);
});

test("fetchPullRequestContributors falls back to solo PR-author attribution on a GitHub API error", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("rate limited", { status: 403 }));

  const logins = await fetchPullRequestContributors("acme-oss", "widget", 42, "octocat");
  assert.deepEqual(logins, ["octocat"]);
});

test("fetchPullRequestContributors sends a bearer token when one is provided", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify([]), { status: 200 }));

  await fetchPullRequestContributors("acme-oss", "widget", 42, "octocat", "test-token");

  const [, init] = fetchMock.mock.calls[0].arguments as [string, RequestInit & { headers: Record<string, string> }];
  assert.equal(init.headers.Authorization, "Bearer test-token");
});
