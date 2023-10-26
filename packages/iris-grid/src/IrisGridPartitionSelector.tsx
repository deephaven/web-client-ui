import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DropdownMenu, Tooltip } from '@deephaven/components';
import { vsTriangleDown, vsClose } from '@deephaven/icons';
import Log from '@deephaven/log';
import debounce from 'lodash.debounce';
import type { Column, dh as DhType, Table } from '@deephaven/jsapi-types';
import { TableUtils } from '@deephaven/jsapi-utils';
import PartitionSelectorSearch from './PartitionSelectorSearch';
import './IrisGridPartitionSelector.scss';
import IrisGridUtils from './IrisGridUtils';

const log = Log.module('IrisGridPartitionSelector');

const PARTITION_CHANGE_DEBOUNCE_MS = 250;
interface IrisGridPartitionSelectorProps<T> {
  dh: DhType;
  getFormattedString: (value: T, type: string, name: string) => string;
  table: Table;
  columns: Column[];
  partitions: (string | null)[];
  onFetchAll: () => void;
  onDone: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  onChange: (partitions: (string | null)[]) => void;
}
interface IrisGridPartitionSelectorState {
  partitions: (string | null)[];
  partitionTables: Table[] | null;
}
class IrisGridPartitionSelector<T> extends Component<
  IrisGridPartitionSelectorProps<T>,
  IrisGridPartitionSelectorState
