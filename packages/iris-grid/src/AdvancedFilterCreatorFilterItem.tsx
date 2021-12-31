/* eslint react/no-did-update-set-state: "off" */
import React, { PureComponent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from '@deephaven/components';
import { vsTrash } from '@deephaven/icons';
import Log from '@deephaven/log';
import TableUtils from './TableUtils';
import { FilterType, FilterTypeValue } from './filters';

const log = Log.module('AdvancedFilterCreatorFilterItem');

interface AdvancedFilterCreatorFilterItemProps {
  column: { type: string };
  filterTypes: FilterTypeValue[];
  onChange(type: FilterTypeValue, value: string): void;
  onDelete(): void;
  selectedType?: FilterTypeValue;
  value?: string;
}

export interface AdvancedFilterCreatorFilterItemState {
  selectedType: FilterTypeValue;
  value: string;
}

class AdvancedFilterCreatorFilterItem extends PureComponent<
  AdvancedFilterCreatorFilterItemProps,
  AdvancedFilterCreatorFilterItemState
> {
  static getLabelForTextFilter(filterType: FilterTypeValue): string {
    switch (filterType) {
      case FilterType.eq:
        return 'is exactly';
      case FilterType.eqIgnoreCase:
        return 'is exactly (ignore case)';
      case FilterType.notEq:
        return 'is not exactly';
      case FilterType.notEqIgnoreCase:
        return 'is not exactly (ignore case)';
      case FilterType.contains:
        return 'contains';
      case FilterType.notContains:
        return 'does not contain';
      case FilterType.startsWith:
        return 'starts with';
      case FilterType.endsWith:
        return 'ends with';
      default:
        log.warn('Unrecognized text filter type', filterType);
        return '';
    }
  }

  static getLabelForNumberFilter(filterType: FilterTypeValue): string {
    switch (filterType) {
      case FilterType.eq:
        return 'is equal to';
      case FilterType.notEq:
        return 'is not equal to';
      case FilterType.greaterThan:
        return 'greater than';
      case FilterType.greaterThanOrEqualTo:
        return 'greater than or equal to';
      case FilterType.lessThan:
        return 'less than';
      case FilterType.lessThanOrEqualTo:
        return 'less than or equal to';
      default:
        log.warn('Unrecognized number filter type', filterType);
        return '';
    }
  }

  static getLabelForDateFilter(filterType: FilterTypeValue): string {
    switch (filterType) {
      case FilterType.eq:
        return 'date is';
      case FilterType.notEq:
        return 'date is not';
      case FilterType.notEqIgnoreCase:
      case FilterType.greaterThan:
        return 'date is after';
      case FilterType.greaterThanOrEqualTo:
        return 'date is after or equal';
      case FilterType.lessThan:
        return 'date is before';
      case FilterType.lessThanOrEqualTo:
        return 'date is before or equal';
      default:
        log.warn('Unrecognized date filter type', filterType);
        return '';
    }
  }

  static getLabelForBooleanFilter(filterType: FilterTypeValue): string {
    switch (filterType) {
      case FilterType.isTrue:
        return 'Is True';
      case FilterType.isFalse:
        return 'Is False';
      case FilterType.isNull:
        return 'Is Null';
      default:
        log.warn('Unrecognized boolean filter type', filterType);
        return '';
    }
  }

  static getLabelForFilter(
    columnType: string,
    filterType: FilterTypeValue
  ): string {
    if (
      TableUtils.isNumberType(columnType) ||
      TableUtils.isCharType(columnType)
    ) {
      return AdvancedFilterCreatorFilterItem.getLabelForNumberFilter(
        filterType
      );
    }
    if (TableUtils.isTextType(columnType)) {
      return AdvancedFilterCreatorFilterItem.getLabelForTextFilter(filterType);
    }
    if (TableUtils.isDateType(columnType)) {
      return AdvancedFilterCreatorFilterItem.getLabelForDateFilter(filterType);
    }
    if (TableUtils.isBooleanType(columnType)) {
      return AdvancedFilterCreatorFilterItem.getLabelForBooleanFilter(
        filterType
      );
    }
    log.warn('Unrecognized column type: ', columnType);
    return '';
  }

  constructor(props: AdvancedFilterCreatorFilterItemProps) {
    super(props);

    this.handleDelete = this.handleDelete.bind(this);
    this.handleTypeChange = this.handleTypeChange.bind(this);
    this.handleValueChange = this.handleValueChange.bind(this);
    this.typeDropdown = null;

    const { value = '', filterTypes, selectedType = filterTypes[0] } = props;

    this.state = {
      selectedType,
      value,
    };
  }

  componentDidMount(): void {
    this.typeDropdown?.focus();
  }

  componentDidUpdate(prevProps: AdvancedFilterCreatorFilterItemProps): void {
    const {
      value = '',
      filterTypes,
      selectedType = filterTypes[0],
    } = this.props;
    if (prevProps.selectedType !== selectedType || prevProps.value !== value) {
      this.setState({ selectedType, value });
    }
  }

  typeDropdown: HTMLSelectElement | null;

  handleTypeChange(event: React.ChangeEvent<HTMLSelectElement>): void {
    log.debug2('typeChange');
    const selectedType = event.target.value as FilterTypeValue;
    this.setState({ selectedType });

    const { onChange } = this.props;
    const { value } = this.state;
    if (value != null && value.length > 0) {
      // Don't send an update unless there's already a value entered
      onChange(selectedType, value);
    }
  }

  handleValueChange(event: React.ChangeEvent<HTMLInputElement>): void {
    log.debug2('valueChange');
    const { value } = event.target;
    this.setState({ value });

    const { onChange } = this.props;
    const { selectedType } = this.state;
    if (selectedType != null) {
      // Don't send an update unless they've already selected a type
      onChange(selectedType, value);
    }
  }

  handleDelete(): void {
    log.debug('delete');

    const { onDelete } = this.props;
    onDelete();
  }

  render(): JSX.Element {
    const { column, filterTypes } = this.props;
    const { selectedType, value } = this.state;
    const showValueInput = !TableUtils.isBooleanType(column.type);
    const typeOptionElements = [];
    for (let i = 0; i < filterTypes.length; i += 1) {
      const type = filterTypes[i];
      const label = AdvancedFilterCreatorFilterItem.getLabelForFilter(
        column.type,
        type
      );
      const element = (
        <option key={type} value={type}>
          {label}
        </option>
      );
      typeOptionElements.push(element);
    }

    return (
      <div className="advanced-filter-creator-filter-item">
        <div className="form-row">
          <div className="form-group col">
            <select
              className="form-control custom-select"
              value={selectedType}
              onChange={this.handleTypeChange}
              ref={typeDropdown => {
                this.typeDropdown = typeDropdown;
              }}
            >
              {typeOptionElements}
            </select>
          </div>
          {showValueInput && (
            <div className="form-group col">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter value"
                  value={value}
                  onChange={this.handleValueChange}
                />
              </div>
            </div>
          )}
          <div className="form-group col-1 px-0">
            <button
              type="button"
              className="btn btn-link btn-link-icon w-100 h-100 p-0 m-0"
              onClick={this.handleDelete}
            >
              <FontAwesomeIcon icon={vsTrash} />
              <Tooltip>Remove Filter</Tooltip>
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default AdvancedFilterCreatorFilterItem;
