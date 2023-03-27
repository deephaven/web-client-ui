import React from 'react';
import { render, RenderResult, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Aggregations, { Aggregation } from './Aggregations';
import AggregationOperation from './AggregationOperation';
import { SELECTABLE_OPTIONS } from './AggregationUtils';

function makeAggregation({
  operation = AggregationOperation.SUM,
  selected = [],
  invert = true,
} = {}): Aggregation {
  return { operation, selected, invert };
}

function mountAggregations({
  settings = { aggregations: [] as Aggregation[], showOnTop: false },
  onChange = jest.fn(),
  onEdit = jest.fn(),
  isRollup = false,
} = {}): RenderResult {
  return render(
    <Aggregations
      settings={settings}
      onChange={onChange}
      onEdit={onEdit}
      isRollup={isRollup}
    />
  );
}

it('shows all operations in select when no aggregations selected yet', () => {
  mountAggregations();

  expect(screen.getByText('Sum')).toBeInTheDocument();
  expect(screen.getByText('AbsSum')).toBeInTheDocument();
  expect(screen.getByText('Min')).toBeInTheDocument();
  expect(screen.getByText('Max')).toBeInTheDocument();
  expect(screen.getByText('Avg')).toBeInTheDocument();
  expect(screen.getByText('Std')).toBeInTheDocument();
  expect(screen.getByText('First')).toBeInTheDocument();
  expect(screen.getByText('Last')).toBeInTheDocument();
  expect(screen.getByText('CountDistinct')).toBeInTheDocument();
  expect(screen.getByText('Distinct')).toBeInTheDocument();
  expect(screen.getByText('Count')).toBeInTheDocument();
  expect(screen.getByText('Unique')).toBeInTheDocument();
  expect(screen.getAllByRole('option').length).toBe(SELECTABLE_OPTIONS.length);
});

it('adds an aggregation when clicking the add button', async () => {
  const user = userEvent.setup();
  const onChange = jest.fn();
  mountAggregations({ onChange });

  await user.click(
    screen.getByText('Add Aggregation').closest('button') as HTMLElement
  );

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      aggregations: expect.arrayContaining([
        expect.objectContaining({ operation: SELECTABLE_OPTIONS[0] }),
      ]),
    })
  );
});

it('deletes an aggregation when clicking the trash can', async () => {
  const user = userEvent.setup();
  const aggregations = [
    makeAggregation({ operation: AggregationOperation.SUM }),
  ];
  const onChange = jest.fn();
  mountAggregations({
    settings: { aggregations, showOnTop: false },
    onChange,
  });

  const buttons = screen.getAllByRole('button');
  await user.click(buttons[buttons.length - 1]);

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ aggregations: [], showOnTop: false })
  );
});

it('triggers an edit when pen is pressed', async () => {
  const user = userEvent.setup();
  const aggregations = [
    makeAggregation({ operation: AggregationOperation.MIN }),
    makeAggregation({ operation: AggregationOperation.SUM }),
  ];
  const onEdit = jest.fn();
  mountAggregations({
    settings: { aggregations, showOnTop: false },
    onEdit,
  });

  const buttons = screen.getAllByRole('button');
  await user.click(buttons[buttons.length - 2]);

  expect(onEdit).toHaveBeenCalledWith(aggregations[1]);
});

it('only lists items without aggregations in the dropdown', () => {
  const expectedOptions = SELECTABLE_OPTIONS.filter(
    (operation, i) => i % 2 === 0
  );
  const aggregations = SELECTABLE_OPTIONS.filter(
    operation => expectedOptions.indexOf(operation) < 0
  ).map(operation => makeAggregation({ operation }));
  mountAggregations({
    settings: { aggregations, showOnTop: false },
  });

  expect(screen.getByText('Sum')).toBeInTheDocument();
  expect(screen.getByText('Min')).toBeInTheDocument();
  expect(screen.getByText('Avg')).toBeInTheDocument();
  expect(screen.getByText('First')).toBeInTheDocument();
  expect(screen.getByText('CountDistinct')).toBeInTheDocument();
  expect(screen.getByText('Count')).toBeInTheDocument();
  expect(screen.getAllByRole('option').length).toBe(expectedOptions.length);
});

it('hides the select view when all aggregations are selected', () => {
  const aggregations = SELECTABLE_OPTIONS.map(operation =>
    makeAggregation({ operation })
  );
  mountAggregations({
    settings: { aggregations, showOnTop: false },
  });

  expect(screen.queryAllByRole('option').length).toBe(0);
});
