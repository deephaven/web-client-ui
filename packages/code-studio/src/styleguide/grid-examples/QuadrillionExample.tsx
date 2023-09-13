import React, { useState } from 'react';
import { Grid, MockGridModel } from '@deephaven/grid';

function QuadrillionExample(): JSX.Element {
  const [model] = useState(
    () =>
      new MockGridModel({
        isEditable: true,
        rowCount: Number.MAX_SAFE_INTEGER,
        columnCount: Number.MAX_SAFE_INTEGER,
      })
  );

  return <Grid model={model} />;
}

export default QuadrillionExample;
