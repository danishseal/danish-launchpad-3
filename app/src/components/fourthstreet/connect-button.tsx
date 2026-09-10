"use client";

import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { formatEther } from "viem";
import { ROBINHOOD_CHAIN_ID } from "@/lib/fourthstreet/chain";
import { shortAddress } from "@/lib/fourthstreet/format";

/**
 * The EVM wallet control for chain 4663.
 *
 * `injected()` only, deliberately: WalletConnect needs a project id and a relay round
 * trip and nothing here needs either. When no injected wallet exists the button says
 * so rather than opening a modal that cannot do anything.
 */
export function FourthStreetConnect() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const bal = useBalance({ address, chainId: ROBINHOOD_CHAIN_ID, query: { enabled: !!address } });

  const injected = connectors[0];

  if (!isConnected) {
    return (
      <button
        onClick={() => injected && connect({ connector: injected })}
        disabled={!injected || isPending}
        className="h-9 shrink-0 rounded-lg bg-[var(--ansem)] px-3.5 text-[13px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {!injected ? "No wallet" : isPending ? "Connecting…" : "Connect"}
      </button>
    );
  }

  const wrongChain = chainId !== ROBINHOOD_CHAIN_ID;

  return (
    <button
      onClick={() => disconnect()}
      title={wrongChain ? "Connected to another network" : "Disconnect"}
      className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface-1)] px-3 text-[13px] text-zinc-300 transition-colors hover:border-[var(--hairline-strong)]"
    >
      {wrongChain ? (
        <span className="text-[var(--down)]">wrong network</span>
      ) : (
        bal.data && (
          <span className="text-zinc-400">
            {Number(formatEther(bal.data.value)).toFixed(4)} ETH
          </span>
        )
      )}
      <span>{shortAddress(address!, 6, 4)}</span>
    </button>
  );
}
