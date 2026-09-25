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

### Resolution: es-module-shims in shim mode

We use [`es-module-shims`](https://github.com/guybedford/es-module-shims) in
**shim mode**. Shim mode only processes modules loaded through the explicit
`importShim()` API, so the host's own module scripts are never touched, and
import maps can be added at runtime on every browser (including Firefox) via
`importShim.addImportMap()`. Every plugin module therefore goes through the
shim loader — specifiers are resolved and rewritten by es-module-shims rather
than the native loader — which is what makes late, incremental import maps
reliable across all supported browsers.

## Plan

### Phase 1 — Resolution infrastructure (`packages/app-utils/src/plugins`)

- Add `es-module-shims` dependency, initialized with `shimMode: true`.
- New `esmPluginLoader.ts`:
  - `buildHostImportMap(resolve)` — for each `resolve` entry, create a blob ESM
    module that re-exports the live host instance (`default` plus named keys
    enumerated via `Object.keys`), returning
    `{ imports: { react: blobUrl, '@deephaven/components': blobUrl, ... } }`.
  - `buildPluginImportMap(manifest, baseUrl)` — map each plugin's
    `loader.package` to its served entry URL so cross-plugin imports resolve up
    front.
  - `addImportMap(map)` — register the map with `importShim.addImportMap()`
    before importing the first plugin module.
  - `loadEsModulePlugin(url)` — `importShim(url)`.
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
  `plugin-example` script. Set `VITE_JS_PLUGINS_DEV_PORT=4100` to proxy
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
- `packages/app-utils/src/declarations.d.ts` — declares the `es-module-shims`
  side-effect module for the lazy dynamic import.
- `packages/plugin-example/**` (new) — example ESM plugin + static dev server.
- `packages/app-utils/src/plugins/PluginUtils.test.ts` — new ESM cases.

## Verification

1. `npm run plugin-example` + `VITE_JS_PLUGINS_DEV_PORT=4100 npm start`;
   confirm the example widget loads, the lazy chunk and its CSS fetch only on
   demand (Network tab), styles apply, and host React is shared (no
   duplicate-React errors).
2. An existing CJS plugin still loads unchanged (auto-detect path).
3. `npm run test:unit -- PluginUtils` passes the new ESM cases.
4. Cross-browser smoke — Chromium and Firefox — both load the ESM plugin and
   its lazy CSS through the shim loader.

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
  (`shimMode: true` plus a `source` hook that serves already-fetched plugin
  entries) is set immediately before the dynamic import.
- **Module format detection** fetches the entry once and uses `es-module-lexer`
  (`parse` → an ES module if it has any `export` or a static `import`). A
  failed fetch throws; there is no CommonJS fallback. Both paths consume the
  already-fetched source: the ESM path hands it to es-module-shims via the
  `source` hook, and the CommonJS path evaluates it directly, so the entry is
  never fetched twice.
- **Host singletons are exposed via blob ES modules.** `buildHostImportMap`
  registers each `resolve` entry in a global registry
  (`window.__DH_SHARED_PLUGIN_MODULES__`) and creates a blob-URL ES module that
  re-exports the live instance (default + valid named export keys). The host
  map is memoized and registered specifiers are tracked so the first mapping
  for a specifier wins and entries are never re-registered.
- **Example plugin CSS injection** uses `vite-plugin-css-injected-by-js` with
  `relativeCSSInjection: true` so each lazy chunk's CSS is injected when that
  chunk loads (verified: the SCSS-derived CSS ships in the lazy chunk, not the
  entry).
- **Example dev server** (`packages/plugin-example/serve.js`) uses only Node
  built-ins (no extra deps) to serve `dist/` and a generated `manifest.json`
  with CORS on port 4100.
- **Migration guide** lives at
  `packages/app-utils/docs/migrating-plugins-to-esm.md`.
