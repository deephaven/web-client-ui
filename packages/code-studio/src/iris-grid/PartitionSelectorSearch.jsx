import React, { Component } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import dh from '@deephaven/jsapi-shim';
import { ItemList, LoadingSpinner } from '@deephaven/components';
import Log from '@deephaven/log';
import { CanceledPromiseError } from '@deephaven/utils';
import './PartitionSelectorSearch.scss';

const log = Log.module('PartitionSelectorSearch');
const DEBOUNCE_UPDATE_FILTER = 150;

class PartitionSelectorSearch extends Component {
  static MAX_VISIBLE_ITEMS = 12;

  static handleError(error) {
    if (!(error instanceof CanceledPromiseError)) {
      log.error(error);
    }
  }

  constructor(props) {
    super(props);

    this.debounceUpdateFilter = debounce(
      this.debounceUpdateFilter.bind(this),
      DEBOUNCE_UPDATE_FILTER
    );
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handleInputFocus = this.handleInputFocus.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleListKeydown = this.handleListKeydown.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleTableUpdate = this.handleTableUpdate.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleViewportChange = this.handleViewportChange.bind(this);

    this.itemList = null;
    this.searchInput = null;
    this.timer = null;

    this.state = {
      offset: 0,
      itemCount: 0,
      items: [],
      text: '',
      isLoading: true,
    };
  }

  componentDidMount() {
    this.startListening();
  }

  componentDidUpdate(prevProps, prevState) {
    const { isLoading, itemCount } = this.state;
    const { onListResized } = this.props;
    if (
      itemCount !== prevState.itemCount ||
      isLoading !== prevState.isLoading
    ) {
      onListResized();
    }
  }

  componentWillUnmount() {
    this.debounceUpdateFilter.cancel();

    this.stopListening();
  }

  handleKeyDown(event) {
    if (this.itemList == null) {
      return false;
    }

    const { items, itemCount } = this.state;
    switch (event.key) {
      case 'Enter': {
        let selectedValue = null;
        if (items.length > 0) {
          selectedValue = items[0].value;
        } else {
          const { text } = this.state;
          selectedValue = text.trim();
        }

        if (selectedValue.length > 0) {
          const { onSelect } = this.props;
          onSelect(selectedValue);
        }

        event.stopPropagation();
        event.preventDefault();
        return true;
      }
      case 'ArrowDown':
        if (itemCount > 0) {
          this.itemList.setKeyboardIndex(1);
          this.itemList.focus();
        }
        event.stopPropagation();
        event.preventDefault();
        return true;
      default:
        return false;
    }
  }

  handleListKeydown(event) {
    switch (event.key) {
      case 'Escape':
        // Do nothing
        break;
      default:
        this.focus();
        break;
    }
  }

  handleFilterChange() {
    log.debug2('handleFilterChange');

    const { table } = this.props;
    const itemCount = table.size;
    this.setState({ itemCount, isLoading: true });
  }

  handleInputFocus() {
    if (this.itemList) {
      this.itemList.setKeyboardIndex(0);
    }
  }

  handleSelect(itemIndex) {
    log.debug2('handleSelect', itemIndex);

    const { onSelect } = this.props;
    const { offset, items } = this.state;
    const offsetIndex = itemIndex - offset;
    if (offsetIndex < 0 || items.length <= offsetIndex) {
      log.error('No data for item', itemIndex);
      return;
    }

    const { value } = items[offsetIndex];
    onSelect(value);
  }

  handleTableUpdate(event) {
    const data = event.detail;
    const { offset } = data;

    const items = [];
    const { getFormattedString, table } = this.props;
    const column = table.columns[0];
    for (let r = 0; r < data.rows.length; r += 1) {
      const row = data.rows[r];
      const value = row.get(column);
      const displayValue = getFormattedString(value, column.type, column.name);
      items.push({
        displayValue,
        value,
      });
    }

    const itemCount = table.size;
    log.debug2('handleTableUpdate', itemCount, offset, items.length);
    this.setState({ itemCount, items, offset, isLoading: false });
  }

