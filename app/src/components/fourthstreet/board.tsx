"use client";

import Link from "next/link";
import { useBoard, modeLabel, MODE } from "@/lib/fourthstreet/launches";
import { bondProgress, compact, ppm, shortAddress, wadToNumber } from "@/lib/fourthstreet/format";

/**
 * The board reads the LAUNCHER's own enumeration, not the indexer. launchCount()
 * and launchAt(i) cannot disagree with themselves, and every figure in a row is
 * then read off the chain: the curve position and frozen structures from
 * hook.launchOf, the names and decimals from the ERC-20s. Nothing is modelled and
 * nothing is a placeholder; a value we do not have renders as the reason we do
 * not have it.
 */
export function FourthStreetBoard() {
  const { rows, count, isLoading, error, stack } = useBoard();

  if (error) {
    return (
      <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-1)] p-6 text-sm text-zinc-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">4thstreet</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            Launches on Robinhood Chain 4663, where the bonding curve is a Uniswap v4 hook
            rather than a contract that hands off to one. The pool is created at launch and
            never changes: token address, poolId and router path survive graduation.
          </p>
        </div>
        <div className="text-right text-xs text-zinc-500">
          <div>
            {isLoading ? "reading the launcher…" : `${count} launch${count === 1 ? "" : "es"}`}
          </div>
          {stack && (
            <div className="mt-1 font-normal">
              hook {shortAddress(stack.hook)}
              {stack.retiredHooks.length > 0 && (
                <span className="text-zinc-600"> · {stack.retiredHooks.length} retired</span>
              )}
            </div>
          )}
        </div>
      </header>

      {!isLoading && rows.length === 0 && (
        <div className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-1)] p-6 text-sm text-zinc-400">
          The current launcher reports {count} launches. Launches made by earlier
          deployments are not shown here on purpose; open one by address and it still
          resolves.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((r) => {
          const p = bondProgress(r.uWad, r.targetWad);
          const graduated = r.mode === MODE.AMM;
          return (
            <Link
              key={r.poolId}
              href={`/4thstreet/${r.token}`}
              className="group rounded-xl border border-[var(--hairline)] bg-[var(--surface-1)] p-4 transition-colors hover:border-[var(--hairline-strong)] hover:bg-[var(--surface-2)]"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold text-zinc-100">
                    {r.symbol ?? shortAddress(r.token)}
                  </div>
                  <div className="truncate text-xs text-zinc-500">{r.name ?? "unnamed"}</div>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2 py-1 text-[11px] ${
                    graduated
                      ? "bg-[color-mix(in_srgb,var(--ansem)_16%,transparent)] text-[var(--ansem)]"
                      : "bg-[var(--surface-3)] text-zinc-400"
                  }`}
                >
                  {modeLabel(r.mode)}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-y-2 text-xs">
                <dt className="text-zinc-500">reserve</dt>
                <dd className="text-right text-zinc-300">{r.underlyingSymbol ?? "?"}</dd>
                <dt className="text-zinc-500">target</dt>
                <dd className="text-right text-zinc-300">
                  {compact(wadToNumber(r.targetWad))} {r.underlyingSymbol ?? ""}
                </dd>
                <dt className="text-zinc-500">base fee</dt>
                <dd className="text-right text-zinc-300">{ppm(r.baseFeePpm)}</dd>
                <dt className="text-zinc-500">structures</dt>
                <dd className="text-right text-zinc-300">{r.traitCount} of 4</dd>
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
                    <span className={p >= 1 ? "text-[var(--down)]" : undefined}>
                      {p >= 1
                        ? `past target, not flipped${r.gradArmed ? ", armed" : ""}`
                        : `${(p * 100).toFixed(1)}% bonded`}
                    </span>
                    <span>
                      {compact(wadToNumber(r.uWad))} / {compact(wadToNumber(r.targetWad))}
                    </span>
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
