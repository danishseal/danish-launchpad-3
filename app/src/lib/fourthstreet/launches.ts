"use client";

import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { stringToHex, type Address } from "viem";
import { ROBINHOOD_CHAIN_ID } from "./chain";
import {
  MAX_RETIRED_HOOKS,
  REGISTRY_ADDRESS,
  REGISTRY_KEYS,
  ZERO_ADDRESS,
} from "./addresses";
import { erc20Abi, hookAbi, launcherAbi, registryAbi, stateViewAbi } from "./abis";

/** ASCII, right-padded to bytes32. Registry.sol does not hash its keys. */
export function registryKey(key: string): `0x${string}` {
  return stringToHex(key, { size: 32 });
}

export type Stack = {
  registry: Address;
  launcher: Address;
  hook: Address;
  router: Address;
  stateView: Address;
  /**
   * Hooks this protocol used to deploy, vouched by the Registry owner under
   * FOURTHSTREET_HOOK0..7. A v4 pool key contains the hook address, so a pool
   * belongs to whichever hook opened it for as long as it exists and a redeploy
   * migrates nothing. Reading only the current key made fourteen of fifteen
   * launches look like they did not exist, which presents as an empty state
   * rather than as an error.
   */
  retiredHooks: Address[];
  /**
   * Launchers this protocol used to deploy, vouched under FOURTHSTREET_FACTORY0..7.
   * The token to PoolId map lives on the launcher that minted the token, so a launch
   * from an earlier deployment cannot be found by asking the current one. Searching
   * hooks but not launchers finds nothing, because the search never gets a PoolId to
   * look up.
   */
  retiredLaunchers: Address[];
};

const base = {
  address: REGISTRY_ADDRESS,
  abi: registryAbi,
  functionName: "addrs" as const,
  chainId: ROBINHOOD_CHAIN_ID,
};

export function useStack(): { stack: Stack | null; isLoading: boolean; error: string | null } {
  const q = useReadContracts({
    contracts: [
      { ...base, args: [registryKey(REGISTRY_KEYS.launcher)] as const },
      { ...base, args: [registryKey(REGISTRY_KEYS.hook)] as const },
      { ...base, args: [registryKey(REGISTRY_KEYS.router)] as const },
      { ...base, args: [registryKey(REGISTRY_KEYS.stateView)] as const },
      ...Array.from({ length: MAX_RETIRED_HOOKS }, (_, i) => ({
        ...base,
        args: [registryKey(`FOURTHSTREET_HOOK${i}`)] as const,
      })),
      ...Array.from({ length: MAX_RETIRED_HOOKS }, (_, i) => ({
        ...base,
        args: [registryKey(`FOURTHSTREET_FACTORY${i}`)] as const,
      })),
    ],
  });

  return useMemo(() => {
    if (q.isLoading) return { stack: null, isLoading: true, error: null };
    const rows = q.data ?? [];
    const at = (i: number) => rows[i]?.result as Address | undefined;
    const launcher = at(0);
    const hook = at(1);
    if (!launcher || !hook || launcher === ZERO_ADDRESS || hook === ZERO_ADDRESS) {
      return {
        stack: null,
        isLoading: false,
        error:
          "The Registry answered address(0) for FOURTHSTREET_FACTORY or FOURTHSTREET_HOOK. That is an unset key, not an empty protocol.",
      };
    }
    const retiredHooks: Address[] = [];
    for (let i = 0; i < MAX_RETIRED_HOOKS; i++) {
      const a = at(4 + i);
      if (!a || a === ZERO_ADDRESS) break;
      retiredHooks.push(a);
    }
    const retiredLaunchers: Address[] = [];
    for (let i = 0; i < MAX_RETIRED_HOOKS; i++) {
      const a = at(4 + MAX_RETIRED_HOOKS + i);
      if (!a || a === ZERO_ADDRESS) break;
      retiredLaunchers.push(a);
    }
    return {
      stack: {
        registry: REGISTRY_ADDRESS,
        launcher,
        hook,
        router: (at(2) ?? ZERO_ADDRESS) as Address,
        stateView: (at(3) ?? ZERO_ADDRESS) as Address,
        retiredHooks,
        retiredLaunchers,
      },
      isLoading: false,
      error: null,
    };
  }, [q.data, q.isLoading]);
}

