# Middleware Plugin Architecture

## Overview

Middleware plugins allow you to wrap and enhance existing widget plugins without modifying them. Multiple middleware plugins can target the same widget type and are chained in registration order, with the first registered middleware as the outermost wrapper.

```
┌─────────────────────────────┐
│ Middleware A (outermost)    │
│  ┌────────────────────────┐ │
│  │ Middleware B            │ │
│  │  ┌───────────────────┐ │ │
│  │  │ Base Widget       │ │ │
│  │  └───────────────────┘ │ │
│  └────────────────────────┘ │
└─────────────────────────────┘
```

## Key Concepts

- **Base plugin**: A standard `WidgetPlugin` that renders a widget type. Exactly one base plugin handles each type (last registered wins if duplicates exist).
- **Middleware plugin**: A `WidgetMiddlewarePlugin` that wraps the next component in the chain. It receives a `Component` prop and must render it to continue the chain.
- **Chaining**: Middleware is applied in registration order. The first middleware registered becomes the outermost wrapper. Each middleware renders the next via its `Component` prop.

## Types

### `WidgetMiddlewarePlugin`

```tsx
interface WidgetMiddlewarePlugin<T = unknown> {
  name: string;
  type: PluginType.WIDGET_PLUGIN;
  supportedTypes: string | string[];
  isMiddleware: true;

  // Required: wraps the widget component
  component: React.ComponentType<WidgetMiddlewareComponentProps<T>>;

  // Optional: wraps the panel component (only needed if the base plugin defines panelComponent)
  panelComponent?: React.ComponentType<WidgetMiddlewarePanelProps<T>>;
}
```

### `WidgetMiddlewareComponentProps`

```tsx
interface WidgetMiddlewareComponentProps<T = unknown> extends WidgetComponentProps<T> {
  // The next component in the chain — render this to continue
  Component: React.ComponentType<WidgetComponentProps<T>>;
}
```

### `WidgetMiddlewarePanelProps`

```tsx
interface WidgetMiddlewarePanelProps<T = unknown> extends WidgetPanelProps<T> {
  // The next panel component in the chain — render this to continue
  Component: React.ComponentType<WidgetPanelProps<T>>;
}
```

## Rendering Paths

The middleware is applied in two different contexts:

| Context | File | When Used |
|---|---|---|
| Dashboard panels | `WidgetLoaderPlugin.tsx` | Widget opened as a panel via `PanelEvent.OPEN` |
| Inline/embedded | `WidgetView.tsx` | Widget rendered inline (e.g., inside a document) |

Both paths collect middleware for the widget type and use `createChainedComponent` to build the wrapper chain.

## Usage Examples

### Basic Middleware — Add a Toolbar

```tsx
import { PluginType, type WidgetMiddlewareComponentProps } from '@deephaven/plugin';

function MyToolbar({ Component, ...props }: WidgetMiddlewareComponentProps) {
  return (
    <div className="my-toolbar-wrapper">
      <div className="toolbar">
        <button onClick={() => console.log('Action!')}>Do Something</button>
      </div>
      <Component {...props} />
    </div>
  );
}

const myToolbarPlugin = {
  name: 'my-toolbar-middleware',
  type: PluginType.WIDGET_PLUGIN,
  component: MyToolbar,
  supportedTypes: 'deephaven.plot.express.DeephavenFigure',
  isMiddleware: true,
} satisfies WidgetMiddlewarePlugin;
```

### Intercepting Props

```tsx
function PropsInterceptor({ Component, fetch, ...rest }: WidgetMiddlewareComponentProps) {
  // Modify or augment props before passing them to the wrapped component
  const enhancedFetch = useCallback(async () => {
    const widget = await fetch();
    // Transform or cache the widget data
    return widget;
  }, [fetch]);

  return <Component {...rest} fetch={enhancedFetch} />;
}
```

### Adding Context

```tsx
const MyFeatureContext = createContext<MyFeatureState | null>(null);

function FeatureProvider({ Component, ...props }: WidgetMiddlewareComponentProps) {
  const [state, setState] = useState<MyFeatureState>({ enabled: true });

  return (
    <MyFeatureContext.Provider value={state}>
      <Component {...props} />
    </MyFeatureContext.Provider>
  );
}
```

### Conditional Wrapping

