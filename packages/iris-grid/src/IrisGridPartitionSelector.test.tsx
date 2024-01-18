import React from 'react';
import { render } from '@testing-library/react';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import dh from '@deephaven/jsapi-shim';
import IrisGridPartitionSelector from './IrisGridPartitionSelector';
import IrisGridTestUtils from './IrisGridTestUtils';
import { PartitionConfig, PartitionedGridModel } from './PartitionedGridModel';

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
      <IrisGridPartitionSelector
        model={model}
        onChange={onChange}
        partitionConfig={partitionConfig as PartitionConfig}
      />
    </ApiContext.Provider>
  );
}

it('unmounts successfully without crashing', () => {
  makeIrisGridPartitionSelector();
});

it('should display multiple selectors to match columns', () => {
  const columns = [
    irisGridTestUtils.makeColumn('a'),
    irisGridTestUtils.makeColumn('b'),
  ];
  const component = makeIrisGridPartitionSelector(makeModel(columns));

  const selectors = component.getAllByRole('combobox');
  expect(selectors).toHaveLength(2);
});
