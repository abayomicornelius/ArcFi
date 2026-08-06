import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { TxState } from "@/lib/hooks";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-ink-200 bg-paper-raised p-6 shadow-[0_1px_2px_rgba(20,24,31,0.04)] ${className}`}>
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
  hint?: string;
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
      className={`w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-usdc-500 focus:ring-2 focus:ring-usdc-100 ${props.className ?? ""}`}
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
    primary: "bg-usdc-500 text-white hover:bg-usdc-600 disabled:bg-ink-200 disabled:text-ink-400",
    secondary: "bg-ink-900 text-white hover:bg-ink-700 disabled:bg-ink-200 disabled:text-ink-400",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-40",
  }[variant];

  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed ${styles} ${className}`}
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

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" }) {
  const styles = {
    neutral: "bg-ink-100 text-ink-600",
    good: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-700",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>{children}</span>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`inline-block animate-pulse rounded bg-ink-100 ${className}`} />;
}
