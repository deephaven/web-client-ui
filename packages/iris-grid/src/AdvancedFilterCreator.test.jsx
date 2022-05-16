import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dh from '@deephaven/jsapi-shim';
import AdvancedFilterCreator from './AdvancedFilterCreator';
import IrisGridTestUtils from './IrisGridTestUtils';
import { FilterType, FilterOperator } from './filters';
import Formatter from './Formatter';

let mockFilterHandlers = [];
let mockSelectedType;
let mockValue;

jest.mock('./AdvancedFilterCreatorFilterItem', () =>
  jest.fn(({ onChange, selectedType, value }) => {
    console.log('===' + onChange);
    mockFilterHandlers.push(onChange);
    mockSelectedType = selectedType;
    mockValue = value;
    return null;
  })
);
function makeAdvancedFilterCreatorWrapper({
  options = {},
  model = IrisGridTestUtils.makeModel(),
  column = IrisGridTestUtils.makeColumn(),
  formatter = new Formatter(),
  timeZone = 'America/New_York',
} = {}) {
  const wrapper = render(
    <AdvancedFilterCreator
      model={model}
      column={column}
      formatter={formatter}
      onFilterChange={() => {}}
      onSortChange={() => {}}
      onDone={() => {}}
      options={options}
      timeZone={timeZone}
    />
  );

  return wrapper;
}

function makeChangeAndOrEvent(index = 0, operator = FilterOperator.and) {
  return {
    target: {
      dataset: {
        index,
        operator,
      },
    },
  };
}

it('renders without crashing', () => {
  makeAdvancedFilterCreatorWrapper();
});

it('handles assigning a unknown filter type properly', () => {
  const type = 'garbage';
  const value = 'test';
  const { container } = makeAdvancedFilterCreatorWrapper({
    column: new dh.Column({ type: 'garbage' }),
  });
  console.log(mockFilterHandlers);
  mockFilterHandlers[0](0, type, value);
  expect(
    container.querySelectorAll('advanced-filter-creator-filter-item').length
  ).toBe(0);
});

it('handles editing a filters value properly', () => {
  const type = FilterType.eqIgnoreCase;
  const value = 'test';
  const { container } = makeAdvancedFilterCreatorWrapper();
  console.log('asd' + mockFilterHandlers);
  mockFilterHandlers[0](0, type, value);
  expect(screen.getByRole('textbox')).toBeTruthy();
  expect(mockValue).toBe(value);
  expect(mockSelectedType).toBe(type);
});

// it('handles adding an And filter operator', () => {
//   const wrapper = makeAdvancedFilterCreatorWrapper();
//   mockFilterHandlers(0, FilterType.eq, 'test');

//   userEvent.click(screen.getByText('AND'));

//   expect(screen.getAllByRole('textbox').length).toBe(2);
//   expect(selectedType).toEqual('');
//   expect(value).toEqual('');

//   const filterOperators = wrapper.state('filterOperators');
//   expect(filterOperators.length).toEqual(1);
//   expect(filterOperators[0]).toEqual(FilterOperator.and);
// });

// it('handles adding an Or filter operator', () => {
//   const wrapper = makeAdvancedFilterCreatorWrapper();
//   wrapper.instance().handleFilterChange(0, FilterType.eq, 'test');
//   wrapper.instance().handleAddAnd();

//   const filterItems = wrapper.state('filterItems');
//   expect(filterItems.length).toEqual(2);
//   expect(filterItems[1].selectedType).toEqual('');
//   expect(filterItems[1].value).toEqual('');

//   const filterOperators = wrapper.state('filterOperators');
//   expect(filterOperators.length).toEqual(1);
//   expect(filterOperators[0]).toEqual(FilterOperator.and);
// });

// it('handles editing a previous and/or operator', () => {
//   const wrapper = makeAdvancedFilterCreatorWrapper();
//   wrapper.instance().handleFilterChange(0, FilterType.eq, 'test');
//   wrapper.instance().handleAddAnd();

//   let event = makeChangeAndOrEvent(0, FilterOperator.or);
//   wrapper.instance().handleChangeFilterOperator(event);

//   let filterOperators = wrapper.state('filterOperators');
//   expect(filterOperators.length).toEqual(1);
//   expect(filterOperators[0]).toEqual(FilterOperator.or);

//   event = makeChangeAndOrEvent(0, FilterOperator.and);
//   wrapper.instance().handleChangeFilterOperator(event);

//   filterOperators = wrapper.state('filterOperators');
//   expect(filterOperators.length).toEqual(1);
//   expect(filterOperators[0]).toEqual(FilterOperator.and);
// });
