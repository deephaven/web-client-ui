/* eslint react/no-did-update-set-state: "off" */
import React, { PureComponent } from 'react';
import { Button } from '@deephaven/components';
import {
  getLabelForBooleanFilter,
  getLabelForDateFilter,
  getLabelForNumberFilter,
  getLabelForTextFilter,
  TypeValue as FilterTypeValue,
} from '@deephaven/filters';
import { vsTrash } from '@deephaven/icons';
import { Column } from '@deephaven/jsapi-shim';
import {
  AdvancedFilterItemType,
  Formatter,
  TableUtils,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import classNames from 'classnames';
import memoizeOne from 'memoize-one';
import './AdvancedFilterCreatorFilterItem.scss';

const log = Log.module('AdvancedFilterCreatorFilterItem');

export interface AdvancedFilterCreatorFilterItemProps {
  column: Column;
  filterTypes: FilterTypeValue[];
  onChange(type: FilterTypeValue, value: string): void;
  onDelete(): void;
  selectedType?: FilterTypeValue;
  value?: string;
  formatter: Formatter;
}

export type AdvancedFilterCreatorFilterItemState = AdvancedFilterItemType;

export class AdvancedFilterCreatorFilterItem extends PureComponent<
  AdvancedFilterCreatorFilterItemProps,
  AdvancedFilterCreatorFilterItemState
> {
  static getLabelForFilter(
    columnType: string,
    filterType: FilterTypeValue
  ): string {
    try {
      if (
        TableUtils.isNumberType(columnType) ||
        TableUtils.isCharType(columnType)
      ) {
        return getLabelForNumberFilter(filterType);
      }
      if (TableUtils.isTextType(columnType)) {
        return getLabelForTextFilter(filterType);
      }
      if (TableUtils.isDateType(columnType)) {
        return getLabelForDateFilter(filterType);
      }
      if (TableUtils.isBooleanType(columnType)) {
        return getLabelForBooleanFilter(filterType);
      }
      throw new Error(`Unrecognized column type: ${columnType}`);
    } catch (e) {
      log.warn(e);
      return '';
    }
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
    const { value, selectedType } = this.props;
    if (selectedType !== undefined && prevProps.selectedType !== selectedType) {
      this.setState({ selectedType });
    }
    if (value !== undefined && prevProps.value !== value) {
      this.setState({ value });
    }
  }

  typeDropdown: HTMLSelectElement | null;

  handleTypeChange(event: React.ChangeEvent<HTMLSelectElement>): void {
    const selectedType = event.target.value as FilterTypeValue;
    log.debug2('typeChange', selectedType);
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

  getCachedIsValid = memoizeOne(
    (
      column: Column,
      operation: FilterTypeValue,
      value: string,
      timeZone: string
    ): boolean => {
      try {
        // We don't want to show an error for an empty value
        return (
          !value ||
          TableUtils.makeAdvancedValueFilter(
            column,
            operation,
            value,
            timeZone
          ) != null
        );
      } catch (e) {
        return false;
      }
    }
  );

  render(): JSX.Element {
    const { column, filterTypes, formatter } = this.props;
    const { selectedType, value } = this.state;
    const showValueInput = !TableUtils.isBooleanType(column.type);
    const typeOptionElements = [];
    const isValid = this.getCachedIsValid(
      column,
      selectedType,
      value,
      formatter.timeZone
    );
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
                  className={classNames('form-control', { error: !isValid })}
                  placeholder="Enter value"
                  value={value}
                  onChange={this.handleValueChange}
                />
              </div>
            </div>
          )}
          <div className="form-group col-1 px-0">
            <Button
              kind="ghost"
              className="w-100 h-100 p-0 m-0"
              onClick={this.handleDelete}
              icon={vsTrash}
              tooltip="Remove Filter"
            />
          </div>
        </div>
      </div>
    );
  }
}

export default AdvancedFilterCreatorFilterItem;
