import { createConfig, http, injected } from "wagmi";
import { arcTestnet, localAnvil, activeChain } from "./chains";

const chains = activeChain.id === arcTestnet.id ? ([arcTestnet, localAnvil] as const) : ([localAnvil, arcTestnet] as const);

export const wagmiConfig = createConfig({
  chains,
  connectors: [injected()],
  // Arc's public testnet RPC rate-limits aggressively; local Anvil doesn't
  // care either way, so a conservative shared interval keeps both happy.
  pollingInterval: 12_000,
  transports: {
    [arcTestnet.id]: http(undefined, { retryCount: 2, retryDelay: 2_000 }),
    [localAnvil.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
