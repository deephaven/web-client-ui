import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dh from '@deephaven/jsapi-shim';
import PartitionSelectorSearch from './PartitionSelectorSearch';

function makeTable() {
  const columns = [new dh.Column({ index: 0, name: '0' })];
  return new dh.Table({ columns });
}

function makePartitionSelectorSearch({
  table = makeTable(),
  onSelect = jest.fn(),
  getFormattedString = jest.fn(value => `${value}`),
} = {}) {
  return render(
    <PartitionSelectorSearch
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

it('updates filters when input is changed', () => {
  const table = makeTable();
  table.applyFilter = jest.fn();

  const component = makePartitionSelectorSearch({ table });

  const input = screen.getByRole('textbox');
  userEvent.type(input, 'abc');

  jest.runAllTimers();

  expect(table.applyFilter).toHaveBeenCalledWith([
    expect.any(dh.FilterCondition),
  ]);

  userEvent.type(input, '{backspace}{backspace}{backspace}');

  jest.runAllTimers();

  expect(table.applyFilter).toHaveBeenCalledWith([]);

  component.unmount();
});

it('selects the first item when enter is pressed', () => {
  const onSelect = jest.fn();
  const table = makeTable();
  const component = makePartitionSelectorSearch({ onSelect, table });

  table.fireViewportUpdate();

  const input = screen.getByRole('textbox');
  userEvent.type(input, '{enter}');

  expect(onSelect).toHaveBeenCalledWith('AAPL');

  component.unmount();
});
