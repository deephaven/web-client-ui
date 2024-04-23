import React, { Component } from 'react';
import memoizee from 'memoizee';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@deephaven/components';
import { vsChevronRight, vsMerge, vsKey } from '@deephaven/icons';
import Log from '@deephaven/log';
import { TableDropdown } from '@deephaven/jsapi-components';
import type { dh } from '@deephaven/jsapi-types';
import { TableUtils } from '@deephaven/jsapi-utils';
import { assertNotNull, Pending, PromiseUtils } from '@deephaven/utils';
import './IrisGridPartitionSelector.scss';
import { PartitionConfig, PartitionedGridModel } from './PartitionedGridModel';

const log = Log.module('IrisGridPartitionSelector');

interface IrisGridPartitionSelectorProps {
  model: PartitionedGridModel;
  partitionConfig: PartitionConfig;
  onChange: (partitionConfig: PartitionConfig) => void;
}
interface IrisGridPartitionSelectorState {
  isLoading: boolean;

  keysTable: dh.Table | null;

  partitionTables: dh.Table[] | null;

  /** The filters to apply to each partition table */
  partitionFilters: dh.FilterCondition[][] | null;
}
class IrisGridPartitionSelector extends Component<
  IrisGridPartitionSelectorProps,
  IrisGridPartitionSelectorState
