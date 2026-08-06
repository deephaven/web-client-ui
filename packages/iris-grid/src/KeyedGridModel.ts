import type { ModelIndex } from '@deephaven/grid';

/** Model that exposes key-column metadata for selection purposes. */
export interface KeyedGridModel {
  /** Model column indices forming the row key for selection purposes. Empty for non-keyed tables. */
  readonly selectionKeyColumnIndices: readonly ModelIndex[];
  /** True if each key uniquely identifies at most one row. */
  readonly hasUniqueSelectionKeys: boolean;
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
