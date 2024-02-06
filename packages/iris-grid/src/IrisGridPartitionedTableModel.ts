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
import MissingPartitionError, {
  isMissingPartitionError,
} from './MissingPartitionError';
import { PartitionedGridModelProvider } from './PartitionedGridModel';

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

  get columns(): readonly Column[] {
    return this.partitionedTable.columns;
  }

  get partitionColumns(): readonly Column[] {
    return this.partitionedTable.keyColumns;
  }

  async partitionKeysTable(): Promise<Table> {
    return this.partitionedTable.getKeyTable();
  }

  async partitionMergedTable(): Promise<Table> {
    return this.partitionedTable.getMergedTable();
  }

  async partitionTable(partitions: unknown[]): Promise<Table> {
    try {
      const table = await this.partitionedTable.getTable(partitions);
      if (table == null) {
        // TODO: Will be unnecessary with https://github.com/deephaven/deephaven-core/pull/5050
        throw new MissingPartitionError('Partition not found');
      }
      return table;
    } catch (e) {
      if (!isMissingPartitionError(e)) {
        throw new MissingPartitionError('Unable to retrieve partition');
      } else {
        throw e;
      }
    }
  }
}

export default IrisGridPartitionedTableModel;
