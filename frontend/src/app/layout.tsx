import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme-provider";
import { GithubConfigProvider } from "@/lib/github-config-context";
import { isGithubConfigured } from "@/auth";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
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
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>
          <GithubConfigProvider configured={isGithubConfigured}>
            <Providers>{children}</Providers>
          </GithubConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
