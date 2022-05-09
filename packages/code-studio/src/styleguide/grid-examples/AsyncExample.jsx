import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Grid, ViewportDataGridModel } from '@deephaven/grid';

/**
 * An example showing data loading asnychronously for a grid.
 */
const AsyncExample = () => {
  // Use a Viewport data model that we update asynchronously to display the data
  const [model] = useState(
    () => new ViewportDataGridModel(1_000_000_000, 1_000_000)
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
  useEffect(
    function mockLoadViewportAndData() {
      let isCancelled = false;

      // Simulate fetching data asynchronously by using at timeout
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
    },
    [top, bottom, left, right, model]
  );

  return <Grid model={model} onViewChanged={handleViewChanged} ref={grid} />;
};

export default AsyncExample;
