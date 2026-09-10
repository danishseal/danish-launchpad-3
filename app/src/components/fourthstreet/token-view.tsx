"use client";

import Link from "next/link";
import { isAddress, type Address } from "viem";
import { useLaunch, modeLabel, MODE } from "@/lib/fourthstreet/launches";
import { bondProgress, compact, ppm, shortAddress, wadToNumber } from "@/lib/fourthstreet/format";
import { TradePanel } from "./trade-panel";
import { StructureList } from "./structures";

export function FourthStreetToken({ address }: { address: string }) {
  const valid = isAddress(address);
  const { launch, stack, lpFee, liquidity, isLoading, error } = useLaunch(
    valid ? (address as Address) : undefined,
  );

  if (!valid) {
    return <Shell>{address} is not an address.</Shell>;
  }
  if (error) return <Shell>{error}</Shell>;
  if (isLoading) return <Shell>Reading the launch record…</Shell>;
  if (!launch) {
    return (
      <Shell>
        No 4thstreet launch names {shortAddress(address, 10, 8)}. Every launcher the
        Registry vouches for was asked for a pool, and every hook it vouches for was asked
        for the record, {stack ? `${1 + stack.retiredLaunchers.length} and ${1 + stack.retiredHooks.length}` : "current and retired"} of them.
      </Shell>
    );
  }

  const graduated = launch.mode === MODE.AMM;
  const p = bondProgress(launch.uWad, launch.targetWad);
  const retired = stack ? launch.hook.toLowerCase() !== stack.hook.toLowerCase() : false;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_384px]">
      <div className="space-y-6">
        <header>
          <Link href="/4thstreet" className="text-xs text-zinc-500 hover:text-zinc-300">
            ← all launches
          </Link>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <h1 className="text-2xl font-semibold text-zinc-100">
              {launch.symbol ?? shortAddress(launch.token)}
            </h1>
            <span className="text-sm text-zinc-500">{launch.name}</span>
            <span
              className={`rounded-md px-2 py-1 text-[11px] ${
                graduated
                  ? "bg-[color-mix(in_srgb,var(--ansem)_16%,transparent)] text-[var(--ansem)]"
                  : "bg-[var(--surface-3)] text-zinc-400"
              }`}
            >
              {modeLabel(launch.mode)}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Paired against {launch.underlyingSymbol ?? shortAddress(launch.underlying)}. The
            reserve is the asset itself, never a stablecoin, so buying this token buys the
            underlying at the AMM level.
          </p>
        </header>

        {retired && (
          <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-1)] p-4 text-xs text-zinc-400">
            This launch belongs to a retired hook, {shortAddress(launch.hook, 10, 8)}. A v4
            pool key contains the hook address, so the pool stays with the hook that opened
            it and the protocol cannot migrate it. It trades normally.
          </div>
        )}

        {!graduated && (
          <section className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-1)] p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-medium text-zinc-200">Bonding</h2>
              <span className="text-xs text-zinc-500">{(p * 100).toFixed(2)}%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
              <div
                className="h-full bg-[var(--ansem)]"
                style={{ width: `${Math.min(100, Math.max(0, p * 100))}%` }}
              />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-y-2 text-xs sm:grid-cols-4">
              <Cell label="taken in">
                {compact(wadToNumber(launch.uWad))} {launch.underlyingSymbol}
              </Cell>
              <Cell label="target">
                {compact(wadToNumber(launch.targetWad))} {launch.underlyingSymbol}
              </Cell>
              <Cell label="curve float">{compact(wadToNumber(launch.tRes))}</Cell>
              <Cell label="supply">{compact(wadToNumber(launch.supply))}</Cell>
            </dl>
          </section>
        )}

        <section className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-1)] p-5">
          <h2 className="text-sm font-medium text-zinc-200">Pool</h2>
          <dl className="mt-4 grid grid-cols-2 gap-y-3 text-xs sm:grid-cols-4">
            <Cell label="advertised fee">
              {lpFee === null ? "no StateView" : ppm(lpFee)}
            </Cell>
            <Cell label="base fee">{ppm(launch.baseFeePpm)}</Cell>
            <Cell label="v4 liquidity, raw L">
              {liquidity === undefined
                ? "not read"
                : liquidity === 0n
                  ? "0, curve phase"
                  : liquidity.toString()}
            </Cell>
            <Cell label="structures">{launch.traitCount} of 4</Cell>
          </dl>
          <p className="mt-3 text-[11px] text-zinc-600">
            Liquidity is v4&apos;s own uint128 L, printed whole. It is not a token balance
            and not a dollar figure, and converting it to either needs the range and the
            current price, so it is left as the number the pool actually holds.{" "}
            The advertised fee is what a screener reads off slot0. It is not what you pay:
            the charged fee is the base plus whatever the installed structures add on the
            trade in question, and it moves with size.
          </p>
        </section>

        <StructureList launch={launch} />

        <section className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-1)] p-5 text-xs text-zinc-500">
          <div className="grid gap-2 sm:grid-cols-2">
            <Addr label="token" value={launch.token} />
            <Addr label="reserve" value={launch.underlying} />
            <Addr label="hook" value={launch.hook} />
            <Addr label="poolId" value={launch.poolId} />
          </div>
        </section>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <TradePanel launch={launch} stack={stack} />
      </div>
    </div>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-zinc-200">{children}</dd>
    </div>
  );
}

function Addr({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-zinc-600">{label}</span>
      <span className="text-zinc-400">{shortAddress(value, 10, 8)}</span>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-1)] p-6 text-sm text-zinc-400">
      {children}
    </div>
  );
}
