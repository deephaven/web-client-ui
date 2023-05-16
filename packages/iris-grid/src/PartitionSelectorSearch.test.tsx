import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dh from '@deephaven/jsapi-shim';
import type { Table } from '@deephaven/jsapi-types';
import PartitionSelectorSearch from './PartitionSelectorSearch';
import IrisGridTestUtils from './IrisGridTestUtils';

const irisGridTestUtils = new IrisGridTestUtils(dh);

function makePartitionSelectorSearch({
  table = irisGridTestUtils.makeTable(),
  onSelect = jest.fn(),
  getFormattedString = jest.fn(value => `${value}`),
} = {}) {
  return render(
    <PartitionSelectorSearch
      dh={dh}
      table={table}
      onSelect={onSelect}
      getFormattedString={getFormattedString}
    />
  );
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('mounts and unmounts properly', () => {
  makePartitionSelectorSearch();
});

it('updates filters when input is changed', async () => {
  const user = userEvent.setup({ delay: null });
  const table = irisGridTestUtils.makeTable();
  table.applyFilter = jest.fn();

  const component = makePartitionSelectorSearch({ table });

  const input = screen.getByRole('textbox');
  await user.type(input, 'abc');

  jest.runAllTimers();

  expect(table.applyFilter).toHaveBeenCalledWith([
    expect.any(dh.FilterCondition),
  ]);

  await user.type(input, '{Backspace}{Backspace}{Backspace}');

  jest.runAllTimers();

  expect(table.applyFilter).toHaveBeenCalledWith([]);

  component.unmount();
});

it('selects the first item when enter is pressed', async () => {
  const user = userEvent.setup({ delay: null });
  const onSelect = jest.fn();
  const table = irisGridTestUtils.makeTable();
  const component = makePartitionSelectorSearch({ onSelect, table });

  (table as Table).fireViewportUpdate();

  const input = screen.getByRole('textbox');
  await user.type(input, '{Enter}');

  expect(onSelect).toHaveBeenCalledWith('AAPL');

  component.unmount();
});
