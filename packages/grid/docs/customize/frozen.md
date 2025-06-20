# How to freeze columns

Extending [GridModel](https://github.com/deephaven/web-client-ui/blob/main/packages/grid/src/GridModel.ts) allows you to customize behavior, such as freezing rows and/or columns to the side of a viewport.

```jsx live
function Example() {
  const [model] = useState(
    () =>
      new MockGridModel({
        floatingLeftColumnCount: 3,
        floatingTopRowCount: 1,
      })
  );

  return <Grid model={model} />;
}
```
