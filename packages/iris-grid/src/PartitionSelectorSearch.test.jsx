import React from 'react';
import { mount } from 'enzyme';
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
  return mount(
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
  const component = makePartitionSelectorSearch();
  component.unmount();
});

it('updates filters when input is changed', () => {
  const table = makeTable();
  table.applyFilter = jest.fn();

  const component = makePartitionSelectorSearch({ table });

  component.find('input').simulate('change', { target: { value: 'abc' } });

  jest.runAllTimers();

  expect(table.applyFilter).toHaveBeenCalledWith([
    expect.any(dh.FilterCondition),
  ]);

  component.find('input').simulate('change', { target: { value: '' } });

  jest.runAllTimers();

  expect(table.applyFilter).toHaveBeenCalledWith([]);

  component.unmount();
});

it('selects the first item when enter is pressed', () => {
  const onSelect = jest.fn();
  const table = makeTable();
  const component = makePartitionSelectorSearch({ onSelect, table });

  table.fireViewportUpdate();

  component.find('input').simulate('keydown', { key: 'Enter' });

  expect(onSelect).toHaveBeenCalledWith('AAPL');

  component.unmount();
});
