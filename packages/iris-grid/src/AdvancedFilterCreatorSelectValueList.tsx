/* eslint react/no-did-update-set-state: "off" */
import React, { PureComponent } from 'react';
import { CSSTransition } from 'react-transition-group';
import dh, { FilterCondition, Table } from '@deephaven/jsapi-shim';
import { Formatter } from '@deephaven/jsapi-utils';
import {
  LoadingSpinner,
  SelectValueList,
  SelectItem,
} from '@deephaven/components';
import Log from '@deephaven/log';

const log = Log.module('AdvancedFilterCreatorSelectValueList');

interface AdvancedFilterCreatorSelectValueListProps<T> {
  selectedValues: T[];
  table?: Table;
  filters: FilterCondition[];
  invertSelection: boolean;
  onChange: (selectedValues: T[], invertSelection: boolean) => void;
  formatter: Formatter;
}

interface AdvancedFilterCreatorSelectValueListState<T> {
  itemCount: number;
  items: SelectItem<T>[];
  offset: number;
  selectedValues: T[];
  isLoading: boolean;
}
/**
 * Select values from a long scrollable list.
 * Swaps items in and out for infinite scrolling
 */
class AdvancedFilterCreatorSelectValueList<T = unknown> extends PureComponent<
  AdvancedFilterCreatorSelectValueListProps<T>,
  AdvancedFilterCreatorSelectValueListState<T>
