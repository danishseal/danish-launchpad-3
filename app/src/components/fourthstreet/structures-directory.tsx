"use client";

import { useState } from "react";
import {
  TRAITS,
  TRAIT_FAMILIES,
  MAX_TRAITS,
  type Trait,
  type TraitFamily,
} from "@/lib/fourthstreet/structures-catalog";

/**
 * What the seventeen structures are and why each one exists.
 *
 * Every blurb here is an argument about a real market mechanism, not marketing: the
 * borrow curve going hyperbolic on a special, the intraday U in the spread, an
 * ex-dividend gap. The point of the directory is that a launch can install four of
 * them and freeze them, so a reader should be able to tell what they would actually do
 * before choosing.
 */
export function StructuresDirectory() {
  const [family, setFamily] = useState<TraitFamily | "all">("all");
  const shown = family === "all" ? TRAITS : TRAITS.filter((t) => t.family === family);

  return (
    <div className="space-y-8 font-sans">
      <header>
        <span className="inline-block rounded-md border border-[var(--hairline-strong)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] text-[var(--ansem)]">
          {TRAITS.length} deployed on 4663
        </span>
        <h1 className="mt-4 font-display text-[36px] font-semibold leading-[1.05] tracking-tight text-white">
          Structures
        </h1>
        <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-zinc-400">
          A structure is a module the hook calls on every swap. It can add fee and
          nothing else: it cannot mint, cannot move anyone&apos;s balance, and cannot
          refuse a trade. Each one is an argument about how a real market actually
          behaves, priced into the swap rather than described in a footnote. A launch
          installs up to {MAX_TRAITS} and freezes them at launch, forever.
        </p>
        <p className="mt-3 max-w-3xl text-sm text-zinc-500">
          Refusal was removed from the trait interface as a type rather than left unused,
          so nothing written after the hook was frozen can reintroduce blocking. There is
          no cap, no maximum wallet and no pause anywhere in the system. Sells always
          work.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Chip active={family === "all"} onClick={() => setFamily("all")}>
          all {TRAITS.length}
        </Chip>
        {TRAIT_FAMILIES.map((f) => (
          <Chip key={f.id} active={family === f.id} onClick={() => setFamily(f.id)}>
            {f.label} {TRAITS.filter((t) => t.family === f.id).length}
          </Chip>
        ))}
      </div>

      {family !== "all" && (
        <p className="max-w-3xl text-sm text-zinc-500">
          {TRAIT_FAMILIES.find((f) => f.id === family)?.blurb}
        </p>
      )}

      <div className="space-y-3">
        {shown.map((t) => (
          <StructureCard key={t.slug} trait={t} />
        ))}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
        active
          ? "border-[var(--ansem)] bg-[color-mix(in_srgb,var(--ansem)_14%,transparent)] text-[var(--ansem)]"
          : "border-[var(--hairline)] bg-[var(--surface-1)] text-zinc-400 hover:border-[var(--hairline-strong)] hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

function StructureCard({ trait }: { trait: Trait }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="rounded-xl border border-[var(--hairline)] bg-[var(--surface-1)]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-4 p-5 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h2 className="text-[17px] font-semibold text-zinc-100">{trait.name}</h2>
            <span className="rounded-md bg-[var(--surface-3)] px-2 py-0.5 text-[11px] text-zinc-400">
              {trait.family}
            </span>
            <span className="text-[11px] text-zinc-600">
              charges {trait.side === "both" ? "both sides" : trait.side}
            </span>
            {trait.inertAfterGraduation && (
              <span className="text-[11px] text-zinc-600">quiet after graduation</span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-zinc-400">{trait.tagline}</p>
        </div>
        <span className="shrink-0 pt-1 text-xs text-zinc-600">{open ? "close" : "read"}</span>
      </button>

      {open && (
        <div className="space-y-5 border-t border-[var(--hairline)] p-5">
          <p className="max-w-3xl text-sm leading-relaxed text-zinc-300">{trait.blurb}</p>

          <div>
            <h3 className="text-xs uppercase tracking-wide text-zinc-500">
              What it actually does
            </h3>
            <ul className="mt-2 space-y-2">
              {trait.points.map((p, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-zinc-400">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--ansem)]" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {trait.params.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wide text-zinc-500">
                Parameters, packed into one bytes32
              </h3>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead className="text-zinc-600">
                    <tr>
                      <th className="py-1.5 pr-4 font-normal">name</th>
                      <th className="py-1.5 pr-4 font-normal">bits</th>
                      <th className="py-1.5 pr-4 font-normal">type</th>
                      <th className="py-1.5 pr-4 font-normal">range</th>
                      <th className="py-1.5 font-normal">meaning</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-400">
                    {trait.params.map((p) => (
                      <tr key={p.name} className="border-t border-[var(--hairline)]">
                        <td className="py-1.5 pr-4 text-zinc-200">{p.name}</td>
                        <td className="py-1.5 pr-4">{p.bits}</td>
                        <td className="py-1.5 pr-4">{p.type}</td>
                        <td className="py-1.5 pr-4">{p.range}</td>
                        <td className="py-1.5">{p.meaning ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {trait.worked && (
            <div>
              <h3 className="text-xs uppercase tracking-wide text-zinc-500">
                Worked settings
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
                {trait.worked}
              </p>
            </div>
          )}

          <p className="text-[11px] text-zinc-600">{trait.sourceFile}</p>
        </div>
      )}
    </article>
  );
}
