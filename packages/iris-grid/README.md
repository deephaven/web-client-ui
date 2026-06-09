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

There is a single entry point: the `transformTableOptions` prop on
`<IrisGrid>`. It is **opt-in** — it lives on the iris-grid-specific
`IrisGridTableOptionsWidgetProps`, not on the generic
`WidgetComponentProps` / `WidgetPanelProps`, so widgets that don't care
about the Table Options menu never see it.

- **Own the render site?** Pass `transformTableOptions` straight to
  `<IrisGrid>`.
- **A `WidgetMiddlewarePlugin` that doesn't render `<IrisGrid>`
  yourself?** Thread the prop down the middleware chain via the
  `Component` you wrap, composing your own transform on top of the one
  you received (see [Publishing from middleware](#publishing-from-middleware)).
  The panel hosts that ship with Deephaven (`IrisGridPanel`,
  `GridWidgetPlugin`) accept `transformTableOptions` as a prop and
  forward it to `<IrisGrid>`.

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

### Publishing from middleware

When you're a `WidgetMiddlewarePlugin` and don't render `<IrisGrid>`
yourself, you receive `transformTableOptions` as a prop and pass a
composed transform down to the `Component` (or panel) you wrap. Run the
upstream transform first so contributions compose, then layer your own
changes on top:

```tsx
import { useMemo, type ComponentType } from 'react';
import {
  type IrisGridTableOptionsWidgetProps,
  type TableOptionsTransform,
} from '@deephaven/iris-grid';

function makeMyTransform(
  upstream: TableOptionsTransform | undefined
): TableOptionsTransform {
  return defaults => {
    const base = upstream != null ? upstream(defaults) : defaults;
    return [...base, myPluginItem];
  };
}

function MyMiddleware({
  Component,
  transformTableOptions,
  ...props
}: WidgetMiddlewarePanelProps & IrisGridTableOptionsWidgetProps) {
  const composedTransform = useMemo(
    () => makeMyTransform(transformTableOptions),
    [transformTableOptions]
  );

  const Next = Component as ComponentType<
    typeof props & IrisGridTableOptionsWidgetProps
  >;
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Next {...props} transformTableOptions={composedTransform} />;
}
```

Composition rule: each middleware layer reads the `transformTableOptions`
it was handed, runs that transform first, then layers its own changes on
top — last writer wins for any given `OptionItem.type`.

#### Model-aware menus

The transform must stay **pure** — it only sees `defaults`, never the
`IrisGridModel`. To make a menu react to model state (e.g. relabel an
item once a pivot is active), take a **snapshot of the value you care
about** from model events and fold it into the transform's identity:

```tsx
const [isPivot, setIsPivot] = useState(model.isPivot);
useEffect(() => {
  const handler = () => setIsPivot(model.isPivot);
  model.addEventListener(SOME_MODEL_EVENT, handler);
  return () => model.removeEventListener(SOME_MODEL_EVENT, handler);
}, [model]);

const composedTransform = useMemo(
  () => makeMyTransform(transformTableOptions, isPivot),
  [transformTableOptions, isPivot]
);
```

Because `composedTransform`'s identity changes when the snapshot
changes, `IrisGrid` re-runs it (its menu cache is keyed on
`[defaults, transform]`). Keeping the snapshot in the dependency array —
rather than reading `model.isPivot` inside the transform — is what keeps
that memoization honest.

To obtain the model when the host builds it for you, pass an
`onModelChanged` callback to `IrisGridPanel` (called once the panel's
model is ready).

### Full example

See the [`@deephaven/js-plugin-table-options-example`](https://github.com/deephaven/deephaven-plugins/tree/main/plugins/table-options-example)
plugin for a working `WidgetMiddlewarePlugin` and `DashboardPlugin` that
hides a built-in item and adds a `configPage`-backed page.

### Why the transform doesn't take the model

The transform signature is `(defaults) => items` — it deliberately does
**not** receive the `IrisGridModel` or grid state. State-aware menus
(e.g. "relabel an item once a pivot is active", "show *Reset filters*
only when filters exist") are implemented in the middleware: subscribe
to model events, snapshot the value you need, and fold that snapshot
into the transform's identity (see
[Model-aware menus](#model-aware-menus)). The transform itself stays
pure.

This isn't just about keeping the public surface small — it's also
what keeps menu memoization honest. `IrisGrid` caches the computed
item list on `[defaults, transform]` (see `getCachedTransformedOptionItems`),
both of which are stable values/refs. Adding a live `model` argument
would break that: `IrisGridModel` is a long-lived mutable handle whose
identity does not change when `isExpandable`, `filter`, `sorts`, or
`isRollup` flip, so any plugin that read those fields would silently
return stale items until something unrelated invalidated the cache.

By passing a **curated snapshot of values** through the transform's
closure instead, the memo key changes exactly when those values change
and re-runs are driven by actual dependencies. Passing the model itself,
or the full `IrisGrid` instance, is intentionally off the table: the
surface is too large, too volatile, and (in the model's case)
memoization-hostile.

## Transforming the model

Some plugins need more than a custom menu — they need to change the
**model** the grid renders (e.g. wrap it in a proxy that can swap its
inner model in response to a config page). For that there is a second,
symmetric opt-in seam: the `transformModel` prop.

Like `transformTableOptions`, it lives on an iris-grid-specific
interface (`IrisGridModelWidgetProps`), not on the generic
`WidgetComponentProps` / `WidgetPanelProps`, and is threaded down the
middleware chain by the hosts that build the model for you
(`IrisGridPanel`, `GridWidgetPlugin` / `useIrisGridModel`).

```ts
import { type IrisGridModelTransform } from '@deephaven/iris-grid';

// (model: IrisGridModel) => IrisGridModel | Promise<IrisGridModel>
const transformModel: IrisGridModelTransform = model =>
  wrapInMyProxy(model);
```

The host builds the model from `fetch` as usual, then applies
`transformModel` to whatever it built **before** handing it to
`<IrisGrid>`. The returned model must be a drop-in for the input — the
host owns its lifecycle and will `close()` whatever you return, so wrap
rather than discard the model you were given. The transform may be async
if it needs to await dependencies first.

Rules:

- `transformModel` must be **referentially stable**. It is applied when
  the model is (re)built; an unstable transform would rebuild the model.
  Memoize it with `useMemo` / `useCallback`.
- It runs once per model build, not per render, so it is the right place
  for one-time wrapping — not for per-render state.
- This is why model construction stays in the host: the host keeps
  ownership of `fetch`, error/loading state, and `close()`, while the
  plugin only augments the result. A middleware using `transformModel`
  can therefore render the wrapped `Component` and stay a **chained**
  layer instead of taking over model construction and becoming terminal.

### Publishing `transformModel` from middleware

A middleware that needs both seams composes them the same way — run any
upstream transform first, then layer your own — and passes both down to
the `Component` it wraps:

```tsx
import { useMemo, type ComponentType } from 'react';
import {
  type IrisGridModelTransform,
  type IrisGridModelWidgetProps,
  type IrisGridTableOptionsWidgetProps,
} from '@deephaven/iris-grid';

function MyMiddleware({
  Component,
  transformModel,
  transformTableOptions,
  ...props
}: WidgetMiddlewarePanelProps &
  IrisGridModelWidgetProps &
  IrisGridTableOptionsWidgetProps) {
  const composedModel = useMemo<IrisGridModelTransform>(
    () => async model => {
      const base = transformModel != null ? await transformModel(model) : model;
      return wrapInMyProxy(base);
    },
    [transformModel]
  );

  const Next = Component as ComponentType<
    typeof props &
      IrisGridModelWidgetProps &
      IrisGridTableOptionsWidgetProps
  >;
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Next
      {...props}
      transformModel={composedModel}
      transformTableOptions={transformTableOptions}
    />
  );
}
```
