import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [GitHub],
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
    async signIn({ user, profile }) {
      // Auth.js's default User fields don't include the GitHub @login or a
      // stable avatar URL — capture them here once the adapter has
      // created/found the row, so profile pages can link to github.com/<login>.
      if (user.id && profile) {
        const githubProfile = profile as { login?: string; avatar_url?: string };
        await prisma.user.update({
          where: { id: user.id },
          data: {
            githubLogin: githubProfile.login ?? undefined,
            githubAvatarUrl: githubProfile.avatar_url ?? undefined,
          },
        });
      }
      return true;
    },
  },
});
