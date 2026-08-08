import { Coins, Flag, PiggyBank, CheckCircle2 } from "lucide-react";

/** Static mockup of the /app dashboard — proves the product exists without faking live data. */
export function AppPreview() {
  return (
    <div className="group relative">
      <div
        className="pointer-events-none absolute -inset-4 -z-10 rounded-2xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: "radial-gradient(circle, rgba(74,143,224,0.25), transparent 70%)" }}
      />
      <div className="absolute -top-3 -right-3 z-10 flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-emerald-600 shadow-[0_4px_12px_rgba(20,24,31,0.1)]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live product
      </div>
      <div className="overflow-hidden rounded-lg border border-ink-200 bg-paper-raised shadow-[0_20px_60px_-20px_rgba(20,24,31,0.25)] transition-transform duration-500 ease-out group-hover:-translate-y-1.5 group-hover:shadow-[0_28px_70px_-20px_rgba(20,24,31,0.35)]">
      <div className="flex items-center gap-1.5 border-b border-ink-100 bg-ink-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span className="ml-3 truncate rounded-md bg-white px-2.5 py-1 font-mono text-[11px] text-ink-400">arcfi.app/app</span>
      </div>

      <div className="grid gap-0 sm:grid-cols-[220px_1fr]">
        <div className="hidden border-r border-ink-100 bg-ink-50/50 p-4 sm:block">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 rounded-lg bg-ink-900 px-3 py-2.5 text-white">
              <Coins className="h-4 w-4 text-usdc-400" />
              <span className="text-xs font-semibold">Escrow</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-ink-400">
              <Flag className="h-4 w-4" />
              <span className="text-xs font-medium">Milestones</span>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-ink-400">
              <PiggyBank className="h-4 w-4" />
              <span className="text-xs font-medium">Maintenance Pool</span>
            </div>
          </div>
        </div>

        <div className="p-5">
          <p className="mb-3 text-xs font-semibold text-ink-900">Sponsor: fund a bounty</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-[10px] font-medium text-ink-500">Amount (USDC)</p>
              <div className="rounded-lg border border-ink-200 bg-white px-3 py-2 font-mono text-xs text-ink-700">2,500</div>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-medium text-ink-500">Deadline</p>
              <div className="rounded-lg border border-ink-200 bg-white px-3 py-2 font-mono text-xs text-ink-700">30 days</div>
            </div>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-usdc-500 px-4 py-2 text-xs font-semibold text-white">
            Approve &amp; Fund
          </div>

          <div className="mt-5 space-y-2 rounded-md bg-ink-50 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-500">Status</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Funded
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-500">Amount</span>
              <span className="font-mono text-ink-700">2,500.00 USDC</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-500">Deadline</span>
              <span className="font-mono text-ink-700">30 days from funding</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
