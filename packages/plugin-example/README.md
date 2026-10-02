# @deephaven/plugin-example

A minimal **ES module** Deephaven plugin used to develop and test the modern
remote-plugin loader in [@deephaven/app-utils](../app-utils). It demonstrates:

- Building a plugin as an ES module (`vite` lib mode, `formats: ['es']`).
- Resolving host singletons (`react`, `@deephaven/*`, ...) through the import map
  the host injects at runtime, so the plugin shares the host's instances instead
  of bundling its own.
- **Lazy-loading** a heavier component on demand via dynamic `import()`, so it is
  split into a separate chunk that loads only when needed.
- **Dynamically imported styling**: the lazy chunk imports a `.scss` file that is
  compiled to CSS at build time and injected via JS when the chunk loads.

This package is dev-only (`"private": true`) and is not published or part of the
monorepo's main build.

## How it works

| File                                                       | Purpose                                                                                               |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [src/index.ts](src/index.ts)                               | Plugin entry; default-exports a `WidgetPlugin`.                                                       |
| [src/ExampleWidgetView.tsx](src/ExampleWidgetView.tsx)     | Eagerly-loaded view; `React.lazy(() => import('./LazyExampleContent'))`.                              |
| [src/LazyExampleContent.tsx](src/LazyExampleContent.tsx)   | Lazy chunk; imports `./LazyExampleContent.scss`.                                                      |
| [src/LazyExampleContent.scss](src/LazyExampleContent.scss) | SCSS compiled + injected with the lazy chunk.                                                         |
| [vite.config.ts](vite.config.ts)                           | ESM lib build; externals; `cssCodeSplit` + `vite-plugin-css-injected-by-js` (`relativeCSSInjection`). |
| [serve.js](serve.js)                                       | Tiny static server that serves `dist/` and a generated `manifest.json` with CORS.                     |

The plugin's host singletons are declared `external` in
[vite.config.ts](vite.config.ts) so they are emitted as bare `import` statements
(e.g. `import { Button } from '@deephaven/components'`). At runtime the host
resolves those bare specifiers via the import map built from
[remote-component.config.ts](../app-utils/src/plugins/remote-component.config.ts).

## Local development

1. Build and serve the plugin (rebuilds on change):

   ```sh
   npm run start -w @deephaven/plugin-example
   ```

   This serves on `http://localhost:4100` with:

   - manifest: `http://localhost:4100/manifest.json`
   - entry: `http://localhost:4100/@deephaven/plugin-example/index.js`

   You can also run the steps separately: `npm run build:plugin` then
   `npm run serve` (set `PORT` to change the port).

2. Point the host dev server at it by adding to
   `packages/code-studio/.env.development.local`:

   ```sh
   VITE_JS_PLUGINS_DEV_PORT=4100
   ```

3. Start the host app (`npm start`). The host proxies `/js-plugins` to the
   plugin server, auto-detects the entry as an ES module, injects the import
   map, and loads it via `es-module-shims`.

To exercise the widget, open an object of type `Example` from a Deephaven
console (or adjust `supportedTypes` in [src/index.ts](src/index.ts) to match an
object type you can create).
