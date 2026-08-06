import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      githubLogin: string | null;
      walletAddress: string | null;
      isSponsor: boolean;
      isMaintainer: boolean;
      isContributor: boolean;
    } & DefaultSession["user"];
  }
}
