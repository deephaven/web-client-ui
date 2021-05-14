import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Aggregation } from './Aggregations';
import AggregationEdit from './AggregationEdit';
import AggregationOperation from './AggregationOperation';

function makeAggregation({
  operation = AggregationOperation.MIN,
  selected = [],
  invert = true,
}: {
  operation?: AggregationOperation;
  selected?: string[];
  invert?: boolean;
} = {}): Aggregation {
  return { operation, selected, invert };
}

function makeColumnName(index: number) {
  return `COLUMN ${index}`;
}

function makeColumns(count = 3) {
  const columns = [];
  for (let i = 0; i < count; i += 1) {
    columns.push({ name: makeColumnName(i), type: 'java.lang.String' });
  }
  return columns;
}

function mountAggregationEdit({
  aggregation = makeAggregation(),
  columns = makeColumns(),
  onChange = jest.fn(),
} = {}): ReactWrapper {
  return mount(
    <AggregationEdit
      aggregation={aggregation}
      columns={columns}
      onChange={onChange}
    />
  );
}

it('resets select when reset button is pressed', () => {
  const onChange = jest.fn();
  const wrapper = mountAggregationEdit({
    aggregation: makeAggregation({ selected: [makeColumnName(1)] }),
    onChange,
  });

  wrapper.find('button.btn-reset').simulate('click');

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining(makeAggregation())
  );

  wrapper.unmount();
});
