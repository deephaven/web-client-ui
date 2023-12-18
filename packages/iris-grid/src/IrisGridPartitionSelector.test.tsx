import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import dh from '@deephaven/jsapi-shim';
import IrisGridPartitionSelector from './IrisGridPartitionSelector';
import IrisGridTestUtils from './IrisGridTestUtils';
import { PartitionConfig } from './PartitionedGridModel';

function makeIrisGridPartitionSelector(
  table = new IrisGridTestUtils(dh).makeTable(),
  columns = [new IrisGridTestUtils(dh).makeColumn()],
  onChange = jest.fn(),
  onMerge = jest.fn(),
  onKeyTable = jest.fn(),
  getFormattedString = jest.fn(value => `${value}`),
  partitionConfig = { partitions: [], mode: 'merged' }
) {
  const tablePromise = Promise.resolve(table);
  return render(
    <IrisGridPartitionSelector
      dh={dh}
      tablePromise={tablePromise}
      columns={columns}
      getFormattedString={getFormattedString}
      onChange={onChange}
      onMerge={onMerge}
      onKeyTable={onKeyTable}
      partitionConfig={partitionConfig as PartitionConfig}
    />
  );
}

it('unmounts successfully without crashing', () => {
  makeIrisGridPartitionSelector();
});

it('calls onKeyTable when key button is clicked', () => {
  const onKeyTable = jest.fn();
  const component = makeIrisGridPartitionSelector(
    undefined,
    undefined,
    undefined,
    undefined,
    onKeyTable
  );

  const keyButton = component.getAllByRole('button')[0];
  fireEvent.click(keyButton);
  expect(onKeyTable).toHaveBeenCalled();
});

it('calls onMerge when merge button is clicked', () => {
  const onMerge = jest.fn();
  const component = makeIrisGridPartitionSelector(
    undefined,
    undefined,
    undefined,
    onMerge
  );

  const mergeButton = component.getAllByRole('button')[1];
  fireEvent.click(mergeButton);
  expect(onMerge).toHaveBeenCalled();
});

it('should display multiple selectors to match columns', () => {
  const columns = [
    new IrisGridTestUtils(dh).makeColumn('a'),
    new IrisGridTestUtils(dh).makeColumn('b'),
  ];
  const component = makeIrisGridPartitionSelector(undefined, columns);

  const selectors = component.getAllByRole('combobox');
  expect(selectors).toHaveLength(2);
});
