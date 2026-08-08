"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import type { Session } from "next-auth";
import { useAccount } from "wagmi";
import {
  GitBranch,
  Wallet,
  Check,
  HandCoins,
  Wrench,
  Users,
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  Star,
  AtSign,
  Briefcase,
  Send,
  Info,
} from "lucide-react";
import { Card, Button, Field, Input, Pill } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { toast } from "sonner";

const ROLES = [
  {
    key: "isSponsor" as const,
    label: "Sponsor",
    blurb: "I fund issues, milestones, or maintenance pools.",
    icon: HandCoins,
    tone: "sponsor" as const,
    active: "border-usdc-400 bg-usdc-50",
    iconActive: "text-usdc-600",
  },
  {
    key: "isMaintainer" as const,
    label: "Maintainer",
    blurb: "I scope bounties and vouch for merged work on my repos.",
    icon: Wrench,
    tone: "maintainer" as const,
    active: "border-gold-400 bg-gold-50",
    iconActive: "text-gold-600",
  },
  {
    key: "isContributor" as const,
    label: "Contributor",
    blurb: "I want to get paid in USDC for merged PRs.",
    icon: Users,
    tone: "contributor" as const,
    active: "border-emerald-400 bg-emerald-50",
    iconActive: "text-emerald-600",
  },
];

type RoleFlags = { isSponsor: boolean; isMaintainer: boolean; isContributor: boolean };

export default function OnboardingPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="mx-auto max-w-xl px-6 py-20 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Set up your ArcFi profile</h1>
        <p className="mb-6 text-muted-foreground">Connect GitHub to create a sponsor, maintainer, or contributor profile.</p>
        <button
          onClick={() => signIn("github", { callbackUrl: "/onboarding" })}
          className="btn-glow inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
        >
          <GitBranch className="h-4 w-4" />
          Connect GitHub
        </button>
      </div>
    );
  }

  // Keyed by user id so this remounts (and re-reads initial props into fresh
  // local state) the moment the session actually loads, instead of syncing
  // via an effect.
  return <OnboardingForm key={session.user.id} user={session.user} />;
}

type Profile = {
  bio: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  telegramUrl: string | null;
  githubJoinedAt: string | null;
  walletLinkedAt: string | null;
  createdAt: string;
};