> {
  static defaultProps = {
    onChange: (): void => undefined,
    onFetchAll: (): void => undefined,
    onDone: (): void => undefined,
    partitions: [],
  };

  constructor(props: IrisGridPartitionSelectorProps<T>) {
    super(props);

    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.handleIgnoreClick = this.handleIgnoreClick.bind(this);
    this.handlePartitionChange = this.handlePartitionChange.bind(this);
    this.handlePartitionSelect = this.handlePartitionSelect.bind(this);
    this.handlePartitionListResized =
      this.handlePartitionListResized.bind(this);
    this.handleSearchOpened = this.handleSearchOpened.bind(this);
    this.handleSearchClosed = this.handleSearchClosed.bind(this);

    const { dh, columns, partitions } = props;
    this.tableUtils = new TableUtils(dh);
    this.searchMenu = columns.map(() => null);
    this.selectorSearch = columns.map(() => null);

    this.state = {
      partitions,
      partitionTables: null,
    };
  }

  async componentDidMount(): Promise<void> {
    const { columns, table } = this.props;
    const { partitions } = this.state;

    const partitionTables = await Promise.all(
      columns.map(async (_, i) => table.selectDistinct(columns.slice(0, i + 1)))
    );
    this.updatePartitionFilters(partitions, partitionTables);
  }

  componentWillUnmount(): void {
    const { partitionTables } = this.state;
    partitionTables?.forEach(table => table.close());
    this.debounceUpdate.cancel();
  }

  tableUtils: TableUtils;

  searchMenu: (DropdownMenu | null)[];

  selectorSearch: (PartitionSelectorSearch<T> | null)[];

  handleCloseClick(): void {
    log.debug2('handleCloseClick');

    this.sendDone();
  }

  handleIgnoreClick(): void {
    log.debug2('handleIgnoreClick');

    this.sendFetchAll();
  }

  handlePartitionChange(
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    log.debug2('handlePartitionChange');

    const { columns } = this.props;
    const { partitions, partitionTables } = this.state;
    const { value: partition } = event.target;

    const newPartitions = [...partitions];
    newPartitions[index] =
      TableUtils.isCharType(columns[index].type) && partition.length > 0
        ? partition.charCodeAt(0).toString()
        : partition;
    if (partitionTables) {
      this.updatePartitionFilters(newPartitions, partitionTables);
    }

    this.setState({
      partitions: newPartitions,
    });

    this.debounceUpdate();
  }

  handlePartitionSelect(index: number, partition: string): void {
    const { partitions, partitionTables } = this.state;
    const selectedMenu = this.searchMenu[index];
    if (selectedMenu) {
      selectedMenu.closeMenu();
    }

    const newPartitions = [...partitions];
    newPartitions[index] = partition;
    if (partitionTables) {
      this.updatePartitionFilters(newPartitions, partitionTables);
    }

    this.setState({ partitions: newPartitions }, () => {
      this.sendUpdate();
    });
  }

  handlePartitionListResized(index: number): void {
    const selectedMenu = this.searchMenu[index];
    if (selectedMenu) {
      selectedMenu.scheduleUpdate();
    }
  }

  handleSearchClosed(): void {
    // Reset the table filter so it's ready next time user opens search
    const { table } = this.props;
    table.applyFilter([]);
  }

  handleSearchOpened(index: number): void {
    const selectedSearch = this.selectorSearch[index];
    if (selectedSearch) {
      selectedSearch.focus();
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
    const { partitions } = this.state;
    onChange(partitions);
  }

  sendFetchAll(): void {
    log.debug2('sendFetchAll');

    this.debounceUpdate.cancel();

    const { onFetchAll } = this.props;
    onFetchAll();
  }

  getDisplayValue(column: Column, index: number): string {
    const { partitions } = this.state;
    const partition = partitions[index];
    if (partition == null) {
      return '';
    }
    if (TableUtils.isCharType(column.type) && partition.toString().length > 0) {
      return String.fromCharCode(parseInt(partition, 10));
    }
    return IrisGridUtils.convertValueToText(partition, column.type);
  }

  async updatePartitionFilters(
    partitions: (string | null)[],
    partitionTables: Table[]
  ): Promise<void> {
    const { columns, getFormattedString } = this.props;

    const partitionFilters = [];
    for (let i = 0; i < columns.length - 1; i += 1) {
      const partition = partitions[i];
      const partitionColumn = columns[i];

      partitionTables[i]?.applyFilter(partitionFilters);
      if (
        partition !== null &&
        !(TableUtils.isCharType(partitionColumn.type) && partition === '')
      ) {
        const partitionText = TableUtils.isCharType(partitionColumn.type)
          ? getFormattedString(
              partition as T,
              partitionColumn.type,
              partitionColumn.name
            )
          : partition;
        const partitionFilter = this.tableUtils.makeQuickFilterFromComponent(
          partitionColumn,
          partitionText
        );
        if (partitionFilter !== null) {
          partitionFilters.push(partitionFilter);
        }
      }
    }
    partitionTables[partitionTables.length - 1]?.applyFilter(partitionFilters);
    this.setState({ partitionTables });
  }

  render(): JSX.Element {
    const { columns, dh, getFormattedString, onDone } = this.props;
    const { partitionTables } = this.state;

    const partitionSelectorSearch = columns.map(
      (column, index) =>
        partitionTables && (
          <PartitionSelectorSearch
            dh={dh}
            key={`search-${column.name}`}
            column={column}
            getFormattedString={getFormattedString}
            table={partitionTables[index]}
            onSelect={(partition: string) =>
              this.handlePartitionSelect(index, partition)
            }
            onListResized={() => this.handlePartitionListResized(index)}
            ref={selectorSearch => {
              this.selectorSearch[index] = selectorSearch;
            }}
          />
        )
    );
    const partitionSelectors = columns.map((column, index) => (
      <>
        <div className="status-message">
          <span>{column.name}: </span>
        </div>
        <div className="input-group">
          <input
            type="text"
            value={this.getDisplayValue(column, index)}
            onChange={e => {
              this.handlePartitionChange(index, e);
            }}
            className="form-control input-partition"
          />
          <div className="input-group-append">
            <button type="button" className="btn btn-outline-primary">
              <FontAwesomeIcon icon={vsTriangleDown} />
              <Tooltip>Partitions</Tooltip>
              <DropdownMenu
                ref={searchMenu => {
                  this.searchMenu[index] = searchMenu;
                }}
                actions={[
                  { menuElement: partitionSelectorSearch[index] ?? undefined },
                ]}
                onMenuOpened={() => {
                  this.handleSearchOpened(index);
                }}
                onMenuClosed={this.handleSearchClosed}
              />
            </button>
          </div>
        </div>
        <div className="iris-grid-partition-selector-spacer" />
      </>
    ));
    return (
      <div className="iris-grid-partition-selector">
        {partitionSelectors}
        <button
          type="button"
          className="btn btn-outline-primary btn-ignore"
          onClick={this.handleIgnoreClick}
        >
          Ignore &amp; Fetch All
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
