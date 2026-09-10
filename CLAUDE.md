# danish-launchpad-3

Solana/Anchor launchpad. Frontend in `app/` (Next.js 16, bun), plus `programs/`,
`indexer/`, `relayer/`, `launcher/`, `blog/`, `docs/`.

## Who is working on what

Add your row before you write a file. Update it when you start, not when you finish.

| When (start) | Instance | Working on |
|---|---|---|
| 2026-09-09 | achi-43 [a4cd35] | Recolouring `app/` to black + phosphor green off the 4TH. logo. Colours only, no type, no layout. Dev server on 3020. |
| 2026-09-09 | achi-2a [c94496] | Adding 4thstreet as its own section: NEW files under `app/src/app/(shell)/4thstreet/`, `app/src/lib/fourthstreet/`, `app/src/components/fourthstreet/`. EVM (wagmi/viem, chain 4663) alongside the Solana stack. Touching two shared files only, `app/package.json` and the providers, and using the phosphor tokens rather than any colour of my own. |

## The palette

All black, with the phosphor green from the logo's CRT. `#00f090` was SAMPLED
from the artwork rather than picked: it is the most common glyph pixel in it, a
spring green with a slight cyan lean, which is what a P1 phosphor looks like.

    ground     #000000        raised    #030806      elevated  #061109
    controls   #0b1b13        hairline  #123021      strong    #1d4a33
    accent     #00f090        light     #6dffbf      mid       #00c477
    dim        #00693f

Surfaces and hairlines are TINTED toward the phosphor, not neutral grey. That is
the difference between this and the app it started as: it was already dark with
a green accent, so neutralising the greys changed almost nothing on screen. The
tint is what makes the chrome read as a CRT rather than a grey dashboard.

Tokens live in `app/src/app/globals.css`. Prefer `--ansem`, `--surface-*` and
`--hairline*` over a literal; there were 640 literals before this pass and they
are the reason a recolour touches 70 files.

## Three colours are deliberately NOT green, do not "fix" them

1. **Stock brand colours** in `app/src/lib/floorlaunch/config.ts`: NVDA
   `#76b900`, TSLA `#e31937`, SPY `#4b8dff`. These identify a real underlying
   and are not ours to restyle.
2. **The violet in `app/src/components/analytics/charts.tsx`.** Launches vs
   graduations is a two-series categorical encoding, and the file's own comment
   records that emerald `#00c477` + violet `#6f4fd0` was chosen because it
   passes colour-vision-deficiency separation. Two greens would not. A single
   series (volume) does use the brand green, which is why it is green there.
3. **Chart indicator lines** in `components/trading/indicator-toolbar.tsx`.
   Several blues that exist to tell one indicator from another.
