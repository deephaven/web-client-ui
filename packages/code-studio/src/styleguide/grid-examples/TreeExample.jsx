import React, { useState } from 'react';
import { Grid, MockTreeGridModel } from '@deephaven/grid';

const TreeExample = () => {
  const [model] = useState(() => new MockTreeGridModel());

  return <Grid model={model} />;
};

export default TreeExample;
