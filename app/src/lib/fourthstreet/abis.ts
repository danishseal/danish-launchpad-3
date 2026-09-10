/**
 * Only the fragments this section actually calls, transcribed from the deployed
 * contracts in ~/4thstreet/contracts/src. Nothing here is speculative.
 */
export const registryAbi = [
  {
    type: "function",
    name: "addrs",
    stateMutability: "view",
    inputs: [{ name: "key", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

export const launcherAbi = [
  {
    type: "function",
    name: "launchCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "launchAt",
    stateMutability: "view",
    inputs: [{ name: "i", type: "uint256" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "launchOfToken",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
] as const;

/** The hook's Launch record, field for field as IFourthStreetHook declares it. */
const launchTuple = {
  name: "launch",
  type: "tuple",
  components: [
    { name: "underlying", type: "address" },
    { name: "uDec", type: "uint8" },
    { name: "mode", type: "uint8" },
    { name: "traitCount", type: "uint8" },
    { name: "gradArmed", type: "bool" },
    { name: "degraded", type: "bool" },
    { name: "token", type: "address" },
    { name: "tickLower", type: "int24" },
    { name: "tickUpper", type: "int24" },
    { name: "uWad", type: "uint128" },
    { name: "tRes", type: "uint128" },
    { name: "supply", type: "uint128" },
    { name: "vWad", type: "uint128" },
    { name: "targetWad", type: "uint128" },
    { name: "feeWad", type: "uint128" },
    { name: "claimedU", type: "uint128" },
    { name: "claimedT", type: "uint128" },
    { name: "baseFeePpm", type: "uint24" },
    { name: "maxFeePpm", type: "uint24" },
    { name: "launchedAt", type: "uint32" },
    { name: "feeSink", type: "address" },
  ],
} as const;

export const hookAbi = [
  {
    type: "function",
    name: "launchOf",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [
      launchTuple,
      { name: "traits", type: "uint256[4]" },
      { name: "traitState", type: "bytes32[4]" },
    ],
  },
  {
    type: "function",
    name: "quote",
    stateMutability: "view",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "buying", type: "bool" },
      { name: "exactInput", type: "bool" },
      { name: "specified", type: "uint256" },
      { name: "router", type: "address" },
    ],
    outputs: [
      { name: "amountIn", type: "uint256" },
      { name: "amountOut", type: "uint256" },
      { name: "feePpm", type: "uint24" },
    ],
  },
  {
    type: "function",
    name: "quoteStructures",
    stateMutability: "view",
    inputs: [
      { name: "id", type: "bytes32" },
      { name: "buying", type: "bool" },
      { name: "exactInput", type: "bool" },
      { name: "specified", type: "uint256" },
      { name: "router", type: "address" },
    ],
    outputs: [
      { name: "baseFeePpm", type: "uint24" },
      { name: "perSlotPpm", type: "uint24[4]" },
      { name: "totalPpm", type: "uint24" },
    ],
  },
] as const;

export const traitAbi = [
  {
    type: "function",
    name: "describe",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "family", type: "string" },
      { name: "name", type: "string" },
    ],
  },
] as const;

export const erc20Abi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

export const stateViewAbi = [
  {
    type: "function",
    name: "getSlot0",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "protocolFee", type: "uint24" },
      { name: "lpFee", type: "uint24" },
    ],
  },
  {
    type: "function",
    name: "getLiquidity",
    stateMutability: "view",
    inputs: [{ name: "id", type: "bytes32" }],
    outputs: [{ name: "liquidity", type: "uint128" }],
  },
] as const;
