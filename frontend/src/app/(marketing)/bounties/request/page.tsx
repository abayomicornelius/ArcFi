"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";
import { GitBranch, Coins } from "lucide-react";
import { Card, Field, Input, Button } from "@/components/ui";
import { PageHero } from "@/components/PageHero";

type MyRepo = { githubOwner: string; githubRepo: string };

export default function RequestBountyPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="mx-auto max-w-xl px-6 py-20 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Request funding</h1>
        <p className="mb-6 text-muted-foreground">Connect GitHub to ask sponsors to fund an issue on a repo you maintain.</p>
        <button
          onClick={() => signIn("github", { callbackUrl: "/bounties/request" })}
          className="btn-glow inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
        >
          <GitBranch className="h-4 w-4" />
          Connect GitHub
        </button>
      </div>
    );
  }

  return <RequestForm />;
}

function RequestForm() {
  const router = useRouter();
  const [repos, setRepos] = useState<MyRepo[] | null>(null);
  const [selected, setSelected] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [suggestedAmount, setSuggestedAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/repos?mine=1")
      .then((res) => res.json())
      .then((data: { repos: MyRepo[] }) => {
        setRepos(data.repos);
        if (data.repos.length > 0) setSelected(`${data.repos[0].githubOwner}/${data.repos[0].githubRepo}`);
      })
      .catch(() => setRepos([]));
  }, []);

  async function handleSubmit() {
    const [githubOwner, githubRepo] = selected.split("/");
    const githubIssueNumber = Number(issueNumber);
    if (!githubOwner || !githubRepo || !Number.isInteger(githubIssueNumber) || githubIssueNumber <= 0) {
      toast.error("Pick a repo and a valid issue number");
      return;
    }
    if (!title.trim()) {
      toast.error("Give it a short title");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bounty-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractType: "escrow",
          githubOwner,
          githubRepo,
          githubIssueNumber,
          title,
          description,
          suggestedAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not post request");
      toast.success("Posted — sponsors will see this on the Bounties page");
      router.push("/bounties");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <PageHero
        eyebrow="Maintainer"
        eyebrowDot="bg-gold-400"
        title="Request funding"
        subtitle="Point sponsors at an issue that needs USDC behind it. This just posts a public ask — nothing is escrowed until a sponsor actually funds it from here."
      />
      <div className="mt-8">

      {repos === null ? (
        <p className="text-sm text-ink-400">Loading your projects…</p>
      ) : repos.length === 0 ? (
        <Card className="text-center">
          <p className="mb-3 text-sm text-ink-500">You need to verify a repo before you can request funding for it.</p>
          <Button onClick={() => router.push("/maintainers/submit")}>List a repo first</Button>
        </Card>
      ) : (
        <Card>
          <Field label="Project">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-ink-900 outline-none transition [color-scheme:light] focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              {repos.map((r) => (
                <option key={`${r.githubOwner}/${r.githubRepo}`} value={`${r.githubOwner}/${r.githubRepo}`}>
                  {r.githubOwner}/{r.githubRepo}
                </option>
              ))}
            </select>
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Issue #">
              <Input value={issueNumber} onChange={(e) => setIssueNumber(e.target.value)} inputMode="numeric" placeholder="1042" />
            </Field>
            <Field label="Suggested amount" hint="Optional — just a hint for sponsors.">
              <div className="relative">
                <Coins className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-300" />
                <Input
                  value={suggestedAmount}
                  onChange={(e) => setSuggestedAmount(e.target.value)}
                  placeholder="150 USDC"
                  className="pl-8"
                />
              </div>
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Fix flaky retry logic in the sync worker" maxLength={140} />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Description" hint="What needs doing, and why it matters. Shown to sponsors.">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={1000}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-usdc-500 focus:ring-2 focus:ring-usdc-100"
              />
            </Field>
          </div>

          <Button className="mt-5" onClick={handleSubmit} loading={submitting} disabled={submitting}>
            Post request
          </Button>
        </Card>
      )}
      </div>
    </div>
  );
}
