import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Option, Select } from '@deephaven/components';
import { vsChevronRight, vsMerge, vsKey } from '@deephaven/icons';
import Log from '@deephaven/log';
import type { Table } from '@deephaven/jsapi-types';
import { TableUtils } from '@deephaven/jsapi-utils';
import { Pending, PromiseUtils } from '@deephaven/utils';
import './IrisGridPartitionSelector.scss';
import { PartitionConfig, PartitionedGridModel } from './PartitionedGridModel';

const log = Log.module('IrisGridPartitionSelector');

interface Items {
  order: string[];
  data: {
    [key: string]: unknown;
  };
}

interface IrisGridPartitionSelectorProps {
  model: PartitionedGridModel;
  partitionConfig: PartitionConfig;
  onChange: (partitionConfig: PartitionConfig) => void;
}
interface IrisGridPartitionSelectorState {
  partitionConfig: PartitionConfig;
  partitionColumnValues: readonly Items[];
  selectorValue: readonly string[];
  isLoading: boolean;
}
class IrisGridPartitionSelector extends Component<
  IrisGridPartitionSelectorProps,
  IrisGridPartitionSelectorState
> {
  static defaultProps = {
    onChange: (): void => undefined,
    partitions: [],
  };

  constructor(props: IrisGridPartitionSelectorProps) {
    super(props);

    this.handleKeyTableClick = this.handleKeyTableClick.bind(this);
    this.handleMergeClick = this.handleMergeClick.bind(this);
    this.handlePartitionSelect = this.handlePartitionSelect.bind(this);

    const { model, partitionConfig } = props;
    this.tableUtils = new TableUtils(model.dh);
    this.table = null;
    this.partitionTables = null;
    this.pending = new Pending();

    this.state = {
      selectorValue: model.partitionColumns.map(() => ''),
      partitionConfig,
      partitionColumnValues: model.partitionColumns.map(() => ({
        order: [],
        data: {},
      })),
      isLoading: true,
    };
  }

  async componentDidMount(): Promise<void> {
    const { model, partitionConfig } = this.props;

    const table = await this.pending.add(
      model.partitionKeysTable().then(keyTable => {
        const sorts = model.partitionColumns.map(column =>
          column.sort().desc()
        );
        keyTable.applySort(sorts);
        return keyTable;
      }),
      t => t.close()
    );
    try {
      this.partitionTables = await Promise.all(
        model.partitionColumns.map(async (_, i) =>
          this.pending.add(
            table.selectDistinct(model.partitionColumns.slice(0, i + 1)),
            t => t.close()
          )
        )
      );
    } catch (e) {
      if (!PromiseUtils.isCanceled(e)) {
        log.error('Unable to get partition tables', e);
      }
    }
    this.table = table;
    this.updateConfig(partitionConfig);
  }

  componentDidUpdate(prevProps: IrisGridPartitionSelectorProps): void {
    const { partitionConfig: prevConfig } = prevProps;

    const { partitionConfig } = this.props;

    if (prevConfig !== partitionConfig) {
      this.updateConfig(partitionConfig);
    }
  }

  componentWillUnmount(): void {
    this.pending.cancel();
    this.table?.close();
    this.partitionTables?.forEach(table => table.close());
  }

  pending: Pending;

  tableUtils: TableUtils;

  table: Table | null;

  partitionTables: Table[] | null;

  handleKeyTableClick(): void {
    log.debug2('handleKeyTableClick');

    this.setState(
      prevState => ({
        partitionConfig: { ...prevState.partitionConfig, mode: 'keys' },
      }),
      this.sendUpdate
    );
  }

  handleMergeClick(): void {
    log.debug2('handleMergeClick');

    this.setState(
      prevState => ({
        partitionConfig: { ...prevState.partitionConfig, mode: 'merged' },
      }),
      this.sendUpdate
    );
  }

  handlePartitionSelect(index: number, partition: string): void {
    const { model } = this.props;
    const { partitionConfig: prevConfig, partitionColumnValues } = this.state;

    log.debug('handlePartitionSelect', index, partition, prevConfig);

    const newPartitions =
      prevConfig.partitions.length === model.partitionColumns.length
        ? [...prevConfig.partitions]
        : Array(model.partitionColumns.length).fill(null);
    newPartitions[index] = partitionColumnValues[index].data[partition];
    const newConfig: PartitionConfig = {
      partitions: newPartitions,
      mode: 'partition',
    };

    this.setState({ isLoading: true });
    this.updateConfig(newConfig, index, true);
  }

  sendUpdate(): void {
    log.debug2('sendUpdate');

    const { onChange } = this.props;
    const { partitionConfig } = this.state;
    onChange(partitionConfig);
  }

  /** Calls model.displayString with a special character case */
  getDisplayValue(index: number, partition?: unknown): string {
    const { model } = this.props;
    const { partitionConfig } = this.state;

    const value =
      partition === undefined ? partitionConfig.partitions[index] : partition;
    if (value == null || value === '') {
      return '';
    }
    const column = model.partitionColumns[index];
    if (TableUtils.isCharType(column.type) && value.toString().length > 0) {
      return String.fromCharCode(parseInt(value.toString(), 10));
    }
    return model.displayString(value, column.type, column.name);
  }

  /**
   * Resolve invalid partitions and get new values for partition dropdowns
   * @param index The index of the partition that was changed
   * @param partitions Array of partitions containing updated values
   */
  async updateConfig(
    partitionConfig: PartitionConfig,
    index = 0,
    updateIrisGrid = false
  ): Promise<void> {
    if (partitionConfig.mode !== 'partition') {
      this.clearDropdowns(partitionConfig);
      return;
    }
    if (!Array.isArray(this.partitionTables)) {
      return;
    }
    log.debug('partitionSelector update', index, partitionConfig);
    const { model } = this.props;
    // Cannot use columns from props since different index number will cause filters to fail
    const { columns } = this.partitionTables[this.partitionTables.length - 1];
    if (!this.table) {
      // this.table should be assigned in componentDidMount before updatePartitions is called
      throw new Error('Table not initialized');
    }

    const partitionFilters = [...this.partitionTables[index].filter];
    const validPartitions = [...partitionConfig.partitions];
    let lastValidPartition = null;

    // Update partition filters
    for (let i = index; i < partitionConfig.partitions.length; i += 1) {
      // Await in loop necessary since each partition values list cascades from the previous iteration
      /* eslint-disable  no-await-in-loop */
      const partition = validPartitions[i];
      const partitionColumn = columns[i];

      this.partitionTables[i].applyFilter([...partitionFilters]);
      const partitionText = TableUtils.isCharType(partitionColumn.type)
        ? this.getDisplayValue(i, partition)
        : partition?.toString() ?? '';
      const partitionFilter =
        partition === null
          ? partitionColumn.filter().isNull()
          : this.tableUtils.makeQuickFilterFromComponent(
              partitionColumn,
              partitionText
            );
      if (partitionFilter !== null) {
        partitionFilters.push(partitionFilter);
      } else {
        throw new Error(
          `Failed to build partition ${partition} for column ${partitionColumn.name}`
        );
      }

      const t = await this.pending.add(this.table.copy(), tCopy =>
        tCopy.close()
      );
      t.applyFilter(partitionFilters);
      t.setViewport(0, 0, t.columns);
      const data = await t.getViewportData();
      t.close();
      // Check if columns after index are defined
      if (data.rows.length > 0) {
        [lastValidPartition] = data.rows;
      } else {
        validPartitions[i] = lastValidPartition?.get(partitionColumn);
        partitionFilters.pop();
        i -= 1;
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
            const displayValue = model.displayString(
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
    this.setState(
      {
        partitionConfig: { partitions: validPartitions, mode: 'partition' },
        partitionColumnValues: newColumnValues,
        selectorValue: columns.map((_, i) =>
          this.getDisplayValue(i, validPartitions[i] ?? '')
        ),
        isLoading: false,
      },
      updateIrisGrid ? this.sendUpdate : undefined
    );
  }

  async clearDropdowns(partitionConfig: PartitionConfig): Promise<void> {
    if (!Array.isArray(this.partitionTables)) {
      return;
    }
    log.debug('partitionSelector clearDropdowns', partitionConfig);
    const { model } = this.props;
    this.partitionTables.forEach(table => table.applyFilter([]));
    const newColumnValues = Array(model.partitionColumns.length).fill({
      order: [],
      data: {},
    } as Items);
    this.partitionTables[0].setViewport(0, this.partitionTables[0].size);
    const data = await this.partitionTables[0].getViewportData();
    const column = this.partitionTables[0].columns[0];
    newColumnValues[0] = data.rows.reduce(
      (columnValues, row) => {
        const value = row.get(column);
        const displayValue = model.displayString(
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
    this.setState({
      partitionConfig,
      partitionColumnValues: newColumnValues,
      selectorValue: Array(model.partitionColumns.length).fill(''),
    });
  }

  render(): JSX.Element {
    const { model } = this.props;
    const { selectorValue, partitionConfig, partitionColumnValues, isLoading } =
      this.state;

    const partitionSelectors = model.partitionColumns.map((column, index) => (
      <div key={`selector-${column.name}`} className="column-selector">
        <div className="column-name">{column.name}</div>
        <Select
          className="custom-select-sm"
          value={selectorValue[index]}
          onChange={value => this.handlePartitionSelect(index, value)}
          disabled={
            (index > 0 && partitionConfig.mode !== 'partition') || isLoading
          }
        >
          {partitionConfig.mode === 'partition' || (
            <Option disabled key={column.name} value="">
              {' '}
            </Option>
          )}
          {partitionColumnValues[index].order.map((value, i) => (
            <Option
              key={`${column.name}-${i.toString()} ${value}`}
              value={value}
            >
              {value}
            </Option>
          ))}
        </Select>
        {model.partitionColumns.length - 1 === index || (
          <FontAwesomeIcon icon={vsChevronRight} />
        )}
      </div>
    ));
    return (
      <div className="iris-grid-partition-selector">
        <div className="table-name">Partitioned Table</div>
        <div className="partition-button-group">
          <Button
            className="btn-sm"
            onClick={this.handleKeyTableClick}
            kind="inline"
            tooltip="View keys as table"
            icon={vsKey}
            active={partitionConfig.mode === 'keys'}
            disabled={isLoading}
          >
            Keys
          </Button>
          <Button
            className="btn-sm"
            onClick={this.handleMergeClick}
            kind="inline"
            tooltip="View all partitions as one merged table"
            icon={<FontAwesomeIcon icon={vsMerge} rotation={90} />}
            active={partitionConfig.mode === 'merged'}
            disabled={isLoading}
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
