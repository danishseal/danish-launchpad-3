# danish-launchpad-3

Solana/Anchor launchpad. Frontend in `app/` (Next.js 16, bun), plus `programs/`,
`indexer/`, `relayer/`, `launcher/`, `blog/`, `docs/`.

## Who is working on what

Add your row before you write a file. Update it when you start, not when you finish.

| When (start) | Instance | Working on |
|---|---|---|
| 2026-09-09 | achi-43 [a4cd35] | Recolouring `app/` to black + phosphor green off the 4TH. logo. Colours only, no type, no layout. Dev server on 3020. |

## The palette

All black, with the phosphor green from the logo's CRT. `#00f090` was SAMPLED
from the artwork rather than picked: it is the most common glyph pixel in it, a
spring green with a slight cyan lean, which is what a P1 phosphor looks like.

    ground     #000000        raised    #0a0a0a      elevated  #101010
    controls   #171717        hairline  #1e1e1e      strong    #2c2c2c
    accent     #00f090        light     #6dffbf      mid       #00c477
    dim        #00693f

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
