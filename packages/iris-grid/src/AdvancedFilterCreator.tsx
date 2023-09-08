/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
// disabled for tab-index on focus traps, which are intentionally non-interactive

import React, { PureComponent } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import memoize from 'memoize-one';
import {
  Operator as FilterOperator,
  OperatorValue as FilterOperatorValue,
  TypeValue as FilterTypeValue,
  assertOperatorValue as assertFilterOperatorValue,
} from '@deephaven/filters';
import { dhSortAmountDown, dhNewCircleLargeFilled } from '@deephaven/icons';
import {
  Formatter,
  TableUtils,
  SortDirection,
  FilterItem,
} from '@deephaven/jsapi-utils';
import { Button, ContextActionUtils } from '@deephaven/components';
import Log from '@deephaven/log';
import {
  assertNotNull,
  CancelablePromise,
  PromiseUtils,
} from '@deephaven/utils';
import type { Column, FilterCondition, Table } from '@deephaven/jsapi-types';
import shortid from 'shortid';
import AdvancedFilterCreatorFilterItem from './AdvancedFilterCreatorFilterItem';
import AdvancedFilterCreatorSelectValue from './AdvancedFilterCreatorSelectValue';
import './AdvancedFilterCreator.scss';
import IrisGridModel from './IrisGridModel';
import { AdvancedFilterOptions } from './CommonTypes';

const log = Log.module('AdvancedFilterCreator');

type FilterChangeHandler = (
  selectedType: FilterTypeValue,
  value: string
) => void;

interface AdvancedFilterCreatorProps {
  model: IrisGridModel;
  column: Column;
  onFilterChange: (
    column: Column,
    filter: FilterCondition | null,
    options: AdvancedFilterOptions
  ) => void;
  onSortChange: (
    column: Column,
    direction: SortDirection,
    addToExisting?: boolean
  ) => void;
  onDone: () => void;
  options: AdvancedFilterOptions;
  sortDirection: SortDirection;
  formatter: Formatter;
  tableUtils: TableUtils;
}

interface AdvancedFilterItem {
  selectedType?: FilterTypeValue;
  value?: string;
  key: string;
}

interface AdvancedFilterCreatorState {
  // Filter items
  filterItems: AdvancedFilterItem[];

  // And/Or between the filter items
  filterOperators: FilterOperatorValue[];

  invertSelection: boolean;

  selectedValues: unknown[];

  valuesTableError: null;
  valuesTable?: Table;

  isSortable: boolean;
}

class AdvancedFilterCreator extends PureComponent<
  AdvancedFilterCreatorProps,
  AdvancedFilterCreatorState
