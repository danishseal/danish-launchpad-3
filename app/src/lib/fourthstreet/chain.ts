import { defineChain } from "viem";

/**
 * Robinhood Chain 4663, where 4thstreet lives.
 *
 * This is an EVM section inside a Solana repo, which is deliberate rather than an
 * accident of copying: 4thstreet's contracts are Uniswap v4 hooks on 4663 and cannot
 * move here. Nothing in this directory touches the Anchor stack and nothing in the
 * Anchor stack needs to know this exists.
 */
export const ROBINHOOD_CHAIN_ID = 4663;

/**
 * Reads go through this app's own /api/4thstreet/rpc rather than straight at the node.
 * Two reasons, both measured rather than assumed:
 *
 *   1. The public endpoint answers with `Access-Control-Allow-Origin: '*,*'`, which is
 *      not a legal header value, so the browser rejects the response and reads fail
 *      intermittently. That is upstream and not ours.
 *   2. A local forwarder sends no CORS headers at all, so a browser cannot read it
 *      either.
 */
export const RPC_PATH = "/api/4thstreet/rpc";

export const robinhoodChain = defineChain({
  id: ROBINHOOD_CHAIN_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_PATH] } },
});
