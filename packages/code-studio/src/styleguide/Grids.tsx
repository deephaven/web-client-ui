import React, { ReactElement, useState } from 'react';
import {
  Grid,
  GridThemeType,
  MockGridModel,
  MockTreeGridModel,
  ThemeContext,
} from '@deephaven/grid';
import { IrisGrid } from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { Flex } from '@adobe/react-spectrum';
import MockIrisGridTreeModel from './MockIrisGridTreeModel';
import StaticExample from './grid-examples/StaticExample';
import QuadrillionExample from './grid-examples/QuadrillionExample';
import TreeExample from './grid-examples/TreeExample';
import AsyncExample from './grid-examples/AsyncExample';
import DataBarExample from './grid-examples/DataBarExample';
import SampleSection from './SampleSection';

function Grids(): ReactElement {
  const dh = useApi();
  const [irisGridModel] = useState(
    new MockIrisGridTreeModel(dh, new MockTreeGridModel())
  );
  const [irisGridCompactModel] = useState(
    new MockIrisGridTreeModel(dh, new MockTreeGridModel())
  );
  const [irisGridSpaciousModel] = useState(
    new MockIrisGridTreeModel(dh, new MockTreeGridModel())
  );
  const [model] = useState(new MockGridModel());
  const [theme] = useState<Partial<GridThemeType>>({
    autoSelectRow: true,
  });
  const [contextTheme] = useState<Partial<GridThemeType>>({
    rowHeight: 40,
  });
  return (
    <div>
      <ThemeContext.Provider value={contextTheme}>
        <h2 className="ui-title">Grid</h2>
        <SampleSection name="grids-grid" component={Flex}>
          <Grid model={model} theme={theme} />
        </SampleSection>
        <h2 className="ui-title">Static Data</h2>
        <SampleSection name="grids-static" component={Flex} height={200}>
          <StaticExample />
        </SampleSection>
        <h2 className="ui-title">Data Bar</h2>
        <SampleSection name="grids-data-bar" component={Flex} height={500}>
          <DataBarExample />
        </SampleSection>
        <h2 className="ui-title">Quadrillion rows and columns</h2>
        <SampleSection
          name="grids-quadrillion"
          component={Flex}
          position="relative"
          height={500}
        >
          <QuadrillionExample />
        </SampleSection>
        <h2 className="ui-title">Async example</h2>
        <SampleSection
          name="grids-async"
          component={Flex}
          position="relative"
          height={500}
        >
          <AsyncExample />
        </SampleSection>
        <h2 className="ui-title">Tree Grid</h2>
        <SampleSection name="grids-tree" component={Flex} height={500}>
          <TreeExample />
        </SampleSection>
        <h2 className="ui-title">Iris Grid</h2>
        <SampleSection name="grids-iris" component={Flex} height={500}>
          <IrisGrid model={irisGridModel} density="regular" />
        </SampleSection>
        <h2 className="ui-title">Iris Grid Compact</h2>
        <SampleSection name="grids-iris-compact" component={Flex} height={500}>
          <IrisGrid model={irisGridCompactModel} density="compact" />
        </SampleSection>
        <h2 className="ui-title">Iris Grid Spacious</h2>
        <SampleSection name="grids-iris-spacious" component={Flex} height={500}>
          <IrisGrid model={irisGridSpaciousModel} density="spacious" />
        </SampleSection>
      </ThemeContext.Provider>
    </div>
  );
}

export default Grids;
