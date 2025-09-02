import { act, render } from '@testing-library/react';
import { ThemeProvider } from '@deephaven/components';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import dh from '@deephaven/jsapi-shim';
import IrisGridPartitionSelector from './IrisGridPartitionSelector';
import IrisGridTestUtils from './IrisGridTestUtils';
import {
  type PartitionConfig,
  type PartitionedGridModel,
} from './PartitionedGridModel';

const irisGridTestUtils = new IrisGridTestUtils(dh);

function makeModel(
  columns = irisGridTestUtils.makeColumns()
): PartitionedGridModel {
  const model = {
    ...irisGridTestUtils.makeModel(),
    partitionKeysTable: jest.fn(() =>
      Promise.resolve(irisGridTestUtils.makeTable())
    ),
    partitionColumns: columns,
    partitionBaseTable: jest.fn(() =>
      Promise.resolve(irisGridTestUtils.makeTable())
    ),
  } as unknown as PartitionedGridModel;
  return model;
}

function makeIrisGridPartitionSelector(
  model = makeModel(),
  onChange = jest.fn(),
  partitionConfig = { partitions: [], mode: 'merged' }
) {
  return render(
    <ApiContext.Provider value={dh}>
      <ThemeProvider themes={[]}>
        <IrisGridPartitionSelector
          model={model}
          onChange={onChange}
          partitionConfig={partitionConfig as PartitionConfig}
        />
      </ThemeProvider>
    </ApiContext.Provider>
  );
}

it('mounts successfully without crashing', async () => {
  await act(() => makeIrisGridPartitionSelector());
});

it('should display multiple selectors to match columns', async () => {
  const columns = [
    irisGridTestUtils.makeColumn('a'),
    irisGridTestUtils.makeColumn('b'),
  ];
  const component = makeIrisGridPartitionSelector(makeModel(columns));

  const selectors = await component.findAllByText('Select a key');
  expect(selectors).toHaveLength(2);
});
