# @deephaven/grid

> Deephaven React grid component

[![NPM](https://img.shields.io/npm/v/@deephaven/grid.svg)](https://www.npmjs.com/package/@deephaven/grid) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save @deephaven/grid
```

## Usage

There are many ways to use the @deephaven/grid package. The minimum requirement for displaying a grid is to implement the [GridModel](https://github.com/deephaven/web-client-ui/blob/main/packages/grid/src/GridModel.ts) class and pass that in as a prop. Below are a few different examples of different ways to extend the `GridModel`.

### Displaying static data

It's easy to display a static array of data using [StaticDataGridModel](https://github.com/deephaven/web-client-ui/blob/main/packages/grid/src/StaticDataGridModel.ts). All you need to do is pass in the data you would like to display, and it will display it.

```jsx
import React, { useState } from 'react';
import { Grid, StaticDataGridModel } from '@deephaven/grid';

const GridExample = () => {
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
};

export default GridExample;
```

### Quadrillions of rows and columns

Both rows and columns are virtualized in this grid solution, so you can theoretically have up to `Number.MAX_SAFE_INTEGER` (about 9 quadrillion) rows and columns. Not only are the row and columns virtualized, but you can drag columns/rows to reposition them without affecting the underlying model, effectiively allowing quadrillions of rows and columns that can be moved around. Here is an example using [MockGridModel](https://github.com/deephaven/web-client-ui/blob/main/packages/grid/src/MockGridModel.ts) that displays quadrillions of rows/columns, which you can scroll around using the mouse or keyboard, edit by double clicking on a value or by typing, or move columns or rows by dragging the headers:

```jsx
import React, { useState } from 'react';
import { Grid, MockGridModel } from '@deephaven/grid';

const GridQuadrillionExample = () => {
  const [model] = useState(
    () =>
      new MockGridModel({
        rowCount: Number.MAX_SAFE_INTEGER,
        columnCount: Number.MAX_SAFE_INTEGER,
        isEditable: true,
      })
  );

  return <Grid model={model} />;
};

export default GridQuadrillionExample;
```

### Expandable rows

Some data can be displayed as a tree. This example uses [MockTreeGridModel](https://github.com/deephaven/web-client-ui/blob/main/packages/grid/src/MockTreeGridModel.ts) to display exandable rows of data:

```jsx
import React, { useState } from 'react';
import { Grid, MockTreeGridModel } from '@deephaven/grid';

const TreeExample = () => {
  const [model] = useState(() => new MockTreeGridModel());

  return <Grid model={model} />;
};

export default TreeExample;
```

### Asynchronous data

When working with big data, it's more than likely you will not have the data accessible immediately, and will be fetching it from a server. Here is an example that simulates setting data by using a timeout:

```jsx
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
  useEffect(() => {
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
  }, [top, bottom, left, right, model]);

  return <Grid model={model} onViewChanged={handleViewChanged} ref={grid} />;
};

export default AsyncExample;
```

## Code Examples

There are [code examples](https://github.com/deephaven/web-client-ui/tree/main/packages/code-studio/src/styleguide/grid-examples) available in the [StyleGuide](https://github.com/deephaven/web-client-ui/tree/main/packages/code-studio/src/styleguide).

# Legal Notices

Deephaven Data Labs and any contributors grant you a license to the content of this repository under the Apache 2.0 License, see the [LICENSE](https://github.com/deephaven/web-client-ui/blob/main/LICENSE) file.
