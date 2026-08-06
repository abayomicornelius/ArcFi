"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { wagmiConfig } from "@/lib/wagmi";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster
            position="bottom-right"
            theme="light"
            toastOptions={{
              style: {
                background: "var(--color-paper-raised)",
                color: "var(--foreground)",
                border: "1px solid var(--color-ink-200)",
                fontSize: "0.8125rem",
              },
            }}
          />
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
