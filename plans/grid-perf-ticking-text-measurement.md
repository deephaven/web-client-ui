# Grid perf: text measurement optimizations on a ticking table

A before/after benchmark of two grid text measurement commits against the
ticking data mode of the standalone grid perf app (`tests/grid-perf/app`,
`?tick=`). The question was whether optimizations aimed at scrolling static
data also help a table where every cell changes on every tick.

**Result:** yes. Grid script time drops 25–35% in every ticking scenario, and
the heaviest one (4K, 200 ticking columns) goes from ~19 to ~30 FPS.

## Commits under test

Cherry-picked onto `grid-performance2` on top of `d36c93a4f9` ("test: Add
ticking data mode to grid perf app"):

| On this branch | Original     | Change                                                                                                                                                                                                                                 |
| -------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `9721f0b6ae`   | `13f1ea8ca8` | `perf(grid): cache measured text widths when auto-sizing columns`. Font-keyed whole-string width cache in `GridMetricCalculator.calculateTextWidth`, no redundant next-char measurement, `context.font` only assigned on a cache miss. |
| `e07c9671ae`   | `d5ca6f8aff` | `perf(grid): skip text measurement for cells with no tokens`. `TextCellRenderer.drawCellContent` does a single `fillText` when a cell has no link tokens, skipping three `measureText` calls.                                          |

- **Before:** `HEAD~2` versions of `GridMetricCalculator.ts` and `TextCellRenderer.ts`.
- **After:** `HEAD`.

## Method

- Two production builds of the perf app (`vite build`): before served on
  `:4021` and after served on `:4022` (`vite preview`).
- Headless Chromium through Playwright, one fresh browser context per
  scenario, 1.5s warmup, then a 5s measurement window.
- Each scenario was run 3 times, alternating before and after, and the
  report uses the median.
- Metrics:
  - **FPS, p95 frame, and dropped frames (>33ms):** from a
    `requestAnimationFrame` loop.
  - **Script ms/s:** CDP `Performance.getMetrics` `ScriptDuration` per wall
    second.
  - **Per-function ms/s:** inclusive time from a CDP `Profiler` CPU profile
    sampled every 100µs.
- Scroll scenarios use 4 passes of 30 vertical wheel steps (±100/80px)
  and 10 horizontal steps, with 16ms between steps.

> **Pitfall:** the first attempt swapped the source files under the
> `npm run dev` server on `:4020` with `git checkout HEAD~2 -- …`. Vite's
> watcher missed the cherry-pick of `GridMetricCalculator.ts`, so both "sides"
> ran the old `calculateTextWidth` and showed no difference. Use separate
> production builds, or confirm the served module, e.g.
> `curl localhost:4020/@fs/<repo>/packages/grid/src/GridMetricCalculator.ts | grep allTextWidths`,
> before trusting a dev server A/B.

## Results

Medians of 3 runs each. In the table, before → after.

| Scenario                                         | FPS             | p95 frame      | Dropped frames | Script ms/s      |
| ------------------------------------------------ | --------------- | -------------- | -------------- | ---------------- |
| Idle, 2K×40, tick 100ms, 1080p                   | 54.9 → 59.2     | 33.3 → 16.8ms  | 9.0% → 0.7%    | 373 → 251 (−33%) |
| Scroll while ticking, 2K×40, tick 100ms, 1080p   | 58.7 → 59.8     | 16.8 → 16.8ms  | 1.9% → 0.2%    | 598 → 386 (−35%) |
| **Idle, 2K×200, tick 100ms, 4K (3840×2160 @1x)** | **18.7 → 29.8** | **100 → 67ms** | 50% → 34%      | 777 → 507 (−35%) |
| Idle, 2K×40, tick 16ms, 1080p                    | 59.2 → 59.4     | 16.7 → 16.8ms  | 0.3% → 0.3%    | 755 → 581 (−23%) |
| Control: static scroll, 100K×500, 1080p          | 59.6 → 59.8     | 16.8 → 16.8ms  | 0.2% → 0.2%    | 408 → 343 (−16%) |

Scenarios already at the 60 FPS vsync cap only show the gain in CPU time. On a
slower machine or a busier page, that headroom becomes frames.

### Per-function inclusive time (ms per wall second)

The 4K scenario (2K×200, tick 100ms):

| Function             | Before | After | Change |
| -------------------- | ------ | ----- | ------ |
| `updateCanvas`       | 530    | 391   | −26%   |
| `updateMetrics`      | 389    | 228   | −41%   |
| `calculateTextWidth` | 209    | 24    | −89%   |
| `drawCanvas`         | 338    | 281   | −17%   |
| `drawCellContent`    | 323    | 265   | −18%   |
| `measureText`        | 67     | 1.4   | −98%   |

The 1080p idle scenario (2K×40, tick 100ms):

| Function             | Before | After | Change |
| -------------------- | ------ | ----- | ------ |
| `updateCanvas`       | 254    | 191   | −25%   |
| `updateMetrics`      | 217    | 108   | −50%   |
| `calculateTextWidth` | 118    | 12    | −90%   |
| `drawCanvas`         | 146    | 138   | −6%    |
| `measureText`        | 27     | 0.5   | −98%   |

## Analysis

- **The width cache still pays off when values change every tick.** I
  expected little gain, since each tick produces new strings and the cache
  keyed on the whole string mostly misses. Even so, `calculateTextWidth`
  drops ~90%. The likely causes are the other changes in the same commit:

  - `context.font` is no longer assigned once per cell per frame. Assigning
    it re-parses the font string.
  - The loop no longer measures the next character.
  - Character-pair widths are cached. Formatted doubles
    (`###,##0.0000`) use only ~13 distinct characters, so pair lookups almost
    always hit.

  Some whole strings also repeat across ticks, such as row values that round
  to the same 4 decimal places.

- **Skipping measurement for cells with no tokens removes almost all of
  `measureText`** in this scenario. Ticking doubles never contain links, so
  every cell takes the single `fillText` path.
- **Column auto-sizing (`updateMetrics`) was the larger cost while ticking,
  and it shrank the most.** Every tick triggers `forceUpdate` → `updateMetrics`,
  which re-measures every visible cell of every visible column to auto-size
  widths.
- **Control.** The static 100K×500 scroll also improves: `calculateTextWidth`
  is −77% and `measureText` is −84%. That is consistent with the commits'
  own claims, measured there on CPU share. Its `drawCanvas` and
  `drawCellContent` numbers went up ~11–14%. That looks like noise within a
  vsync-capped run, since the ticking scenarios show `drawCanvas` falling by
  6–20%, but it is worth re-checking with more runs if it matters.

## Remaining cost after these commits

At 4K with 200 ticking columns, roughly half the main thread is still script
time (~507 ms/s), split mainly between:

1. **`updateMetrics`, at ~228 ms/s.** Column widths are recalculated from
   every visible cell on every tick.
2. **`drawCellContent`, at ~265 ms/s.** This is per cell `save`/`restore`,
   truncation cache lookups, `textForCell` formatting, and `fillText`.

Possible next steps:

- Skip or throttle content-based column width recalculation on data-only
  updates. Widths of ticking numeric columns rarely change, so widths could
  only grow, or be re-measured on a slower cadence.
- Estimate widths for numeric and fixed-format columns from the format string
  and `fontWidthsUpper` instead of measuring each value.
- Batch per-cell context state changes (`save`/`restore`, `textAlign`,
  `fillStyle`) per column. `npm run e2e:grid-render-breakdown` can quantify
  this, since its `rawTextWithContextState` variant measures exactly that
  overhead.

## Caveats

- The benchmark ran in headless Chromium on a shared 32-core Linux box with
  software rasterization. Compare relative changes rather than absolute FPS.
- It only covers grid rendering. Like the perf app's `tick` mode, it excludes
  JS API viewport processing and `IrisGridTableModel` overhead, so the
  end-to-end improvement in `code-studio` with a real server table will be
  smaller in relative terms.
- There are 3 runs per side. The ticking results are consistent across runs:
  every "after" run beat every "before" run on script time. The 4K FPS gain
  ranged from +11 to +20 FPS.

## Reproducing

```bash
FILES="packages/grid/src/GridMetricCalculator.ts packages/grid/src/TextCellRenderer.ts"
git checkout HEAD~2 -- $FILES
(cd tests/grid-perf/app && npx vite build --outDir /tmp/gp-before --emptyOutDir)
git checkout HEAD -- $FILES
(cd tests/grid-perf/app && npx vite build --outDir /tmp/gp-after --emptyOutDir)

(cd tests/grid-perf/app && npx vite preview --outDir /tmp/gp-before --port 4021 --strictPort) &
(cd tests/grid-perf/app && npx vite preview --outDir /tmp/gp-after --port 4022 --strictPort) &
```

Then open, for example,
`http://localhost:4021/?rows=2000&cols=200&tick=100` and the same URL on `:4022`.
The overlay shows live FPS. For repeatable numbers, point the existing ticking
benchmarks at each port by changing `PERF_APP_URL` in
`tests/grid-perf/grid-perf-app.spec.ts`, then run:

```bash
npm run e2e:grid-performance -- --grep "ticking"
```
