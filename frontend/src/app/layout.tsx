import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "./providers";
import { GithubConfigProvider } from "@/lib/github-config-context";
import { isGithubConfigured } from "@/auth";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "ArcFi — Programmable USDC payouts for open source",
  description: "Escrow, milestone and maintenance-pool payouts in USDC on Arc, released the moment a GitHub PR merges.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <GithubConfigProvider configured={isGithubConfigured}>
          <Providers>{children}</Providers>
        </GithubConfigProvider>
      </body>
    </html>
  );
}
