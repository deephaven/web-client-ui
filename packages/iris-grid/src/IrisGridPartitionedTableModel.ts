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

export function isIrisGridPartitionedTableModel(
  model: IrisGridModel
): model is IrisGridPartitionedTableModel {
  return (
    (model as IrisGridPartitionedTableModel).partitionedTable !== undefined
  );
}

class IrisGridPartitionedTableModel extends EmptyIrisGridModel {
  readonly partitionedTable: PartitionedTable;

  private partitionKeys: unknown[];

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
    // Get the most recently added key
    let lastKey;
    this.partitionedTable.getKeys().forEach(key => {
      lastKey = key;
    });
    this.partitionKeys = Array.isArray(lastKey) ? lastKey : [lastKey];
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

  get partition(): unknown[] {
    return this.partitionKeys;
  }

  set partition(partition: unknown[]) {
    this.partitionKeys = partition;
  }

  get partitionKeysTable(): Promise<Table> {
    const sorts = this.partitionColumns.map(column => column.sort().desc());
    return this.partitionedTable.getKeyTable().then(table => {
      table.applySort(sorts);
      return table;
    });
  }

  async initializePartitionModel(): Promise<IrisGridModel> {
    const initTable = await this.partitionedTable.getTable(this.partitionKeys);
    const tableCopy = await initTable.copy();
    return Promise.resolve(
      new IrisGridTableModel(this.dh, tableCopy, this.formatter)
    );
  }
}

export default IrisGridPartitionedTableModel;
