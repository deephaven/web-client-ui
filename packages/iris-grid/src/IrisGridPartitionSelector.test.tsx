import React from 'react';
import { render } from '@testing-library/react';
import dh from '@deephaven/jsapi-shim';
import IrisGridPartitionSelector from './IrisGridPartitionSelector';
import IrisGridTestUtils from './IrisGridTestUtils';

function makeIrisGridPartitionSelector(
  table = new IrisGridTestUtils(dh).makeTable(),
  onChange = jest.fn(),
  onDone = jest.fn(),
  getFormattedString = jest.fn(value => `${value}`)
) {
  return render(
    <IrisGridPartitionSelector
      dh={dh}
      table={table}
      columns={[new IrisGridTestUtils(dh).makeColumn()]}
      getFormattedString={getFormattedString}
      onChange={onChange}
      onDone={onDone}
    />
  );
}

it('unmounts successfully without crashing', () => {
  makeIrisGridPartitionSelector();
});
