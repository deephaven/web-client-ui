import type { Column, Table } from '@deephaven/jsapi-types';
import IrisGridModel from './IrisGridModel';

export function isPartitionedGridModel(
  model: IrisGridModel
): model is PartitionedGridModel {
  return (model as PartitionedGridModel)?.isPartitionRequired !== undefined;
}

export interface PartitionConfig {
  /** The partition values to set on the model */
  partitions: unknown[];

  /** What data to display - the keys table, the merged table, or the selected partition */
  mode: 'keys' | 'merged' | 'partition';
}

export interface PartitionedGridModel extends IrisGridModel {
  get partitionConfig(): PartitionConfig;

  set partitionConfig(partitionConfig: PartitionConfig);

  /**
   * Retrieve the columns this model is partitioned on
   * @returns All columns to partition on
   */
  get partitionColumns(): readonly Column[];

  /** Whether a partition is required to be set on this model */
  get isPartitionRequired(): boolean;

  /** Get a keys table for the partitions */
  partitionKeysTable: () => Promise<Table>;

  /** Get a merged table containing all partitions */
  partitionMergedTable: () => Promise<Table>;

  /** Get a table containing the selected partition */
  partitionTable: (partitionConfig: PartitionConfig) => Promise<Table> | null;
}