> {
  static defaultProps = {
    invertSelection: true,
    selectedValues: [],
    onChange: (): void => undefined,
  };

  /**
   * Get the index of a value in an array. Has some special handling for some types, like DateTimes and Longs.
   * @param value The value to search for
   * @param values The array of values to search within
   */
  static indexOf(
    value: { valueof?: unknown },
    values: { valueof?: unknown }[]
  ): number {
    for (let i = 0; i < values.length; i += 1) {
      const v = values[i];
      if (
        v === value ||
        (v != null &&
          v.valueOf &&
          value != null &&
          value.valueOf &&
          v.valueOf() === value.valueOf())
      ) {
        return i;
      }
    }

    return -1;
  }

  constructor(props: AdvancedFilterCreatorSelectValueListProps<T>) {
    super(props);

    this.handleSelect = this.handleSelect.bind(this);
    this.handleViewportChange = this.handleViewportChange.bind(this);
    this.handleSelectionUpdate = this.handleSelectionUpdate.bind(this);
    this.handleTableUpdate = this.handleTableUpdate.bind(this);

    this.list = null;

    const { selectedValues } = this.props;

    this.state = {
      itemCount: 0,
      items: [],
      offset: 0,
      selectedValues,
      isLoading: true,
    };
  }

  componentDidMount(): void {
    const { table } = this.props;
    if (table) this.startListening(table);
  }

  componentDidUpdate(
    prevProps: AdvancedFilterCreatorSelectValueListProps<T>
  ): void {
    const { filters, invertSelection, selectedValues, table } = this.props;
    if (prevProps.table !== table) {
      if (prevProps.table) this.stopListening(prevProps.table);
      if (table) this.startListening(table);
      this.resetViewport();
    }

    if (prevProps.invertSelection !== invertSelection) {
      this.setState({ selectedValues: [] }, this.handleSelectionUpdate);
    }

    if (prevProps.selectedValues !== selectedValues) {
      this.setState({ selectedValues }, this.handleSelectionUpdate);
    }

    if (prevProps.filters !== filters) {
      if (table) table.applyFilter(filters);
      this.resetViewport();
    }
  }

  componentWillUnmount(): void {
    const { table } = this.props;
    if (table) this.stopListening(table);
  }

  list: SelectValueList<T> | null;

  handleSelect(itemIndex: number, value: T): void {
    const { invertSelection } = this.props;
    let { selectedValues } = this.state;
    selectedValues = [...selectedValues];
    const selectedIndex = AdvancedFilterCreatorSelectValueList.indexOf(
      value,
      selectedValues
    );
    if (selectedIndex >= 0) {
      selectedValues.splice(selectedIndex, 1);
    } else {
      selectedValues.push(value);
    }

    let isSelected = selectedIndex < 0;
    if (invertSelection) {
      isSelected = !isSelected;
    }

    const { offset } = this.state;
    let { items } = this.state;
    items = [...items];
    const visibleItemIndex = itemIndex - offset;
    if (visibleItemIndex >= 0 && visibleItemIndex < items.length) {
      items[visibleItemIndex].isSelected = isSelected;
    }

    this.setState({ items, selectedValues });

    const { onChange } = this.props;
    onChange(selectedValues, invertSelection);
  }

  handleViewportChange(top: number, bottom: number): void {
    this.updateViewport(top, bottom);
  }

  handleSelectionUpdate(): void {
    this.updateItemSelection();
  }

  handleTableUpdate(event: CustomEvent): void {
    const { table, formatter } = this.props;
    if (!table) return;

    const data = event.detail;
    const { offset } = data;
    const items = [];
    const column = table.columns[0];
    for (let r = 0; r < data.rows.length; r += 1) {
      const row = data.rows[r];
      const value = row.get(column);
      const displayValue = formatter.getFormattedString(
        value,
        column.type,
        column.name
      );
      const isSelected = this.isValueSelected(value);
      items.push({
        displayValue,
        value,
        isSelected,
      });
    }

    log.debug2('Received table update:', offset, items.length);

    const itemCount = table.size;
    this.setState({ itemCount, items, offset, isLoading: false });
  }

  isValueSelected(value: T): boolean {
    const { invertSelection } = this.props;
    const { selectedValues } = this.state;

    // Need to check if any of the valueOf matches, timestamp value that is equal
    const selectedIndex = AdvancedFilterCreatorSelectValueList.indexOf(
      value,
      selectedValues
    );

    return invertSelection ? selectedIndex < 0 : selectedIndex >= 0;
  }

  startListening(table: Table): void {
    table.addEventListener(dh.Table.EVENT_UPDATED, this.handleTableUpdate);
  }

  stopListening(table: Table): void {
    table.removeEventListener(dh.Table.EVENT_UPDATED, this.handleTableUpdate);
  }

  resetViewport(): void {
    if (this.list && this.list.topRow != null && this.list.bottomRow != null) {
      this.updateViewport(this.list.topRow, this.list.bottomRow, true);
    }
  }

  updateItemSelection(): void {
    let { items } = this.state;

    items = [...items];

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const { value } = item;
      item.isSelected = this.isValueSelected(value);
    }

    this.setState({ items });
  }

  updateViewport(top: number, bottom: number, isLoading = false): void {
    const { table } = this.props;
    if (table == null) {
      return;
    }

    if (isLoading) {
      this.setState({ isLoading: true });
    }

    const viewportSize = bottom - top + 1;
    const topRow = Math.max(0, top - viewportSize * 3);
    const bottomRow = Math.max(topRow, bottom + viewportSize * 3);

    log.debug2('Setting viewport', topRow, ',', bottomRow);
    table.setViewport(topRow, bottomRow);
  }

  render(): React.ReactElement {
    const { offset, isLoading, items, itemCount } = this.state;

    return (
      <div className="select-value-list-wrapper">
        <SelectValueList
          itemCount={itemCount}
          items={items}
          offset={offset}
          onSelect={this.handleSelect}
          onViewportChange={this.handleViewportChange}
          ref={list => {
            this.list = list;
          }}
        />
        <CSSTransition
          in={isLoading}
          timeout={250}
          classNames="fade"
          mountOnEnter
          unmountOnExit
        >
          <div className="loading-list">
            <LoadingSpinner className="loading-spinner-large" />
          </div>
        </CSSTransition>
      </div>
    );
  }
}

export default AdvancedFilterCreatorSelectValueList;
