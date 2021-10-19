/* eslint react/no-did-update-set-state: "off" */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { CSSTransition } from 'react-transition-group';
import classNames from 'classnames';
import Formatter from './Formatter';
import TableUtils from './TableUtils';
import AdvancedFilterCreatorSelectValueList from './AdvancedFilterCreatorSelectValueList';
import './AdvancedFilterCreatorSelectValue.scss';

class AdvancedFilterCreatorSelectValue extends PureComponent {
  static searchDebounceTime = 250;

  constructor(props) {
    super(props);

    this.handleSelectAllClick = this.handleSelectAllClick.bind(this);
    this.handleClearAllClick = this.handleClearAllClick.bind(this);
    this.handleListChange = this.handleListChange.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleUpdateFilterTimeout = this.handleUpdateFilterTimeout.bind(this);

    this.searchTablePromise = null;
    this.updateFilterTimer = null;

    const { invertSelection, selectedValues } = props;

    this.state = {
      error: null,
      filters: [],
      invertSelection,
      selectedValues,
      searchText: '',
      table: null,
    };
  }

  componentDidMount() {
    this.initSearchTable();
  }

  componentDidUpdate(prevProps, prevState) {
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
    if (searchTable !== prevState.table && prevState.table != null) {
      prevState.table.close();
    }

    if (searchText !== prevState.searchText) {
      this.startUpdateFilterTimer();
    }
  }

  componentWillUnmount() {
    const { table } = this.state;
    if (table != null) {
      table.close();
    }
    this.searchTablePromise = null;

    this.stopUpdateFilterTimer();
  }

  getColumnName() {
    const { table } = this.props;
    if (table != null) {
      return table.columns[0].name;
    }
    return '';
  }

  getDisplayedValuesCount() {
    const { invertSelection, selectedValues, table } = this.state;
    if (table == null) {
      return null;
    }

    if (invertSelection) {
      return table.totalSize - selectedValues.length;
    }
    return selectedValues.length;
  }

  getDisplayedValueText() {
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

  initSearchTable() {
    const { table } = this.props;
    if (table == null) {
      return;
    }

    const searchTablePromise = table.copy();
    this.searchTablePromise = searchTablePromise;
    this.searchTablePromise.then(searchTable => {
      if (this.searchTablePromise === searchTablePromise) {
        this.setState({ table: searchTable });
        this.searchTablePromise = null;
      } else {
        searchTable.close();
      }
    });
  }

  handleListChange(selectedValues, invertSelection) {
    this.setState({ selectedValues, invertSelection });

    const { onChange } = this.props;
    onChange(selectedValues, invertSelection);
  }

  handleSearchChange(event) {
    const searchText = event.target.value;
    this.setState({ searchText });
  }

  handleSelectAllClick() {
    this.resetSelection(true);
  }

  handleClearAllClick() {
    this.resetSelection(false);
  }

  handleUpdateFilterTimeout() {
    this.updateFilterTimer = null;
    this.updateTableFilter();
  }

  resetSelection(invertSelection) {
    const selectedValues = [];

    this.setState({ invertSelection, selectedValues });

    const { onChange } = this.props;
    onChange(selectedValues, invertSelection);
  }

  startUpdateFilterTimer() {
    this.stopUpdateFilterTimer();

    this.updateFilterTimer = setTimeout(
      this.handleUpdateFilterTimeout,
      AdvancedFilterCreatorSelectValue.searchDebounceTime
    );
  }

  stopUpdateFilterTimer() {
    if (this.updateFilterTimer) {
      clearTimeout(this.updateFilterTimer);
      this.updateFilterTimer = null;
    }
  }

  updateTableFilter() {
    const { table, searchText } = this.state;
    const { timeZone } = this.props;
    const column = table.columns[0];
    const filters = [];
    let error = null;
    if (searchText.length > 0) {
      let filter = null;
      if (TableUtils.isTextType(column.type)) {
        // case insensitive & contains search text
        filter = TableUtils.makeQuickFilter(column, `~${searchText}`, timeZone);
      } else {
        // greater than or equal search for everything else
        // we may want to be smarter with some other types (like dates)
        filter = TableUtils.makeQuickFilter(
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

  render() {
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
            <button
              type="button"
              className="btn btn-link"
              onClick={this.handleSelectAllClick}
            >
              Select All
            </button>
            <button
              type="button"
              className="btn btn-link"
              onClick={this.handleClearAllClick}
            >
              Clear
            </button>
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

AdvancedFilterCreatorSelectValue.propTypes = {
  table: PropTypes.shape({
    close: PropTypes.func,
    columns: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })),
    copy: PropTypes.func,
    totalSize: PropTypes.number,
  }),
  invertSelection: PropTypes.bool,
  selectedValues: PropTypes.arrayOf(PropTypes.any),
  formatter: PropTypes.instanceOf(Formatter).isRequired,
  onChange: PropTypes.func,
  showSearch: PropTypes.bool,
  timeZone: PropTypes.string.isRequired,
};

AdvancedFilterCreatorSelectValue.defaultProps = {
  table: null,
  invertSelection: true,
  selectedValues: [],
  onChange: () => {},
  showSearch: true,
};

export default AdvancedFilterCreatorSelectValue;
