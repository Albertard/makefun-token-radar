[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/Albertard/makefun-token-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/Albertard/makefun-token-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

# Token Launch Radar

A dashboard that finds the protocols most likely to launch a token next —
and ranks them by what that launch would be worth — built for the make.fun
competition **"Build the best token launch radar"** (`token-radar-01`).

It reads a sealed DefiLlama snapshot (758 protocols, 14 Nov 2026), keeps
every protocol that records no token and is not a wrapped, staked, or
bridged product of one that trades, and ranks them by implied launch value.

## The model (`radar-2-comps`)

```
implied = categoryMultiple × TVL^0.85 × 1M^0.15 × growthMult × maturityMult
```

- **categoryMultiple** — median mcap/TVL of live-token protocols in the
  same category (small samples shrunk toward the global median, each live
  multiple winsorized at 1.5×, so one tiny-TVL outlier cannot set its
  category; a category with no live comps falls back to the global median
  0.246). The value follows the snapshot's own figures, not hardcoded names.
- **growthMult** — `clamp(1 + 0.6 × clamp(change_7d, −50, +100)/100, 0.7, 1.4)`
- **maturityMult** — `0.70 + 0.30 × (1 − exp(−age/365))`; unknown age → 0.85

Board: **198 rows** (all 40 watchlist protocols + every other rankable
pre-token protocol). Top 3 by implied value: Steakhouse Financial $432.1M,
Sentora $429.9M, Gauntlet $281.9M. Total implied value $2.87B.

## The dashboard

Dark terminal palette, header stats, and an open methodology panel with the
formula and the full comparables table. Search + category + chain filters,
watchlist toggle, sortable columns, and a click-a-row detail view (facts,
5-row model breakdown, 6-step farm plan with cost and time). A separate
live-token table shows market values for protocols that already have a
token — they are never ranked. Hash state (`#detail=…`, `#cat=…`,
`#chain=…`, `#q=…`, `#watch=1`) deep-links every view.

## Screenshots

1. `screenshots/1-board.jpg` — full board, rows 1–23
2. `screenshots/2-detail.jpg` — #1 Steakhouse Financial detail view
3. `screenshots/3-filtered.jpg` — Risk Curators filter, 34 of 198 rows

## How it runs

`main.ts` (Node 22 stdlib only, no network) reads `/input/snapshot.json`
and writes `/output/board.json` + `data.js`, copies `dashboard/` +
`screenshots/` to `/output`, and writes `/output/dossier.json` via
`vendor/makefun-board.ts`. Two runs are byte-identical.

## Referral

- referral_code: `t85p2qsg`
