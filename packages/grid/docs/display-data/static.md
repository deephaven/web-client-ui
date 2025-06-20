# Static data

It's easy to display a static array of data using [StaticDataGridModel](https://github.com/deephaven/web-client-ui/blob/main/packages/grid/src/StaticDataGridModel.ts). Pass in the data you'd like to display, and the grid displays it. Simple!

```jsx live
function Example() {
  const [model] = useState(
    new StaticDataGridModel(
      [
        ['Matthew Austins', 'Toronto', 35, 22],
        ['Doug Millgore', 'Toronto', 14, 33],
        ['Bart Marchant', 'Boston', 20, 14],
        ['Luigi Dabest', 'Pittsburgh', 66, 33],
      ],
      ['Name', 'Team', 'Goals', 'Assists']
    )
  );

  return <Grid model={model} />;
}
```
