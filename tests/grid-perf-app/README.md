# Grid Performance Testing

For performance-sensitive changes to the Grid component, there are two ways to benchmark. Both suites are skipped unless `RUN_PERF_TESTS` is set, since frame timings are too resource sensitive for CI.

## Main app tests

[`tests/grid-performance.spec.ts`](../grid-performance.spec.ts) measures scroll FPS in the main app with real table data, so it requires a Deephaven server and the usual [E2E setup](../../README.md#e2e-tests).

```bash
npm run e2e:performance
```

## Standalone perf app

[`tests/grid-perf-app.spec.ts`](../grid-perf-app.spec.ts) drives this app, a lightweight Vite app that renders a `Grid` backed by `MockGridModel`. It is useful for:

- Testing without a Deephaven server
- Benchmarking row and column counts the test data does not reach
- Iterating on Grid changes quickly

```bash
# Install dependencies (one time)
cd tests/grid-perf-app && npm install

# Start the app
npm run dev

# In another terminal (from the repo root), run the perf app tests
npm run e2e:grid-performance
```

The app supports query params to configure the grid:

- `rows`: Number of rows (default: 1000000)
- `cols`: Number of columns (default: 100)

Example: `http://localhost:4020/?rows=100000&cols=50`
