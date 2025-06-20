# Grouped data

Some data can be displayed as a tree. This example uses [MockTreeGridModel](https://github.com/deephaven/web-client-ui/blob/main/packages/grid/src/MockTreeGridModel.ts) to display exandable rows of data:

```jsx live
function Example() {
  const [model] = useState(() => new MockTreeGridModel());

  return <Grid model={model} />;
}
```
