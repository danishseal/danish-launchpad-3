"use client";

import { useReadContracts } from "wagmi";
import type { Address } from "viem";
import { ROBINHOOD_CHAIN_ID } from "@/lib/fourthstreet/chain";
import { traitAbi } from "@/lib/fourthstreet/abis";
import { ZERO_ADDRESS } from "@/lib/fourthstreet/addresses";
import Link from "next/link";
import { shortAddress } from "@/lib/fourthstreet/format";
import { TRAITS } from "@/lib/fourthstreet/structures-catalog";
import type { LaunchRow } from "@/lib/fourthstreet/launches";

/**
 * The four structure slots, frozen at launch and never changeable.
 *
 * A slot is packed as `address | flags`, so the low 160 bits are the trait
 * contract. The family and name shown are the exact strings the contract's own
 * describe() returns; nothing is looked up in a table here, because a table can
 * drift from what is actually installed and the address cannot.
 */
export function StructureList({ launch }: { launch: LaunchRow }) {
  const addrs = launch.traits
    .slice(0, launch.traitCount)
    .map((slot) => `0x${(slot & ((1n << 160n) - 1n)).toString(16).padStart(40, "0")}` as Address)
    .filter((a) => a !== ZERO_ADDRESS);

  const q = useReadContracts({
    contracts: addrs.map((a) => ({
      address: a,
      abi: traitAbi,
      functionName: "describe" as const,
      chainId: ROBINHOOD_CHAIN_ID,
    })),
    query: { enabled: addrs.length > 0 },
  });

  if (launch.traitCount === 0) {
    return (
      <section className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-1)] p-5">
        <h2 className="text-sm font-medium text-zinc-200">Structures</h2>
        <p className="mt-2 text-xs text-zinc-500">
          None installed. This launch prices off the bare curve.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-1)] p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-zinc-200">Structures</h2>
        <span className="text-[11px] text-zinc-600">frozen at launch</span>
      </div>
      <ul className="mt-4 space-y-2">
        {addrs.map((a, i) => {
          const d = q.data?.[i]?.result as readonly [string, string] | undefined;
          return (
            <li
              key={a}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--hairline)] bg-[var(--surface-2)] px-3 py-2"
            >
              <div className="min-w-0">
                <div className="text-[13px] text-zinc-200">
                  {d ? d[1] : q.isLoading ? "reading describe()…" : "did not answer describe()"}
                </div>
                {/* The tagline is matched on the name the CONTRACT returned, so a
                    structure the directory does not know about shows its family
                    rather than borrowing someone else's description. */}
                <div className="text-[11px] text-zinc-600">
                  {(d && TRAITS.find((t) => t.name === d[1])?.tagline) ??
                    (d ? d[0] : shortAddress(a))}
                </div>
              </div>
              <span className="shrink-0 text-[11px] text-zinc-600">slot {i + 1}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11px] text-zinc-600">
        A structure can add fee and nothing else. It cannot refuse a trade: refuse was
        removed from the trait interface as a type, so nothing written later can
        reintroduce blocking. Sells always work.{" "}
        <Link href="/4thstreet/structures" className="text-[var(--ansem)] hover:underline">
          All seventeen, explained →
        </Link>
      </p>
    </section>
  );
}
