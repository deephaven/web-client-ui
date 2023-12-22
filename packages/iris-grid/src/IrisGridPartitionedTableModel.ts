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
import { PartitionConfig, PartitionedGridModel } from './PartitionedGridModel';

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

  partitionMergedTable(): Promise<Table> {
    return this.partitionedTable.getMergedTable();
  }

  partitionTable(partitionConfig: PartitionConfig): Promise<Table> | null {
    if (partitionConfig.mode !== 'partition') {
      return null;
    }
    // TODO: Copy is necessary for now since getTable returns memoized tables https://github.com/deephaven/web-client-ui/pull/1663#discussion_r1434984641
    return this.partitionedTable
      .getTable(partitionConfig.partitions)
      .then(table => table.copy());
  }
}

export default IrisGridPartitionedTableModel;
