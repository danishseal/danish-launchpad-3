"use client";

import Link from "next/link";
import { useAllLaunches, modeLabel, MODE, type LaunchRow } from "@/lib/fourthstreet/launches";
import { bondProgress, compact, ppm, shortAddress, wadToNumber } from "@/lib/fourthstreet/format";

/**
 * The 4thstreet launchpad, on Robinhood Chain 4663.
 *
 * Every figure below is read from a contract: the launcher's own enumeration for
 * what exists, the hook's launch record for the curve position and the frozen
 * structures, the ERC-20s for names. There is no modelled number and no
 * placeholder anywhere on this page; a value that does not exist says so.
 */
export function FourthStreetHome() {
  const { current, retired, isLoading, error, stack } = useAllLaunches();

  const bonding = current.filter((r) => r.mode === MODE.CURVE);
  const graduated = current.filter((r) => r.mode === MODE.AMM);

  return (
    <div className="space-y-12 font-sans">
      <Hero live={current.length} retiredCount={retired.length} />

      {error && (
        <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-1)] p-6 text-sm text-zinc-400">
          {error}
        </div>
      )}

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-[24px] font-semibold tracking-tight text-white">
            On the curve
          </h2>
          <span className="text-xs text-zinc-500">
            {isLoading ? "reading the launcher…" : `${bonding.length} bonding`}
          </span>
        </div>
        {isLoading ? (
          <Skeletons />
        ) : bonding.length === 0 ? (
          <Empty>
            Nothing is bonding right now. Every live launch has reached its target and
            flipped to the AMM.
          </Empty>
        ) : (
          <Grid rows={bonding} />
        )}
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-[24px] font-semibold tracking-tight text-white">
            Graduated
          </h2>
          <span className="text-xs text-zinc-500">
            {isLoading ? "" : `${graduated.length} trading on the AMM`}
          </span>
        </div>
        {isLoading ? (
          <Skeletons />
        ) : graduated.length === 0 ? (
          <Empty>
            No launch on the current deployment has graduated yet. A launch flips the
            moment its curve takes in the target, in the same pool, at the same address.
          </Empty>
        ) : (
          <Grid rows={graduated} />
        )}
      </section>

      {retired.length > 0 && (
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-[24px] font-semibold tracking-tight text-white">
              Earlier deployments
            </h2>
            <span className="text-xs text-zinc-500">{retired.length} still tradeable</span>
          </div>
          <p className="mb-4 max-w-3xl text-sm text-zinc-500">
            These were launched by a launcher that has since been replaced. A Uniswap v4
            pool key contains the hook address, so each pool stays with the hook that
            opened it and the protocol cannot migrate them. They are kept off the main
            board on purpose and they trade exactly as they always did.
          </p>
          <Grid rows={retired} muted />
        </section>
      )}

      <section className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-1)] p-5 text-xs text-zinc-500">
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <span>chain 4663</span>
          {stack && <span>registry {shortAddress(stack.registry)}</span>}
          {stack && <span>hook {shortAddress(stack.hook)}</span>}
          {stack && <span>router {shortAddress(stack.router)}</span>}
        </div>
      </section>
    </div>
  );
}

function Hero({ live, retiredCount }: { live: number; retiredCount: number }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface-1)]">
      <div className="px-6 py-14 sm:px-10 sm:py-20">
        <span className="inline-block rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] text-[var(--ansem)]">
          Robinhood Chain 4663
        </span>
        <h1 className="mt-5 max-w-3xl font-display text-[40px] font-semibold leading-[1.05] tracking-tight text-white sm:text-[56px]">
          THE CURVE IS
          <br />
          <span className="text-[var(--ansem)]">THE POOL.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-zinc-400">
          Every launch is a Uniswap v4 hook that prices the token itself from the first
          block. There is no presale, no second contract and no migration: at the target
          the same hook mints real liquidity into the same pool and flips mode, so the
          token address, the poolId and the router path never change. The money leg is a
          real tokenized asset, never a stablecoin.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/4thstreet"
            className="rounded-lg bg-[var(--ansem)] px-5 py-2.5 text-sm font-medium text-black"
          >
            Browse launches →
          </Link>
          <span className="text-xs text-zinc-500">
            {live} live
            {retiredCount > 0 && ` · ${retiredCount} from earlier deployments`}
          </span>
        </div>
      </div>
    </section>
  );
}

function Grid({ rows, muted = false }: { rows: LaunchRow[]; muted?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((r) => (
        <Card key={r.poolId} row={r} muted={muted} />
      ))}
    </div>
  );
}

function Card({ row, muted }: { row: LaunchRow; muted: boolean }) {
  const p = bondProgress(row.uWad, row.targetWad);
  const graduated = row.mode === MODE.AMM;
  return (
    <Link
      href={`/4thstreet/${row.token}`}
      className={`group rounded-xl border border-[var(--hairline)] bg-[var(--surface-1)] p-4 transition-colors hover:border-[var(--hairline-strong)] hover:bg-[var(--surface-2)] ${
        muted ? "opacity-70 hover:opacity-100" : ""
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-zinc-100">
            {row.symbol ?? shortAddress(row.token)}
          </div>
          <div className="truncate text-xs text-zinc-500">{row.name ?? "unnamed"}</div>
        </div>
        <span
          className={`shrink-0 rounded-md px-2 py-1 text-[11px] ${
            graduated
              ? "bg-[color-mix(in_srgb,var(--ansem)_16%,transparent)] text-[var(--ansem)]"
              : "bg-[var(--surface-3)] text-zinc-400"
          }`}
        >
          {modeLabel(row.mode)}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-y-2 text-xs">
        <dt className="text-zinc-500">reserve</dt>
        <dd className="text-right text-zinc-300">{row.underlyingSymbol ?? "?"}</dd>
        <dt className="text-zinc-500">target</dt>
        <dd className="text-right text-zinc-300">
          {compact(wadToNumber(row.targetWad))} {row.underlyingSymbol ?? ""}
        </dd>
        <dt className="text-zinc-500">base fee</dt>
        <dd className="text-right text-zinc-300">{ppm(row.baseFeePpm)}</dd>
        <dt className="text-zinc-500">structures</dt>
        <dd className="text-right text-zinc-300">{row.traitCount} of 4</dd>
      </dl>

      {!graduated && (
        <div className="mt-4">
          <div className="h-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
            <div
              className={`h-full ${p >= 1 ? "bg-[var(--down)]" : "bg-[var(--ansem)]"}`}
              style={{ width: `${Math.min(100, Math.max(0, p * 100))}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-zinc-500">
            {/* Past target and still on the curve is a real state, not a rounding
                artifact: the curve kept taking in size and nothing flipped it.
                Graduation is permissionless, so this says what is true rather than
                showing a bar stuck at full. */}
            <span className={p >= 1 ? "text-[var(--down)]" : undefined}>
              {p >= 1
                ? `past target, not flipped${row.gradArmed ? ", armed" : ""}`
                : `${(p * 100).toFixed(1)}% bonded`}
            </span>
            <span>
              {compact(wadToNumber(row.uWad))} / {compact(wadToNumber(row.targetWad))}
            </span>
          </div>
        </div>
      )}
    </Link>
  );
}

function Skeletons() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-[196px] animate-pulse rounded-xl border border-[var(--hairline)] bg-[var(--surface-1)]"
        />
      ))}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-1)] p-6 text-sm text-zinc-400">
      {children}
    </div>
  );
}
