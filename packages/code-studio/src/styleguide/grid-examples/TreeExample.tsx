import React, { useState, type JSX } from 'react';
import { Grid, MockTreeGridModel } from '@deephaven/grid';

function TreeExample(): JSX.Element {
  const [model] = useState(() => new MockTreeGridModel());

  return <Grid model={model} />;
}

export default TreeExample;
