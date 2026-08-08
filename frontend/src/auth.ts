import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const isGithubConfigured = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  // @auth/prisma-adapter's types are tied to @prisma/client's default output
  // location; our client lives at a custom path (see prisma/schema.prisma)
  // to avoid colliding with apps/api's separate Postgres client in this pnpm
  // workspace — the underlying object is a real, functionally identical
  // PrismaClient, so this cast is purely about reconciling the two type
  // origins, not suppressing an actual mismatch.
  adapter: PrismaAdapter(prisma as unknown as Parameters<typeof PrismaAdapter>[0]),
  session: { strategy: "database" },
  // Explicit rather than relying on Auth.js's AUTH_GITHUB_ID/SECRET
  // auto-inference, so the required env var names are unambiguous.
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      // public_repo (beyond the default read:user/user:email) lets the repo
      // submission flow check the signed-in user's actual admin/maintain
      // permission on a repo via the GitHub API, instead of trusting
      // whatever owner/repo they type in.
      authorization: { params: { scope: "read:user user:email public_repo" } },
    }),
  ],
  pages: {
    signIn: "/onboarding",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.githubLogin = (user as { githubLogin?: string | null }).githubLogin ?? null;
        session.user.walletAddress = (user as { walletAddress?: string | null }).walletAddress ?? null;
        session.user.isSponsor = (user as { isSponsor?: boolean }).isSponsor ?? false;
        session.user.isMaintainer = (user as { isMaintainer?: boolean }).isMaintainer ?? false;
        session.user.isContributor = (user as { isContributor?: boolean }).isContributor ?? false;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, profile }) {
      // Auth.js's default User fields don't include the GitHub @login or a
      // stable avatar URL. Captured here (an event, not the signIn callback)
      // because events fire only after the adapter has actually created the
      // user row — the signIn callback runs beforehand, when a first-time
      // sign-in's user.id doesn't exist in the database yet.
      if (user.id && profile) {
        const githubProfile = profile as { login?: string; avatar_url?: string; created_at?: string };
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              githubLogin: githubProfile.login ?? undefined,
              githubAvatarUrl: githubProfile.avatar_url ?? undefined,
              githubJoinedAt: githubProfile.created_at ? new Date(githubProfile.created_at) : undefined,
            },
          });
        } catch (error) {
          // Never let this cosmetic metadata write take down sign-in itself —
          // an uncaught error here previously surfaced to the user as a full
          // AccessDenied on every GitHub sign-in attempt.
          console.error("[auth] failed to save GitHub profile metadata", error);
        }
      }
    },
  },
});
