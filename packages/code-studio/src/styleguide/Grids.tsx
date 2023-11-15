/* eslint-disable react/jsx-props-no-spreading */
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
import { sampleSectionIdAndClassesSpectrum } from './utils';

function Grids(): ReactElement {
  const dh = useApi();
  const [irisGridModel] = useState(
    new MockIrisGridTreeModel(dh, new MockTreeGridModel())
  );
  const [model] = useState(new MockGridModel());
  const [theme] = useState<Partial<GridThemeType>>({
    autoSelectRow: true,
  });
  const [contextTheme] = useState<Partial<GridThemeType>>({
    // Unicode characters '⊟' and '⊞' used by the Grid tree don't exist in Arial
    // font, so we fallback to DejaVu Sans which should exist on both the CI and
    // the local Docker environments. Otherwise the sans-serif fallback is at the
    // mercy of the OS and whatever installed fonts are available which is not
    // the same in the 2 environments.
    font: '12px Arial, "DejaVu Sans", sans-serif',
    rowHeight: 40,
  });
  return (
    <div>
      <ThemeContext.Provider value={contextTheme}>
        <h2 className="ui-title">Grid</h2>
        <Flex {...sampleSectionIdAndClassesSpectrum('grids-grid')}>
          <Grid model={model} theme={theme} />
        </Flex>
        <h2 className="ui-title">Static Data</h2>
        <Flex
          {...sampleSectionIdAndClassesSpectrum('grids-static')}
          height={200}
        >
          <StaticExample />
        </Flex>
        <h2 className="ui-title">Data Bar</h2>
        <Flex
          {...sampleSectionIdAndClassesSpectrum('grids-data-bar')}
          height={500}
        >
          <DataBarExample />
        </Flex>
        <h2 className="ui-title">Quadrillion rows and columns</h2>
        <Flex
          {...sampleSectionIdAndClassesSpectrum('grids-quadrillion')}
          position="relative"
          height={500}
        >
          <QuadrillionExample />
        </Flex>
        <h2 className="ui-title">Async example</h2>
        <Flex
          {...sampleSectionIdAndClassesSpectrum('grids-async')}
          position="relative"
          height={500}
        >
          <AsyncExample />
        </Flex>
        <h2 className="ui-title">Tree Grid</h2>
        <Flex {...sampleSectionIdAndClassesSpectrum('grids-tree')} height={500}>
          <TreeExample />
        </Flex>
        <h2 className="ui-title">Iris Grid</h2>
        <Flex {...sampleSectionIdAndClassesSpectrum('grids-iris')} height={500}>
          <IrisGrid model={irisGridModel} />
        </Flex>
      </ThemeContext.Provider>
    </div>
  );
}

export default Grids;
