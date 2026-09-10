import type { Address } from "viem";

/**
 * THE REGISTRY is the single hardcoded pointer for 4thstreet. Every other address the
 * protocol deploys is resolved through it at call time, so a redeploy changes nothing
 * here. Do not add a hook, launcher or router address to this file; read the Registry.
 */
export const REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_FOURTHSTREET_REGISTRY ??
  "0x05229270471B6dbD132a26376b98FEe45CDD0C74") as Address;

/** The indexer's public base. Trade history and volume only; never used for truth. */
export const INDEXER_BASE = process.env.NEXT_PUBLIC_FOURTHSTREET_INDEXER ?? "";

/** ASCII, right-padded bytes32. Registry.sol does not hash its keys. */
export const REGISTRY_KEYS = {
  hook: "FOURTHSTREET_HOOK",
  launcher: "FOURTHSTREET_FACTORY",
  router: "FOURTHSTREET_ROUTER",
  stateView: "STATE_VIEW",
  usdg: "USDG",
} as const;

/**
 * How many retired hooks the Registry may vouch for under FOURTHSTREET_HOOK0..7.
 * Mirrors FourthStreetRouter.MAX_RETIRED. A v4 pool key contains the hook address, so a
 * pool belongs to whichever hook opened it, permanently: reading only the current key
 * makes every launch from an earlier deployment look like it does not exist.
 */
export const MAX_RETIRED_HOOKS = 8;

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export const USDG_DECIMALS = 6;
