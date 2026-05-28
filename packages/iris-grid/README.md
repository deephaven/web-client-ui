# @deephaven/iris-grid

This is a library of Deephaven Iris Grid component. Display a grid with enhanced functionality with a Deephaven table.

## Usage

Add the package to your "dependencies":
```
npm install --save @deephaven/iris-grid
```

Then, import and use the component from the package:
```
import { useApi } from '@deephaven/jsapi-bootstrap';
import { IrisGrid, IrisGridModelFactory } from '@deephaven/iris-grid';

// In your initialization, create the model async
const dh = useApi();
const model = await IrisGridModelFactory.makeModel(dh, table);

// In your render function
<IrisGrid dh={dh} model={model} />
```

## Customizing the Table Options menu

The Table Options sidebar (the gear menu on the right edge of the grid) is
extensible. Plugin authors can hide built-in items, relabel or reorder
them, and add their own items that open a custom configuration page —
without forking `IrisGrid`.

There are two entry points, depending on where you sit in the tree:

1. **Direct prop** — pass `transformTableOptions` to `<IrisGrid>` when you
   own the render site.
2. **Context** — wrap any subtree in `IrisGridTableOptionsContext.Provider`
   when you can't reach the `<IrisGrid>` directly (typical for
   `WidgetMiddlewarePlugin` / `DashboardPlugin` authors). The panel hosts
   that ship with Deephaven (`IrisGridPanel`, `GridWidgetPlugin`) read
   the context and forward it to the prop for you.

Both routes accept the same payload: an `IrisGridTableOptionsExtension`
with an optional `transformTableOptions` transform.

### Writing a transform

`transformTableOptions(defaults)` is a pure function that receives the
built-in items (already filtered by what the current model supports) and
returns the items to actually render. Use it to add, hide, relabel,
reorder, or replace entries.

```tsx
import { OptionType, type OptionItem } from '@deephaven/iris-grid';

const transformTableOptions = (defaults: readonly OptionItem[]) => [
  // hide a built-in
  ...defaults.filter(o => o.type !== OptionType.SELECT_DISTINCT),
  // add a plugin item with its own page
  {
    type: 'plugin:my-plugin:column-inspector',
    title: 'Column Inspector',
    configPage: ColumnInspectorPage,
  },
];
```

Rules:

- The transform should be referentially stable and side-effect-free
  (it's called inside memoization). Memoize it with `useMemo` /
  `useCallback` rather than rebuilding per render.
- A throwing transform is logged once and treated as identity for that
  render, so the menu degrades gracefully.
- Items **without** a `configPage` MUST have a `type` matching an
  existing `OptionType` enum value — those are rendered by the built-in
  page switch.
- Items **with** a `configPage` SHOULD use a namespaced key,
  conventionally `plugin:<name>:<id>`, to avoid colliding with built-ins
  or other plugins.

### Implementing a `configPage`

A `configPage` is a regular React component that receives
`IrisGridTableOptionsPageProps`:

```tsx
import { type IrisGridTableOptionsPageProps } from '@deephaven/iris-grid';

export function ColumnInspectorPage({
  model,
  onBack,
}: IrisGridTableOptionsPageProps): JSX.Element {
  return (
    <div>
      <button type="button" onClick={onBack}>Back</button>
      <pre>{model.columns.map(c => c.name).join('\n')}</pre>
    </div>
  );
}
```

`IrisGrid` wraps each `configPage` render in `PluginTableOptionsErrorBoundary`,
so a throw inside your page shows a small inline fallback instead of
unmounting the whole grid.

### Publishing via context (middleware pattern)

When you're a `WidgetMiddlewarePlugin` and don't render `<IrisGrid>`
yourself, publish the extension through context:

```tsx
import {
  IrisGridTableOptionsContext,
  type IrisGridTableOptionsExtension,
} from '@deephaven/iris-grid';
import { useContext, useMemo } from 'react';

function MyMiddleware({ children }: { children: React.ReactNode }) {
  const parent = useContext(IrisGridTableOptionsContext);
  const value = useMemo<IrisGridTableOptionsExtension>(
    () => ({
      transformTableOptions: defaults => {
        // Run the parent transform first so contributions compose.
        const upstream = parent?.transformTableOptions?.(defaults) ?? defaults;
        return [...upstream, myPluginItem];
      },
    }),
    [parent]
  );

  return (
    <IrisGridTableOptionsContext.Provider value={value}>
      {children}
    </IrisGridTableOptionsContext.Provider>
  );
}
```

Composition rule: when multiple providers nest, each one should read
the parent value via `useContext`, run its transform first, then layer
its own changes on top — last writer wins for any given `OptionItem.type`.

### Full example

See the [`@deephaven/js-plugin-table-options-example`](https://github.com/deephaven/deephaven-plugins/tree/main/plugins/table-options-example)
plugin for a working `WidgetMiddlewarePlugin` and `DashboardPlugin` that
hides a built-in item and adds a `configPage`-backed page.

### Future work

The transform signature today is `(defaults) => items` — it does **not**
receive the `IrisGridModel` or grid state. State-aware menus
(e.g. "hide an item unless rollup is active", "show *Reset filters* only
when filters exist") should be implemented in the middleware: subscribe
to model events in the `Provider`, recompute the extension, and let the
transform itself stay pure.

This isn't just about keeping the public surface small — it's also
what keeps menu memoization honest. `IrisGrid` caches the computed
item list on `[defaults, transform]` (see `getCachedTransformedOptionItems`),
both of which are stable values/refs. Adding a live `model` argument
would break that: `IrisGridModel` is a long-lived mutable handle whose
identity does not change when `isExpandable`, `filter`, `sorts`, or
`isRollup` flip, so any plugin that read those fields would silently
return stale items until something unrelated invalidated the cache.

If a model-aware transform proves necessary, the planned evolution is
to pass a **curated snapshot of values** as the second argument —
something like `(defaults, { isRollup, hasFilters, columnCount, ... }) => items`
— so the memo key changes when those values change and re-runs are
driven by actual dependencies. Passing the model itself, or the full
`IrisGrid` instance, is intentionally off the table: the surface is
too large, too volatile, and (in the model's case) memoization-hostile.