> {
  static debounceFilterUpdate = 250;

  static defaultProps = {
    options: {
      filterItems: null,
      filterOperators: null,
      invertSelection: true,
      selectedValues: [],
    },
    sortDirection: null,
  };

  static makeFilterItem(): AdvancedFilterItem {
    return { key: shortid() };
  }

  constructor(props: AdvancedFilterCreatorProps) {
    super(props);

    this.handleAddAnd = this.handleAddAnd.bind(this);
    this.handleAddOr = this.handleAddOr.bind(this);
    this.handleChangeFilterOperator =
      this.handleChangeFilterOperator.bind(this);
    this.handleDone = this.handleDone.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handleFilterDelete = this.handleFilterDelete.bind(this);
    this.handleSelectValueChange = this.handleSelectValueChange.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.handleSortDown = this.handleSortDown.bind(this);
    this.handleSortUp = this.handleSortUp.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleFocusTrapStart = this.handleFocusTrapStart.bind(this);
    this.handleFocusTrapEnd = this.handleFocusTrapEnd.bind(this);
    this.handleUpdateTimeout = this.handleUpdateTimeout.bind(this);

    this.focusTrapContainer = React.createRef();

    const { model, column, options } = props;
    let { filterOperators, invertSelection, selectedValues } = options;

    // can be null or an empty array
    const filterItems: AdvancedFilterItem[] =
      options.filterItems?.map(({ selectedType, value }) => ({
        selectedType,
        value,
        key: shortid(),
      })) ?? [];
    if (filterItems.length === 0) {
      filterItems.push(AdvancedFilterCreator.makeFilterItem());
    }
    if (filterOperators == null) {
      filterOperators = [];
    }
    if (invertSelection == null) {
      invertSelection = true;
    }
    if (selectedValues == null) {
      selectedValues = [];
    }

    const columnIndex = model.getColumnIndexByName(column.name);
    assertNotNull(columnIndex);
    const isSortable = model.isColumnSortable(columnIndex);

    this.state = {
      // Filter items
      filterItems,

      // And/Or between the filter items
      filterOperators,

      invertSelection,

      selectedValues,

      valuesTableError: null,
      valuesTable: undefined,

      isSortable,
    };
  }

  componentDidMount(): void {
    this.initValuesTable();
  }

  componentWillUnmount(): void {
    if (this.debounceTimeout != null) {
      clearTimeout(this.debounceTimeout);
      this.sendUpdate();
    }
    if (this.valuesTablePromise != null) {
      this.valuesTablePromise.cancel();
    }
  }

  focusTrapContainer: React.RefObject<HTMLFormElement>;

  debounceTimeout?: ReturnType<typeof setTimeout>;

  valuesTablePromise?: CancelablePromise<Table>;

  getFilterChangeHandler(index: number): FilterChangeHandler {
    return this.handleFilterChange.bind(this, index);
  }

  getFilterDeleteHandler(index: number): () => void {
    return this.handleFilterDelete.bind(this, index);
  }

  getFilterTypes = memoize((columnType: string): FilterTypeValue[] =>
    TableUtils.getFilterTypes(columnType)
  );

  initValuesTable(): void {
    const { model, column } = this.props;
    if (!model.isValuesTableAvailable) {
      log.debug('No values table for this model, just ignore');
      return;
    }

    this.valuesTablePromise = TableUtils.makeCancelableTablePromise(
      model.valuesTable(column)
    );
    this.valuesTablePromise
      .then(valuesTable => {
        if (valuesTable.columns[0].isSortable ?? true) {
          const sort = valuesTable.columns[0].sort().asc();
          valuesTable.applySort([sort]);
        }
        this.setState({ valuesTable });
      })
      .catch(error => {
        if (PromiseUtils.isCanceled(error)) {
          return;
        }

        log.error('Unable to open values table', error);
        this.setState({ valuesTableError: error });
      });
  }

  handleFocusTrapEnd(): void {
    (
      this.focusTrapContainer?.current?.querySelector(
        'button,select,input,textarea'
      ) as HTMLElement
    ).focus();
  }

  handleFocusTrapStart(): void {
    const inputs = this.focusTrapContainer?.current?.querySelectorAll(
      'button,select,input,textarea'
    );
    if (inputs && inputs.length > 0) {
      const element = inputs[inputs.length - 1] as HTMLElement;
      element.focus();
    }
  }

  handleAddAnd(): void {
    let { filterItems, filterOperators } = this.state;
    filterItems = filterItems.concat(AdvancedFilterCreator.makeFilterItem());
    filterOperators = filterOperators.concat(FilterOperator.and);
    this.setState({ filterItems, filterOperators });
  }

  handleAddOr(): void {
    let { filterItems, filterOperators } = this.state;
    filterItems = filterItems.concat(AdvancedFilterCreator.makeFilterItem());
    filterOperators = filterOperators.concat(FilterOperator.or);
    this.setState({ filterItems, filterOperators });
  }

  handleChangeFilterOperator(index: number, operator: string): void {
    let { filterOperators } = this.state;
    filterOperators = [...filterOperators];

    assertFilterOperatorValue(operator);

    filterOperators[index] = operator;

    this.setState({ filterOperators });

    this.startUpdateTimer();
  }

  handleFilterChange(
    filterIndex: number,
    selectedType: FilterTypeValue,
    value: string
  ): void {
    let { filterItems } = this.state;
    filterItems = [...filterItems];
    const { key } = filterItems[filterIndex];
    filterItems[filterIndex] = { key, selectedType, value };

    this.setState({ filterItems });

    this.startUpdateTimer();
  }

  handleFilterDelete(filterIndex: number): void {
    let { filterItems, filterOperators } = this.state;
    filterItems = [...filterItems];
    filterOperators = [...filterOperators];
    if (filterIndex < filterItems.length) {
      filterItems.splice(filterIndex, 1);
    }

    if (filterIndex < filterOperators.length) {
      filterOperators.splice(filterIndex, 1);
    } else if (filterIndex === filterOperators.length) {
      // When deleting the last filter item, we also need to remove the last filter operator
      filterOperators.splice(filterOperators.length - 1, 1);
    }

    if (filterItems.length === 0) {
      filterItems.push(AdvancedFilterCreator.makeFilterItem());
    }

    this.setState({ filterItems, filterOperators });

    this.startUpdateTimer();
  }

  handleSelectValueChange(
    selectedValues: unknown[],
    invertSelection: boolean
  ): void {
    this.setState({ selectedValues, invertSelection });

    this.startUpdateTimer();
  }

  handleReset(): void {
    log.debug('Resetting Advanced Filter');

    this.setState({
      filterItems: [AdvancedFilterCreator.makeFilterItem()],
      filterOperators: [],
      selectedValues: [],
      invertSelection: true,
    });

    this.startUpdateTimer();
  }

  handleSortDown(event: React.MouseEvent<HTMLButtonElement>): void {
    const addToExisting = ContextActionUtils.isModifierKeyDown(event);
    this.sortTable(TableUtils.sortDirection.descending, addToExisting);
  }

  handleSortUp(event: React.MouseEvent<HTMLButtonElement>): void {
    const addToExisting = ContextActionUtils.isModifierKeyDown(event);
    this.sortTable(TableUtils.sortDirection.ascending, addToExisting);
  }

  handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    log.debug('Submitting Advanced Filter');
    this.stopUpdateTimer();
    this.sendUpdate();

    event.preventDefault();
  }

  handleDone(event: React.MouseEvent<HTMLButtonElement>): void {
    log.debug('Submitting and Closing Advanced Filter');
    this.stopUpdateTimer();
    this.sendUpdate();

    const { onDone } = this.props;
    onDone();

    event.preventDefault();
  }

  handleUpdateTimeout(): void {
    this.debounceTimeout = undefined;
    this.sendUpdate();
  }

  /**
   * Convenience function to check if the previous filter has been inputted, and
   * we should show the add filter buttons (+ AND OR)
   * @returns true If the add filter buttons should be shown, false otherwise
   */
  shouldShowAddFilter(): boolean {
    const { filterItems } = this.state;
    if (filterItems.length === 0) {
      return false;
    }

    const filterItem = filterItems[filterItems.length - 1];
    const { selectedType, value } = filterItem;

    return (
      selectedType != null &&
      selectedType.length > 0 &&
      value != null &&
      value.length > 0
    );
  }

  /**
   * Sorts the table in the specified direction. If already sorted in that direction, remove it.
   * @param direction The sort direction, ASC or DESC
   * @param addToExisting Add to the existing sort, or replace the existing table sort
   */
  sortTable(direction: SortDirection, addToExisting = false): void {
    const { column, onSortChange } = this.props;
    const { isSortable } = this.state;
    if (isSortable) {
      onSortChange(column, direction, addToExisting);
    }
  }

  startUpdateTimer(): void {
    this.stopUpdateTimer();

    this.debounceTimeout = setTimeout(
      this.handleUpdateTimeout,
      AdvancedFilterCreator.debounceFilterUpdate
    );
  }

  stopUpdateTimer(): void {
    if (this.debounceTimeout !== undefined) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = undefined;
    }
  }

  sendUpdate(): void {
    const { filterItems, filterOperators, invertSelection, selectedValues } =
      this.state;
    const { column, onFilterChange, model, tableUtils } = this.props;
    const { formatter } = model;

    const items = filterItems.filter(
      ({ selectedType, value }) =>
        selectedType != null && value != null && value !== ''
    ) as FilterItem[];

    const operators = filterOperators
      .filter(
        (operator, i) =>
          operator != null &&
          filterItems[i].selectedType != null &&
          filterItems[i].value != null &&
          filterItems[i].value !== ''
      )
      .slice(0, items.length - 1);
    // slice last operator, user may have set an operator but not a value

    const options = {
      filterItems: items,
      filterOperators: operators,
      invertSelection,
      selectedValues,
    };

    const filter = tableUtils.makeAdvancedFilter(
      column,
      options,
      formatter.timeZone
    );

    onFilterChange(column, filter, options);
  }

  render(): JSX.Element {
    const { column, model, sortDirection, formatter, tableUtils } = this.props;
    const {
      filterItems,
      filterOperators,
      invertSelection,
      selectedValues,
      valuesTable,
      valuesTableError,
      isSortable,
    } = this.state;
    const { dh, isValuesTableAvailable } = model;
    const isBoolean = TableUtils.isBooleanType(column.type);
    const isDateType = TableUtils.isDateType(column.type);
    const filterTypes = this.getFilterTypes(column.type);
    const columnType = column.type.substring(column.type.lastIndexOf('.') + 1);
    const filterItemElements = [];
    if (!isBoolean && filterTypes.length) {
      for (let i = 0; i < filterItems.length; i += 1) {
        const filterItem = filterItems[i];
        const { key, selectedType, value } = filterItem;

        const element = (
          <AdvancedFilterCreatorFilterItem
            key={key}
            column={column}
            filterTypes={filterTypes}
            onChange={this.getFilterChangeHandler(i)}
            onDelete={this.getFilterDeleteHandler(i)}
            selectedType={selectedType}
            value={value}
            formatter={formatter}
            tableUtils={tableUtils}
          />
        );
        filterItemElements.push(element);

        if (i < filterOperators.length) {
          const filterOperator = filterOperators[i];
          const isAndFilter = filterOperator === FilterOperator.and;
          const operatorElement = (
            <div
              key={`filterOperator${key}`}
              className="form-row justify-content-end advanced-filter-creator-filter-operator"
            >
              <Button
                kind="ghost"
                className={classNames('filter-operator', {
                  active: isAndFilter,
                })}
                onClick={() =>
                  this.handleChangeFilterOperator(i, FilterOperator.and)
                }
              >
                AND
              </Button>
              <Button
                kind="ghost"
                className={classNames('filter-operator', {
                  active: !isAndFilter,
                })}
                onClick={() =>
                  this.handleChangeFilterOperator(i, FilterOperator.or)
                }
              >
                OR
              </Button>
            </div>
          );
          filterItemElements.push(operatorElement);
        }
      }
    }
    const showAddFilterItem = this.shouldShowAddFilter();
    const addFilterItem = (
      <div
        key="addFilterItem"
        className={classNames('form-row justify-content-end add-filter-item', {
          hidden: !showAddFilterItem,
        })}
      >
        <span className="text-muted">
          <FontAwesomeIcon icon={dhNewCircleLargeFilled} />
        </span>
        <Button
          kind="ghost"
          className="btn-filter-item"
          onClick={this.handleAddAnd}
          disabled={!showAddFilterItem}
          tooltip="Add filter with AND"
        >
          AND
        </Button>
        <Button
          kind="ghost"
          className="btn-filter-item"
          onClick={this.handleAddOr}
          disabled={!showAddFilterItem}
          tooltip="Add filter with OR"
        >
          OR
        </Button>
      </div>
    );
    filterItemElements.push(addFilterItem);

    return (
      <div className="advanced-filter-creator" role="presentation">
        <div tabIndex={0} onFocus={this.handleFocusTrapStart} />
        <form onSubmit={this.handleSubmit} ref={this.focusTrapContainer}>
          <div className="title-bar">
            <h6 className="advanced-filter-title">Advanced Filters</h6>
            <div className="advanced-filter-menu-buttons">
              <Button
                kind="ghost"
                className={classNames('sort-operator', {
                  active: sortDirection === TableUtils.sortDirection.descending,
                })}
                onClick={this.handleSortDown}
                icon={dhSortAmountDown}
                tooltip={
                  isSortable ? `Sort ${column.name} Descending` : 'Not sortable'
                }
                disabled={!isSortable}
              />
              <Button
                kind="ghost"
                className={classNames('sort-operator', {
                  active: sortDirection === TableUtils.sortDirection.ascending,
                })}
                onClick={this.handleSortUp}
                icon={
                  <FontAwesomeIcon icon={dhSortAmountDown} rotation={180} />
                }
                tooltip={
                  isSortable ? `Sort ${column.name} Ascending` : 'Not sortable'
                }
                disabled={!isSortable}
              />
            </div>
          </div>
          <hr />
          <div className="advanced-filter-column-name">
            {column.name}&nbsp;
            <span className="column-type">({columnType})</span>
          </div>
          {filterItemElements}
          {isValuesTableAvailable && valuesTableError == null && (
            <>
              {!isBoolean && <hr />}
              <div className="form-group">
                <AdvancedFilterCreatorSelectValue
                  dh={dh}
                  table={valuesTable}
                  onChange={this.handleSelectValueChange}
                  invertSelection={invertSelection}
                  selectedValues={selectedValues}
                  formatter={formatter}
                  showSearch={!isDateType}
                  timeZone={formatter.timeZone}
                />
              </div>
            </>
          )}
          <div className="form-row justify-content-end">
            <Button
              kind="secondary"
              className="mr-2"
              onClick={this.handleReset}
            >
              Reset
            </Button>
            <Button kind="primary" onClick={this.handleDone}>
              Done
            </Button>
          </div>
        </form>
        <div tabIndex={0} onFocus={this.handleFocusTrapEnd} />
      </div>
    );
  }
}

export default AdvancedFilterCreator;