```tsx
function ConditionalMiddleware({ Component, ...props }: WidgetMiddlewareComponentProps) {
  const shouldWrap = useSomeCondition();

  if (!shouldWrap) {
    // Pass through without wrapping
    return <Component {...props} />;
  }

  return (
    <div className="conditional-wrapper">
      <Component {...props} />
    </div>
  );
}
```

### Targeting Multiple Widget Types

```tsx
const multiTypeMiddleware = {
  name: 'multi-type-middleware',
  type: PluginType.WIDGET_PLUGIN,
  component: MyMiddlewareComponent,
  supportedTypes: ['deephaven.plot.express.DeephavenFigure', 'deephaven.ui.Element'],
  isMiddleware: true,
} satisfies WidgetMiddlewarePlugin;
```

## Registration

Middleware plugins are registered the same way as regular plugins — they are included in the plugin map passed to `PluginsContext`. Registration order determines chaining order.

```tsx
// In the plugin map, order matters:
const plugins = new Map([
  ['base-widget', baseWidgetPlugin],           // Base plugin
  ['middleware-a', middlewarePluginA],          // Outermost wrapper
  ['middleware-b', middlewarePluginB],          // Inner wrapper (closer to base)
]);
```

## Rules

1. **A base plugin is required.** Middleware registered for a type with no base plugin has no effect and produces a warning.
2. **Last base plugin wins.** If multiple non-middleware plugins register for the same type, the last one replaces earlier ones (with a warning).
3. **Middleware must render `Component`.** If a middleware doesn't render the `Component` prop, the rest of the chain (including the base widget) will not appear.
4. **Middleware must spread props.** Pass all received props to `Component` to ensure the base widget and other middleware receive them.
5. **`panelComponent` middleware is separate.** When the base plugin defines a `panelComponent`, only middleware that also defines `panelComponent` is applied. Middleware with only `component` is silently skipped in the panel path — it will have no effect for that widget type.

## Cross-Plugin Dependencies

Plugins load sequentially in dependency order (topologically sorted by the `dependencies` field, with manifest order preserved among independent plugins). A plugin can expose its exports for later plugins to import at runtime by declaring a `package` field in the manifest.

```
1. pivot loads        → exports registered under "@deephaven/js-plugin-pivot"
2. grid-toolbar loads → import "@deephaven/js-plugin-pivot" ✓
```

### Optional Manifest `package` Field

When present, the plugin's exports are made available to other plugins under this key, so they can be imported via standard `import` statements.

```json
{
  "plugins": [
    { "name": "pivot", "main": "src/js/dist/index.js", "version": "0.0.0", "package": "@deephaven/js-plugin-pivot" },
    { "name": "grid-toolbar", "main": "src/js/dist/bundle/index.js", "version": "0.0.0", "dependencies": ["@deephaven/js-plugin-pivot"] }
  ]
}
```

Here `pivot` is importable (has `package`); `grid-toolbar` declares it as a dependency and only consumes.

### Consuming Another Plugin

1. **Externalize** in your build config:
   ```ts
   // vite.config.ts
   rollupOptions: { external: ['@deephaven/js-plugin-pivot'] }
   ```

2. **Import normally** in source:
   ```ts
   import { IrisGridPivotModel } from '@deephaven/js-plugin-pivot';
   ```

3. **Provide types.** In a monorepo, use `paths` in `tsconfig.json`:
   ```json
   { "compilerOptions": { "paths": {
     "@deephaven/js-plugin-pivot": ["../pivot/src/js/src/index.ts"]
   }}}
   ```
   For cross-repo dependencies, use ambient declarations instead:
   ```ts
   // pivotPlugin.d.ts
   declare module '@deephaven/js-plugin-pivot' { export class IrisGridPivotModel {} }
   ```

4. **Declare dependencies** in `manifest.json`:
   ```json
   {
     "name": "grid-toolbar",
     "main": "src/js/dist/bundle/index.js",
     "version": "0.0.0",
     "dependencies": ["@deephaven/js-plugin-pivot"]
   }
   ```
   The loader topologically sorts plugins so dependencies load first. If
   `dependencies` is omitted, manifest order is preserved.

### Rules

- Plugins are topologically sorted by their `dependencies` before loading.
  Circular dependencies throw an error at load time.
- Only plugins with a `package` field are importable by other plugins.
- The `package` value must exactly match the `import` string.
- Dependency values in `dependencies` must match a `package` field of another plugin.
