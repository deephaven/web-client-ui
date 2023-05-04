import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DropdownMenu, Tooltip } from '@deephaven/components';
import { vsTriangleDown, vsClose } from '@deephaven/icons';
import Log from '@deephaven/log';
import debounce from 'lodash.debounce';
import { dh as DhType, Table } from '@deephaven/jsapi-types';
import PartitionSelectorSearch from './PartitionSelectorSearch';
import './IrisGridPartitionSelector.scss';
import { ColumnName } from './CommonTypes';

const log = Log.module('IrisGridPartitionSelector');

const PARTITION_CHANGE_DEBOUNCE_MS = 250;
interface IrisGridPartitionSelectorProps<T> {
  dh: DhType;
  getFormattedString: (value: T, type: string, name: string) => string;
  table: Table;
  columnName: ColumnName;
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
  static defaultProps = {
    onAppend: (): void => undefined,
    onChange: (): void => undefined,
    onFetchAll: (): void => undefined,
    onDone: (): void => undefined,
    partition: '',
  };

  constructor(props: IrisGridPartitionSelectorProps<T>) {
    super(props);

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

  searchMenu: DropdownMenu | null;

  selectorSearch: PartitionSelectorSearch<T> | null;

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

  debounceUpdate = debounce((): void => {
    this.sendUpdate();
  }, PARTITION_CHANGE_DEBOUNCE_MS);

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

  render(): JSX.Element {
    const { columnName, dh, getFormattedString, onDone, table } = this.props;
    const { partition } = this.state;
    const partitionSelectorSearch = (
      <PartitionSelectorSearch
        dh={dh}
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
