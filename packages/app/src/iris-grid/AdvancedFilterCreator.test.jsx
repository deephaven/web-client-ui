import React from 'react';
import { mount } from 'enzyme';
import dh from '@deephaven/jsapi-shim';
import AdvancedFilterCreator from './AdvancedFilterCreator';
import IrisGridTestUtils from './IrisGridTestUtils';
import { FilterType, FilterOperator } from './filters';
import Formatter from './Formatter';

function makeAdvancedFilterCreatorWrapper({
  options = {},
  model = IrisGridTestUtils.makeModel(),
  column = IrisGridTestUtils.makeColumn(),
  formatter = new Formatter(),
} = {}) {
  const wrapper = mount(
    <AdvancedFilterCreator
      model={model}
      column={column}
      formatter={formatter}
      onFilterChange={() => {}}
      onSortChange={() => {}}
      onDone={() => {}}
      options={options}
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
  const wrapper = makeAdvancedFilterCreatorWrapper({
    column: new dh.Column({ type: 'garbage' }),
  });
  wrapper.instance().handleFilterChange(0, type, value);
  expect(wrapper.find('.advanced-filter-creator-filter-item').length).toBe(0);
  wrapper.unmount();
});

it('handles editing a filters value properly', () => {
  const type = FilterType.eqIgnoreCase;
  const value = 'test';
  const wrapper = makeAdvancedFilterCreatorWrapper();
  wrapper.instance().handleFilterChange(0, type, value);

  const filterItems = wrapper.state('filterItems');
  expect(filterItems.length).toEqual(1);
  expect(filterItems[0].selectedType).toEqual(type);
  expect(filterItems[0].value).toEqual(value);
});

it('handles adding an And filter operator', () => {
  const wrapper = makeAdvancedFilterCreatorWrapper();
  wrapper.instance().handleFilterChange(0, FilterType.eq, 'test');
  wrapper.instance().handleAddAnd();

  const filterItems = wrapper.state('filterItems');
  expect(filterItems.length).toEqual(2);
  expect(filterItems[1].selectedType).toEqual('');
  expect(filterItems[1].value).toEqual('');

  const filterOperators = wrapper.state('filterOperators');
  expect(filterOperators.length).toEqual(1);
  expect(filterOperators[0]).toEqual(FilterOperator.and);
});

it('handles adding an Or filter operator', () => {
  const wrapper = makeAdvancedFilterCreatorWrapper();
  wrapper.instance().handleFilterChange(0, FilterType.eq, 'test');
  wrapper.instance().handleAddAnd();

  const filterItems = wrapper.state('filterItems');
  expect(filterItems.length).toEqual(2);
  expect(filterItems[1].selectedType).toEqual('');
  expect(filterItems[1].value).toEqual('');

  const filterOperators = wrapper.state('filterOperators');
  expect(filterOperators.length).toEqual(1);
  expect(filterOperators[0]).toEqual(FilterOperator.and);
});

it('handles editing a previous and/or operator', () => {
  const wrapper = makeAdvancedFilterCreatorWrapper();
  wrapper.instance().handleFilterChange(0, FilterType.eq, 'test');
  wrapper.instance().handleAddAnd();

  let event = makeChangeAndOrEvent(0, FilterOperator.or);
  wrapper.instance().handleChangeFilterOperator(event);

  let filterOperators = wrapper.state('filterOperators');
  expect(filterOperators.length).toEqual(1);
  expect(filterOperators[0]).toEqual(FilterOperator.or);

  event = makeChangeAndOrEvent(0, FilterOperator.and);
  wrapper.instance().handleChangeFilterOperator(event);

  filterOperators = wrapper.state('filterOperators');
  expect(filterOperators.length).toEqual(1);
  expect(filterOperators[0]).toEqual(FilterOperator.and);
});
