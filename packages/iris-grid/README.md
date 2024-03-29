# @deephaven/iris-grid

This is a library of Deephaven Iris Grid component. Display a grid with enhanced functionality with a Deephaven table.

## Usage

Add the package to your "dependencies":
```
npm install --save @deephaven/iris-grid
```

Then, import and use the component from the package:
```
import { useApi } from '@deephaven/jsapi-bootstrap';
import { IrisGrid, IrisGridModelFactory } from '@deephaven/iris-grid';

// In your initialization, create the model async
const dh = useApi();
const model = await IrisGridModelFactory.makeModel(dh, table);

// In your render function
<IrisGrid dh={dh} model={model} />
```