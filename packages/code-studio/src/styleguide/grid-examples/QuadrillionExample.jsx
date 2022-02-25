import React, { useState } from 'react';
import { Grid, MockGridModel } from '@deephaven/grid';

const QuadrillionExample = () => {
  const [model] = useState(
    () =>
      new MockGridModel({
        isEditable: true,
        rowCount: Number.MAX_SAFE_INTEGER,
        columnCount: Number.MAX_SAFE_INTEGER,
      })
  );

  return <Grid model={model} />;
};

export default QuadrillionExample;
