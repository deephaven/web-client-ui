import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Option, Select } from '@deephaven/components';
import { vsChevronRight, vsMerge, vsKey } from '@deephaven/icons';
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
import './IrisGridPartitionSelector.scss';

const log = Log.module('IrisGridPartitionSelector');

const PARTITION_CHANGE_DEBOUNCE_MS = 250;

interface Items {
  order: string[];
  data: {
    [key: string]: unknown;
  };
}

interface IrisGridPartitionSelectorProps {
  dh: DhType;
  getFormattedString: (value: unknown, type: string, name: string) => string;
  tablePromise: Promise<Table>;
  columns: readonly Column[];
  partitions: readonly unknown[];
  onMerge: () => void;
  onChange: (partitions: readonly unknown[]) => void;
  onKeyTable: () => void;
}
interface IrisGridPartitionSelectorState {
  isShowingKeys: boolean;
  partitions: readonly unknown[];
  partitionColumnValues: readonly Items[];
  selectorValue: readonly string[];
}
class IrisGridPartitionSelector extends Component<
  IrisGridPartitionSelectorProps,
  IrisGridPartitionSelectorState
> {
  static defaultProps = {
    onChange: (): void => undefined,
    onMerge: (): void => undefined,
    onKeyTable: (): void => undefined,
    partitions: [],
  };

  constructor(props: IrisGridPartitionSelectorProps) {
    super(props);

    this.handleKeyTableClick = this.handleKeyTableClick.bind(this);
    this.handleMergeClick = this.handleMergeClick.bind(this);
    this.handlePartitionSelect = this.handlePartitionSelect.bind(this);

    const { dh, columns, partitions } = props;
    this.tableUtils = new TableUtils(dh);
    this.table = null;
    this.partitionTables = null;

    this.state = {
      isShowingKeys: false,
      selectorValue: columns.map(() => ''),
      partitions,
      partitionColumnValues: columns.map(() => ({ order: [], data: {} })),
    };
  }

  async componentDidMount(): Promise<void> {
    const { columns, tablePromise } = this.props;
    const { partitions } = this.state;

    const table = await tablePromise;
    this.table = table;
    this.partitionTables = await Promise.all(
      columns.map(async (_, i) => table.selectDistinct(columns.slice(0, i + 1)))
    );
    this.updatePartitions(0, partitions);
  }

  componentDidUpdate(prevProps: IrisGridPartitionSelectorProps): void {
    const { partitions: prevPartitions } = prevProps;
    const { partitions: newPartitions } = this.props;

    if (!deepEqual(prevPartitions, newPartitions)) {
      this.updatePartitions(0, newPartitions);
    }
  }

  componentWillUnmount(): void {
    this.table?.close();
    this.partitionTables?.forEach(table => table.close());
    this.debounceUpdate.cancel();
  }

  tableUtils: TableUtils;

  table: Table | null;

  partitionTables: Table[] | null;

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

  handlePartitionSelect(index: number, partition: string): void {
    const { partitions: prevPartitions, partitionColumnValues } = this.state;

    if (prevPartitions[index] === partition) {
      return;
    }
    log.debug('handlePartitionSelect', index, partition);

    const newPartitions = [...prevPartitions];
    newPartitions[index] = partitionColumnValues[index].data[partition];

    this.updatePartitions(index, newPartitions).then(() =>
      this.setState({ isShowingKeys: false }, () => {
        this.sendUpdate();
      })
    );
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

  getDisplayValue(index: number, partition?: unknown): string {
    const { columns, getFormattedString } = this.props;
    const { partitions } = this.state;

    const value = partition === undefined ? partitions[index] : partition;
    if (value == null || value === '') {
      return '';
    }
    const column = columns[index];
    if (TableUtils.isCharType(column.type) && value.toString().length > 0) {
      return String.fromCharCode(parseInt(value.toString(), 10));
    }
    return getFormattedString(value, column.type, column.name);
  }

  async updatePartitions(
    index: number,
    partitions: readonly unknown[]
  ): Promise<void> {
    log.debug('partitionSelector update', index, partitions);
    if (!Array.isArray(this.partitionTables)) {
      return;
    }
    const { columns, getFormattedString, tablePromise } = this.props;
    const table = await tablePromise;

    const dataPromises = Array<Promise<TableData>>();
    const partitionFilters = [...this.partitionTables[index].filter];

    // Update partition filters
    for (let i = index; i < columns.length; i += 1) {
      const partition = partitions[i];
      const partitionColumn = columns[i];

      this.partitionTables[i].applyFilter([...partitionFilters]);
      if (
        partition != null &&
        !(TableUtils.isCharType(partitionColumn.type) && partition === '')
      ) {
        const partitionText = TableUtils.isCharType(partitionColumn.type)
          ? getFormattedString(
              partition,
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
          return data as TableData;
        })
      );
    }
    // Update Partition Values
    const tableData = await Promise.all(dataPromises);
    const validPartitions = partitions.slice(0, index + 1);
    if (partitions[index] !== undefined) {
      // Check if columns before index are defined
      for (
        let emptyIndex = 0;
        emptyIndex < validPartitions.length;
        emptyIndex += 1
      ) {
        if (validPartitions[emptyIndex] === undefined) {
          return this.updatePartitions(
            emptyIndex,
            columns.map(c => tableData[0].rows[0].get(c))
          );
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
            columns.map(c => tableData[i - 1].rows[0].get(c))
          );
        }
      }
    }
    // Valid partitions found, update dropdown values
    const newColumnValuesPromise = this.partitionTables?.map(
      async (partitionTable, colIndex) => {
        partitionTable.setViewport(0, partitionTable.size);
        const data = await partitionTable.getViewportData();
        return data.rows.reduce(
          (columnValues, row) => {
            const column = columns[colIndex];
            const value = row.get(column);
            const displayValue = getFormattedString(
              value,
              column.type,
              column.name
            );

            return {
              order: [...columnValues.order, displayValue],
              data: { ...columnValues.data, [displayValue]: value },
            };
          },
          { order: [], data: {} } as Items
        );
      }
    );
    const newColumnValues = await Promise.all(newColumnValuesPromise);
    this.setState({
      partitions: validPartitions,
      partitionColumnValues: newColumnValues,
      selectorValue: columns.map((_, i) =>
        this.getDisplayValue(i, validPartitions[i] ?? '')
      ),
    });
  }

  render(): JSX.Element {
    const { columns } = this.props;
    const { isShowingKeys, selectorValue, partitions, partitionColumnValues } =
      this.state;

    const partitionSelectors = columns.map((column, index) => (
      <div key={`selector-${column.name}`} className="column-selector">
        <div className="column-name">
          <span>{column.name} </span>
        </div>
        <Select
          className="custom-select-sm"
          value={selectorValue[index]}
          onChange={value => this.handlePartitionSelect(index, value)}
        >
          {partitions.length > 0 || (
            <Option disabled value="">
              {' '}
            </Option>
          )}
          {partitionColumnValues[index].order.map(value => (
            <Option key={value} value={value}>
              {value}
            </Option>
          ))}
        </Select>
        {columns.length - 1 === index || (
          <>
            &nbsp;
            <FontAwesomeIcon icon={vsChevronRight} />
          </>
        )}
      </div>
    ));
    return (
      <div className="iris-grid-partition-selector">
        <div className="table-name">
          <span>Partitioned Table </span>
        </div>
        <div className="partition-button-group">
          <Button
            className="btn-sm"
            onClick={this.handleKeyTableClick}
            kind="inline"
            tooltip="View keys as table"
            icon={vsKey}
            active={isShowingKeys}
          >
            Keys
          </Button>
          <Button
            className="btn-sm"
            onClick={this.handleMergeClick}
            kind="inline"
            tooltip="View all partitions as one merged table"
            icon={<FontAwesomeIcon icon={vsMerge} rotation={90} />}
            active={!isShowingKeys && partitions.length === 0}
          >
            Merge
          </Button>
        </div>
        {partitionSelectors}
      </div>
    );
  }
}

export default IrisGridPartitionSelector;
