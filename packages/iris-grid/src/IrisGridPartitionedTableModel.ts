/* eslint class-methods-use-this: "off" */
import type {
  Column,
  dh as DhType,
  PartitionedTable,
  Table,
} from '@deephaven/jsapi-types';
import { Formatter } from '@deephaven/jsapi-utils';
import { ColumnName } from './CommonTypes';
import IrisGridModel from './IrisGridModel';
import IrisGridTableModel from './IrisGridTableModel';
import EmptyIrisGridModel from './EmptyIrisGridModel';
import { PartitionConfig, PartitionedGridModel } from './PartitionedGridModel';

export function isIrisGridPartitionedTableModel(
  model: IrisGridModel
): model is IrisGridPartitionedTableModel {
  return (
    (model as IrisGridPartitionedTableModel).partitionedTable !== undefined
  );
}

class IrisGridPartitionedTableModel
  extends EmptyIrisGridModel
  implements PartitionedGridModel
{
  readonly partitionedTable: PartitionedTable;

  private config: PartitionConfig;

  /**
   * @param dh JSAPI instance
   * @param table Partitioned table to be used in the model
   * @param formatter The formatter to use when getting formats
   */
  constructor(
    dh: DhType,
    partitionedTable: PartitionedTable,
    formatter = new Formatter(dh)
  ) {
    super(dh, formatter);
    this.partitionedTable = partitionedTable;
    this.config = {
      partitions: [],
      mode: 'partition',
    };
  }

  get isPartitionRequired(): boolean {
    return true;
  }

  get isReversible(): boolean {
    return false;
  }

  displayString(
    value: unknown,
    columnType: string,
    columnName?: ColumnName
  ): string {
    return '';
  }

  close(): void {
    this.partitionedTable.close();
  }

  get partitionColumns(): readonly Column[] {
    return this.partitionedTable.keyColumns;
  }

  get partitionConfig(): PartitionConfig {
    return this.config;
  }

  set partitionConfig(rollupConfig: PartitionConfig) {
    this.config = rollupConfig;
  }

  partitionKeysTable(): Promise<Table> {
    return this.partitionedTable.getKeyTable();
  }

  async initializePartitionModel(): Promise<IrisGridModel> {
    const keyTable = await this.partitionedTable.getKeyTable();
    const sorts = keyTable.columns.map(column => column.sort().desc());
    keyTable.applySort(sorts);
    keyTable.setViewport(0, 0);
    const data = await keyTable.getViewportData();
    const row = data.rows[0];
    const values = keyTable.columns.map(column => row.get(column));
    this.config = {
      partitions: values,
      mode: 'partition',
    };

    const initTable = await this.partitionedTable.getTable(
      this.config.partitions
    );
    const tableCopy = await initTable.copy();
    return new IrisGridTableModel(this.dh, tableCopy, this.formatter);
  }
}

export default IrisGridPartitionedTableModel;