export type LaunchRow = {
  poolId: `0x${string}`;
  token: Address;
  underlying: Address;
  name?: string;
  symbol?: string;
  underlyingSymbol?: string;
  mode: number;
  uWad: bigint;
  tRes: bigint;
  supply: bigint;
  vWad: bigint;
  targetWad: bigint;
  baseFeePpm: number;
  traitCount: number;
  traits: readonly bigint[];
  gradArmed: boolean;
  launchedAt: number;
  /** Which hook actually holds this launch, current or retired. */
  hook: Address;
};

/** CURVE is 1 and AMM is 2 in the hook's Mode enum; 0 is NONE. */
export const MODE = { NONE: 0, CURVE: 1, AMM: 2, WINDDOWN: 3 } as const;

export function modeLabel(mode: number): string {
  if (mode === MODE.CURVE) return "bonding";
  if (mode === MODE.AMM) return "graduated";
  if (mode === MODE.WINDDOWN) return "winding down";
  return "unknown";
}

/**
 * Every launch the CURRENT launcher has made, in its own enumeration order.
 * Launches from retired launchers are deliberately absent: the board shows the
 * protocol as it stands, and legacy deployments do not belong on it. A token page
 * still resolves a retired launch, because a link to one has to keep working.
 */
export function useBoard() {
  const { stack, isLoading: stackLoading, error } = useStack();

  const count = useReadContract({
    address: stack?.launcher,
    abi: launcherAbi,
    functionName: "launchCount",
    chainId: ROBINHOOD_CHAIN_ID,
    query: { enabled: !!stack },
  });

  const n = count.data ? Number(count.data) : 0;

  const ids = useReadContracts({
    contracts: Array.from({ length: n }, (_, i) => ({
      address: stack!.launcher,
      abi: launcherAbi,
      functionName: "launchAt" as const,
      args: [BigInt(i)] as const,
      chainId: ROBINHOOD_CHAIN_ID,
    })),
    query: { enabled: !!stack && n > 0 },
  });

  const poolIds = useMemo(
    () =>
      (ids.data ?? [])
        .map((r) => r?.result as `0x${string}` | undefined)
        .filter((x): x is `0x${string}` => !!x),
    [ids.data],
  );

  const records = useReadContracts({
    contracts: poolIds.map((id) => ({
      address: stack!.hook,
      abi: hookAbi,
      functionName: "launchOf" as const,
      args: [id] as const,
      chainId: ROBINHOOD_CHAIN_ID,
    })),
    query: { enabled: !!stack && poolIds.length > 0 },
  });

  const partial = useMemo<LaunchRow[]>(() => {
    if (!stack) return [];
    const out: LaunchRow[] = [];
    (records.data ?? []).forEach((row, i) => {
      const d = row?.result as
        | [Record<string, unknown>, readonly bigint[], readonly `0x${string}`[]]
        | undefined;
      const L = d?.[0];
      const token = L?.token as Address | undefined;
      if (!L || !token || token === ZERO_ADDRESS) return;
      out.push({
        poolId: poolIds[i],
        token,
        underlying: L.underlying as Address,
        mode: Number(L.mode),
        uWad: L.uWad as bigint,
        tRes: L.tRes as bigint,
        supply: L.supply as bigint,
        vWad: L.vWad as bigint,
        targetWad: L.targetWad as bigint,
        baseFeePpm: Number(L.baseFeePpm),
        traitCount: Number(L.traitCount),
        traits: d?.[1] ?? [],
        gradArmed: Boolean(L.gradArmed),
        launchedAt: Number(L.launchedAt),
        hook: stack.hook,
      });
    });
    return out;
  }, [records.data, poolIds, stack]);

  // Names and symbols come from the ERC-20s themselves rather than from any list.
  const meta = useReadContracts({
    contracts: partial.flatMap((r) => [
      { address: r.token, abi: erc20Abi, functionName: "name" as const, chainId: ROBINHOOD_CHAIN_ID },
      { address: r.token, abi: erc20Abi, functionName: "symbol" as const, chainId: ROBINHOOD_CHAIN_ID },
      {
        address: r.underlying,
        abi: erc20Abi,
        functionName: "symbol" as const,
        chainId: ROBINHOOD_CHAIN_ID,
      },
    ]),
    query: { enabled: partial.length > 0 },
  });

  const rows = useMemo<LaunchRow[]>(() => {
    const m = meta.data ?? [];
    return partial.map((r, i) => ({
      ...r,
      name: m[i * 3]?.result as string | undefined,
      symbol: m[i * 3 + 1]?.result as string | undefined,
      underlyingSymbol: m[i * 3 + 2]?.result as string | undefined,
    }));
  }, [partial, meta.data]);

  return {
    stack,
    rows,
    count: n,
    error,
    isLoading: stackLoading || count.isLoading || ids.isLoading || records.isLoading,
  };
}

