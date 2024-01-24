import type { dh.Column, dh.Table } from '@deephaven/jsapi-types';
import IrisGridModel from './IrisGridModel';

export function isPartitionedGridModelProvider(
  model: IrisGridModel
): model is PartitionedGridModelProvider {
  return (
    (model as PartitionedGridModel)?.isPartitionRequired !== undefined &&
    (model as PartitionedGridModel)?.partitionColumns !== undefined &&
    (model as PartitionedGridModel)?.partitionKeysTable !== undefined &&
    (model as PartitionedGridModel)?.partitionMergedTable !== undefined &&
    (model as PartitionedGridModel)?.partitionTable !== undefined
  );
}

export function isPartitionedGridModel(
  model: IrisGridModel
): model is PartitionedGridModel {
  return (
    isPartitionedGridModelProvider(model) &&
    (model as PartitionedGridModel).partitionConfig !== undefined
  );
}

export interface PartitionConfig {
  /** The partition values to set on the model */
  partitions: unknown[];

  /** What data to display - the keys table, the merged table, or the selected partition */
  mode: 'keys' | 'merged' | 'partition';
}

/**
 * A grid model that provides key tables and partitions, cannot accept a `PartitionConfig` being set
 */
export interface PartitionedGridModelProvider extends IrisGridModel {
  /**
   * Retrieve the columns this model is partitioned on
   * @returns All columns to partition on
   */
  get partitionColumns(): readonly dh.Column[];

  /** Whether a partition is required to be set on this model */
  get isPartitionRequired(): boolean;

  /** Get a keys table for the partitions */
  partitionKeysTable: () => Promise<dh.Table>;

  /** Get a merged table containing all partitions */
  partitionMergedTable: () => Promise<dh.Table>;

  /** Get a table containing the selected partition */
  partitionTable: (partitions: unknown[]) => Promise<dh.Table>;
}

/**
 * A grid model that can be partitioned on a column
 */
export interface PartitionedGridModel extends PartitionedGridModelProvider {
  /** Retrieve the currently set partition config */
  get partitionConfig(): PartitionConfig | null;

  /** Set the partition config */
  set partitionConfig(partitionConfig: PartitionConfig | null);
}
