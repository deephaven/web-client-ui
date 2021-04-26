import React from 'react';
import { mount } from 'enzyme';
import dh from '@deephaven/jsapi-shim';
import IrisGridPartitionSelector from './IrisGridPartitionSelector';

function makeTable() {
  const columns = [new dh.Column({ index: 0, name: '0' })];
  return new dh.Table({ columns });
}

function makeIrisGridPartitionSelector(
  table = makeTable(),
  onChange = jest.fn(),
  onDone = jest.fn(),
  getFormattedString = jest.fn(value => `${value}`)
) {
  return mount(
    <IrisGridPartitionSelector
      table={table}
      columnName="0"
      getFormattedString={getFormattedString}
      onChange={onChange}
      onDone={onDone}
    />
  );
}

it('unmounts successfully without crashing', () => {
  const wrapper = makeIrisGridPartitionSelector();
  wrapper.unmount();
});
