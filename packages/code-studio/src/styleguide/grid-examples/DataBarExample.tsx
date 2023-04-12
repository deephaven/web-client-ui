import React, { useState } from 'react';
import { Grid, MockDataBarGridModel } from '@deephaven/grid';

function DataBarExample() {
  const columnData = [100, 50, 20, 10, -10, -20, -50, -30, 100, 0, 1];
  const data: number[][] = [];
  const columnAxes = new Map([
    [0, 'proportional'],
    [1, 'middle'],
    [2, 'directional'],
    [6, 'directional'],
    [7, 'directional'],
    [8, 'directional'],
    [9, 'directional'],
    [10, 'directional'],
  ]);
  const positiveColors = new Map([
    [3, '#72d7df'],
    [4, '#ac9cf4'],
  ]);
  const negativeColors = new Map([
    [3, '#f3cd5b'],
    [4, '#ac9cf4'],
  ]);
  const valuePlacements = new Map([
    [6, 'hide'],
    [7, 'overlap'],
    [8, 'overlap'],
    [9, 'overlap'],
  ]);
  const opacities = new Map([
    [7, 0.5],
    [8, 0.5],
    [9, 0.5],
  ]);
  const directions = new Map([
    [8, 'RTL'],
    [10, 'RTL'],
    [16, 'RTL'],
  ]);
  const textAlignments = new Map([
    [9, 'left'],
    [11, 'left'],
  ]);
  const hasGradients = new Map([[5, true]]);
  const markers = new Map([
    [
      12,
      [
        { column: 13, color: 'white' },
        { column: 14, color: 'gray' },
      ],
    ],
  ]);
  for (let i = 0; i < 13; i += 1) {
    data.push(columnData.slice());
  }
  data.push([70, 60, 30, 20, -10, -30, -20, -50, 80, 50, 10]);
  data.push([50, 20, 10, 0, 0, -10, -30, 10, 90, 20, 40]);
  data.push([-100, -90, -80, -70, -60, -50, -40, -30, -20, -10, 0]);
  data.push(columnData.slice());
  const [model] = useState(
    () =>
      new MockDataBarGridModel(
        data,
        columnAxes,
        positiveColors,
        negativeColors,
        valuePlacements,
        opacities,
        directions,
        textAlignments,
        markers,
        hasGradients
      )
  );

  return <Grid model={model} />;
}

export default DataBarExample;
