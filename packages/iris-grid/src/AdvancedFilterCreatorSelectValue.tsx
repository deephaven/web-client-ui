/* eslint react/no-did-update-set-state: "off" */
import React, { PureComponent } from 'react';
import { CSSTransition } from 'react-transition-group';
import classNames from 'classnames';
import { Formatter, TableUtils } from '@deephaven/jsapi-utils';
import { FilterCondition, Table } from '@deephaven/jsapi-shim';
import { Button } from '@deephaven/components';
import AdvancedFilterCreatorSelectValueList from './AdvancedFilterCreatorSelectValueList';
import './AdvancedFilterCreatorSelectValue.scss';
import { ColumnName } from './CommonTypes';

interface AdvancedFilterCreatorSelectValueProps<T> {
  invertSelection: boolean;
  selectedValues: T[];
  table?: Table;
  formatter: Formatter;
  onChange: (selectedValues: T[], invertSelection: boolean) => void;
  showSearch: boolean;
  timeZone: string;
  tableUtils: TableUtils;
}

interface AdvancedFilterCreatorSelectValueState<T> {
  error?: string;
  filters: FilterCondition[];
  invertSelection: boolean;
  selectedValues: T[];
  searchText: string;
  table?: Table;
}

class AdvancedFilterCreatorSelectValue<T = unknown> extends PureComponent<
  AdvancedFilterCreatorSelectValueProps<T>,
  AdvancedFilterCreatorSelectValueState<T>
