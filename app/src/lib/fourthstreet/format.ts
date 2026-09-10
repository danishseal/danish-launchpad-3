/** Wad helpers that do not lose the fraction to Number() before dividing. */
export function wadToNumber(wad: bigint, decimals = 18): number {
  const scale = 10n ** BigInt(decimals);
  const whole = wad / scale;
  const frac = wad % scale;
  return Number(whole) + Number(frac) / Number(scale);
}

export function compact(n: number): string {
  if (!Number.isFinite(n)) return "n/a";
  const a = Math.abs(n);
  if (a >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  if (a >= 1) return n.toFixed(2);
  if (a === 0) return "0";
  return n.toPrecision(3);
}

export function ppm(v: number): string {
  return `${(v / 10_000).toFixed(2)}%`;
}

export function shortAddress(a: string, head = 6, tail = 4): string {
  return a.length <= head + tail + 2 ? a : `${a.slice(0, head)}…${a.slice(-tail)}`;
}

/**
 * Progress toward graduation, as the curve measures it: the underlying actually
 * taken in over the target. Never clamped above 1 without saying so, because a
 * pool at 100% has flipped and the caller should render that, not a full bar.
 */
export function bondProgress(uWad: bigint, targetWad: bigint): number {
  if (targetWad === 0n) return 0;
  return wadToNumber(uWad) / wadToNumber(targetWad);
}
