/* eslint class-methods-use-this: "off" */
import type { dh as DhType } from '@deephaven/jsapi-types';
import { Formatter } from '@deephaven/jsapi-utils';
import { type ColumnName } from './CommonTypes';
import EmptyIrisGridModel from './EmptyIrisGridModel';
import MissingPartitionError, {
  isMissingPartitionError,
} from './MissingPartitionError';
import { type PartitionedGridModelProvider } from './PartitionedGridModel';

type PartitionedTableWithBaseTable = DhType.PartitionedTable & {
  getBaseTable: () => DhType.Table;
};

function isPartitionedTableWithBaseTable(
  partitionedTable: DhType.PartitionedTable
): partitionedTable is PartitionedTableWithBaseTable {
  return (
    'getBaseTable' in partitionedTable &&
    typeof partitionedTable.getBaseTable === 'function'
  );
}

class IrisGridPartitionedTableModel
  extends EmptyIrisGridModel
  implements PartitionedGridModelProvider
{
  readonly partitionedTable: DhType.PartitionedTable;

  /**
   * @param dh JSAPI instance
   * @param table Partitioned table to be used in the model
   * @param formatter The formatter to use when getting formats
   */
  constructor(
    dh: typeof DhType,
    partitionedTable: DhType.PartitionedTable,
    formatter = new Formatter(dh)
  ) {
    super(dh, formatter);
    this.partitionedTable = partitionedTable;
  }

  get isPartitionRequired(): boolean {
    return true;
  }

  get isPartitionAwareSourceTable(): boolean {
    return false;
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

  get columns(): readonly DhType.Column[] {
    return this.partitionedTable.columns;
  }

  get partitionColumns(): readonly DhType.Column[] {
    return this.partitionedTable.keyColumns;
  }

  get columnCount(): number {
    return this.columns.length;
  }

  getColumnIndexByName(columnName: string): number {
    return this.columns.findIndex(column => column.name === columnName);
  }

  textForColumnHeader(
    column: number,
    depth?: number | undefined
  ): string | undefined {
    return this.columns[column].name ?? '';
  }

  async partitionKeysTable(): Promise<DhType.Table> {
    return this.partitionedTable.getKeyTable();
  }

  async partitionBaseTable(): Promise<DhType.Table> {
    if (isPartitionedTableWithBaseTable(this.partitionedTable)) {
      return this.partitionedTable.getBaseTable();
    }
    // Fallback to the key table if the base table API is not available
    return this.partitionedTable.getKeyTable();
  }

  async partitionMergedTable(): Promise<DhType.Table> {
    return this.partitionedTable.getMergedTable();
  }

  async partitionTable(partitions: unknown[]): Promise<DhType.Table> {
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
