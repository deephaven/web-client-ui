# Sticky behavior

To keep the latest rows visible as new data is appended, use the `isStuckToBottom` prop. This is especially useful in ticking tables, ensuring users always see the most recent updates without needing to scroll manually.

```jsx live
function AsyncExample() {
  // Use a Viewport data model that we update asynchronously to display the data
  const [model, setModel] = useState(
    () => new ViewportDataGridModel(1000000000, 20)
  );
  const grid = useRef();

  // Track the current number of rows we've added
  const [currentRowCount, setCurrentRowCount] = useState(20);

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

  // Effect to add one new row every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRowCount(prevCount => {
        const newCount = prevCount + 1;

        // Generate data for the new row count up to the viewport
        const { top, bottom, left, right } = viewport;
        const data = [];

        // Only generate data for rows that are visible in the viewport
        const startRow = Math.max(0, top);
        const endRow = Math.min(newCount - 1, bottom);

        if (startRow <= endRow) {
          for (let i = startRow; i <= endRow; i += 1) {
            const rowData = [];
            for (let j = left; j <= right; j += 1) {
              rowData.push(`${i},${j}`);
            }
            data.push(rowData);
          }

          model.viewportData = {
            rowOffset: startRow,
            columnOffset: left,
            data,
          };

          // Refresh the grid
          grid.current?.forceUpdate();
        }

        return newCount;
      });

      setModel(() => new ViewportDataGridModel(1000000000, currentRowCount));
    }, 1000); // Add one row every second

    return () => clearInterval(interval);
  }, [model, viewport, grid]);

  // Effect to update viewport data when viewport changes
  const { top, bottom, left, right } = viewport;
  useEffect(() => {
    // Generate the data for the current viewport based on current row count
    const data = [];
    const startRow = Math.max(0, top);
    const endRow = Math.min(currentRowCount - 1, bottom);

    if (startRow <= endRow && currentRowCount > 0) {
      for (let i = startRow; i <= endRow; i += 1) {
        const rowData = [];
        for (let j = left; j <= right; j += 1) {
          rowData.push(`${i},${j}`);
        }
        data.push(rowData);
      }

      model.viewportData = {
        rowOffset: startRow,
        columnOffset: left,
        data,
      };

      // Refresh the grid
      grid.current?.forceUpdate();
    }
  }, [top, bottom, left, right, currentRowCount, model]);

  return (
    <Grid
      model={model}
      onViewChanged={handleViewChanged}
      ref={grid}
      isStuckToBottom
    />
  );
}
```

To ensure the newest columns remain visible in streaming or real-time data grids, you can use the `isStuckToRight` prop. This keeps the view pinned to the right edge as new columns are added dynamically.

```jsx live
function AsyncExample() {
  // Use a Viewport data model that we update asynchronously to display the data
  const [model, setModel] = useState(
    () => new ViewportDataGridModel(15, 1000000)
  );
  const grid = useRef();

  // Track the current number of rows we've added
  const [currentRowCount, setCurrentRowCount] = useState(15);

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

  // Effect to add one new row every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRowCount(prevCount => {
        const newCount = prevCount + 1;

        // Generate data for the new row count up to the viewport
        const { top, bottom, left, right } = viewport;
        const data = [];

        // Only generate data for rows that are visible in the viewport
        const startRow = Math.max(0, top);
        const endRow = Math.min(newCount - 1, bottom);

        if (startRow <= endRow) {
          for (let i = startRow; i <= endRow; i += 1) {
            const rowData = [];
            for (let j = left; j <= right; j += 1) {
              rowData.push(`${i},${j}`);
            }
            data.push(rowData);
          }

          model.viewportData = {
            rowOffset: startRow,
            columnOffset: left,
            data,
          };

          // Refresh the grid
          grid.current?.forceUpdate();
        }

        return newCount;
      });

      setModel(() => new ViewportDataGridModel(currentRowCount, 1000000));
    }, 1000); // Add one row every second

    return () => clearInterval(interval);
  }, [model, viewport, grid]);

  // Effect to update viewport data when viewport changes
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

  return (
    <Grid
      model={model}
      onViewChanged={handleViewChanged}
      ref={grid}
      isStuckToRight
    />
  );
}
```
