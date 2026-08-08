import { Check, Circle, Loader2 } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { CtaBand } from "@/components/CtaBand";
import { Reveal } from "@/components/Reveal";

export const metadata = { title: "Roadmap — ArcFi" };

const PHASES: {
  label: string;
  status: "done" | "in-progress" | "planned";
  items: string[];
}[] = [
  {
    label: "Shipped",
    status: "done",
    items: [
      "ArcFiEscrow, ArcFiMilestones, and ArcFiMaintenancePool deployed and verified on Arc testnet",
      "GitHub OAuth with real repo-permission verification before a project can be listed",
      "Oracle backend that detects merged PRs and triggers on-chain release automatically",
      "Sponsor, maintainer, and contributor dashboards with live on-chain activity",
      "Bounty applications, discussion threads, and maintainer-initiated funding requests",
      "Public profiles, a leaderboard, and protocol-wide analytics",
    ],
  },
  {
    label: "In progress",
    status: "in-progress",
    items: [
      "Broader repo-discovery tools for sponsors browsing by language and topic",
      "Deeper analytics on payout latency between merge and release",
    ],
  },
  {
    label: "Planned",
    status: "planned",
    items: [
      "Mainnet deployment once Arc mainnet is available",
      "Multi-signature treasury controls for protocol fee governance",
      "Support for splitting a single payout across multiple contributors on one PR",
    ],
  },
];

const STYLES = {
  done: { icon: Check, dot: "bg-emerald-500", text: "text-emerald-700" },
  "in-progress": { icon: Loader2, dot: "bg-usdc-500", text: "text-usdc-700" },
  planned: { icon: Circle, dot: "bg-ink-300", text: "text-ink-500" },
} as const;

export default function RoadmapPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHero eyebrow="Progress" eyebrowDot="bg-emerald-400" title="Roadmap" subtitle="What&rsquo;s live, what&rsquo;s underway, and what&rsquo;s next." />

      <Reveal delay={0.08} className="mt-8 space-y-10">
        {PHASES.map((phase) => {
          const style = STYLES[phase.status];
          return (
            <div key={phase.label}>
              <h2 className={`mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider ${style.text}`}>
                <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                {phase.label}
              </h2>
              <ul className="space-y-3 border-l border-ink-100 pl-5">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-ink-700">
                    <style.icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${style.text}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </Reveal>

      <CtaBand title="Want to be part of what's next?" subtitle="Fund an issue, list a repo, or ship a merged PR today — on testnet, for free." />
    </main>
  );
}
