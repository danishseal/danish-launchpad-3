"use client";

import { useState } from "react";
import { parseEther, formatEther } from "viem";
import {
  useAccount,
  useConnect,
  useBalance,
  useReadContract,
  useSimulateContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ROBINHOOD_CHAIN_ID } from "@/lib/fourthstreet/chain";
import { ZERO_ADDRESS } from "@/lib/fourthstreet/addresses";
import { erc20Abi } from "@/lib/fourthstreet/abis";
import {
  ETH_LEG,
  V3_RESERVE_LEG,
  erc20ApproveAbi,
  routerAbi,
} from "@/lib/fourthstreet/router-abi";
import { compact, shortAddress, wadToNumber } from "@/lib/fourthstreet/format";
import type { LaunchRow, Stack } from "@/lib/fourthstreet/launches";

type Side = "buy" | "sell";

/**
 * ETH in, ETH out, over the router's own three hops: ETH to USDG on v4, USDG to
 * the reserve asset on Uniswap V3, reserve to the launched token on the hook.
 *
 * NOTHING IS SENT UNSIMULATED. Every submit is first run as an eth_call from the
 * connected address, so a drifted signature or an unroutable size fails for free
 * and the reason is shown rather than swallowed. The route below is the one proven
 * on chain on 2026-09-09 by three real transactions.
 */
