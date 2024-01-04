/* eslint class-methods-use-this: "off" */
import type {
  Column,
  dh as DhType,
  PartitionedTable,
  Table,
} from '@deephaven/jsapi-types';
import { Formatter } from '@deephaven/jsapi-utils';
import { ColumnName } from './CommonTypes';
import EmptyIrisGridModel from './EmptyIrisGridModel';
import {
  PartitionConfig,
  PartitionedGridModelProvider,
} from './PartitionedGridModel';

class IrisGridPartitionedTableModel
  extends EmptyIrisGridModel
  implements PartitionedGridModelProvider
{
  readonly partitionedTable: PartitionedTable;

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

  partitionKeysTable(): Promise<Table> {
    return this.partitionedTable.getKeyTable();
  }

  partitionMergedTable(): Promise<Table> {
    return this.partitionedTable.getMergedTable();
  }

  async partitionTable(partitions: unknown[]): Promise<Table> {
    // TODO: Copy is necessary for now since getTable returns memoized tables https://github.com/deephaven/web-client-ui/pull/1663#discussion_r1434984641
    return this.partitionedTable
      .getTable(partitions)
      .then(table => table.copy());
  }
}

export default IrisGridPartitionedTableModel;
