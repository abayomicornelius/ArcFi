"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import type { Session } from "next-auth";
import { useAccount } from "wagmi";
import { GitBranch, Wallet, Check, HandCoins, Wrench, Users } from "lucide-react";
import { Card, Button, Field } from "@/components/ui";
import { toast } from "sonner";

const ROLES = [
  {
    key: "isSponsor" as const,
    label: "Sponsor",
    blurb: "I fund issues, milestones, or maintenance pools.",
    icon: HandCoins,
    active: "border-usdc-400 bg-usdc-50",
    iconActive: "text-usdc-600",
  },
  {
    key: "isMaintainer" as const,
    label: "Maintainer",
    blurb: "I scope bounties and vouch for merged work on my repos.",
    icon: Wrench,
    active: "border-gold-400 bg-gold-50",
    iconActive: "text-gold-600",
  },
  {
    key: "isContributor" as const,
    label: "Contributor",
    blurb: "I want to get paid in USDC for merged PRs.",
    icon: Users,
    active: "border-emerald-400 bg-emerald-50",
    iconActive: "text-emerald-600",
  },
];

type RoleFlags = { isSponsor: boolean; isMaintainer: boolean; isContributor: boolean };

export default function OnboardingPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="mx-auto max-w-xl px-6 py-20 text-center text-sm text-ink-400">Loading…</div>;
  }

  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="mb-2 text-2xl font-semibold text-ink-900">Set up your ArcFi profile</h1>
        <p className="mb-6 text-ink-500">Connect GitHub to create a sponsor, maintainer, or contributor profile.</p>
        <button
          onClick={() => signIn("github", { callbackUrl: "/onboarding" })}
          className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-700"
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

function OnboardingForm({ user }: { user: Session["user"] }) {
  const { update } = useSession();
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const [roles, setRoles] = useState<RoleFlags>({
    isSponsor: user.isSponsor,
    isMaintainer: user.isMaintainer,
    isContributor: user.isContributor,
  });
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(false);

  async function saveRoles() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...roles, bio }),
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
      router.push(`/profile/${address}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not link wallet");
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-8 flex items-center gap-3">
        {user.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="h-12 w-12 rounded-full" />
        )}
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Set up your profile</h1>
          <p className="text-sm text-ink-500">Signed in as @{user.githubLogin ?? user.name}</p>
        </div>
      </div>

      <Card className="mb-6">
        <h2 className="mb-4 text-sm font-semibold text-ink-900">I am a…</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {ROLES.map((role) => {
            const active = roles[role.key];
            return (
              <button
                key={role.key}
                onClick={() => setRoles((r) => ({ ...r, [role.key]: !r[role.key] }))}
                className={`rounded-xl border p-4 text-left transition ${active ? role.active : "border-ink-200 bg-white hover:border-ink-300"}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <role.icon className={`h-4 w-4 ${active ? role.iconActive : "text-ink-400"}`} />
                  {active && <Check className={`h-4 w-4 ${role.iconActive}`} />}
                </div>
                <p className="text-sm font-semibold text-ink-900">{role.label}</p>
                <p className="mt-0.5 text-xs text-ink-500">{role.blurb}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
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
        </div>

        <Button className="mt-4" onClick={saveRoles} loading={saving} disabled={saving}>
          Save profile
        </Button>
      </Card>

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-ink-900">Link a wallet</h2>
        <p className="mb-4 text-sm text-ink-500">Your on-chain funding and payout history is tracked by wallet address.</p>

        {user.walletAddress ? (
          <div className="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-sm">
            <Wallet className="h-4 w-4 text-usdc-600" />
            <span className="font-mono text-ink-700">{user.walletAddress}</span>
            <Check className="ml-auto h-4 w-4 text-emerald-600" />
          </div>
        ) : isConnected && address ? (
          <Button onClick={linkWallet} loading={linking} disabled={linking}>
            Link {address.slice(0, 6)}…{address.slice(-4)} to this profile
          </Button>
        ) : (
          <p className="text-sm text-ink-400">Connect a wallet using the button in the top nav, then come back here to link it.</p>
        )}
      </Card>

      {user.walletAddress && (
        <div className="mt-6 text-center">
          <button onClick={() => router.push(`/profile/${user.walletAddress}`)} className="text-sm font-medium text-usdc-600 hover:underline">
            View my public profile →
          </button>
        </div>
      )}
    </div>
  );
}
