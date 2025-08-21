# Asynchronous data

When working with big data, it's more than likely you will not have the data accessible immediately, and will be fetching it from a server. Here is an example that simulates setting data by using a timeout:

```jsx live
/**
 * An example showing data loading asynchronously for a grid.
 */
function AsyncExample() {
  // Use a Viewport data model that we update asynchronously to display the data
  const model = useMemo(
    () => new ViewportDataGridModel(1000000000, 1000000),
    []
  );
  const grid = useRef();

  // The current viewport
  const [viewport, setViewport] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  const handleViewChanged = useCallback(metrics => {
    // Pull out the viewport from the metrics
    const { top, bottom, left, right } = metrics;
    setViewport({ top, bottom, left, right });
  }, []);

  const { top, bottom, left, right } = viewport;
  useEffect(() => {
    let isCancelled = false;

    // Simulate fetching data asynchronously by using a timeout
    setTimeout(() => {
      if (isCancelled) return;

      // Generate the data for the viewport
      const data = [];
      for (let i = top; i <= bottom; i += 1) {
        const rowData = [];
        for (let j = left; j <= right; j += 1) {
          rowData.push(`${i},${j}`);
        }
        data.push(rowData);
      }
      model.viewportData = {
        rowOffset: top,
        columnOffset: left,
        data,
      };

      // Refresh the grid
      grid.current.forceUpdate();
    }, 250);
    return () => {
      isCancelled = true;
    };
  }, [top, bottom, left, right, model]);

  return <Grid model={model} onViewChanged={handleViewChanged} ref={grid} />;
}
```
