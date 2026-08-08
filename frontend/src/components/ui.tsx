import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { TxState } from "@/lib/hooks";

/** Underline tab switcher for grouping several distinct actions under one card, instead of stacking them all. */
export function ActionTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="mb-5 flex gap-5 border-b border-ink-100">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative pb-3 text-sm font-medium transition-colors ${
            active === tab.id ? "text-ink-900" : "text-ink-400 hover:text-ink-600"
          }`}
        >
          {tab.label}
          {active === tab.id && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
        </button>
      ))}
    </div>
  );
}

export function Card({
  children,
  className = "",
  lift = true,
}: {
  children: React.ReactNode;
  className?: string;
  lift?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-sm ${lift ? "card-lift" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      // bg-card stays white in both themes (the "paper" card look), so its
      // text must use the ink scale (also theme-invariant) rather than
      // text-foreground — that one flips to near-white in dark mode and
      // becomes invisible on the still-white input background.
      className={`w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-ink-900 outline-none transition [color-scheme:light] placeholder:text-ink-400 focus:border-primary focus:ring-2 focus:ring-primary/15 ${props.className ?? ""}`}
    />
  );
}

export function Button({
  variant = "primary",
  className = "",
  loading = false,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger"; loading?: boolean }) {
  const styles = {
    primary:
      "bg-primary text-primary-foreground shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_8px_20px_-8px_hsl(var(--shadow-color)/0.5)] hover:brightness-110 active:brightness-95 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none btn-glow",
    secondary: "bg-foreground text-background hover:brightness-125 disabled:bg-muted disabled:text-muted-foreground",
    danger: "bg-card text-destructive border border-destructive/25 hover:bg-destructive/10 disabled:opacity-40",
  }[variant];

  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0 ${styles} ${className}`}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

export function TxStatus({ state, error, hash }: { state: TxState; error: string | null; hash: string | null }) {
  if (state === "idle") return null;

  const config: Record<Exclude<TxState, "idle">, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
    pending: { label: "Confirm in wallet…", className: "text-ink-500", icon: Loader2 },
    confirming: { label: "Waiting for confirmation…", className: "text-usdc-600", icon: Loader2 },
    success: { label: "Confirmed", className: "text-emerald-600", icon: CheckCircle2 },
    error: { label: error ?? "Transaction failed", className: "text-red-600", icon: XCircle },
  };

  const { label, className, icon: Icon } = config[state];
  const spinning = state === "pending" || state === "confirming";

  return (
    <p className={`mt-2.5 flex items-center gap-1.5 text-xs ${className}`}>
      <Icon className={`h-3.5 w-3.5 shrink-0 ${spinning ? "animate-spin" : ""}`} />
      <span>{label}</span>
      {hash && !spinning && <span className="font-mono text-ink-400">{hash.slice(0, 10)}…{hash.slice(-8)}</span>}
    </p>
  );
}

export type PillTone = "neutral" | "good" | "warn" | "sponsor" | "maintainer" | "contributor";

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: PillTone }) {
  const styles: Record<PillTone, string> = {
    neutral: "bg-ink-100 text-ink-600",
    good: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-700",
    sponsor: "bg-usdc-50 text-usdc-700",
    maintainer: "bg-gold-50 text-gold-700",
    contributor: "bg-emerald-50 text-emerald-700",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[tone]}`}>{children}</span>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`inline-block animate-pulse rounded bg-ink-100 ${className}`} />;
}

/** Label/value row with a rule underneath — a ledger line, not another bordered icon box. */
export function LedgerRow({
  label,
  value,
  icon: Icon,
  accent = "text-ink-400",
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100 py-3 last:border-b-0">
      <span className="flex items-center gap-2 text-sm text-ink-500">
        {Icon && <Icon className={`h-3.5 w-3.5 ${accent}`} />}
        {label}
      </span>
      <span className="font-mono text-sm font-semibold text-ink-900">{value}</span>
    </div>
  );
}
