# How to automatically select columns and rows

In addition to customizing the color, you can use a custom theme to change some of the Grid's behavior. All parameters are optional and will fall back to default values if omitted. See [GridTheme](https://github.com/deephaven/web-client-ui/blob/main/packages/grid/src/GridTheme.ts) for full list of properties and default values.

In this example below, we set the `autoSelectColumn` property to `true`, which will automatically select the entire column when you click inside the grid.

```jsx live
function Example() {
  const [model] = useState(() => new MockTreeGridModel());
  const theme = useMemo(() => ({ autoSelectColumn: true }), []);

  return <Grid model={model} theme={theme} />;
}
```
