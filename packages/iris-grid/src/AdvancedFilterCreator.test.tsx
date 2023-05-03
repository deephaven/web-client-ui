import React from 'react';
import { Formatter, TableUtils } from '@deephaven/jsapi-utils';
import { render } from '@testing-library/react';
import { Column } from '@deephaven/jsapi-types';
// import userEvent from '@testing-library/user-event';
import dh from '@deephaven/jsapi-shim';
// import {
//   Type as FilterType,
//   Operator as FilterOperator,
// } from '@deephaven/filters';
import AdvancedFilterCreator from './AdvancedFilterCreator';
import { AdvancedFilterOptions } from './CommonTypes';
import IrisGridTestUtils from './IrisGridTestUtils';
import IrisGridModel from './IrisGridModel';

// let mockFilterHandlers = [];
// let mockSelectedType;
// let mockValue;

// jest.mock('./AdvancedFilterCreatorFilterItem', () =>
//   jest.fn(({ onChange, selectedType, value }) => {
//     mockFilterHandlers.push(onChange);
//     mockSelectedType = selectedType;
//     mockValue = value;
//     return (
//       <p>
//         selectedType: {selectedType} Value: {value}
//       </p>
//     );
//   })
// );

function makeAdvancedFilterCreatorWrapper(
  {
    tableUtils,
    options,
    model,
    column,
    formatter,
  }: {
    tableUtils: TableUtils;
    options: AdvancedFilterOptions;
    model: IrisGridModel;
    column: Column;
    formatter: Formatter;
  } = {
    tableUtils: new TableUtils(dh),
    options: {
      filterItems: [],
      filterOperators: [],
      invertSelection: false,
      selectedValues: [],
    },
    model: IrisGridTestUtils.makeModel(dh),
    column: IrisGridTestUtils.makeColumn(),
    formatter: new Formatter(),
  }
) {
  const wrapper = render(
    <AdvancedFilterCreator
      model={model}
      column={column}
      formatter={formatter}
      onFilterChange={() => null}
      onSortChange={() => null}
      onDone={() => null}
      options={options}
      tableUtils={tableUtils}
    />
  );

  return wrapper;
}

// function makeChangeAndOrEvent(index = 0, operator = FilterOperator.and) {
//   return {
//     target: {
//       dataset: {
//         index,
//         operator,
//       },
//     },
//   };
// }

it('renders without crashing', () => {
  makeAdvancedFilterCreatorWrapper();
});

// jest.mock('./AdvancedFilterCreatorFilterItem', () =>
//   jest.fn(({ onChange, selectedType, value }) => {
//     mockFilterHandlers.push(onChange);
//     mockSelectedType = selectedType;
//     mockValue = value;
//     return (
//       <p>
//         selectedType: {selectedType} Value: {value}
//       </p>
//     );
//   })
// );

// it('handles assigning a unknown filter type properly', () => {
//   const type = 'garbage';
//   const value = 'test';
//   const { container } = makeAdvancedFilterCreatorWrapper({
//     column: new dh.Column({ type: 'garbage' }),
//   });
//   mockFilterHandlers[0](type, value);
//   expect(
//     container.querySelectorAll('advanced-filter-creator-filter-item').length
//   ).toBe(0);
//   jest.unmock('./AdvancedFilterCreatorFilterItem');
// });

// it('handles editing a filters value properly', () => {
//   const type = FilterType.eqIgnoreCase;
//   const value = 'test';

//   makeAdvancedFilterCreatorWrapper();
//   const option = screen.getByRole('option', {
//     name: 'is exactly (ignore case)',
//   });
//   expect(option.selected).toBeFalsy();
//   userEvent.selectOptions(option.closest('select'), ['eqIgnoreCase']);
//   expect(option.selected).toBeTruthy();

//   const inputFields = screen.getAllByRole('textbox');
//   userEvent.type(inputFields[0], value);
//   expect(inputFields[0].value).toBe(value);
//   expect(screen.getByText('AND')).toBeInTheDocument();
//   expect(screen.getByText('OR')).toBeInTheDocument();
// });

// it('handles adding an And filter operator', () => {
//   const type = FilterType.eqIgnoreCase;
//   const value = 'test';

//   makeAdvancedFilterCreatorWrapper();
//   const option = screen.getByRole('option', {
//     name: 'is exactly (ignore case)',
//   });
//   expect(option.selected).toBeFalsy();
//   userEvent.selectOptions(option.closest('select'), ['eqIgnoreCase']);
//   expect(option.selected).toBeTruthy();

//   const inputFields = screen.getAllByRole('textbox');
//   userEvent.type(inputFields[0], value);
//   expect(inputFields[0].value).toBe(value);
//   expect(screen.getByText('AND')).toBeInTheDocument();
//   expect(screen.getByText('OR')).toBeInTheDocument();
//   userEvent.click(screen.getByText('AND'));
//   expect(screen.getByText('AND').selected).toBeTruthy();
// });

// it('handles adding an Or filter operator', () => {
//   mockFilterHandlers = [];
//   makeAdvancedFilterCreatorWrapper();
//   mockFilterHandlers[0](FilterType.eq, 'test');

//   userEvent.click(screen.getByText('OR'));

//   const orButtons = screen.getAllByText('OR');
//   expect(orButtons.length).toEqual(2);
//   expect(orButtons[0]).not.toBeDisabled();
//   expect(orButtons[1]).toBeDisabled();
// });

// it('handles editing a previous and/or operator', () => {
//   mockFilterHandlers = [];

//   const wrapper = makeAdvancedFilterCreatorWrapper();
//   mockFilterHandlers[0](FilterType.eq, 'test');
//   userEvent.click(screen.getByText('AND'));

//   userEvent.click(screen.getAllByText('OR')[0]);

//   let andButtons = screen.getAllByText('AND');
//   expect(andButtons.length).toEqual(2);
//   expect(andButtons[0]).not.toBeDisabled();
//   expect(andButtons[1]).toBeDisabled();
//   let orButtons = screen.getAllByText('OR');
//   expect(orButtons.length).toEqual(2);
//   expect(orButtons[0]).not.toBeDisabled();
//   expect(orButtons[1]).toBeDisabled();

//   userEvent.click(andButtons[0]);

//   andButtons = screen.getAllByText('AND');
//   expect(andButtons.length).toEqual(2);
//   expect(andButtons[0]).not.toBeDisabled();
//   expect(andButtons[1]).toBeDisabled();
//   orButtons = screen.getAllByText('OR');
//   expect(orButtons.length).toEqual(2);
//   expect(orButtons[0]).not.toBeDisabled();
//   expect(orButtons[1]).toBeDisabled();
// });
