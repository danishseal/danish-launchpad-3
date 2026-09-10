"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBlockNumber } from "wagmi";
import { ROBINHOOD_CHAIN_ID } from "@/lib/fourthstreet/chain";
import { useAllLaunches } from "@/lib/fourthstreet/launches";
import { TRAITS } from "@/lib/fourthstreet/structures-catalog";
import { FourthStreetConnect } from "@/components/fourthstreet/connect-button";

/**
 * The top chrome: a thin stats line and the main header.
 *
 * This used to be ansemchain's, reading a Cosmos block height off the ansem REST node
 * and totalling SOL-priced volume over the Solana token list. Every one of those
 * figures described a different chain from the one this launchpad runs on, so they are
 * gone rather than restyled. What is here now is read from 4663 or from the contracts
 * themselves, and a figure we do not have is absent rather than zero.
 *
 * The brand mark, the object-contain logo and the "4th" wordmark are left exactly as
 * they were set in eb6b01d.
 */
const NAV = [
  { href: "/4thstreet", label: "Launches" },
  { href: "/4thstreet/structures", label: "Structures" },
];

export function TopNav({ squareCorners = false }: { squareCorners?: boolean }) {
  const pathname = usePathname();
  const { current, retired, isLoading } = useAllLaunches();

  // watch:true so the height ticks rather than freezing at first paint.
  const { data: block } = useBlockNumber({ chainId: ROBINHOOD_CHAIN_ID, watch: true });

  const total = current.length + retired.length;

  return (
    <header
      className="sticky top-0 z-30 border-b border-[var(--hairline)] bg-[#000000]/90 backdrop-blur-md"
      style={squareCorners ? { borderRadius: 0 } : undefined}
    >
      {/* Stats line. Every value here comes from chain 4663 or from the launchers. */}
      <div className="border-b border-[var(--hairline)]">
        <div className="mx-auto flex h-8 w-full max-w-[1440px] items-center gap-6 overflow-x-auto px-4 text-[11px] text-zinc-500 sm:px-6">
          <span className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                block ? "animate-pulse bg-[var(--ansem)]" : "bg-zinc-700"
              }`}
            />
            <span className="text-zinc-300">4thstreet</span>
          </span>
          <span>
            CHAIN <span className="text-zinc-300">4663</span>
          </span>
          <span>
            BLOCK{" "}
            <span className="text-[var(--ansem)]">
              {block != null ? `#${block.toLocaleString()}` : "-"}
            </span>
          </span>
          <span>
            LAUNCHES{" "}
            <span className="text-zinc-300">{isLoading ? "-" : total}</span>
          </span>
          <span>
            STRUCTURES <span className="text-zinc-300">{TRAITS.length}</span>
          </span>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="4th" className="h-7 w-7 object-contain" />
          <span className="font-display text-[16px] font-semibold tracking-tight text-white">
            4th
          </span>
        </Link>

        <nav className="ml-3 hidden items-center gap-5 font-sans text-[13px] text-zinc-400 md:flex">
          {NAV.map((n) => {
            const active =
              n.href === "/4thstreet"
                ? pathname === "/4thstreet" || pathname.startsWith("/4thstreet/0x")
                : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`transition-colors hover:text-white ${
                  active ? "text-white" : ""
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <FourthStreetConnect />
        </div>
      </div>
    </header>
  );
}
