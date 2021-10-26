/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
// disabled for tab-index on focus traps, which are intentionally non-interactive

import React, { PureComponent } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import memoize from 'memoize-one';
import { dhSortAmountDown, dhNewCircleLargeFilled } from '@deephaven/icons';
import { ContextActionUtils, Tooltip } from '@deephaven/components';
import Log from '@deephaven/log';
import { PromiseUtils } from '@deephaven/utils';
import TableUtils from './TableUtils';
import { FilterOperator } from './filters';
import AdvancedFilterCreatorFilterItem from './AdvancedFilterCreatorFilterItem';
import AdvancedFilterCreatorSelectValue from './AdvancedFilterCreatorSelectValue';
import Formatter from './Formatter';
import IrisGridModel from './IrisGridModel';
import './AdvancedFilterCreator.scss';

const log = Log.module('AdvancedFilterCreator');

class AdvancedFilterCreator extends PureComponent {
  static debounceFilterUpdate = 250;

  constructor(props) {
    super(props);

    this.handleAddAnd = this.handleAddAnd.bind(this);
    this.handleAddOr = this.handleAddOr.bind(this);
    this.handleChangeFilterOperator = this.handleChangeFilterOperator.bind(
      this
    );
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
    this.debounceTimeout = null;
    this.filterKey = 0;
    this.valuesTablePromise = null;

    const { options } = props;
    let {
      filterItems,
      filterOperators,
      invertSelection,
      selectedValues,
    } = options;
    if (filterItems == null) {
      filterItems = [this.makeFilterItem()];
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

    this.state = {
      // Filter items
      filterItems,

      // And/Or between the filter items
      filterOperators,

      invertSelection,

      selectedValues,

      valuesTableError: null,
      valuesTable: null,
    };
  }

  componentDidMount() {
    this.initValuesTable();
  }

  componentWillUnmount() {
    if (this.debounceTimeout != null) {
      clearTimeout(this.debounceTimeout);
      this.sendUpdate();
    }
    if (this.valuesTablePromise != null) {
      this.valuesTablePromise.cancel();
    }
  }

  getFilterChangeHandler(index) {
    return this.handleFilterChange.bind(this, index);
  }

  getFilterDeleteHandler(index) {
    return this.handleFilterDelete.bind(this, index);
  }

  getFilterTypes = memoize(columnType => TableUtils.getFilterTypes(columnType));

  initValuesTable() {
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
        const sort = valuesTable.columns[0].sort().asc();
        valuesTable.applySort([sort]);

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

  handleFocusTrapEnd() {
    const inputs = this.focusTrapContainer.current.querySelectorAll(
      'button,select,input,textarea'
    );
    inputs[0].focus();
  }

  handleFocusTrapStart() {
    const inputs = this.focusTrapContainer.current.querySelectorAll(
      'button,select,input,textarea'
    );
    inputs[inputs.length - 1].focus();
  }

  handleAddAnd() {
    let { filterItems, filterOperators } = this.state;
    filterItems = filterItems.concat(this.makeFilterItem());
    filterOperators = filterOperators.concat(FilterOperator.and);
    this.setState({ filterItems, filterOperators });
  }

  handleAddOr() {
    let { filterItems, filterOperators } = this.state;
    filterItems = filterItems.concat(this.makeFilterItem());
    filterOperators = filterOperators.concat(FilterOperator.or);
    this.setState({ filterItems, filterOperators });
  }

  handleChangeFilterOperator(event) {
    const index = parseInt(event.target.dataset.index, 10);
    const { operator } = event.target.dataset;

    let { filterOperators } = this.state;
    filterOperators = [].concat(filterOperators);
    filterOperators[index] = operator;

    this.setState({ filterOperators });

    this.startUpdateTimer();
  }

  handleFilterChange(filterIndex, selectedType, value) {
    let { filterItems } = this.state;
    filterItems = [].concat(filterItems);
    const { key } = filterItems[filterIndex];
    filterItems[filterIndex] = { key, selectedType, value };

    this.setState({ filterItems });

    this.startUpdateTimer();
  }

  handleFilterDelete(filterIndex) {
    let { filterItems, filterOperators } = this.state;
    filterItems = [].concat(filterItems);
    filterOperators = [].concat(filterOperators);
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
      filterItems.push(this.makeFilterItem());
    }

    this.setState({ filterItems, filterOperators });

    this.startUpdateTimer();
  }

  handleSelectValueChange(selectedValues, invertSelection) {
    this.setState({ selectedValues, invertSelection });

    this.startUpdateTimer();
  }

  handleReset() {
    log.debug('Resetting Advanced Filter');

    this.setState({
      filterItems: [this.makeFilterItem()],
      filterOperators: [],
      selectedValues: [],
      invertSelection: true,
    });

    this.startUpdateTimer();
  }

  handleSortDown(event) {
    const addToExisting = ContextActionUtils.isModifierKeyDown(event);
    this.sortTable(TableUtils.sortDirection.descending, addToExisting);
  }

  handleSortUp(event) {
    const addToExisting = ContextActionUtils.isModifierKeyDown(event);
    this.sortTable(TableUtils.sortDirection.ascending, addToExisting);
  }

  handleSubmit(event) {
    log.debug('Submitting Advanced Filter');
    this.stopUpdateTimer();
    this.sendUpdate();

    event.preventDefault();
  }

  handleDone(event) {
    log.debug('Submitting and Closing Advanced Filter');
    this.stopUpdateTimer();
    this.sendUpdate();

    const { onDone } = this.props;
    onDone();

    event.preventDefault();
  }

  handleUpdateTimeout() {
    this.debounceTimeout = null;
    this.sendUpdate();
  }

  makeFilterItem(updateKey = true) {
    const key = this.filterKey;
    if (updateKey) {
      this.filterKey += 1;
    }
    return { selectedType: '', value: '', key };
  }

  /**
   * Convenience function to check if the previous filter has been inputted, and
   * we should show the add filter buttons (+ AND OR)
   * @returns true If the add filter buttons should be shown, false otherwise
   */
  shouldShowAddFilter() {
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
   * @param {String} direction The sort direction, ASC or DESC
   * @param {boolean} addToExisting Add to the existing sort, or replace the existing table sort
   */
  sortTable(direction, addToExisting = false) {
    const { column, onSortChange } = this.props;
    onSortChange(column, direction, addToExisting);
  }

  startUpdateTimer() {
    this.stopUpdateTimer();

    this.debounceTimeout = setTimeout(
      this.handleUpdateTimeout,
      AdvancedFilterCreator.debounceFilterUpdate
    );
  }

  stopUpdateTimer() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
  }

  sendUpdate() {
    const {
      filterItems,
      filterOperators,
      invertSelection,
      selectedValues,
    } = this.state;
    const { column, onFilterChange, model } = this.props;
    const { formatter } = model;

    const options = {
      filterItems,
      filterOperators,
      invertSelection,
      selectedValues,
    };

    const filter = TableUtils.makeAdvancedFilter(
      column,
      options,
      formatter.timeZone
    );

    onFilterChange(column, filter, options);
  }

  render() {
    const { column, model, sortDirection, formatter } = this.props;
    const {
      filterItems,
      filterOperators,
      invertSelection,
      selectedValues,
      valuesTable,
      valuesTableError,
    } = this.state;
    const { isValuesTableAvailable } = model;
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
              <button
                type="button"
                className={classNames('btn btn-link filter-operator', {
                  active: isAndFilter,
                })}
                onClick={this.handleChangeFilterOperator}
                data-index={i}
                data-operator={FilterOperator.and}
              >
                AND
              </button>
              <button
                type="button"
                className={classNames('btn btn-link filter-operator', {
                  active: !isAndFilter,
                })}
                onClick={this.handleChangeFilterOperator}
                data-index={i}
                data-operator={FilterOperator.or}
              >
                OR
              </button>
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
        <button
          type="button"
          className="btn btn-link btn-filter-item"
          onClick={this.handleAddAnd}
          disabled={!showAddFilterItem}
        >
          AND
          <Tooltip>Add filter with AND</Tooltip>
        </button>
        <button
          type="button"
          className="btn btn-link btn-filter-item"
          onClick={this.handleAddOr}
          disabled={!showAddFilterItem}
        >
          OR
          <Tooltip>Add filter with OR</Tooltip>
        </button>
      </div>
    );
    filterItemElements.push(addFilterItem);

    return (
      <div className="advanced-filter-creator" role="presentation">
        <div tabIndex="0" onFocus={this.handleFocusTrapStart} />
        <form onSubmit={this.handleSubmit} ref={this.focusTrapContainer}>
          <div className="title-bar">
            <h6 className="advanced-filter-title">Advanced Filters</h6>
            <div className="advanced-filter-menu-buttons">
              <button
                type="button"
                className={classNames(
                  'btn btn-link btn-link-icon sort-operator',
                  {
                    active:
                      sortDirection === TableUtils.sortDirection.descending,
                  }
                )}
                onClick={this.handleSortDown}
              >
                <FontAwesomeIcon icon={dhSortAmountDown} />
                <Tooltip>Sort {column.name} Descending</Tooltip>
              </button>
              <button
                type="button"
                className={classNames(
                  'btn btn-link btn-link-icon sort-operator',
                  {
                    active:
                      sortDirection === TableUtils.sortDirection.ascending,
                  }
                )}
                onClick={this.handleSortUp}
              >
                <FontAwesomeIcon rotation={180} icon={dhSortAmountDown} />
                <Tooltip>Sort {column.name} Ascending</Tooltip>
              </button>
            </div>
          </div>
          <hr />
          <div className="advanced-filter-column-name">
            {column.name}&nbsp;
            <span className="column-type">({columnType})</span>
          </div>
          {filterItemElements}
          {isValuesTableAvailable && !valuesTableError && (
            <>
              {!isBoolean && <hr />}
              <div className="form-group">
                <AdvancedFilterCreatorSelectValue
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
            <button
              type="button"
              className="btn btn-outline-primary mr-2"
              onClick={this.handleReset}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.handleDone}
            >
              Done
            </button>
          </div>
        </form>
        <div tabIndex="0" onFocus={this.handleFocusTrapEnd} />
      </div>
    );
  }
}

AdvancedFilterCreator.propTypes = {
  model: PropTypes.instanceOf(IrisGridModel).isRequired,
  column: PropTypes.shape({ name: PropTypes.string, type: PropTypes.string })
    .isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onSortChange: PropTypes.func.isRequired,
  onDone: PropTypes.func.isRequired,
  options: PropTypes.shape({
    filterItems: PropTypes.arrayOf(PropTypes.shape({})),
    filterOperators: PropTypes.arrayOf(PropTypes.shape({})),
    invertSelection: PropTypes.bool,
    selectedValues: PropTypes.arrayOf(PropTypes.any),
  }),
  sortDirection: PropTypes.string,
  formatter: PropTypes.instanceOf(Formatter).isRequired,
};

AdvancedFilterCreator.defaultProps = {
  options: {
    filterItems: null,
    filterOperators: null,
    invertSelection: true,
    selectedValues: [],
  },
  sortDirection: null,
};

export default AdvancedFilterCreator;
