# ESM remote plugins with lazy loading

Allow remotely-loaded plugins to be modern ES-module plugins that can
code-split / lazy-load parts of their components (and their CSS/SCSS) instead of
shipping everything in one CommonJS bundle. ESM plugin components must resolve
the same host singletons (`react`, `redux`, `@deephaven/*`, ...) that the
existing CommonJS plugins resolve via the `remote-component.config.ts` `resolve`
map. The existing CommonJS plugin format keeps working — the format is
auto-detected per plugin at load time.

## Background — how plugins load today

1. [`PluginsBootstrap`](../packages/app-utils/src/components/PluginsBootstrap.tsx)
   calls
   [`loadModulePlugins(pluginsUrl)`](../packages/app-utils/src/plugins/PluginUtils.ts).
2. `loadModulePlugins` fetches `manifest.json`, groups plugins into dependency
   levels via `groupByDependencyLevel`, and loads each level in parallel.
3. Each plugin is loaded by `loadModulePlugin` →
   [`loadRemoteModule`](../packages/app-utils/src/plugins/loadRemoteModule.ts),
   which uses `@paciolan/remote-module-loader` to **fetch a single CommonJS
   bundle as text and `eval` it** with a custom `require` backed by the
   [`resolve`](../packages/app-utils/src/plugins/remote-component.config.ts) map.
   Because this is a JS-level shim, the browser module system is never involved,
   so there are no import-map timing constraints.
4. `processLoadedModule` (in `@deephaven/plugin`) registers each plugin's raw
   exports in the `resolve` map under its `package` name so later plugins can
   import earlier ones, then registers the plugin in the plugin map.

The plugin build (deephaven-plugins repo) uses Vite library mode with
`formats: ['cjs']` and `external: ['react', '@deephaven/components', ...]` so the
deps become `require(...)` calls satisfied by the `resolve` map.

## Why ESM needs more than "just import it"

Native `import 'react'` / `import('./Chunk.js')` are resolved by the **browser**,
which rejects bare specifiers (`react`, `@deephaven/components`) unless an
**import map** maps them. Our import map can only be built **at runtime** because:

- the host singletons live inside the app bundle (we expose them as blob ESM
  modules), and
- cross-plugin URLs come from the manifest.

