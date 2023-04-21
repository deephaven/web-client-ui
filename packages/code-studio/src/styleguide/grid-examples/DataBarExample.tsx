import React, { useState } from 'react';
import { Grid, MockDataBarGridModel } from '@deephaven/grid';
import { ColorMap } from 'packages/grid/src/DataBarGridModel';

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
  const positiveColors: ColorMap = new Map([
    [3, '#72d7df'],
    [4, '#ac9cf4'],
  ]);
  positiveColors.set(5, ['#f3cd5b', '#9edc6f']);
  positiveColors.set(19, ['#42f54b', '#42b9f5', '#352aa8']);

  const negativeColors: ColorMap = new Map([
    [3, '#f3cd5b'],
    [4, '#ac9cf4'],
  ]);
  negativeColors.set(5, ['#f95d84', '#f3cd5b']);
  negativeColors.set(19, ['#e05536', '#e607de', '#e6e207']);

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
    [19, 'RTL'],
  ]);
  const textAlignments = new Map([
    [9, 'left'],
    [11, 'left'],
  ]);
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
  // Decimals
  data.push([
    100,
    10.5,
    11.234,
    -20.5,
    -50,
    -2.5,
    -15.1234,
    94.254,
    25,
    44.4444,
    -50.5,
  ]);

  // Big values
  data.push([
    1000000,
    10,
    200,
    -20000,
    -2000000,
    -25,
    -900000,
    800000,
    100000,
    450000,
    1,
  ]);

  // RTL gradient with multiple colors
  data.push(columnData.slice());

  // Both data bar and text
  data.push(columnData.slice());
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
        markers
      )
  );

  return <Grid model={model} />;
}

export default DataBarExample;
