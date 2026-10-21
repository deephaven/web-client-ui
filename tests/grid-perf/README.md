# Grid Performance Testing

For performance-sensitive changes to the Grid component, there are two ways to benchmark. Both suites are skipped unless `RUN_PERF_TESTS` is set, since frame timings are too resource sensitive for CI.

Both run through [`playwright-perf.config.ts`](../../playwright-perf.config.ts), which disables video and trace capture and runs chromium only with a single worker, so recording overhead and parallelism don't skew the frame times.

## Main app tests

[`tests/grid-perf/grid-performance.spec.ts`](./grid-performance.spec.ts) measures scroll FPS in the main app with real table data, so it requires a Deephaven server and the usual [E2E setup](../../README.md#e2e-tests). It covers the application mode tables plus the `perf_` tables defined in [`performance_tables.py`](../docker-scripts/data/app.d/performance_tables.py), which include ~500 and ~25,000 character string cells to exercise text measurement and truncation.

```bash
npm run e2e:performance
```

Each benchmark appends its metrics to `test-results/grid-perf-results.jsonl`. Run [`scripts/grid-perf-report.mjs`](../../scripts/grid-perf-report.mjs) afterwards to turn them into a markdown table.

The `Build and End-to-end Tests` workflow runs this suite in chromium after the e2e matrix and publishes the report to the job summary, an artifact, and a PR comment. Runner timings are noisy, so the job never fails the build.

## Standalone perf app

[`tests/grid-perf/grid-perf-app.spec.ts`](./grid-perf-app.spec.ts) drives [`app`](./app), a lightweight Vite app that renders a `Grid` backed by `MockGridModel`. It is useful for:

- Testing without a Deephaven server
- Benchmarking row and column counts the test data does not reach
- Iterating on Grid changes quickly

```bash
# Install dependencies (one time)
cd tests/grid-perf/app && npm install

# Start the app
npm run dev

# In another terminal (from the repo root), run the perf app tests
npm run e2e:grid-performance
```

The app supports query params to configure the grid:

- `rows`: Number of rows (default: 1000000)
- `cols`: Number of columns (default: 100)
- `text`: `short` cell text, or `long` text that is truncated in every cell (default: `short`)

Example: `http://localhost:4020/?rows=100000&cols=50`

## Render breakdown

[`tests/grid-perf/grid-render-breakdown.spec.ts`](./grid-render-breakdown.spec.ts) splits grid draw time into model/text processing and raw canvas drawing. It uses the perf app's `window.runRenderBreakdown()` ([`renderBreakdown.ts`](./app/src/renderBreakdown.ts)), which times these variants against the exact cells, positions, and strings the grid has on screen, once per animation frame:

| Variant                   | Measures                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `full`                    | The grid's complete `drawCanvas`                                                                                         |
| `cellText`                | The grid's cell text drawing, with a warm truncation cache                                                               |
| `cellTextColdCache`       | `cellText` with the truncation cache cleared first                                                                       |
| `textLookup`              | The model and truncation cache work for each cell, without drawing                                                       |
| `rawText`                 | Per column clip and `fillText` of precomputed strings, the floor for drawing that much text                              |
| `rawTextWithContextState` | `rawText` plus the per cell `save`/`restore`, `textAlign`, `fillStyle`, and `measureText` calls `TextCellRenderer` makes |

`cpu` is the synchronous time spent in the draw call, and `frame` is the time between animation frames, which also includes rasterization. It runs at every display profile with both `short` and `long` text, and appends results to `test-results/grid-render-breakdown.jsonl`.

```bash
# With the perf app running
npm run e2e:grid-render-breakdown
```

The breakdown can also be run by hand from the browser console on the perf app with `await runRenderBreakdown({ iterations: 60, warmup: 10 })`.

## Display scaling (4K) benchmarks

Both specs also run a `display scaling` suite. It repeats representative benchmarks under the display profiles in [`utils.ts`](./utils.ts) (`DISPLAY_PROFILES`), using Playwright viewport and `deviceScaleFactor` emulation:

| Profile        | Viewport (CSS px) | Device pixel ratio | What it stresses                          |
| -------------- | ----------------- | ------------------ | ----------------------------------------- |
| 1080p baseline | 1920×1080         | 1                  | Reference point                           |
| 4K at 100%     | 3840×2160         | 1                  | Many more visible cells                   |
| 4K at 150%     | 2560×1440         | 1.5                | More cells, and fractional canvas scaling |
| 4K at 200%     | 1920×1080         | 2                  | Same cells as 1080p, 4× the canvas pixels |

The grid sizes its canvas backing store to CSS size × device pixel ratio, so comparing these profiles shows whether a slowdown comes from the number of cells drawn or from the number of pixels filled. Each test first asserts that the canvas was actually scaled to the emulated ratio.

Run only these benchmarks with:

```bash
npm run e2e:performance -- --grep "display scaling"
npm run e2e:grid-performance -- --grep "display scaling"
```

Headless chromium (including CI) usually rasterizes the canvas in software, so compare each 4K result with the 1080p baseline from the same run rather than reading absolute FPS. For numbers closer to a real GPU, add `--headed`.
