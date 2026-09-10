"use client";

import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { robinhoodChain, RPC_PATH } from "./chain";

/**
 * The EVM half of this app. It exists alongside the Solana wallet adapter rather
 * than replacing it: a viewer can hold a Phantom session for the Solana surfaces
 * and an injected EVM wallet for the 4thstreet ones at the same time, because the
 * two providers share nothing but the react-query client.
 *
 * `injected()` only, deliberately. WalletConnect wants a project id and a relay
 * round trip, and nothing here needs either yet.
 */
export const fourthStreetWagmiConfig = createConfig({
  chains: [robinhoodChain],
  connectors: [injected()],
  // batch.multicall makes viem coalesce reads issued in the same tick into one
  // aggregate3 call. wait is deliberately non-zero so a page that mounts several
  // hooks at once produces one request rather than one per hook.
  transports: {
    [robinhoodChain.id]: http(RPC_PATH, { batch: { wait: 16 } }),
  },
  batch: { multicall: { wait: 16, batchSize: 2048 } },
  ssr: true,
});
