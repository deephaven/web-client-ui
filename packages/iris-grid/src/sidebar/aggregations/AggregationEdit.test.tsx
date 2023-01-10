import React from 'react';
import { render, RenderResult, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
} = {}): RenderResult {
  return render(
    <AggregationEdit
      aggregation={aggregation}
      columns={columns}
      onChange={onChange}
    />
  );
}

it('resets select when reset button is pressed', async () => {
  const user = userEvent.setup();
  const onChange = jest.fn();
  const wrapper = mountAggregationEdit({
    aggregation: makeAggregation({ selected: [makeColumnName(1)] }),
    onChange,
  });

  const btn = screen.getByText('Reset');
  await user.click(btn);

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining(makeAggregation())
  );

  wrapper.unmount();
});
