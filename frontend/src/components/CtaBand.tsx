import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";

/** The homepage's closing dark gradient-mesh CTA band, reusable at the bottom of any page. */
export function CtaBand({
  title = "Ready to fund or get funded?",
  subtitle = "Connect a wallet in the app, or set up a GitHub-backed profile to appear in the directory.",
  primaryHref = "/app",
  primaryLabel = "Launch the app",
  secondaryHref = "/onboarding",
  secondaryLabel = "Create a profile",
}: {
  title?: string;
  subtitle?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <Reveal className="hero-mesh relative mt-16 overflow-hidden rounded-lg px-8 py-14 text-center">
      <div className="hero-grid absolute inset-0" />
      <div
        className="hero-orb pointer-events-none absolute -bottom-16 left-1/4 h-64 w-64 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(124,92,224,0.4), transparent 70%)" }}
      />
      <div className="relative">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/60">{subtitle}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={primaryHref}
            className="btn-glow inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-white/90"
          >
            {primaryLabel} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={secondaryHref}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