type Stats = { fundedUsdc: string; fundedCount: number; receivedUsdc: string; receivedCount: number };
type OwnedRepo = { id: string; githubOwner: string; githubRepo: string; avatarUrl: string | null };

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function OnboardingForm({ user }: { user: Session["user"] }) {
  const { update } = useSession();
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [ownedRepos, setOwnedRepos] = useState<OwnedRepo[] | null>(null);
  const [roles, setRoles] = useState<RoleFlags>({
    isSponsor: user.isSponsor,
    isMaintainer: user.isMaintainer,
    isContributor: user.isContributor,
  });
  const [bio, setBio] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    fetch("/api/profile/me")
      .then((res) => res.json())
      .then((data: { user: Profile | null }) => {
        if (!data.user) return;
        setProfile(data.user);
        setBio(data.user.bio ?? "");
        setTwitterUrl(data.user.twitterUrl ?? "");
        setLinkedinUrl(data.user.linkedinUrl ?? "");
        setTelegramUrl(data.user.telegramUrl ?? "");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user.walletAddress) return;
    fetch(`/api/profile/stats?address=${user.walletAddress}`)
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {});
  }, [user.walletAddress]);

  useEffect(() => {
    if (!roles.isMaintainer) return;
    fetch("/api/repos?mine=1")
      .then((res) => res.json())
      .then((data: { repos: OwnedRepo[] }) => setOwnedRepos(data.repos))
      .catch(() => {});
  }, [roles.isMaintainer]);

  async function saveRoles() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...roles, bio, twitterUrl, linkedinUrl, telegramUrl }),
      });
      if (!res.ok) throw new Error("Failed to save");
      await update();
      toast.success("Profile saved");
    } catch {
      toast.error("Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  async function linkWallet() {
    if (!address) return;
    setLinking(true);
    try {
      const res = await fetch("/api/profile/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to link wallet");
      await update();
      toast.success("Wallet linked");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not link wallet");
    } finally {
      setLinking(false);
    }
  }

  const walletLinked = Boolean(user.walletAddress);
  const displayName = user.name ?? user.githubLogin ?? "Anonymous";
  const activeRoles = ROLES.filter((role) => roles[role.key]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Profile header */}
      <Reveal>
      <Card className="mb-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="h-20 w-20 rounded-full" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-ink-100" />
              )}
              {walletLinked && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-usdc-500 text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-semibold uppercase tracking-tight text-foreground sm:text-3xl">{displayName}</h1>
              <p className="mt-0.5 flex items-center gap-1 font-mono text-sm text-muted-foreground">
                @{user.githubLogin ?? "unknown"}
                {user.githubLogin && (
                  <a href={`https://github.com/${user.githubLogin}`} target="_blank" rel="noreferrer" className="text-ink-400 hover:text-ink-700">
                    <GitBranch className="h-3.5 w-3.5" />
                  </a>
                )}
              </p>

              <p className={`mt-2 max-w-md text-sm ${bio ? "text-ink-600" : "text-ink-400 italic"}`}>
                {bio || "No bio yet — add one below."}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-ink-400">
                {profile?.githubJoinedAt && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" /> Joined GitHub on {formatDate(profile.githubJoinedAt)}
                  </span>
                )}
                {profile?.createdAt && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" /> Joined ArcFi on {formatDate(profile.createdAt)}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {activeRoles.length > 0 ? (
                  activeRoles.map((role) => (
                    <Pill key={role.key} tone={role.tone}>
                      {role.label}
                    </Pill>
                  ))
                ) : (
                  <span className="text-xs text-ink-400">Pick a role below to show it here.</span>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            className="shrink-0"
            disabled={!walletLinked}
            title={walletLinked ? undefined : "Link a wallet to unlock your public profile"}
            onClick={() => walletLinked && router.push(`/profile/${user.walletAddress}`)}
          >
            Public profile <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
      </Reveal>

      {/* On-chain stats */}
      <Reveal delay={0.06} className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-ink-200 bg-paper-raised p-5">
          <p className="font-mono text-xs uppercase tracking-wider text-ink-400">Total funded</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-ink-900">{walletLinked ? (stats?.fundedUsdc ?? "0.0") : "—"} USDC</p>
          <p className="mt-1 text-xs text-ink-400">
            {walletLinked ? `across ${stats?.fundedCount ?? 0} deposit${stats?.fundedCount === 1 ? "" : "s"}` : "link a wallet to track this"}
          </p>
        </div>
        <div className="rounded-md border border-ink-200 bg-paper-raised p-5">
          <p className="font-mono text-xs uppercase tracking-wider text-ink-400">Total received</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-ink-900">{walletLinked ? (stats?.receivedUsdc ?? "0.0") : "—"} USDC</p>
          <p className="mt-1 text-xs text-ink-400">
            {walletLinked ? `across ${stats?.receivedCount ?? 0} payout${stats?.receivedCount === 1 ? "" : "s"}` : "link a wallet to track this"}
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.12} className="grid gap-6 lg:grid-cols-2">
        {/* Payment methods */}
        <Card>
          <h2 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-ink-900">
            Payment methods
            <Info className="h-3.5 w-3.5 text-ink-300" />
          </h2>
          <p className="mb-4 text-sm text-ink-500">
            Rewards are paid to the wallet linked below the moment a funded issue&rsquo;s PR merges.
          </p>

          {user.walletAddress ? (
            <div className="overflow-hidden rounded-lg border border-ink-200">
              <div className="hidden gap-3 border-b border-ink-100 bg-ink-50 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-ink-400 sm:grid sm:grid-cols-[1fr_auto_auto]">
                <span>Address</span>
                <span>Primary</span>
                <span>Added</span>
              </div>
              <div className="flex flex-col gap-2 px-3 py-3 sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-3">
                <span className="flex min-w-0 items-center gap-1.5 truncate font-mono text-sm text-ink-700">
                  <Wallet className="h-3.5 w-3.5 shrink-0 text-usdc-600" />
                  {user.walletAddress.slice(0, 8)}…{user.walletAddress.slice(-6)}
                </span>
                <span className="flex items-center gap-3 text-xs text-ink-400 sm:contents">
                  <span className="flex items-center gap-1 font-medium text-gold-600">
                    <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-500" /> Primary
                  </span>
                  <span>{formatDate(profile?.walletLinkedAt) ?? "—"}</span>
                </span>
              </div>
            </div>
          ) : isConnected && address ? (
            <Button onClick={linkWallet} loading={linking} disabled={linking}>
              Link {address.slice(0, 6)}…{address.slice(-4)} to this profile
            </Button>
          ) : (
            <p className="text-sm text-ink-400">Connect a wallet using the button in the top nav, then come back here to link it.</p>
          )}
        </Card>

        {/* Profile details */}
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-ink-900">Profile details</h2>
          <p className="mb-4 text-sm text-ink-500">Tell others about you. You can update this anytime.</p>

          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            {ROLES.map((role) => {
              const active = roles[role.key];
              return (
                <button
                  key={role.key}
                  onClick={() => setRoles((r) => ({ ...r, [role.key]: !r[role.key] }))}
                  className={`rounded-md border p-3 text-left transition ${active ? role.active : "border-ink-200 bg-white hover:border-ink-300"}`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <role.icon className={`h-3.5 w-3.5 ${active ? role.iconActive : "text-ink-400"}`} />
                    {active && <Check className={`h-3.5 w-3.5 ${role.iconActive}`} />}
                  </div>
                  <p className="text-xs font-semibold text-ink-900">{role.label}</p>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <Field label="Bio" hint="Shown on your public profile. 280 characters max.">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={280}
                rows={3}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-usdc-500 focus:ring-2 focus:ring-usdc-100"
                placeholder="What repos do you work on? What are you looking to fund or get funded?"
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Twitter / X">
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-300" />
                  <Input
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://x.com/username"
                    className="pl-8"
                  />
                </div>
              </Field>
              <Field label="LinkedIn">
                <div className="relative">
                  <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-300" />
                  <Input
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="pl-8"
                  />
                </div>
              </Field>
            </div>

            <Field label="Telegram">
              <div className="relative">
                <Send className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-300" />
                <Input value={telegramUrl} onChange={(e) => setTelegramUrl(e.target.value)} placeholder="https://t.me/username" className="pl-8" />
              </div>
            </Field>
          </div>

          <Button className="mt-4" onClick={saveRoles} loading={saving} disabled={saving}>
            Save profile
          </Button>
        </Card>
      </Reveal>

      {roles.isMaintainer && (
        <Reveal delay={0.18}>
        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
              <Wrench className="h-4 w-4 text-gold-600" />
              Your projects
            </h2>
            <a href="/maintainers/submit" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Manage projects <ArrowRight className="h-3 w-3" />
            </a>
          </div>
          <p className="mb-4 mt-1 text-sm text-ink-500">Repos you&rsquo;ve verified access to — sponsors browse these to fund issues.</p>

          {ownedRepos === null ? (
            <p className="text-sm text-ink-400">Loading…</p>
          ) : ownedRepos.length === 0 ? (
            <a
              href="/maintainers/submit"
              className="flex items-center justify-center gap-2 rounded-md border border-dashed border-ink-200 py-6 text-sm font-medium text-ink-500 transition hover:border-gold-300 hover:text-gold-700"
            >
              <GitBranch className="h-4 w-4" /> List your first repo
            </a>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ownedRepos.map((repo) => (
                <span key={repo.id} className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-white py-1 pl-1 pr-3 text-xs">
                  {repo.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={repo.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
                  ) : (
                    <span className="h-5 w-5 rounded-full bg-ink-100" />
                  )}
                  <span className="font-medium text-ink-700">
                    {repo.githubOwner}/{repo.githubRepo}
                  </span>
                </span>
              ))}
            </div>
          )}
        </Card>
        </Reveal>
      )}
    </div>
  );
}
