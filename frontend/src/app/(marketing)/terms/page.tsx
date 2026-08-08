import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

export const metadata = { title: "Terms of Service — ArcFi" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHero eyebrow="Legal" title="Terms of Service" subtitle="Last updated August 2026" />

      <Reveal delay={0.08} className="mt-8 space-y-8 text-sm leading-relaxed text-ink-700">
        <section>
          <h2 className="mb-2 text-base font-semibold text-ink-900">1. What ArcFi is</h2>
          <p>
            ArcFi is a non-custodial interface to a set of open-source smart contracts deployed on Arc that hold USDC in
            escrow against GitHub issues, release it automatically when a linked pull request is detected as merged, and
            refund it back to the sponsor if a deadline passes unmet. ArcFi does not custody funds, hold private keys, or
            act as a party to any transaction between a sponsor and a contributor.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink-900">2. Testnet status</h2>
          <p>
            The contracts referenced by this site are currently deployed on Arc&rsquo;s public testnet. Testnet USDC has no
            real-world value. Nothing on this site should be treated as a guarantee that mainnet contracts will have
            identical behavior, addresses, or fee parameters.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink-900">3. Your responsibilities</h2>
          <p>
            You&rsquo;re responsible for the wallet you connect and any transaction you sign. ArcFi cannot reverse an
            on-chain transaction, recover a lost private key, or unilaterally override what a smart contract has already
            executed. If you list a repository, you&rsquo;re representing that you actually have admin or maintain access
            to it — this is checked against the GitHub API at the time of listing, but access can change afterward, and
            you&rsquo;re responsible for keeping the listing accurate.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink-900">4. No warranty</h2>
          <p>
            ArcFi is provided as-is, without warranty of any kind. Smart contracts, however carefully tested, can contain
            bugs. Do not deposit funds you cannot afford to lose.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink-900">5. Changes</h2>
          <p>These terms may be updated as the protocol evolves. Continued use of the site after a change constitutes acceptance of the update.</p>
        </section>
      </Reveal>
    </main>
  );
}
