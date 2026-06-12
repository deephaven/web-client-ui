# Migrating Deephaven plugins from CommonJS to ES modules

The web UI's remote plugin loader supports both **CommonJS (CJS)** and modern
**ES module (ESM)** plugins. The format of each plugin is auto-detected at load
time, so migrating is **optional and incremental** — CJS plugins continue to
work indefinitely, and you can migrate one plugin at a time.

> This guide targets the JS bundle build of plugins in the
> [deephaven-plugins](https://github.com/deephaven/deephaven-plugins) repo. The
> migration should land as its own commit, separate from any behavioral change.

## Why migrate?

ES module plugins can **code-split** and **lazy-load** parts of their UI with
dynamic `import()`. Instead of shipping one large bundle that must be fully
downloaded and evaluated before the plugin can be used, an ESM plugin only
fetches the code (and styles) for the view actually being shown. They still
resolve the host's shared singletons (`react`, `redux`, `@deephaven/*`, ...)
rather than bundling their own copies.

## How loading differs

|                 | CommonJS (today)                                         | ES module (new)                                    |
| --------------- | -------------------------------------------------------- | -------------------------------------------------- |
| Bundle format   | `formats: ['cjs']`                                       | `formats: ['es']`                                  |
| Host singletons | Custom `require` backed by the resolve map               | Bare `import` resolved via runtime import map      |
| Loading         | Bundle text `eval`'d by `@paciolan/remote-module-loader` | `importShim()` from `es-module-shims`              |
| Lazy loading    | Not supported (single bundle)                            | `import()` / `React.lazy` produce on-demand chunks |
| Styling         | Bundled into the single entry                            | Per-chunk CSS injected on import                   |

No manifest (`manifest.json`) changes are required. The host fetches each
plugin's `main` entry, detects ESM vs CJS from the source, and loads it
accordingly.

## Migration steps

### 1. Switch the Vite library format to ESM

```ts
// vite.config.ts
build: {
  cssCodeSplit: true, // emit per-chunk CSS so lazy chunks carry their styles
  lib: {
    entry: './src/index.ts',
    formats: ['es'],            // was ['cjs']
    fileName: () => 'index.js',
  },
  rollupOptions: {
    // Keep the SAME external list you already use for CJS. These are provided
    // by the host at runtime and must NOT be bundled.
    external: [
      'react',
      'react-dom',
      'redux',
      'react-redux',
      '@deephaven/components',
      '@deephaven/dashboard',
      '@deephaven/icons',
      '@deephaven/jsapi-bootstrap',
      '@deephaven/jsapi-types',
      '@deephaven/log',
      '@deephaven/plugin',
      // ...any other @deephaven/* host packages your plugin imports
    ],
  },
},
```

The host resolves these `external` specifiers through the import map it injects
at runtime from
[remote-component.config.ts](../src/plugins/remote-component.config.ts), so the
plugin shares the host's exact instances.

### 2. Keep `package.json` consistent

Ensure the package is treated as an ES module and points at the ESM entry:

```jsonc
{
  "type": "module",
  "main": "dist/index.js"
}
```

The `manifest.json` entry (`name`, `version`, `main`, `package`) stays the same.

### 3. Inject per-chunk CSS via JS

So a lazy chunk's compiled CSS/SCSS is added to the document when the chunk is
imported (rather than relying on a separate `<link>` the host doesn't know
about):

```ts
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

plugins: [
  react(),
  cssInjectedByJsPlugin({ relativeCSSInjection: true }),
],
```

### 4. (Optional) Add lazy loading

This is the main benefit of migrating. Split heavier views into their own
chunks and import any styles inside the lazy module so the CSS travels with the
chunk:

```tsx
// EntryView.tsx
const HeavyView = React.lazy(() => import('./HeavyView'));

function EntryView(props) {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyView {...props} />
    </Suspense>
  );
}
```

```tsx
// HeavyView.tsx
import './HeavyView.scss'; // compiled + injected with this chunk
export default function HeavyView() {
  /* ... */
}
```

Dynamic imports of other modules (including additional `.scss`/`.css`) also work
and produce additional on-demand chunks.

## Verifying the migration

1. Build the plugin and serve it (or use the
   [example plugin's dev server](../../plugin-example/serve.js) as a template).
2. Point the host at it with `VITE_JS_PLUGINS_DEV_PORT` and run `npm start`.
3. In the browser devtools Network tab, confirm:
   - The plugin entry loads as a module.
   - Lazy chunks (and their CSS) are fetched only when the corresponding view is
     opened — not on initial plugin load.
4. Confirm the plugin renders and is styled correctly, and that there is only
   one React instance (no "invalid hook call" / duplicate-React errors), which
   verifies host singletons are being shared.

## Notes and limitations

- CJS plugins remain fully supported; migrate incrementally.
- Cross-plugin imports by package name work ESM→ESM. An ESM plugin importing a
  CJS plugin (or vice versa) by package name is not supported — migrate
  interdependent plugins together if they import each other.
- The import map is injected at runtime and polyfilled by `es-module-shims` on
  browsers without runtime-injected import map support (e.g. Firefox); on
  Chromium/Safari it passes through to the native loader.