  handleTextChange(event) {
    log.debug2('handleTextChange');

    const { value: text } = event.target;

    this.setState({ text });

    this.debounceUpdateFilter();
  }

  handleViewportChange(topRow, bottomRow) {
    log.debug2('handleViewportChange', topRow, bottomRow);

    const delta = Math.max(1, bottomRow - topRow);
    const top = Math.max(0, topRow - delta);
    const bottom = bottomRow + delta;

    const { table } = this.props;
    table.setViewport(top, bottom);
  }

  debounceUpdateFilter() {
    this.updateFilter();
  }

  focus() {
    if (this.searchInput) {
      this.searchInput.focus();
    }
  }

  startListening() {
    const { initialPageSize, table } = this.props;
    table.addEventListener(dh.Table.EVENT_UPDATED, this.handleTableUpdate);
    table.addEventListener(
      dh.Table.EVENT_FILTERCHANGED,
      this.handleFilterChange
    );
    table.setViewport(0, initialPageSize);
  }

  stopListening() {
    const { table } = this.props;
    table.removeEventListener(dh.Table.EVENT_UPDATED, this.handleTableUpdate);
    table.removeEventListener(
      dh.Table.EVENT_FILTERCHANGED,
      this.handleFilterChange
    );
  }

  updateFilter() {
    const { initialPageSize, table } = this.props;
    const { text } = this.state;
    const filterText = text.trim();
    const filters = [];
    if (filterText.length > 0) {
      const column = table.columns[0];
      const filter = column
        .filter()
        .invoke(
          'matches',
          dh.FilterValue.ofString(`(?s)(?i).*\\Q${filterText}\\E.*`)
        );
      filters.push(filter);
    }

    log.debug2('updateFilter', filters);

    table.applyFilter(filters);
    table.setViewport(0, initialPageSize);
  }

  render() {
    const { isLoading, itemCount, items, offset, text } = this.state;
    const listHeight =
      Math.min(itemCount, PartitionSelectorSearch.MAX_VISIBLE_ITEMS) *
        ItemList.DEFAULT_ROW_HEIGHT +
      // Adjust for ListItem vertical padding - .375rem ~ 5.25px
      11;
    return (
      <div className="iris-grid-partition-selector-search">
        <div className="search-container">
          <input
            type="text"
            ref={searchInput => {
              this.searchInput = searchInput;
            }}
            value={text}
            placeholder="Available Partitions"
            onChange={this.handleTextChange}
            onFocus={this.handleInputFocus}
            onKeyDown={this.handleKeyDown}
            className="form-control input-partition"
          />
        </div>
        {!isLoading && itemCount > 0 && (
          <div
            className="iris-grid-partition-selector-search-list"
            onKeyDown={this.handleListKeydown}
            role="presentation"
            style={{ height: listHeight }}
          >
            <ItemList
              ref={itemList => {
                this.itemList = itemList;
              }}
              itemCount={itemCount}
              items={items}
              offset={offset}
              onSelect={this.handleSelect}
              onViewportChange={this.handleViewportChange}
            />
          </div>
        )}
        {!isLoading && itemCount === 0 && (
          <div className="iris-grid-partition-selector-search-empty">
            No results
          </div>
        )}
        {isLoading && (
          <div className="iris-grid-partition-selector-loading">
            <LoadingSpinner />
            &nbsp;Loading...
          </div>
        )}
      </div>
    );
  }
}

PartitionSelectorSearch.propTypes = {
  getFormattedString: PropTypes.func.isRequired,
  table: PropTypes.shape({
    addEventListener: PropTypes.func.isRequired,
    removeEventListener: PropTypes.func.isRequired,
    columns: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        filter: PropTypes.func.isRequired,
      })
    ),
    size: PropTypes.number.isRequired,
    applyFilter: PropTypes.func.isRequired,
    setViewport: PropTypes.func.isRequired,
  }).isRequired,
  initialPageSize: PropTypes.number,
  onSelect: PropTypes.func,
  onListResized: PropTypes.func,
};

PartitionSelectorSearch.defaultProps = {
  initialPageSize: 100,
  onSelect: () => {},
  onListResized: () => {},
};

export default PartitionSelectorSearch;
