import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import dh from '@deephaven/jsapi-shim';
import IrisGridPartitionSelector from './IrisGridPartitionSelector';
import IrisGridTestUtils from './IrisGridTestUtils';

function makeIrisGridPartitionSelector(
  table = new IrisGridTestUtils(dh).makeTable(),
  columns = [new IrisGridTestUtils(dh).makeColumn()],
  onChange = jest.fn(),
  onMerge = jest.fn(),
  getFormattedString = jest.fn(value => `${value}`)
) {
  return render(
    <IrisGridPartitionSelector
      dh={dh}
      table={table}
      columns={columns}
      getFormattedString={getFormattedString}
      onChange={onChange}
      onMerge={onMerge}
    />
  );
}

it('unmounts successfully without crashing', () => {
  makeIrisGridPartitionSelector();
});

it('calls onMerge when close button is clicked', () => {
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
