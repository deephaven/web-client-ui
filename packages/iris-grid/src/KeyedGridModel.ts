import type { dh as DhType } from '@deephaven/jsapi-types';
import type { ModelIndex } from '@deephaven/grid';

/** Model that exposes key-column metadata for selection purposes. */
export interface KeyedGridModel {
  /** Model column indices forming the row key for selection purposes. Empty for non-keyed tables. */
  readonly selectionKeyColumnIndices: readonly ModelIndex[];
  /** True if each key uniquely identifies at most one row. */
  readonly hasUniqueSelectionKeys: boolean;

  /**
   * Snapshots rows matching the given key values.
   * For invertedSelection=true, snapshots all rows EXCEPT those matching the keys.
   * For invertedSelection=true with empty keyValues, snapshots the entire table.
   *
   * @param columns The columns to include in the snapshot.
   * @param keyValues A map of key column names to their corresponding values.
   * @param invertedSelection Whether to invert the selection.
   * @param includeHeaders Whether to include the headers in the snapshot.
   * @param formatValue Function for formatting the raw value into a string.
   * @returns A promise that resolves to a 2D array of the snapshot data.
   */
  snapshotByKeys: (
    columns: readonly DhType.Column[],
    keyValues: ReadonlyMap<string, readonly unknown[]>,
    invertedSelection: boolean,
    includeHeaders?: boolean,
    formatValue?: (value: unknown, column: DhType.Column) => unknown
  ) => Promise<unknown[][]>;

  /**
   * Text version of snapshotByKeys: rows tab-separated, columns newline-separated.
   * @param columns The columns to include in the snapshot.
   * @param keyValues A map of key column names to their corresponding values.
   * @param invertedSelection Whether to invert the selection.
   * @param includeHeaders Whether to include the headers in the snapshot.
   * @param formatValue Function for formatting the raw value into a string.
   * @returns A promise that resolves to a string representation of the snapshot.
   */
  textSnapshotByKeys: (
    columns: readonly DhType.Column[],
    keyValues: ReadonlyMap<string, readonly unknown[]>,
    invertedSelection: boolean,
    includeHeaders?: boolean,
    formatValue?: (
      value: unknown,
      column: DhType.Column,
      row?: DhType.Row
    ) => string
  ) => Promise<string>;

  /**
   * Returns a filtered copy of the table containing only the rows identified by
   * `keyValues` (or all rows except those, when `invertedSelection` is true).
   * Ownership transfers to the caller; pass to `TableSaver` and it will close it.
   */
  createFilteredByKeysTable: (
    keyValues: ReadonlyMap<string, readonly unknown[]>,
    invertedSelection: boolean
  ) => Promise<DhType.Table>;
}

/**
 * Checks if the given model is a KeyedGridModel.
 * @param model The model to check.
 * @returns True if the model is a KeyedGridModel, false otherwise.
 */
export function isKeyedGridModel(model: unknown): model is KeyedGridModel {
  const indices = (model as unknown as KeyedGridModel)
    .selectionKeyColumnIndices;
  return indices != null && indices.length > 0;
}
