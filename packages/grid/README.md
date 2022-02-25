# @deephaven/grid

> Deephaven React grid component

[![NPM](https://img.shields.io/npm/v/@deephaven/grid.svg)](https://www.npmjs.com/package/@deephaven/grid) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save @deephaven/grid
```

## Usage

There are many ways to use the @deephaven/grid package. The minimum requirement for displaying a grid is to implement the [GridModel](./src/GridModel.ts) class and pass that in as a prop. Below are a few different examples of different ways to extend the `GridModel`.

### StaticDataGridModel

It's easy to display a static array of data using [StaticDataGridModel](./src/StaticDataGridModel.ts). All you need to do is pass in the data you would like to display, and it will display it.

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

### Custom GridModel Client Side Example

The simplest example is implementing a mock `GridModel` of static, client side data. In this example, we're displaying a 10x100 grid that simply returns some text for

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

# Legal Notices

Deephaven Data Labs and any contributors grant you a license to the content of this repository under the Apache 2.0 License, see the [LICENSE](../../LICENSE) file.
