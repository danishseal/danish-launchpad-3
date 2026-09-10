"use client";

import Link from "next/link";
import { TopNav } from "@/components/utoken/top-nav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col text-zinc-100">
      <TopNav />
      <main className="flex-1">
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-[var(--hairline)] bg-[#000000]">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-x-6 gap-y-3 px-4 py-7 text-[13px] text-zinc-500 sm:flex-row sm:flex-wrap sm:px-6">
        <span className="flex items-center gap-2 text-zinc-300">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-5 w-5 object-contain" />
          4thstreet
        </span>
        <Link href="/4thstreet" className="hover:text-white">Launches</Link>
        <Link href="/4thstreet/structures" className="hover:text-white">Structures</Link>
        <span className="text-zinc-600 sm:ml-auto">
          Robinhood Chain 4663 · the curve is the pool
        </span>
      </div>
    </footer>
  );
}
