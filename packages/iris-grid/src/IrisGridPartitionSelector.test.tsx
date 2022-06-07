import React from 'react';
import { render } from '@testing-library/react';
import IrisGridPartitionSelector from './IrisGridPartitionSelector';
import IrisGridTestUtils from './IrisGridTestUtils';

function makeIrisGridPartitionSelector(
  table = IrisGridTestUtils.makeTable(),
  onChange = jest.fn(),
  onDone = jest.fn(),
  getFormattedString = jest.fn(value => `${value}`)
) {
  return render(
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
  makeIrisGridPartitionSelector();
});
