# Middleware Plugin Infrastructure for Widget Chaining

**PR:** [#2660](https://github.com/deephaven/web-client-ui/pull/2660) | **Ticket:** DH-21476

## Summary

Adds middleware plugin support so plugins can wrap existing widgets without replacing them, cross-plugin dependency loading via manifest `package`/`dependencies` fields, and shared plugin-loading utilities in `@deephaven/plugin`.

## What Changed

**Middleware chaining** — New `WidgetMiddlewarePlugin` type with its own `PluginType.MIDDLEWARE_PLUGIN` discriminator. Middleware receives a `Component` prop and wraps the next layer. Multiple middleware compose in registration order. Applied in both `WidgetLoaderPlugin` (dashboard panels) and `WidgetView` (inline widgets) via `createChainedComponent`/`createChainedPanelComponent`. The chaining functions automatically filter middleware by `supportedTypes` at render time, so middleware only activates for matching widget types.

**Cross-plugin dependencies** — Manifest entries can declare `package` (makes the plugin's exports available to other plugins) and `dependencies` (topological sort so deps load first). Plugins load sequentially so each plugin's exports are available to subsequent plugins via standard `import` statements.

**Shared loading utilities** — `getPluginModuleValue`, `registerPlugin`, `processLoadedModule`, `sortPluginsByDependency`, and manifest types moved from `@deephaven/app-utils` into `@deephaven/plugin`. Both web-client-ui and gplus consume these instead of duplicating the logic. ~80 lines removed from app-utils.

## Key Files

| File | Change |
|---|---|
| `packages/plugin/src/PluginTypes.ts` | Middleware types, type guard |
| `packages/plugin/src/PluginUtils.tsx` | Chaining functions, loader utils, manifest types |
| `packages/plugin/src/WidgetView.tsx` | Middleware-aware inline rendering |
| `packages/dashboard-core-plugins/src/WidgetLoaderPlugin.tsx` | Middleware-aware panel loading |
| `packages/app-utils/src/plugins/PluginUtils.tsx` | Simplified to use shared utils |
| `packages/plugin/docs/middleware-architecture.md` | Architecture reference |

## Breaking Changes

`PluginManifestPluginInfo`, `PluginManifest`, and `getPluginModuleValue` are no longer exported from `@deephaven/app-utils`. Import them from `@deephaven/plugin` instead.

## PR Discussion

**Why is `WidgetMiddlewarePlugin` its own `PluginType` rather than a `WidgetPlugin` subtype with a flag?**

- **Clean type narrowing** — the discriminated union splits cleanly on `type`. `isWidgetPlugin` matches base widget plugins only; `isWidgetMiddlewarePlugin` matches middleware only. There is no overlap and no "is it a flagged variant of the other?" check.
- **No hidden field-shape coupling** — with the previous `Omit<WidgetPlugin, 'component' | 'panelComponent'>` approach, any change to `WidgetPlugin` (e.g. a new required field) silently propagated into the middleware contract. A standalone interface declares exactly what middleware needs (`name`, `supportedTypes`, `component`, optional `panelComponent`).
- **Clearer intent at the call site** — `type: PluginType.MIDDLEWARE_PLUGIN` is self-documenting. `type: PluginType.WIDGET_PLUGIN, isMiddleware: true` requires the reader to know that the boolean flag fundamentally changes the runtime role of the plugin.
- **Migration cost is small** — only the two iteration sites (`WidgetLoaderPlugin`, `WidgetView`) needed to add `|| isWidgetMiddlewarePlugin(p)` to their filter. No external consumers in this repo, gplus, or deephaven-plugins iterate plugins and care about the distinction.

**Trade-off accepted:** `supportedTypes` is duplicated as a concept across `WidgetPlugin` and `WidgetMiddlewarePlugin`. This is intentional — the field has the same semantics but the two interfaces have independent lifecycles, and shared inheritance proved more brittle than helpful.
