"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import { GitBranch, ArrowUpRight, Coins, Flag, Check, X, UserCheck, MessageSquare } from "lucide-react";
import { Card, Button, Pill, type PillTone } from "@/components/ui";

type MiniUser = { id: string; githubLogin: string | null; githubAvatarUrl: string | null; image: string | null };

type Bounty = {
  id: string;
  githubOwner: string;
  githubRepo: string;
  githubIssueNumber: number;
  contractType: string;
  status: string;
  createdAt: string;
  avatarUrl: string | null;
  repoDescription: string | null;
  sponsorLogin: string | null;
  assignedUser: MiniUser | null;
  approverId: string | null;
};

type Application = { id: string; message: string | null; status: string; createdAt: string; user: MiniUser };
type Comment = { id: string; message: string; createdAt: string; user: MiniUser };

const STATUS_LABEL: Record<string, string> = {
  funded: "Open",
  pending_recipient: "Awaiting wallet",
  released: "Paid out",
  refunded: "Refunded",
};
const STATUS_TONE: Record<string, PillTone> = {
  funded: "sponsor",
  pending_recipient: "warn",
  released: "good",
  refunded: "neutral",
};

function avatarOf(u: MiniUser) {
  return u.githubAvatarUrl ?? u.image ?? null;
}
function nameOf(u: MiniUser) {
  return u.githubLogin ? `@${u.githubLogin}` : "someone";
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function BountyDetail({
  bounty,
  applications,
  comments,
}: {
  bounty: Bounty;
  applications: Application[];
  comments: Comment[];
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [applyMessage, setApplyMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [posting, setPosting] = useState(false);

  const currentUserId = session?.user?.id;
  const isApprover = Boolean(currentUserId && currentUserId === bounty.approverId);
  const myApplication = applications.find((a) => a.user.id === currentUserId);
  const TypeIcon = bounty.contractType === "milestone" ? Flag : Coins;
  const issueUrl = `https://github.com/${bounty.githubOwner}/${bounty.githubRepo}/issues/${bounty.githubIssueNumber}`;

  async function apply() {
    setApplying(true);
    try {
      const res = await fetch(`/api/bounties/${bounty.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: applyMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not apply");
      toast.success("Applied — the maintainer will review it");
      setApplyMessage("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not apply");
    } finally {
      setApplying(false);
    }
  }

  async function decide(appId: string, decision: "approved" | "rejected") {
    setDecidingId(appId);
    try {
      const res = await fetch(`/api/bounties/${bounty.id}/applications/${appId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not update application");
      toast.success(decision === "approved" ? "Approved — they're now assigned" : "Application rejected");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update application");
    } finally {
      setDecidingId(null);
    }
  }

  async function postComment() {
    if (!commentInput.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/bounties/${bounty.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: commentInput }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not post comment");
      setCommentInput("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post comment");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/bounties" className="mb-6 inline-block text-xs font-medium text-ink-400 hover:text-ink-700">
        ← All bounties
      </Link>

      <Card className="mb-6">
        <div className="flex items-start gap-4">
          {bounty.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bounty.avatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-md" />
          ) : (
            <div className="h-12 w-12 shrink-0 rounded-md bg-ink-100" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap items-center gap-1.5 text-lg font-semibold text-ink-900">
              {bounty.githubOwner}/{bounty.githubRepo} <span className="text-ink-400">#{bounty.githubIssueNumber}</span>
              <a href={issueUrl} target="_blank" rel="noreferrer" className="text-ink-300 hover:text-ink-600">
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </h1>
            {bounty.repoDescription && <p className="mt-1 text-sm text-ink-500">{bounty.repoDescription}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Pill tone={STATUS_TONE[bounty.status] ?? "neutral"}>{STATUS_LABEL[bounty.status] ?? bounty.status}</Pill>
              <span className="flex items-center gap-1 text-xs text-ink-500">
                <TypeIcon className="h-3.5 w-3.5" /> {bounty.contractType === "milestone" ? "Milestone" : "Escrow"}
              </span>
              <span className="text-xs text-ink-400">funded {formatDate(bounty.createdAt)}</span>
              {bounty.sponsorLogin && <span className="text-xs text-ink-400">by @{bounty.sponsorLogin}</span>}
            </div>
            {bounty.assignedUser && (
              <div className="mt-3 flex items-center gap-2 rounded-full bg-emerald-50 py-1 pl-1 pr-3 text-xs font-medium text-emerald-700">
                {avatarOf(bounty.assignedUser) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarOf(bounty.assignedUser)!} alt="" className="h-5 w-5 rounded-full" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                Assigned to {nameOf(bounty.assignedUser)}
              </div>
            )}
          </div>
        </div>
      </Card>

      {!session?.user ? (
        <Card className="mb-6 text-center">
          <p className="mb-3 text-sm text-ink-500">Sign in with GitHub to apply or comment.</p>
          <button
            onClick={() => signIn("github")}
            className="btn-glow inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110"
          >
            <GitBranch className="h-4 w-4" /> Connect GitHub
          </button>
        </Card>
      ) : isApprover ? (
        <Card className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-ink-900">Applications</h2>
          <p className="mb-4 text-sm text-ink-500">You maintain this project — review who wants to work on it.</p>
          {applications.length === 0 ? (
            <p className="text-sm text-ink-400">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="flex flex-col gap-3 rounded-md border border-ink-200 p-3 sm:flex-row sm:items-start">
                  <div className="flex items-start gap-3">
                    {avatarOf(app.user) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarOf(app.user)!} alt="" className="h-8 w-8 shrink-0 rounded-full" />
                    ) : (
                      <div className="h-8 w-8 shrink-0 rounded-full bg-ink-100" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-900">{nameOf(app.user)}</p>
                      {app.message && <p className="mt-0.5 text-sm text-ink-600">{app.message}</p>}
                      <p className="mt-1 text-xs text-ink-400">{formatDate(app.createdAt)}</p>
                    </div>
                  </div>
                  {app.status === "pending" ? (
                    <div className="flex shrink-0 gap-2 sm:ml-auto">
                      <Button
                        className="!bg-emerald-600 hover:!brightness-110"
                        onClick={() => decide(app.id, "approved")}
                        loading={decidingId === app.id}
                        disabled={decidingId !== null}
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => decide(app.id, "rejected")}
                        loading={decidingId === app.id}
                        disabled={decidingId !== null}
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  ) : (
                    <Pill tone={app.status === "approved" ? "good" : "neutral"}>{app.status}</Pill>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-ink-900">Work on this</h2>
          {myApplication ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-ink-500">Your application:</span>
              <Pill tone={myApplication.status === "approved" ? "good" : myApplication.status === "rejected" ? "neutral" : "warn"}>
                {myApplication.status}
              </Pill>
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm text-ink-500">
                Let the maintainer know you want this one — approval doesn&rsquo;t gate payout, it just signals you&rsquo;re on it.
              </p>
              <textarea
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Optional note — e.g. how you'd approach it."
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-usdc-500 focus:ring-2 focus:ring-usdc-100"
              />
              <Button className="mt-3" onClick={apply} loading={applying} disabled={applying}>
                Apply to work on this
              </Button>
            </>
          )}
        </Card>
      )}

      <Card>
        <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-ink-900">
          <MessageSquare className="h-4 w-4" /> Discussion
        </h2>

        {comments.length === 0 ? (
          <p className="mb-4 text-sm text-ink-400">No comments yet.</p>
        ) : (
          <div className="mb-4 space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-3">
                {avatarOf(c.user) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarOf(c.user)!} alt="" className="h-7 w-7 shrink-0 rounded-full" />
                ) : (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-ink-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-ink-800">{nameOf(c.user)}</span>
                    <span className="text-ink-400">{formatDate(c.createdAt)}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-ink-700">{c.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {session?.user && (
          <div className="flex gap-2 border-t border-ink-100 pt-4">
            <input
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && postComment()}
              maxLength={1000}
              placeholder="Add a comment…"
              className="flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-usdc-500 focus:ring-2 focus:ring-usdc-100"
            />
            <Button onClick={postComment} loading={posting} disabled={posting || !commentInput.trim()}>
              Post
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
