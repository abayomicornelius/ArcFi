import { Reveal } from "./Reveal";

/**
 * The homepage's hero treatment (radial glow, mono-uppercase eyebrow,
 * font-display heading, staggered reveal), scaled down to a header block any
 * inner page can drop in — so the landing page isn't the only place that
 * looks designed.
 */
export function PageHero({
  eyebrow,
  eyebrowDot = "bg-primary",
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  eyebrowDot?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="relative -mx-6 overflow-hidden px-6 pb-2">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[320px]"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% -20%, color-mix(in oklab, var(--color-primary) 14%, transparent), transparent)",
        }}
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Reveal>
            <p className="mb-1.5 flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span className={`h-1.5 w-1.5 rounded-full ${eyebrowDot}`} />
              {eyebrow}
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          </Reveal>
          {subtitle && (
            <Reveal delay={0.12}>
              <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
            </Reveal>
          )}
        </div>
        {action && (
          <Reveal delay={0.1} className="shrink-0">
            {action}
          </Reveal>
        )}
      </div>
    </section>
  );
}
