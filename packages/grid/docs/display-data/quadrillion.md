# Quadrillions of rows and columns

Both rows and columns are virtualized in this grid solution, so you can theoretically have up to `Number.MAX_SAFE_INTEGER` (about 9 quadrillion) rows and columns. Not only are the row and columns virtualized, but you can drag columns/rows to reposition them without affecting the underlying model, effectively allowing quadrillions of rows and columns that can be moved around. Here is an example using [MockGridModel](https://github.com/deephaven/web-client-ui/blob/main/packages/grid/src/MockGridModel.ts) that displays quadrillions of rows/columns. You can:

- scroll around using the mouse or keyboard
- edit by double clicking on a value or by typing
- move columns or rows by dragging the headers.

```jsx live
function Example() {
  const model = useMemo(
    () =>
      new MockGridModel({
        rowCount: Number.MAX_SAFE_INTEGER,
        columnCount: Number.MAX_SAFE_INTEGER,
        isEditable: true,
      }),
    []
  );

  return <Grid model={model} />;
}
```
