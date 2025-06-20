# JavaScript Data grid

Deephaven's data grid is an [open-source](https://github.com/deephaven/web-client-ui/blob/main/LICENSE), [React.js](https://reactjs.org/) package that is purpose-built for displaying [massive](/blog/2022/01/24/displaying-a-quadrillion-rows) streaming data sets and is written with TypeScript. Our grid renders viewported data from your own server-side model or a Deephaven worker, using [HTML Canvas](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas). It excels at displaying large data sets for data science, monitoring, analytics, and from streaming data sources. We built it to meet the sophisticated and complex needs of quant traders, but it has some really neat features for data scientists. It was inspired by the now-defunct [hypergrid](https://github.com/fin-hypergrid/core).

Rather than DOM virtualization, our approach uses a canvas-based grid to draw only what is on screen. You fetch just what is displayed (plus a buffer for snappier scrolling), and the grid will re-draw exactly what is displayed. This allows you to display quadrillions of rows and columns, all at 60fps.

<GridMarketing />

## Data grid comes in two flavors:

1. [@deephaven/grid](https://www.npmjs.com/package/@deephaven/grid) for standalone use cases, where you bring your own data model and backend.
2. [@deephaven/iris-grid](https://www.npmjs.com/package/@deephaven/iris-grid) extends the former with additional features for use with the Deephaven [JS API](/core/docs/reference/js-api/concepts), and is expected to run against a Deephaven backend. If you are [building your own frontend](https://github.com/deephaven-examples/deephaven-react-app) and running against a Deephaven table, we suggest you use this version.

<div className="row">
<div className="col">

## Grid features

Bring your own server-side data model:

- Fast rendering, using an optimized HTML canvas element
- Support for quadrillions of rows and columns
- Ticking/streaming data support
- A flexible data model that can add, remove, or change a tables rows or even columns
- Excel-like keyboard shortcuts
- Resizable rows/columns
- Rearrangeable rows/columns
- Freezable rows/columns
- Column visibility options; hideable columns
- Customizable themes
- Row, column and range selections
- Input for editable models

</div>
<div className="col">

## Iris grid features

Additional features when backed by Deephaven server instance:

- Automatic row and column viewporting
- Sorting, multi-column sorting, reversing
- Advanced filtering
- Column descriptions
- Automatic column summary statistics
- Row grouping
- Aggregations
- Conditional row/cell formatting
- CSV export
- Formula-based columns added to tables

</div>
</div>

> [!NOTE]
> Grid was built for desktop use cases, and doesn't currently respond to touch-events. It will render on mobile, but is not interactive.

## Quickstart

```js
// Standalone grid for use with your own model
// npm install --save @deephaven/grid

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