/**
 * One launch by token address, searching the current hook and then every retired
 * one. The launcher search mirrors it, so a link to a launch from an earlier
 * deployment keeps working instead of rendering "not a 4thstreet launch".
 */
export function useLaunch(token: Address | undefined) {
  const { stack, error } = useStack();
  const enabled = !!stack && !!token;

  // Ask the current launcher AND every retired one. The token to PoolId map lives on
  // whichever launcher minted the token, so asking only the current one answers zero
  // for every launch made before the last redeploy.
  const launchers = useMemo<Address[]>(
    () => (stack ? [stack.launcher, ...stack.retiredLaunchers] : []),
    [stack],
  );

  const id = useReadContracts({
    contracts: launchers.map((l) => ({
      address: l,
      abi: launcherAbi,
      functionName: "launchOfToken" as const,
      args: [token!] as const,
      chainId: ROBINHOOD_CHAIN_ID,
    })),
    query: { enabled: enabled && launchers.length > 0 },
  });

  const EMPTY_ID = `0x${"0".repeat(64)}`;
  const poolId = (id.data ?? [])
    .map((r) => r?.result as `0x${string}` | undefined)
    .find((x) => !!x && x !== EMPTY_ID);
  const hooks = useMemo<Address[]>(
    () => (stack ? [stack.hook, ...stack.retiredHooks] : []),
    [stack],
  );

  const reads = useReadContracts({
    contracts:
      poolId
        ? hooks.map((h) => ({
            address: h,
            abi: hookAbi,
            functionName: "launchOf" as const,
            args: [poolId] as const,
            chainId: ROBINHOOD_CHAIN_ID,
          }))
        : [],
    query: { enabled: !!poolId && hooks.length > 0 },
  });

  // The first hook whose record names a token owns this pool. A hook that has
  // never heard of the pool answers with an all zero struct rather than reverting.
  const hit = (reads.data ?? []).findIndex((row) => {
    const d = row?.result as [Record<string, unknown>, readonly bigint[]] | undefined;
    const t = d?.[0]?.token as Address | undefined;
    return !!t && t !== ZERO_ADDRESS;
  });

  const launch = useMemo<LaunchRow | null>(() => {
    if (hit < 0 || !poolId || !stack) return null;
    const d = (reads.data ?? [])[hit]?.result as
      | [Record<string, unknown>, readonly bigint[]]
      | undefined;
    const L = d?.[0];
    if (!L) return null;
    return {
      poolId,
      token: L.token as Address,
      underlying: L.underlying as Address,
      mode: Number(L.mode),
      uWad: L.uWad as bigint,
      tRes: L.tRes as bigint,
      supply: L.supply as bigint,
      vWad: L.vWad as bigint,
      targetWad: L.targetWad as bigint,
      baseFeePpm: Number(L.baseFeePpm),
      traitCount: Number(L.traitCount),
      traits: d?.[1] ?? [],
      gradArmed: Boolean(L.gradArmed),
      launchedAt: Number(L.launchedAt),
      hook: hooks[hit],
    };
  }, [hit, reads.data, poolId, stack, hooks]);

  const meta = useReadContracts({
    contracts: launch
      ? [
          { address: launch.token, abi: erc20Abi, functionName: "name" as const, chainId: ROBINHOOD_CHAIN_ID },
          { address: launch.token, abi: erc20Abi, functionName: "symbol" as const, chainId: ROBINHOOD_CHAIN_ID },
          { address: launch.underlying, abi: erc20Abi, functionName: "symbol" as const, chainId: ROBINHOOD_CHAIN_ID },
        ]
      : [],
    query: { enabled: !!launch },
  });

  const pool = useReadContracts({
    contracts:
      launch && stack && stack.stateView !== ZERO_ADDRESS
        ? [
            { address: stack.stateView, abi: stateViewAbi, functionName: "getSlot0" as const, args: [launch.poolId] as const, chainId: ROBINHOOD_CHAIN_ID },
            { address: stack.stateView, abi: stateViewAbi, functionName: "getLiquidity" as const, args: [launch.poolId] as const, chainId: ROBINHOOD_CHAIN_ID },
          ]
        : [],
    query: { enabled: !!launch && !!stack },
  });

  const m = meta.data ?? [];
  const slot0 = pool.data?.[0]?.result as
    | readonly [bigint, number, number, number]
    | undefined;

  return {
    stack,
    error,
    isLoading: id.isLoading || reads.isLoading,
    launch: launch
      ? {
          ...launch,
          name: m[0]?.result as string | undefined,
          symbol: m[1]?.result as string | undefined,
          underlyingSymbol: m[2]?.result as string | undefined,
        }
      : null,
    /** What a screener reads off the pool. lpFee is the advertised fee, not what you pay. */
    lpFee: slot0 ? Number(slot0[3]) : null,
    liquidity: pool.data?.[1]?.result as bigint | undefined,
  };
}