By the time we load plugins, the app's own module entry has already executed.
Per [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap#merging_multiple_import_maps),
an import map must be declared before any module that depends on it loads, and
late / multiple import maps only work in Chrome 133+ and Safari 18.4+ —
**Firefox does not support multiple import maps**
([caniuse](https://caniuse.com/mdn-html_elements_script_type_importmap_multiple)).
web-client-ui supports Firefox, so a native-only approach is not reliable.

### Resolution: es-module-shims in polyfill mode

We use [`es-module-shims`](https://github.com/guybedford/es-module-shims) in
**polyfill mode** (not shim mode). It injects a native `<script type="importmap">`
and uses native `import()`. On modern browsers it passes through to the native
loader (~5ms overhead). On Firefox / older browsers — where our runtime-injected
map isn't natively honored — the polyfill engages (triggered by the bare-specifier
static failure) and rewrites specifiers via blob URLs. MDN explicitly recommends
this polyfill for non-supporting browsers.

## Plan

### Phase 1 — Resolution infrastructure (`packages/app-utils/src/plugins`)

- Add `es-module-shims` dependency. Load it `async` in
  [`packages/code-studio/index.html`](../packages/code-studio/index.html) and
  [`packages/embed-widget/index.html`](../packages/embed-widget/index.html), with
  an `esms-options` script using **polyfill mode** (default; not `shimMode`).
- New `esmPluginLoader.ts`:
  - `buildHostImportMap(resolve)` — for each `resolve` entry, create a blob ESM
    module that re-exports the live host instance (`default` plus named keys
    enumerated via `Object.keys`), returning
    `{ imports: { react: blobUrl, '@deephaven/components': blobUrl, ... } }`.
  - `buildPluginImportMap(manifest, baseUrl)` — map each plugin's `package` to
    its served entry URL so cross-plugin imports resolve up front.
  - `injectImportMap(map)` — append **one** `<script type="importmap">` to
    `<head>` **before** importing the first plugin module. We rely on
    es-module-shims for the runtime / Firefox case rather than injecting a map
    per dependency level.
  - `loadEsModulePlugin(url)` — native `import(url)` (es-module-shims rewrites
    dynamic import in polyfill mode).
- Leave `loadRemoteModule.ts` (CJS path) untouched.

### Phase 2 — Loader integration (`PluginUtils.ts`)

- `loadModulePlugin`: fetch the entry source once and detect ESM vs CJS using
  `es-module-lexer` (presence of `import`/`export` statements ⇒ ESM). Route ESM
  to `loadEsModulePlugin`, CJS to the existing `loadRemoteModule`.
- `loadModulePlugins`: build the host import map (once) and the plugin-package
  map, then inject both before the existing level-by-level load loop.
- `processLoadedModule` is unchanged — it operates on the resolved exports.

### Phase 3 — Example plugin + dev server (`packages/plugin-example`, dev-only)

- Vite library build with `formats: ['es']`, the same `external` list as today,
  `cssCodeSplit`, and `vite-plugin-css-injected-by-js` so a lazy chunk's compiled
  CSS injects automatically when the chunk is dynamically imported.
- A widget plugin whose component is lazy-loaded via dynamic `import()`, and the
  lazy chunk imports a `.scss` file — proving both code-splitting and dynamic
  SCSS→CSS styling loading with the chunk.
- A tiny static dev server (`sirv` / `http-server`) serving `dist/` plus a
  generated `manifest.json` with CORS on port 4100, exposed via a
  `start:plugin-example` script. Set `VITE_JS_PLUGINS_DEV_PORT=4100` to proxy
  `/js-plugins` to it (existing `vite.config.ts` proxy).

### Phase 4 — Tests, docs & migration

- Unit tests in
  [`PluginUtils.test.ts`](../packages/app-utils/src/plugins/PluginUtils.test.ts)
  for ESM detection / loading (mock dynamic import + `es-module-lexer`) and tests
  for the host import-map builder.
- Optional e2e: load the example plugin, assert the lazy JS chunk and its CSS are
  fetched on demand and the widget renders styled.
- README: authoring ESM plugins (`formats: ['es']`, css-injected-by-js, lazy
  `import()`) and serving locally.
- Migration doc for the `deephaven-plugins` widget template (a **separate future
  commit**): switch Vite `formats` `cjs`→`es`, add css-injected-by-js, keep
  externals. CJS stays supported, so teams migrate when ready.

## Relevant files

- `packages/app-utils/src/plugins/PluginUtils.ts` — detect + branch in
  `loadModulePlugin`, inject import maps in `loadModulePlugins`.
- `packages/app-utils/src/plugins/esmPluginLoader.ts` (new) — blob host modules,
  import-map builders, ESM loader.
- `packages/app-utils/src/plugins/loadRemoteModule.ts` — CJS path, unchanged.
- `packages/app-utils/src/plugins/remote-component.config.ts` — `resolve`
  singletons source.
- `packages/code-studio/index.html`, `packages/embed-widget/index.html` —
  es-module-shims script + `esms-options`.
- `packages/plugin-example/**` (new) — example ESM plugin + static dev server.
- `packages/app-utils/src/plugins/PluginUtils.test.ts` — new ESM cases.

## Verification

1. `npm run start:plugin-example` + `VITE_JS_PLUGINS_DEV_PORT=4100 npm start`;
   confirm the example widget loads, the lazy chunk and its CSS fetch only on
   demand (Network tab), styles apply, and host React is shared (no
   duplicate-React errors).
2. An existing CJS plugin still loads unchanged (auto-detect path).
3. `npm run test:unit -- PluginUtils` passes the new ESM cases.
4. Cross-browser smoke — Chromium (native passthrough) and Firefox (polyfill
   engages) — both load the ESM plugin and its lazy CSS.

## Implementation notes / deviations

The following reflect how this was actually implemented (the rest of the plan
holds):

- **es-module-shims is loaded lazily, not via `index.html`.** Rather than adding
  a `<script>` + `esms-options` to `code-studio`/`embed-widget` `index.html`, it
  is dynamically `import()`-ed on first ESM plugin load inside
  `ensureEsModuleShims()` in `esmPluginLoader.ts`. Plugins are always loaded
  through the explicit `importShim()` API, so the "import map must exist before
  the affected module loads" timing constraint does not apply, and this keeps
  the feature self-contained with no per-app HTML changes. `esmsInitOptions`
  (with an `onpolyfill` log hook) is set immediately before the dynamic import.
- **Module format detection** fetches the entry once and uses `es-module-lexer`
  (`parse` → an ES module if it has any `export` or a static `import`). The
  fetch is guarded so existing test mocks (and non-fetchable entries) fall back
  to the CommonJS path. This incurs one extra fetch per plugin entry; the
  browser cache mitigates the subsequent `importShim()`/`loadRemoteModule`
  fetch.
- **Host singletons are exposed via blob ES modules.** `buildHostImportMap`
  registers each `resolve` entry in a global registry
  (`window.__DH_SHARED_PLUGIN_MODULES__`) and creates a blob-URL ES module that
  re-exports the live instance (default + valid named export keys). The host
  map is memoized and injected specifiers are tracked to avoid re-injection
  errors in polyfill mode.
- **Example plugin CSS injection** uses `vite-plugin-css-injected-by-js` with
  `relativeCSSInjection: true` so each lazy chunk's CSS is injected when that
  chunk loads (verified: the SCSS-derived CSS ships in the lazy chunk, not the
  entry).
- **Example dev server** (`packages/plugin-example/serve.js`) uses only Node
  built-ins (no extra deps) to serve `dist/` and a generated `manifest.json`
  with CORS on port 4100.
- **Migration guide** lives at
  `packages/app-utils/docs/migrating-plugins-to-esm.md`.
