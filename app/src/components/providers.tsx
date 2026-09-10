"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/sonner";
import { SolanaWalletProvider } from "@/components/wallet/solana-wallet-provider";
import { WagmiProvider } from "wagmi";
import { fourthStreetWagmiConfig } from "@/lib/fourthstreet/wagmi";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
        retry: 2,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <SolanaWalletProvider>
      <QueryClientProvider client={queryClient}>
        {/* The EVM provider for the 4thstreet section, mounted INSIDE the existing
            tree so the Solana adapter, the toaster and the query client are all
            untouched. Pages that never call a wagmi hook pay nothing for it. */}
        <WagmiProvider config={fourthStreetWagmiConfig}>
          {children}
          <Toaster />
          <ReactQueryDevtools initialIsOpen={false} />
        </WagmiProvider>
      </QueryClientProvider>
    </SolanaWalletProvider>
  );
}