/**
 * Every launch the protocol has ever made, across the current launcher AND the
 * retired ones, each row carrying the hook that actually holds it.
 *
 * WHY THIS IS SEPARATE FROM useBoard. The board shows the protocol as it stands
 * and legacy deployments do not belong on it. But those launches are still live
 * and still tradeable, so an archive that says so is honest where hiding them
 * entirely is not. Callers must keep the two apart rather than concatenating them.
 */
export function useAllLaunches() {
  const { stack, isLoading: stackLoading, error } = useStack();

  const launchers = useMemo<Address[]>(
    () => (stack ? [stack.launcher, ...stack.retiredLaunchers] : []),
    [stack],
  );

  const counts = useReadContracts({
    contracts: launchers.map((l) => ({
      address: l,
      abi: launcherAbi,
      functionName: "launchCount" as const,
      chainId: ROBINHOOD_CHAIN_ID,
    })),
    query: { enabled: launchers.length > 0 },
  });

  // One (launcher, index) pair per launch, flattened so a single multicall covers
  // every deployment rather than one round trip each.
  const slots = useMemo(() => {
    const out: { launcher: Address; i: number; current: boolean }[] = [];
    (counts.data ?? []).forEach((row, li) => {
      const n = Number((row?.result as bigint | undefined) ?? 0n);
      for (let i = 0; i < n; i++) out.push({ launcher: launchers[li], i, current: li === 0 });
    });
    return out;
  }, [counts.data, launchers]);

  const ids = useReadContracts({
    contracts: slots.map((s) => ({
      address: s.launcher,
      abi: launcherAbi,
      functionName: "launchAt" as const,
      args: [BigInt(s.i)] as const,
      chainId: ROBINHOOD_CHAIN_ID,
    })),
    query: { enabled: slots.length > 0 },
  });

  const hooks = useMemo<Address[]>(
    () => (stack ? [stack.hook, ...stack.retiredHooks] : []),
    [stack],
  );

  // Every (poolId, hook) pair. The pool belongs to whichever hook answers with a
  // record naming a token, which is why this cannot just ask the current hook.
  const pairs = useMemo(() => {
    const out: { poolId: `0x${string}`; hook: Address; current: boolean }[] = [];
    (ids.data ?? []).forEach((row, i) => {
      const id = row?.result as `0x${string}` | undefined;
      if (!id) return;
      for (const h of hooks) out.push({ poolId: id, hook: h, current: slots[i]?.current ?? false });
    });
    return out;
  }, [ids.data, hooks, slots]);

  const records = useReadContracts({
    contracts: pairs.map((p) => ({
      address: p.hook,
      abi: hookAbi,
      functionName: "launchOf" as const,
      args: [p.poolId] as const,
      chainId: ROBINHOOD_CHAIN_ID,
    })),
    query: { enabled: pairs.length > 0 },
  });

  const partial = useMemo<LaunchRow[]>(() => {
    const seen = new Set<string>();
    const out: LaunchRow[] = [];
    (records.data ?? []).forEach((row, i) => {
      const d = row?.result as [Record<string, unknown>, readonly bigint[]] | undefined;
      const L = d?.[0];
      const token = L?.token as Address | undefined;
      if (!L || !token || token === ZERO_ADDRESS) return;
      const p = pairs[i];
      if (seen.has(p.poolId)) return;
      seen.add(p.poolId);
      out.push({
        poolId: p.poolId,
        token,
        underlying: L.underlying as Address,
        mode: Number(L.mode),
        uWad: L.uWad as bigint,
        tRes: L.tRes as bigint,
        supply: L.supply as bigint,
        vWad: L.vWad as bigint,
        targetWad: L.targetWad as bigint,
        baseFeePpm: Number(L.baseFeePpm),
        traitCount: Number(L.traitCount),
        traits: d?.[1] ?? [],
        gradArmed: Boolean(L.gradArmed),
        launchedAt: Number(L.launchedAt),
        hook: p.hook,
      });
    });
    return out;
  }, [records.data, pairs]);

  const meta = useReadContracts({
    contracts: partial.flatMap((r) => [
      { address: r.token, abi: erc20Abi, functionName: "name" as const, chainId: ROBINHOOD_CHAIN_ID },
      { address: r.token, abi: erc20Abi, functionName: "symbol" as const, chainId: ROBINHOOD_CHAIN_ID },
      { address: r.underlying, abi: erc20Abi, functionName: "symbol" as const, chainId: ROBINHOOD_CHAIN_ID },
    ]),
    query: { enabled: partial.length > 0 },
  });

  const all = useMemo<LaunchRow[]>(() => {
    const m = meta.data ?? [];
    return partial.map((r, i) => ({
      ...r,
      name: m[i * 3]?.result as string | undefined,
      symbol: m[i * 3 + 1]?.result as string | undefined,
      underlyingSymbol: m[i * 3 + 2]?.result as string | undefined,
    }));
  }, [partial, meta.data]);

  const currentIds = useMemo(() => {
    const s = new Set<string>();
    (ids.data ?? []).forEach((row, i) => {
      const id = row?.result as `0x${string}` | undefined;
      if (id && slots[i]?.current) s.add(id);
    });
    return s;
  }, [ids.data, slots]);

  return {
    stack,
    error,
    isLoading: stackLoading || counts.isLoading || ids.isLoading || records.isLoading,
    /** Launches made by the launcher the Registry points at today. */
    current: all.filter((r) => currentIds.has(r.poolId)),
    /** Still live, still tradeable, made by a deployment that has been replaced. */
    retired: all.filter((r) => !currentIds.has(r.poolId)),
  };
}
