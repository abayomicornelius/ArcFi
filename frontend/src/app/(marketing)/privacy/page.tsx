import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

export const metadata = { title: "Privacy Policy — ArcFi" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHero eyebrow="Legal" title="Privacy Policy" subtitle="Last updated August 2026" />

      <Reveal delay={0.08} className="mt-8 space-y-8 text-sm leading-relaxed text-ink-700">
        <section>
          <h2 className="mb-2 text-base font-semibold text-ink-900">What we collect</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Your GitHub public profile — username, avatar, and account creation date — when you sign in with GitHub.</li>
            <li>The wallet address you choose to link to your profile. We never see or request a private key.</li>
            <li>Anything you choose to add to your profile: a bio, social links, your role selections.</li>
            <li>Standard session data (a signed session cookie) needed to keep you signed in.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink-900">What we don&rsquo;t collect</h2>
          <p>
            We don&rsquo;t track you across other sites, sell data to third parties, or request access to your private
            GitHub repositories or email beyond what GitHub&rsquo;s OAuth flow itself discloses for authentication.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink-900">On-chain data</h2>
          <p>
            Any transaction you sign — funding an escrow, releasing a payout, depositing to a pool — is public on Arc&rsquo;s
            blockchain by nature. That&rsquo;s true of any blockchain interaction and isn&rsquo;t something ArcFi controls
            or can make private.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink-900">Repo verification</h2>
          <p>
            When you list a repository, we call the GitHub API using your OAuth token to confirm you have admin or
            maintain access, and to fetch the repo&rsquo;s public description, language, topics, and star count. We
            don&rsquo;t retain your GitHub access token beyond what&rsquo;s needed for this and future verification calls
            you initiate.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink-900">Deleting your data</h2>
          <p>
            You can unlink your wallet or remove a listed repository at any time from your profile. To request full
            account deletion, reach out via the contact details on our GitHub repository.
          </p>
        </section>
      </Reveal>
    </main>
  );
}
