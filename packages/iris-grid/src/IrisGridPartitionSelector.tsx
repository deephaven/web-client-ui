import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, DropdownMenu, Tooltip } from '@deephaven/components';
import {
  vsTriangleDown,
  vsChevronRight,
  vsMerge,
  vsKey,
} from '@deephaven/icons';
import Log from '@deephaven/log';
import debounce from 'lodash.debounce';
import type {
  Column,
  dh as DhType,
  Table,
  TableData,
} from '@deephaven/jsapi-types';
import { TableUtils } from '@deephaven/jsapi-utils';
import deepEqual from 'deep-equal';
import PartitionSelectorSearch from './PartitionSelectorSearch';
import './IrisGridPartitionSelector.scss';
import IrisGridUtils from './IrisGridUtils';

const log = Log.module('IrisGridPartitionSelector');

const PARTITION_CHANGE_DEBOUNCE_MS = 250;
interface IrisGridPartitionSelectorProps<T> {
  dh: DhType;
  getFormattedString: (value: T, type: string, name: string) => string;
  table: Table;
  columns: readonly Column[];
  partitions: readonly unknown[];
  onMerge: () => void;
  onChange: (partitions: readonly unknown[]) => void;
  onKeyTable: () => void;
}
interface IrisGridPartitionSelectorState {
  isShowingKeys: boolean;
  partitions: readonly unknown[];
  partitionTables: Table[] | null;
}
class IrisGridPartitionSelector<T> extends Component<
  IrisGridPartitionSelectorProps<T>,
  IrisGridPartitionSelectorState