> {
  constructor(props: IrisGridPartitionSelectorProps) {
    super(props);

    this.handleKeyTableClick = this.handleKeyTableClick.bind(this);
    this.handleMergeClick = this.handleMergeClick.bind(this);
    this.handlePartitionSelect = this.handlePartitionSelect.bind(this);

    const { model } = props;
    this.tableUtils = new TableUtils(model.dh);
    this.pending = new Pending();

    this.state = {
      // We start be loading the partition tables, so we should be in a loading state
      isLoading: true,

      keysTable: null,
      partitionFilters: null,
      partitionTables: null,
    };
  }

  async componentDidMount(): Promise<void> {
    const { model } = this.props;

    try {
      const keysTable = await this.pending.add(
        model.partitionKeysTable().then(keyTable => {
          const sorts = model.partitionColumns.map(column =>
            column.sort().desc()
          );
          keyTable.applySort(sorts);
          return keyTable;
        }),
        t => t.close()
      );

      const partitionTables = await Promise.all(
        model.partitionColumns.map(async (_, i) =>
          this.pending.add(
            keysTable.selectDistinct(model.partitionColumns.slice(0, i + 1)),
            t => t.close()
          )
        )
      );

      const partitionFilters = this.getPartitionFilters(partitionTables);
      this.setState({
        isLoading: false,
        keysTable,
        partitionFilters,
        partitionTables,
      });
    } catch (e) {
      if (!PromiseUtils.isCanceled(e)) {
        // Just re-throw the error if it's not a cancel
        throw e;
      }
    }
  }

  componentDidUpdate(prevProps: IrisGridPartitionSelectorProps): void {
    const { partitionConfig: prevConfig } = prevProps;

    const { partitionConfig } = this.props;

    if (prevConfig !== partitionConfig) {
      this.updatePartitionFilters();
    }
  }

  componentWillUnmount(): void {
    this.pending.cancel();

    const { keysTable, partitionTables } = this.state;
    keysTable?.close();
    partitionTables?.forEach(table => table.close());
  }

  pending: Pending;

  tableUtils: TableUtils;

  handleKeyTableClick(): void {
    log.debug2('handleKeyTableClick');

    const { partitionConfig } = this.props;
    const newPartitionConfig = { ...partitionConfig };
    // Toggle between Keys and Partition mode
    newPartitionConfig.mode =
      partitionConfig.mode === 'keys' ? 'partition' : 'keys';
    this.sendUpdate(newPartitionConfig);
  }

  handleMergeClick(): void {
    log.debug2('handleMergeClick');

    const { partitionConfig } = this.props;
    const newPartitionConfig = { ...partitionConfig };
    // Toggle between Merged and Partition mode
    newPartitionConfig.mode =
      partitionConfig.mode === 'merged' ? 'partition' : 'merged';
    this.sendUpdate(newPartitionConfig);
  }

  /**
   * Handles when a partition dropdown selection is changed. Will send an update with the new partition config
   * @param index Index of the partition column that was changed
   * @param selectedValue Selected value of the partition column
   */
  async handlePartitionSelect(
    index: number,
    selectedValue: unknown
  ): Promise<void> {
    const { model, partitionConfig: prevConfig } = this.props;

    log.debug('handlePartitionSelect', index, selectedValue, prevConfig);

    const newPartitions = [...prevConfig.partitions];
    newPartitions[index] = selectedValue;

    // If it's the last partition changed, we know it's already a valid value, just emit it
    if (index === model.partitionColumns.length - 1) {
      this.sendUpdate({ partitions: newPartitions, mode: 'partition' });
      return;
    }

    const { keysTable } = this.state;
    // Otherwise, we need to get the value from a filtered key table
    assertNotNull(keysTable);
    try {
      this.setState({ isLoading: true });
      const t = await this.pending.add(keysTable.copy(), tCopy =>
        tCopy.close()
      );

      // Apply our partition filters, and just get the first value
      const partitionFilters = newPartitions
        .slice(0, index + 1)
        .map((partition, i) => {
          const partitionColumn = t.columns[i];
          return this.tableUtils.makeNullableEqFilter(
            partitionColumn,
            partition
          );
        });
      t.applyFilter(partitionFilters);
      t.setViewport(0, 0, t.columns);
      const data = await this.pending.add(t.getViewportData());
      const newConfig: PartitionConfig = {
        // Core JSAPI returns undefined for null table values,
        // coalesce with null to differentiate null from no selection in the dropdown
        partitions: t.columns.map(column => data.rows[0].get(column) ?? null),
        mode: 'partition',
      };
      t.close();
      this.sendUpdate(newConfig);
    } catch (e) {
      if (!PromiseUtils.isCanceled(e)) {
        log.error('Unable to get partition tables', e);
      }
    } finally {
      this.setState({ isLoading: false });
    }
  }

  sendUpdate(partitionConfig: PartitionConfig): void {
    log.debug2('sendUpdate', partitionConfig);

    const { onChange } = this.props;
    onChange(partitionConfig);
  }

  /**
   * Calls model.displayString with a special character case
   * @param index The index of the partition column to get the display value for
   * @param value The partition value to get the display value for
   */
  getDisplayValue(index: number, value: unknown): string {
    const { model } = this.props;

    if (value === null) {
      return '(null)';
    }

    if (value === undefined || value === '') {
      return '';
    }
    const column = model.partitionColumns[index];
    if (TableUtils.isCharType(column.type) && value.toString().length > 0) {
      return String.fromCharCode(parseInt(value.toString(), 10));
    }
    return model.displayString(value, column.type, column.name);
  }

  /**
   * Update the filters on the partition dropdown tables
   */
  updatePartitionFilters(): void {
    const { partitionTables } = this.state;
    assertNotNull(partitionTables);

    const { partitionConfig } = this.props;
    const { mode } = partitionConfig;
    log.debug('updatePartitionFilters', partitionConfig);
    if (mode !== 'partition') {
      // We only need to update the filters if the mode is `partitions`
      // In the other modes, we disable the dropdowns anyway
      return;
    }

    const partitionFilters = this.getPartitionFilters(partitionTables);
    this.setState({ partitionFilters });
  }

  getPartitionFilters(partitionTables: dh.Table[]): dh.FilterCondition[][] {
    const { model, partitionConfig } = this.props;
    const { partitions } = partitionConfig;
    log.debug('getPartitionFilters', partitionConfig);

    if (partitions.length !== partitionTables.length) {
      throw new Error(
        `Invalid partition config set. Expected ${partitionTables.length} partitions, but got ${partitions.length}`
      );
    }

    // The filters are applied in order, so we need to build up the filters for each partition
    const partitionFilters: dh.FilterCondition[][] = [];
    for (let i = 0; i < partitions.length; i += 1) {
      if (i === 0) {
        // There's no reason to ever filter the first table
        partitionFilters.push([]);
      } else {
        const previousFilter = partitionFilters[i - 1];
        const previousPartition = partitions[i - 1];
        const previousColumn = model.partitionColumns[i - 1];
        const partitionFilter = [
          ...previousFilter,
          this.tableUtils.makeNullableEqFilter(
            previousColumn,
            previousPartition
          ),
        ];
        partitionFilters.push(partitionFilter);
      }
    }
    return partitionFilters;
  }

  getCachedChangeCallback = memoizee(
    (index: number) => (value: unknown) =>
      this.handlePartitionSelect(index, value)
  );

  getCachedFormatValueCallback = memoizee(
    (index: number) => (value: unknown) => this.getDisplayValue(index, value)
  );

  render(): JSX.Element {
    const { model, partitionConfig } = this.props;
    const { isLoading, partitionFilters, partitionTables } = this.state;

    const { mode, partitions } = partitionConfig;

    const partitionSelectors = model.partitionColumns.map((column, index) => (
      <div key={`selector-${column.name}`} className="column-selector">
        <div className="column-name">{column.name}</div>
        <TableDropdown
          className="custom-select-sm"
          table={partitionTables?.[index]}
          column={partitionTables?.[index]?.columns[index]}
          filter={partitionFilters?.[index]}
          onChange={this.getCachedChangeCallback(index)}
          selectedValue={mode === 'partition' ? partitions[index] : undefined}
          disabled={
            (index > 0 && partitionConfig.mode !== 'partition') || isLoading
          }
          formatValue={this.getCachedFormatValueCallback(index)}
        />
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
