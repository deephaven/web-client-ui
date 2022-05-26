import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DropdownMenu, Tooltip } from '@deephaven/components';
import { vsTriangleDown, vsClose } from '@deephaven/icons';
import Log from '@deephaven/log';
import debounce from 'lodash.debounce';
import { DebouncedFunc } from 'lodash';
import PartitionSelectorSearch from './PartitionSelectorSearch';
import './IrisGridPartitionSelector.scss';
import { Table } from '@deephaven/jsapi-shim';

const log = Log.module('IrisGridPartitionSelector');

const PARTITION_CHANGE_DEBOUNCE_MS = 250;
interface IrisGridPartitionSelectorProps<T> {
  getFormattedString: (value: T, type: string, name: string) => string;
  table: Table;
  columnName: string;
  partition: string;
  onAppend: (partition: string) => void;
  onFetchAll: () => void;
  onDone: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  onChange: (partition: string) => void;
}
interface IrisGridPartitionSelectorState {
  partition: string;
}
class IrisGridPartitionSelector<T> extends Component<
  IrisGridPartitionSelectorProps<T>,
  IrisGridPartitionSelectorState
> {
  static propTypes = {
    getFormattedString: PropTypes.func.isRequired,
    table: PropTypes.shape({ applyFilter: PropTypes.func }).isRequired,
    columnName: PropTypes.string.isRequired,
    partition: PropTypes.string,
    onAppend: PropTypes.func,
    onChange: PropTypes.func,
    onFetchAll: PropTypes.func,
    onDone: PropTypes.func,
  };
  static defaultProps: {
    onAppend: () => void;
    onChange: () => void;
    onFetchAll: () => void;
    onDone: () => void;
    partition: string;
  };

  searchMenu: DropdownMenu | null;
  selectorSearch: PartitionSelectorSearch<T> | null;
  debounceUpdate: DebouncedFunc<() => void>;

  constructor(props: IrisGridPartitionSelectorProps<T>) {
    super(props);

    this.debounceUpdate = debounce(
      this._debounceUpdate.bind(this),
      PARTITION_CHANGE_DEBOUNCE_MS
    );
    this.handleAppendClick = this.handleAppendClick.bind(this);
    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.handleIgnoreClick = this.handleIgnoreClick.bind(this);
    this.handlePartitionChange = this.handlePartitionChange.bind(this);
    this.handlePartitionSelect = this.handlePartitionSelect.bind(this);
    this.handlePartitionListResized = this.handlePartitionListResized.bind(
      this
    );
    this.handleSearchOpened = this.handleSearchOpened.bind(this);
    this.handleSearchClosed = this.handleSearchClosed.bind(this);

    this.searchMenu = null;
    this.selectorSearch = null;

    const { partition } = props;
    this.state = {
      partition,
    };
  }

  componentWillUnmount(): void {
    this.debounceUpdate.cancel();
  }

  handleAppendClick(): void {
    log.debug2('handleAppendClick');

    const { onAppend } = this.props;
    const { partition } = this.state;
    onAppend(partition);
  }

  handleCloseClick(): void {
    log.debug2('handleCloseClick');

    this.sendDone();
  }

  handleIgnoreClick(): void {
    log.debug2('handleIgnoreClick');

    this.sendFetchAll();
  }

  handlePartitionChange(event: React.ChangeEvent<HTMLInputElement>): void {
    log.debug2('handlePartitionChange');

    const { value: partition } = event.target;

    this.setState({ partition });

    this.debounceUpdate();
  }

  handlePartitionSelect(partition: string): void {
    if (this.searchMenu) {
      this.searchMenu.closeMenu();
    }

    this.setState({ partition }, () => {
      this.sendUpdate();
    });
  }

  handlePartitionListResized(): void {
    if (this.searchMenu) {
      this.searchMenu.scheduleUpdate();
    }
  }

  handleSearchClosed(): void {
    // Reset the table filter so it's ready next time user opens search
    const { table } = this.props;
    table.applyFilter([]);
  }

  handleSearchOpened(): void {
    if (this.selectorSearch) {
      this.selectorSearch.focus();
    }
  }

  _debounceUpdate(): void {
    this.sendUpdate();
  }

  sendDone(): void {
    this.debounceUpdate.flush();

    const { onDone } = this.props;
    onDone();
  }

  sendUpdate(): void {
    log.debug2('sendUpdate');

    const { onChange } = this.props;
    const { partition } = this.state;
    onChange(partition);
  }

  sendFetchAll(): void {
    log.debug2('sendFetchAll');

    this.debounceUpdate.cancel();

    const { onFetchAll } = this.props;
    onFetchAll();
  }

  render(): React.ReactElement {
    const { columnName, getFormattedString, onDone, table } = this.props;
    const { partition } = this.state;
    const partitionSelectorSearch = (
      <PartitionSelectorSearch
        key="search"
        getFormattedString={getFormattedString}
        table={table}
        onSelect={this.handlePartitionSelect}
        onListResized={this.handlePartitionListResized}
        ref={selectorSearch => {
          this.selectorSearch = selectorSearch;
        }}
      />
    );
    return (
      <div className="iris-grid-partition-selector">
        <div className="status-message">
          <span>Filtering &quot;{columnName}&quot; partition to</span>
        </div>
        <div className="input-group">
          <input
            type="text"
            value={partition}
            onChange={this.handlePartitionChange}
            className="form-control input-partition"
          />
          <div className="input-group-append">
            <button type="button" className="btn btn-outline-primary">
              <FontAwesomeIcon icon={vsTriangleDown} />
              <Tooltip>Partitions</Tooltip>
              <DropdownMenu
                ref={searchMenu => {
                  this.searchMenu = searchMenu;
                }}
                actions={[{ menuElement: partitionSelectorSearch }]}
                onMenuOpened={this.handleSearchOpened}
                onMenuClosed={this.handleSearchClosed}
              />
            </button>
          </div>
        </div>
        <div className="iris-grid-partition-selector-spacer" />
        <button
          type="button"
          className="btn btn-outline-primary btn-ignore"
          onClick={this.handleIgnoreClick}
        >
          Ignore &amp; Fetch All
        </button>
        <button
          type="button"
          className="btn btn-outline-primary btn-append"
          onClick={this.handleAppendClick}
        >
          Append Command
        </button>
        <button
          type="button"
          className="btn btn-link btn-link-icon btn-close"
          onClick={onDone}
        >
          <FontAwesomeIcon icon={vsClose} />
        </button>
      </div>
    );
  }
}

export default IrisGridPartitionSelector;