> {
  static searchDebounceTime = 250;

  static defaultProps = {
    invertSelection: true,
    selectedValues: [],
    onChange: (): void => undefined,
    showSearch: true,
  };

  constructor(props: AdvancedFilterCreatorSelectValueProps<T>) {
    super(props);

    this.handleSelectAllClick = this.handleSelectAllClick.bind(this);
    this.handleClearAllClick = this.handleClearAllClick.bind(this);
    this.handleListChange = this.handleListChange.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleUpdateFilterTimeout = this.handleUpdateFilterTimeout.bind(this);

    const { invertSelection, selectedValues } = props;

    this.state = {
      filters: [],
      invertSelection,
      selectedValues,
      searchText: '',
    };
  }

  componentDidMount(): void {
    this.initSearchTable();
  }

  componentDidUpdate(
    prevProps: AdvancedFilterCreatorSelectValueProps<T>,
    prevState: AdvancedFilterCreatorSelectValueState<T>
  ): void {
    const { invertSelection, selectedValues, table } = this.props;
    if (prevProps.table !== table) {
      this.initSearchTable();
    }

    if (prevProps.invertSelection !== invertSelection) {
      this.setState({ invertSelection });
    }

    if (prevProps.selectedValues !== selectedValues) {
      this.setState({ selectedValues });
    }

    const { table: searchTable, searchText } = this.state;

    if (searchTable !== prevState.table) {
      if (prevState.table != null) {
        prevState.table.close();
      }
      if (searchTable != null) {
        this.startUpdateFilterTimer();
      }
    }

    if (searchText !== prevState.searchText) {
      this.startUpdateFilterTimer();
    }
  }

  componentWillUnmount(): void {
    const { table } = this.state;
    if (table != null) {
      table.close();
    }
    this.searchTablePromise = undefined;

    this.stopUpdateFilterTimer();
  }

  searchTablePromise?: Promise<Table>;

  updateFilterTimer?: ReturnType<typeof setTimeout>;

  getColumnName(): ColumnName {
    const { table } = this.props;
    if (table != null) {
      return table.columns[0].name;
    }
    return '';
  }

  getDisplayedValuesCount(): number | null {
    const { invertSelection, selectedValues, table } = this.state;
    if (table == null) {
      return null;
    }

    if (invertSelection) {
      return table.totalSize - selectedValues.length;
    }
    return selectedValues.length;
  }

  getDisplayedValueText(): string | null {
    const count = this.getDisplayedValuesCount();
    const { table } = this.state;

    const { formatter } = this.props;

    if (count != null && table != null) {
      const formattedCount = formatter.getFormattedString(count, 'long');
      const formattedTableSize = formatter.getFormattedString(
        table.totalSize,
        'long'
      );
      let prefix = '';
      if (count < 1000000) {
        prefix = 'Displaying ';
      }
      return `${prefix}${formattedCount} of ${formattedTableSize}`;
    }
    return null;
  }

  initSearchTable(): void {
    const { table } = this.props;
    if (table == null) {
      return;
    }

    const searchTablePromise = table.copy();
    this.searchTablePromise = searchTablePromise;
    this.searchTablePromise.then(searchTable => {
      if (this.searchTablePromise === searchTablePromise) {
        this.setState({ table: searchTable });
        this.searchTablePromise = undefined;
      } else {
        searchTable.close();
      }
    });
  }

  handleListChange(selectedValues: T[], invertSelection: boolean): void {
    this.setState({ selectedValues, invertSelection });

    const { onChange } = this.props;
    onChange(selectedValues, invertSelection);
  }

  handleSearchChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const searchText = event.target.value;
    this.setState({ searchText });
  }

  handleSelectAllClick(): void {
    this.resetSelection(true);
  }

  handleClearAllClick(): void {
    this.resetSelection(false);
  }

  handleUpdateFilterTimeout(): void {
    this.updateFilterTimer = undefined;
    this.updateTableFilter();
  }

  resetSelection(invertSelection: boolean): void {
    const selectedValues: T[] = [];

    this.setState({ invertSelection, selectedValues });

    const { onChange } = this.props;
    onChange(selectedValues, invertSelection);
  }

  startUpdateFilterTimer(): void {
    this.stopUpdateFilterTimer();

    this.updateFilterTimer = setTimeout(
      this.handleUpdateFilterTimeout,
      AdvancedFilterCreatorSelectValue.searchDebounceTime
    );
  }

  stopUpdateFilterTimer(): void {
    if (this.updateFilterTimer != null) {
      clearTimeout(this.updateFilterTimer);
      this.updateFilterTimer = undefined;
    }
  }

  updateTableFilter(): void {
    const { table, searchText } = this.state;
    const { timeZone, tableUtils } = this.props;
    const column = table?.columns[0];
    const filters = [];
    if (column == null) {
      return;
    }
    let error;
    if (searchText.length > 0) {
      let filter = null;
      if (TableUtils.isCharType(column.type)) {
        // Just exact match for char
        filter = tableUtils.makeQuickFilter(column, searchText);
      } else if (TableUtils.isTextType(column.type)) {
        // case insensitive & contains search text
        filter = tableUtils.makeQuickFilter(column, `~${searchText}`, timeZone);
      } else {
        // greater than or equal search for everything else
        // we may want to be smarter with some other types (like dates)
        filter = tableUtils.makeQuickFilter(
          column,
          `>=${searchText}`,
          timeZone
        );
      }

      if (filter != null) {
        filters.push(filter);
      } else {
        error = 'Invalid search text';
      }
    }

    this.setState({ filters, error });
  }

  render(): React.ReactElement {
    const {
      error,
      filters,
      invertSelection,
      selectedValues,
      searchText,
      table,
    } = this.state;
    const { formatter, showSearch } = this.props;
    const columnName = this.getColumnName();
    const displayedValuesText = this.getDisplayedValueText();
    const placeholderText = columnName ? `Find ${columnName}...` : '';

    return (
      <div className="advanced-filter-creator-select-value">
        <div className={showSearch ? 'form-group' : ''}>
          <label htmlFor="advanced-filter-creator-select-value-input">
            Select Values
          </label>
          {showSearch && (
            <input
              type="text"
              className={classNames('form-control', {
                'is-invalid': error != null,
              })}
              id="advanced-filter-creator-select-value-input"
              placeholder={placeholderText}
              value={searchText}
              onChange={this.handleSearchChange}
            />
          )}
        </div>
        <AdvancedFilterCreatorSelectValueList
          table={table}
          filters={filters}
          invertSelection={invertSelection}
          selectedValues={selectedValues}
          formatter={formatter}
          onChange={this.handleListChange}
        />
        <div className="advanced-filter-creator-select-meta-row">
          <div>
            <Button kind="ghost" onClick={this.handleSelectAllClick}>
              Select All
            </Button>
            <Button kind="ghost" onClick={this.handleClearAllClick}>
              Clear
            </Button>
          </div>
          <CSSTransition
            in={displayedValuesText != null}
            timeout={250}
            classNames="fade"
            mountOnEnter
            unmountOnExit
          >
            <div className="row-count-info">{displayedValuesText}</div>
          </CSSTransition>
        </div>
      </div>
    );
  }
}

export default AdvancedFilterCreatorSelectValue;
