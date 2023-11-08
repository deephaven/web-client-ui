import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import dh from '@deephaven/jsapi-shim';
import IrisGridPartitionSelector from './IrisGridPartitionSelector';
import IrisGridTestUtils from './IrisGridTestUtils';

function makeIrisGridPartitionSelector(
  table = new IrisGridTestUtils(dh).makeTable(),
  columns = [new IrisGridTestUtils(dh).makeColumn()],
  onChange = jest.fn(),
  onDone = jest.fn(),
  getFormattedString = jest.fn(value => `${value}`),
  onAppend = undefined
) {
  return render(
    <IrisGridPartitionSelector
      dh={dh}
      table={table}
      columns={columns}
      getFormattedString={getFormattedString}
      onChange={onChange}
      onDone={onDone}
      onAppend={onAppend}
    />
  );
}

it('unmounts successfully without crashing', () => {
  makeIrisGridPartitionSelector();
});

it('calls onDone when close button is clicked', () => {
  const onDone = jest.fn();
  const component = makeIrisGridPartitionSelector(
    undefined,
    undefined,
    undefined,
    onDone
  );

  const closeButton = component.getAllByRole('button')[2];
  fireEvent.click(closeButton);
  expect(onDone).toHaveBeenCalled();
});

it('should display multiple selectors to match columns', () => {
  const columns = [
    new IrisGridTestUtils(dh).makeColumn(),
    new IrisGridTestUtils(dh).makeColumn(),
  ];
  const component = makeIrisGridPartitionSelector(undefined, columns);

  const selectors = component.getAllByRole('textbox');
  expect(selectors).toHaveLength(2);
});

it('calls handlePartitionChange when PartitionSelectorSearch value changes', () => {
  const handlePartitionChange = jest.spyOn(
    IrisGridPartitionSelector.prototype,
    'handlePartitionChange'
  );
  const component = makeIrisGridPartitionSelector();

  const partitionSelectorSearch = component.getByRole('textbox');
  fireEvent.change(partitionSelectorSearch, { target: { value: 'test' } });
  expect(handlePartitionChange).toHaveBeenCalledWith(
    0,
    expect.objectContaining({
      target: expect.objectContaining({ value: 'test' }),
    })
  );
});
