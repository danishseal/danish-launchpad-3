/**
 * FourthStreetRouter, the four entry points this panel uses.
 *
 * Transcribed from contracts/src/FourthStreetRouter.sol. `buyWithEth` is payable and
 * takes its input from msg.value, so it has no amountIn field at all; `sellToEth`
 * delivers real ETH rather than WETH or a claim. The reserve leg is CALLER SUPPLIED,
 * which means the venue this panel picks is the venue the transaction uses, so the
 * panel shows the choice instead of hiding it inside the router.
 */
export const routerAbi = [
  {
    type: "function",
    name: "buyWithEth",
    stateMutability: "payable",
    inputs: [
      {
        name: "p",
        type: "tuple",
        components: [
          { name: "token", type: "address" },
          {
            name: "ethLeg",
            type: "tuple",
            components: [
              { name: "fee", type: "uint24" },
              { name: "tickSpacing", type: "int24" },
              { name: "hooks", type: "address" },
            ],
          },
          {
            name: "leg",
            type: "tuple",
            components: [
              { name: "venue", type: "uint8" },
              { name: "fee", type: "uint24" },
              { name: "tickSpacing", type: "int24" },
              { name: "hooks", type: "address" },
            ],
          },
          { name: "minUsdg", type: "uint256" },
          { name: "minUnderlying", type: "uint256" },
          { name: "minOut", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
        ],
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  {
    type: "function",
    name: "sellToEth",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "p",
        type: "tuple",
        components: [
          { name: "token", type: "address" },
          {
            name: "ethLeg",
            type: "tuple",
            components: [
              { name: "fee", type: "uint24" },
              { name: "tickSpacing", type: "int24" },
              { name: "hooks", type: "address" },
            ],
          },
          {
            name: "leg",
            type: "tuple",
            components: [
              { name: "venue", type: "uint8" },
              { name: "fee", type: "uint24" },
              { name: "tickSpacing", type: "int24" },
              { name: "hooks", type: "address" },
            ],
          },
          { name: "amountIn", type: "uint256" },
          { name: "minUnderlying", type: "uint256" },
          { name: "minUsdg", type: "uint256" },
          { name: "minOut", type: "uint256" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
        ],
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

export const erc20ApproveAbi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

/**
 * The legs proven on chain on 2026-09-09 by three real transactions, not guesses:
 * ETH/USDG over the v4 tier at fee 100 / spacing 1, and USDG to the reserve over
 * Uniswap V3 at fee 500. Venue.V3 is 1 in the router's enum.
 */
export const ETH_LEG = { fee: 100, tickSpacing: 1, hooks: "0x0000000000000000000000000000000000000000" } as const;
export const V3_RESERVE_LEG = {
  venue: 1,
  fee: 500,
  tickSpacing: 0,
  hooks: "0x0000000000000000000000000000000000000000",
} as const;
