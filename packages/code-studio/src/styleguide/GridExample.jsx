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
