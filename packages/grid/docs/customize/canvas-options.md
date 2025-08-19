# Canvas Rendering Options

You can customize the appearance and behavior of your canvas by passing in canvasOptions. All parameters are optional and will fall back to default values if omitted. See [CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) for a full list of available rendering options.

> **Note:** Setting `alpha: false` in your canvas options will improve rendering performance by disabling transparency calculations when they're not needed.

```jsx live
function Example() {
  const model = useMemo(
    () =>
      new StaticDataGridModel(
        [
          ['Matthew Austins', 'Toronto', 35, 22],
          ['Doug Millgore', 'Toronto', 14, 33],
          ['Bart Marchant', 'Boston', 20, 14],
          ['Luigi Dabest', 'Pittsburgh', 66, 33],
        ],
        ['Name', 'Team', 'Goals', 'Assists']
      ),
    []
  );

  return (
    <div
      style={{
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '160px',
          height: '160px',
          backgroundColor: 'blue',
          borderRadius: '50%',
          top: '50px',
          left: '200px',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '160px',
          height: '160px',
          backgroundColor: 'green',
          top: '120px',
          right: '150px',
          zIndex: 0,
        }}
      />
      <Grid
        model={model}
        canvasOptions={{ alpha: true }}
        theme={{ backgroundColor: '#00000022' }}
        style={{ position: 'relative', zIndex: 1 }}
      />
    </div>
  );
}
```
