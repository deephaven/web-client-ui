import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import Aggregations, { Aggregation, SELECTABLE_OPTIONS } from './Aggregations';
import AggregationOperation from './AggregationOperation';

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
} = {}): ReactWrapper {
  return mount(
    <Aggregations settings={settings} onChange={onChange} onEdit={onEdit} />
  );
}

it('shows all operations in select when no aggregations selected yet', () => {
  const wrapper = mountAggregations();

  expect(wrapper.find('select').props().value).toBe(SELECTABLE_OPTIONS[0]);
  expect(wrapper.find('option').length).toBe(SELECTABLE_OPTIONS.length);

  wrapper.unmount();
});

it('adds an aggregation when clicking the add button', () => {
  const onChange = jest.fn();
  const wrapper = mountAggregations({ onChange });

  wrapper.find('button.btn-add').simulate('click');

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({
      aggregations: expect.arrayContaining([
        expect.objectContaining({ operation: SELECTABLE_OPTIONS[0] }),
      ]),
    })
  );

  wrapper.unmount();
});

it('deletes an aggregation when clicking the trash can', () => {
  const aggregations = [
    makeAggregation({ operation: AggregationOperation.SUM }),
  ];
  const onChange = jest.fn();
  const wrapper = mountAggregations({
    settings: { aggregations, showOnTop: false },
    onChange,
  });

  wrapper.find('button.btn-delete').simulate('click');

  expect(onChange).toHaveBeenCalledWith(
    expect.objectContaining({ aggregations: [], showOnTop: false })
  );

  wrapper.unmount();
});

it('triggers an edit when pen is pressed', () => {
  const aggregations = [
    makeAggregation({ operation: AggregationOperation.MIN }),
    makeAggregation({ operation: AggregationOperation.SUM }),
  ];
  const onEdit = jest.fn();
  const wrapper = mountAggregations({
    settings: { aggregations, showOnTop: false },
    onEdit,
  });

  wrapper.find('button.btn-edit').at(1).simulate('click');

  expect(onEdit).toHaveBeenCalledWith(aggregations[1]);

  wrapper.unmount();
});

it('only lists items without aggregations in the dropdown', () => {
  const expectedOptions = SELECTABLE_OPTIONS.filter(
    (operation, i) => i % 2 === 0
  );
  const aggregations = SELECTABLE_OPTIONS.filter(
    operation => expectedOptions.indexOf(operation) < 0
  ).map(operation => makeAggregation({ operation }));
  const wrapper = mountAggregations({
    settings: { aggregations, showOnTop: false },
  });

  expect(wrapper.find('select').props().value).toBe(expectedOptions[0]);
  const options = wrapper.find('option');
  expect(options.length).toBe(expectedOptions.length);
  for (let i = 0; i < expectedOptions.length; i += 1) {
    expect(options.at(i).props().value).toBe(expectedOptions[i]);
  }

  wrapper.unmount();
});

it('hides the select view when all aggregations are selected', () => {
  const aggregations = SELECTABLE_OPTIONS.map(operation =>
    makeAggregation({ operation })
  );
  const wrapper = mountAggregations({
    settings: { aggregations, showOnTop: false },
  });

  expect(wrapper.find('select').length).toBe(0);

  wrapper.unmount();
});
