import React, { PureComponent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Checkbox, Popper, SearchInput, Tooltip } from '@deephaven/components';
import {
  dhGearFilled,
  dhCheckSquare,
  dhSquareFilled,
  dhRemoveSquareFilled,
  dhWarningCircleFilled,
  vsCircleLargeFilled,
} from '@deephaven/icons';
import dh, { Column, FilterCondition } from '@deephaven/jsapi-shim';
import { TableUtils } from '@deephaven/jsapi-utils';
import './CrossColumnSearch.scss';
import { ColumnName } from './CommonTypes';

interface CrossColumnSearchProps {
  value: string;
  selectedColumns: ColumnName[];
  invertSelection: boolean;
  onChange: (
    value: string,
    selectedColumns: ColumnName[],
    invertSelection: boolean
  ) => void;
  columns: Column[];
}

interface CrossColumnSearchState {
  isConfigureColumnsShown: boolean;
}
class CrossColumnSearch extends PureComponent<
  CrossColumnSearchProps,
  CrossColumnSearchState
> {
  static createSearchFilter(
    searchValue: string,
    selectedColumns: ColumnName[],
    columns: Column[],
    invertSelection: boolean
  ): FilterCondition | undefined {
    const filterColumns = invertSelection
      ? columns
          .filter(column => !selectedColumns.includes(column.name))
          .map(column => column.name)
      : selectedColumns;
    if (searchValue && filterColumns.length > 0) {
      const filterValue = dh.FilterValue.ofString(searchValue);
      const searchFilter =
        filterColumns.length === columns.length
          ? dh.FilterCondition.search(filterValue)
          : dh.FilterCondition.search(
              filterValue,
              columns
                .filter(column => filterColumns.includes(column.name))
                .map(column => column.filter())
            );
      return searchFilter;
    }
    return undefined;
  }

  constructor(props: CrossColumnSearchProps) {
    super(props);
    this.handleSearchValueChange = this.handleSearchValueChange.bind(this);
    this.toggleColumn = this.toggleColumn.bind(this);
    this.selectAll = this.selectAll.bind(this);
    this.clear = this.clear.bind(this);
    this.selectNumbers = this.selectNumbers.bind(this);

    this.searchField = React.createRef();

    this.state = {
      isConfigureColumnsShown: false,
    };
  }

  searchField: React.RefObject<SearchInput>;

  focus(): void {
    this.searchField.current?.focus();
  }

  handleSearchValueChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const { onChange, selectedColumns, invertSelection } = this.props;
    onChange(event.target.value, selectedColumns, invertSelection);
  }

  sendColumnChange(
    selectedColumns: ColumnName[],
    invertSelection: boolean
  ): void {
    const { onChange, value } = this.props;
    onChange(value, selectedColumns, invertSelection);
  }

  setInvertSelection(invertSelection: boolean): void {
    const { onChange, value } = this.props;
    onChange(value, [], invertSelection);
  }

  toggleColumn(name: string): void {
    const { selectedColumns, invertSelection } = this.props;
    if (selectedColumns.includes(name)) {
      this.sendColumnChange(
        selectedColumns.filter(c => c !== name),
        invertSelection
      );
    } else {
      const update = selectedColumns.slice();
      update.push(name);
      this.sendColumnChange(update, invertSelection);
    }
  }

  selectAll(): void {
    this.setInvertSelection(true);
  }

  clear(): void {
    this.setInvertSelection(false);
  }

  selectNumbers(): void {
    const { columns } = this.props;
    this.sendColumnChange(
      columns
        .filter(c => TableUtils.isNumberType(c.type))
        .map(column => column.name),
      false
    );
  }

  render(): React.ReactElement {
    const { value, selectedColumns, invertSelection, columns } = this.props;
    const { isConfigureColumnsShown } = this.state;
    const hasAllColumnsSelected =
      (selectedColumns.length === 0 && invertSelection === true) ||
      (selectedColumns.length === columns.length && invertSelection === false);
    const hasNoColumnsSelected =
      (selectedColumns.length === 0 && invertSelection === false) ||
      (selectedColumns.length === columns.length && invertSelection === true);

    // set icon layers
    let icon;
    if (hasAllColumnsSelected) {
      // icon if all columns selected for search
      icon = (
        <>
          <FontAwesomeIcon
            icon={dhSquareFilled}
            mask={dhGearFilled}
            transform="shrink-2 down-5 right-7"
          />
          <FontAwesomeIcon
            icon={dhCheckSquare}
            className="text-primary"
            transform="shrink-4 down-5 right-7"
          />
        </>
      );
    } else if (hasNoColumnsSelected) {
      // icon error, no columns selected for searching
      icon = (
        <>
          <FontAwesomeIcon
            icon={vsCircleLargeFilled}
            mask={dhGearFilled}
            transform="shrink-1 down-5 right-7"
          />
          <FontAwesomeIcon
            icon={dhWarningCircleFilled}
            className="text-danger"
            transform="shrink-4 down-5 right-7"
          />
        </>
      );
    } else {
      // icon if some columns selected, but not all
      icon = (
        <>
          <FontAwesomeIcon
            icon={dhSquareFilled}
            mask={dhGearFilled}
            transform="shrink-2 down-5 right-7"
          />
          <FontAwesomeIcon
            icon={dhRemoveSquareFilled}
            className="text-primary"
            transform="shrink-4 down-5 right-7"
          />
        </>
      );
    }

    return (
      <div className="cross-column-container">
        <SearchInput
          className="cross-column-search"
          placeholder="Search Data..."
          value={value}
          onChange={this.handleSearchValueChange}
          ref={this.searchField}
        />
        <button
          type="button"
          className="btn btn-link btn-link-icon px-2"
          onClick={() => {
            if (isConfigureColumnsShown) {
              this.setState({ isConfigureColumnsShown: false });
            } else {
              this.setState({ isConfigureColumnsShown: true });
            }
          }}
        >
          <div className="fa-layers">{icon}</div>
          <Tooltip>Configure Columns</Tooltip>
          <Popper
            isShown={isConfigureColumnsShown}
            className="cross-column-popper"
            onExited={() => {
              this.setState({ isConfigureColumnsShown: false });
            }}
            closeOnBlur
            interactive
          >
            <div className="cross-column-popup">
              Searched Columns
              <div className="cross-column-scroll">
                {columns.map(column => (
                  <React.Fragment key={column.name}>
                    <Checkbox
                      className="cross-column-checkbox"
                      checked={
                        invertSelection
                          ? !selectedColumns.includes(column.name)
                          : selectedColumns.includes(column.name)
                      }
                      onChange={() => this.toggleColumn(column.name)}
                    >
                      {column.name}
                    </Checkbox>

                    {column.type.substring(column.type.lastIndexOf('.') + 1)}
                  </React.Fragment>
                ))}
              </div>
              <div className="cross-column-button-bar">
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={this.selectAll}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={this.clear}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={this.selectNumbers}
                >
                  Numbers Only
                </button>
              </div>
              {hasNoColumnsSelected && (
                <p className="text-danger">
                  <FontAwesomeIcon icon={dhWarningCircleFilled} /> Select at
                  least one column to search.
                </p>
              )}
            </div>
          </Popper>
        </button>
      </div>
    );
  }
}

export default CrossColumnSearch;
