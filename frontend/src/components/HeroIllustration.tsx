"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "./Logo";

const CONTRIBUTORS = [
  { initials: "AK", color: "#2775ca" },
  { initials: "MO", color: "#d98c0f" },
  { initials: "TS", color: "#15803d" },
  { initials: "RN", color: "#7c5ce0" },
];

const MILESTONES = [
  { name: "Docs rewrite", pct: 100, color: "#2775ca" },
  { name: "Perf audit", pct: 64, color: "#d98c0f" },
  { name: "API v2", pct: 30, color: "#15803d" },
];

/** Glass-panel product widget standing in for a screenshot — same composition as a treasury/dashboard hero card. */
export function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div aria-hidden className="absolute -inset-16 -z-10 rounded-full bg-primary/15 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="glass-panel grain-surface relative rounded-3xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <div>
              <p className="text-xs text-muted-foreground">acme-oss/widget · issue #1042</p>
              <p className="font-display text-2xl font-semibold">2,500.00 USDC</p>
            </div>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Funded</span>
        </div>

        <div className="mt-6 flex -space-x-2">
          {CONTRIBUTORS.map((c) => (
            <div
              key={c.initials}
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-card text-[11px] font-semibold text-white"
              style={{ backgroundColor: c.color }}
            >
              {c.initials}
            </div>
          ))}
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-secondary text-[11px] font-medium text-muted-foreground">
            +6
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {MILESTONES.map((m) => (
            <div key={m.name}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{m.name}</span>
                <span className="text-muted-foreground">{m.pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="animate-float glass-panel absolute -right-6 -top-8 hidden w-48 rounded-2xl p-4 shadow-xl sm:block"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Oracle verified
        </div>
        <p className="mt-1.5 font-display text-lg font-semibold">2,500 → Contributor</p>
        <p className="mt-1 text-xs text-muted-foreground">PR #482 merged · auto-released</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="animate-float glass-panel absolute -bottom-8 -left-6 hidden w-44 rounded-2xl p-4 shadow-xl [animation-delay:-2s] sm:block"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Pool topped up
        </div>
        <p className="mt-1.5 font-display text-lg font-semibold">+450 USDC</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-success">
          Maintenance pool <ArrowUpRight className="h-3 w-3" />
        </p>
      </motion.div>
    </div>
  );
}
