import { createConfig, http, injected } from "wagmi";
import { arcTestnet, localAnvil, activeChain } from "./chains";

const chains = activeChain.id === arcTestnet.id ? ([arcTestnet, localAnvil] as const) : ([localAnvil, arcTestnet] as const);

export const wagmiConfig = createConfig({
  chains,
  connectors: [injected()],
  transports: {
    [arcTestnet.id]: http(),
    [localAnvil.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