export function TradePanel({ launch, stack }: { launch: LaunchRow; stack: Stack | null }) {
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState("");
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: connecting } = useConnect();
  const { writeContract, data: hash, isPending: writing, error: writeError } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  const router = stack?.router;
  const routerLive = !!router && router !== ZERO_ADDRESS;

  const ethBal = useBalance({ address, chainId: ROBINHOOD_CHAIN_ID, query: { enabled: !!address } });
  const tokenBal = useReadContract({
    address: launch.token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: ROBINHOOD_CHAIN_ID,
    query: { enabled: !!address },
  });

  const allowance = useReadContract({
    address: launch.token,
    abi: erc20ApproveAbi,
    functionName: "allowance",
    args: address && router ? [address, router] : undefined,
    chainId: ROBINHOOD_CHAIN_ID,
    query: { enabled: !!address && routerLive && side === "sell" },
  });

  let parsed: bigint | null = null;
  let parseError: string | null = null;
  try {
    parsed = amount.trim() === "" ? null : parseEther(amount.trim());
    if (parsed !== null && parsed <= 0n) {
      parseError = "Size must be greater than zero.";
      parsed = null;
    }
  } catch {
    parseError = "That is not a number.";
  }

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
  const needsApproval =
    side === "sell" && parsed !== null && (allowance.data ?? 0n) < parsed;

  const buyArgs =
    parsed !== null && address
      ? ([
          {
            token: launch.token,
            ethLeg: ETH_LEG,
            leg: V3_RESERVE_LEG,
            minUsdg: 1n,
            minUnderlying: 1n,
            minOut: 1n,
            recipient: address,
            deadline,
          },
        ] as const)
      : undefined;

  const sellArgs =
    parsed !== null && address
      ? ([
          {
            token: launch.token,
            ethLeg: ETH_LEG,
            leg: V3_RESERVE_LEG,
            amountIn: parsed,
            minUnderlying: 1n,
            minUsdg: 1n,
            minOut: 1n,
            recipient: address,
            deadline,
          },
        ] as const)
      : undefined;

  // The simulation IS the quote. There is no second pricing path that could
  // disagree with what the transaction will actually do.
  const sim = useSimulateContract({
    address: router,
    abi: routerAbi,
    functionName: side === "buy" ? "buyWithEth" : "sellToEth",
    args: (side === "buy" ? buyArgs : sellArgs) as never,
    value: side === "buy" && parsed !== null ? parsed : undefined,
    chainId: ROBINHOOD_CHAIN_ID,
    query: { enabled: routerLive && !!address && parsed !== null && !needsApproval },
  });

  const expected = sim.data?.result as bigint | undefined;
  const outSymbol = side === "buy" ? launch.symbol ?? "token" : "ETH";
  const inSymbol = side === "buy" ? "ETH" : launch.symbol ?? "token";

  function submit() {
    if (!router || parsed === null || !address) return;
    if (needsApproval) {
      writeContract({
        address: launch.token,
        abi: erc20ApproveAbi,
        functionName: "approve",
        args: [router, parsed],
        chainId: ROBINHOOD_CHAIN_ID,
      });
      return;
    }
    if (!sim.data?.request) return;
    writeContract(sim.data.request);
  }

  return (
    <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-1)] p-4">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-[var(--surface-3)] p-1">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors ${
              side === s
                ? "bg-[var(--ansem)] text-black"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-xs text-zinc-500">
        {side === "buy" ? "You pay, in ETH" : `You sell, in ${inSymbol}`}
      </label>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="decimal"
        placeholder="0.0"
        className="mt-1 w-full rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)] px-3 py-2.5 text-lg text-zinc-100 outline-none focus:border-[var(--hairline-strong)]"
      />
      <div className="mt-1.5 text-[11px] text-zinc-600">
        {side === "buy"
          ? ethBal.data
            ? `balance ${Number(formatEther(ethBal.data.value)).toFixed(5)} ETH`
            : "balance unknown"
          : tokenBal.data !== undefined
            ? `balance ${compact(wadToNumber(tokenBal.data as bigint))} ${inSymbol}`
            : "balance unknown"}
      </div>

      <div className="mt-4 space-y-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)] p-3 text-xs">
        <Row label="route">
          {side === "buy"
            ? `ETH → USDG → ${launch.underlyingSymbol ?? "reserve"} → ${outSymbol}`
            : `${inSymbol} → ${launch.underlyingSymbol ?? "reserve"} → USDG → ETH`}
        </Row>
        <Row label="you receive">
          {parseError ? (
            <span className="text-[var(--down)]">{parseError}</span>
          ) : parsed === null ? (
            "enter a size"
          ) : sim.isLoading ? (
            "simulating…"
          ) : expected !== undefined ? (
            <span className="text-[var(--ansem)]">
              {compact(wadToNumber(expected))} {outSymbol}
            </span>
          ) : needsApproval ? (
            "approve first, then this quotes"
          ) : (
            "the simulation did not return a fill"
          )}
        </Row>
        <Row label="reserve venue">Uniswap V3, fee 0.05%</Row>
      </div>

      {sim.error && !needsApproval && (
        <p className="mt-3 rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)] p-3 text-[11px] text-[var(--down)]">
          {shortReason(sim.error.message)}
        </p>
      )}
      {writeError && (
        <p className="mt-3 rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)] p-3 text-[11px] text-[var(--down)]">
          {shortReason(writeError.message)}
        </p>
      )}

      {!routerLive ? (
        <p className="mt-4 text-xs text-zinc-500">
          The Registry answers address(0) for FOURTHSTREET_ROUTER, so there is nothing to
          trade through yet.
        </p>
      ) : !isConnected ? (
        <button
          onClick={() => connectors[0] && connect({ connector: connectors[0] })}
          disabled={connecting || !connectors[0]}
          className="mt-4 w-full rounded-lg bg-[var(--ansem)] px-4 py-2.5 text-sm font-medium text-black disabled:opacity-50"
        >
          {connectors[0] ? (connecting ? "connecting…" : "Connect an EVM wallet") : "No injected wallet"}
        </button>
      ) : (
        <button
          onClick={submit}
          disabled={parsed === null || writing || (!needsApproval && !sim.data?.request)}
          className="mt-4 w-full rounded-lg bg-[var(--ansem)] px-4 py-2.5 text-sm font-medium text-black disabled:opacity-40"
        >
          {writing
            ? "confirm in your wallet…"
            : needsApproval
              ? `Approve ${inSymbol}`
              : side === "buy"
                ? `Buy ${outSymbol}`
                : `Sell ${inSymbol}`}
        </button>
      )}

      {hash && (
        <p className="mt-3 text-[11px] text-zinc-500">
          {receipt.isLoading
            ? "waiting for the receipt…"
            : receipt.data?.status === "success"
              ? "confirmed"
              : receipt.data
                ? "the transaction reverted"
                : null}{" "}
          <span className="text-zinc-600">{shortAddress(hash, 10, 8)}</span>
        </p>
      )}

      <p className="mt-3 text-[11px] text-zinc-600">
        Minimums are set to 1 wei, so this does not protect you from price movement between
        the simulation and the fill. Slippage bounds are the next thing to land here.
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right text-zinc-300">{children}</span>
    </div>
  );
}

/** viem stacks the whole call in the message; the first line carries the reason. */
function shortReason(msg: string): string {
  const line = msg.split("\n").find((l) => l.trim().length > 0) ?? msg;
  return line.length > 200 ? `${line.slice(0, 200)}…` : line;
}