> {
  static defaultProps = {
    onChange: (): void => undefined,
    onMerge: (): void => undefined,
    onKeyTable: (): void => undefined,
    partitions: [],
  };

  constructor(props: IrisGridPartitionSelectorProps<T>) {
    super(props);

    this.handleKeyTableClick = this.handleKeyTableClick.bind(this);
    this.handleMergeClick = this.handleMergeClick.bind(this);
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
      isShowingKeys: false,
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
    this.updatePartitions(0, partitions, partitionTables).then(
      ([newPartitions, newPartitionTables]) => {
        this.setState({
          partitions: newPartitions,
          partitionTables: newPartitionTables,
        });
      }
    );
  }

  componentDidUpdate(prevProps: IrisGridPartitionSelectorProps<T>): void {
    const { partitions: prevPartitions } = prevProps;
    const { partitions: newPartitions } = this.props;
    const { partitionTables: prevTables } = this.state;

    if (!deepEqual(prevPartitions, newPartitions)) {
      log.log(prevPartitions, newPartitions);
      this.updatePartitions(0, newPartitions, prevTables).then(
        ([partitions, partitionTables]) => {
          this.setState({
            partitions,
            partitionTables,
          });
        }
      );
    }
  }

  componentWillUnmount(): void {
    const { partitionTables } = this.state;
    partitionTables?.forEach(table => table.close());
    this.debounceUpdate.cancel();
  }

  tableUtils: TableUtils;

  searchMenu: (DropdownMenu | null)[];

  selectorSearch: (PartitionSelectorSearch<T> | null)[];

  handleKeyTableClick(): void {
    log.debug2('handleKeyTableClick');

    this.setState({ isShowingKeys: true });
    this.sendKeyTable();
  }

  handleMergeClick(): void {
    log.debug2('handleMergeClick');

    this.setState({ isShowingKeys: false });
    this.sendMerge();
  }

  handlePartitionChange(
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    log.debug2('handlePartitionChange');

    const { columns } = this.props;
    const { partitions: prevPartitions, partitionTables: prevTables } =
      this.state;
    const { value: partition } = event.target;

    const newPartitions = [...prevPartitions];
    newPartitions[index] =
      TableUtils.isCharType(columns[index].type) && partition.length > 0
        ? partition.charCodeAt(0).toString()
        : partition;

    this.updatePartitions(index, newPartitions, prevTables).then(
      ([partitions, partitionTables]) => {
        this.setState({
          partitions,
          partitionTables,
        });

        this.debounceUpdate();
      }
    );
  }

  handlePartitionSelect(index: number, partition: string): void {
    const { partitions: prevPartitions, partitionTables: prevTables } =
      this.state;
    const selectedMenu = this.searchMenu[index];
    if (selectedMenu) {
      selectedMenu.closeMenu();
    }

    const newPartitions = [...prevPartitions];
    newPartitions[index] = partition;

    this.updatePartitions(index, newPartitions, prevTables).then(
      ([partitions, partitionTables]) => {
        this.setState(
          { isShowingKeys: false, partitions, partitionTables },
          () => {
            this.sendUpdate();
          }
        );
      }
    );
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

  sendUpdate(): void {
    log.debug2('sendUpdate');

    const { onChange } = this.props;
    const { partitions } = this.state;
    onChange(partitions);
  }

  sendMerge(): void {
    log.debug2('sendMerge');

    this.debounceUpdate.cancel();

    const { onMerge } = this.props;
    onMerge();
  }

  sendKeyTable(): void {
    log.debug2('sendOpenKeys');

    this.debounceUpdate.cancel();

    const { onKeyTable } = this.props;
    onKeyTable();
  }

  getDisplayValue(column: Column, index: number): string {
    const { partitions } = this.state;
    const partition = partitions[index];
    if (partition == null) {
      return '';
    }
    if (TableUtils.isCharType(column.type) && partition.toString().length > 0) {
      return String.fromCharCode(parseInt(partition.toString(), 10));
    }
    return IrisGridUtils.convertValueToText(partition, column.type);
  }

  async updatePartitions(
    index: number,
    partitions: readonly unknown[],
    partitionTables: Table[] | null
  ): Promise<[unknown[], Table[] | null]> {
    if (!Array.isArray(partitionTables)) {
      return [[...partitions], partitionTables];
    }
    const { columns, getFormattedString, table } = this.props;

    const dataPromises = Array<Promise<TableData>>();
    const partitionFilters = [...partitionTables[index].filter];

    // Create partition filters
    for (let i = index; i < columns.length; i += 1) {
      const partition = partitions[i];
      const partitionColumn = columns[i];

      partitionTables[i].applyFilter([...partitionFilters]);
      if (
        partition != null &&
        !(TableUtils.isCharType(partitionColumn.type) && partition === '')
      ) {
        const partitionText = TableUtils.isCharType(partitionColumn.type)
          ? getFormattedString(
              partition as T,
              partitionColumn.type,
              partitionColumn.name
            )
          : partition?.toString() ?? '';
        const partitionFilter = this.tableUtils.makeQuickFilterFromComponent(
          partitionColumn,
          partitionText
        );
        if (partitionFilter !== null) {
          // Should never be null
          partitionFilters.push(partitionFilter);
        }
      }
      const partitionFilterCopy = [...partitionFilters];
      dataPromises.push(
        table.copy().then(async t => {
          t.applyFilter(partitionFilterCopy);
          t.setViewport(0, 0, columns as Column[]);
          const data = await t.getViewportData();
          t.close();
          return data;
        })
      );
    }

    return Promise.all(dataPromises).then(tableData => {
      // Check if a partition is selected (no partitions for key table or merge table)
      if (partitions[index] === undefined) {
        return [[...partitions], partitionTables];
      }
      // Check if columns before index are defined
      const validPartitions = partitions.slice(0, index + 1);
      if (validPartitions.includes(undefined)) {
        for (
          let emptyIndex = 0;
          emptyIndex < validPartitions.length;
          emptyIndex += 1
        ) {
          if (validPartitions[emptyIndex] === undefined) {
            return this.updatePartitions(
              emptyIndex,
              columns.map(c => tableData[0].rows[0].get(c)),
              partitionTables
            );
          }
        }
      }
      // Check if columns after index are defined
      for (let i = 1; i < tableData.length; i += 1) {
        const data = tableData[i];
        if (data.rows.length > 0 && partitions[index + i] !== undefined) {
          validPartitions.push(partitions[index + i]);
        } else {
          return this.updatePartitions(
            index + i,
            columns.map(c => tableData[i - 1].rows[0].get(c)),
            partitionTables
          );
        }
      }
      return [validPartitions, partitionTables];
    });
  }

  render(): JSX.Element {
    const { columns, dh, getFormattedString } = this.props;
    const { isShowingKeys, partitions, partitionTables } = this.state;

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
      <React.Fragment key={`selector-${column.name}`}>
        <div className="column-name">
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
        {/* <FontAwesomeIcon icon={vsChevronRight} /> */}
        <div className="iris-grid-partition-selector-spacer" />
      </React.Fragment>
    ));
    return (
      <div className="iris-grid-partition-selector">
        <Button
          type="button"
          className="btn btn-outline-primary btn-merge"
          onClick={this.handleKeyTableClick}
          kind="inline"
          icon={<FontAwesomeIcon icon={vsKey} />}
          disabled={isShowingKeys}
        >
          keys
        </Button>
        <Button
          type="button"
          className="btn btn-outline-primary btn-merge"
          onClick={this.handleMergeClick}
          kind="inline"
          icon={<FontAwesomeIcon icon={vsMerge} rotation={90} />}
          disabled={!isShowingKeys && partitions.length === 0}
        >
          merge
        </Button>
        {partitionSelectors}
      </div>
    );
  }
}

export default IrisGridPartitionSelector;
