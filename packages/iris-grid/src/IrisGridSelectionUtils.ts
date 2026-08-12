import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  GridRange,
  GridUtils,
  isRangedSelection,
  type ModelSizeMap,
  type MoveOperation,
  type Selection,
} from '@deephaven/grid';
import type IrisGridModel from './IrisGridModel';
import { isKeyedGridModel } from './KeyedGridModel';
import { KeyedSelection } from './KeyedSelection';
import IrisGridUtils from './IrisGridUtils';

/** Applies moved-column and hidden-column logic to produce model ranges. */
function computeModelRanges(
  ranges: readonly GridRange[],
  movedColumns: readonly MoveOperation[],
  userColumnWidths: ModelSizeMap
): readonly GridRange[] {
  const hiddenColumns = IrisGridUtils.getHiddenColumns(userColumnWidths);
  let modelRanges = GridUtils.getModelRanges(ranges, movedColumns);
  if (hiddenColumns.length > 0) {
    const subtractRanges = hiddenColumns.map(GridRange.makeColumn);
    modelRanges = GridRange.subtractRangesFromRanges(
      modelRanges,
      subtractRanges
    );
  }
  return modelRanges;
}

/** Returns the ordered visible columns after applying moved and hidden column logic. */
function computeVisibleColumns(
  model: IrisGridModel,
  movedColumns: readonly MoveOperation[],
  userColumnWidths: ModelSizeMap
): readonly DhType.Column[] {
  const allColumnsRange = [new GridRange(0, 0, model.columnCount - 1, 0)];
  const columnRanges = computeModelRanges(
    allColumnsRange,
    movedColumns,
    userColumnWidths
  );
  return IrisGridUtils.columnsFromRanges(columnRanges, model.columns);
}

/**
 * Takes a snapshot of the current selection as a 2-D array of raw values.
 * No formatValue or includeHeaders — use textSnapshotFromSelection for formatted output.
 */
export async function snapshotFromSelection(
  selection: Selection,
  model: IrisGridModel,
  movedColumns: readonly MoveOperation[],
  userColumnWidths: ModelSizeMap
): Promise<readonly unknown[][]> {
  if (isRangedSelection(selection)) {
    const modelRanges = computeModelRanges(
      selection.toRanges(),
      movedColumns,
      userColumnWidths
    );
    return model.snapshot(modelRanges);
  }

  if (selection instanceof KeyedSelection) {
    if (!isKeyedGridModel(model)) {
      throw new Error('KeyedSelection requires a KeyedGridModel');
    }
    const columns = computeVisibleColumns(
      model,
      movedColumns,
      userColumnWidths
    );
    return model.snapshotByKeys(
      columns,
      selection.selectedKeyValues,
      selection.invertedSelection,
      false,
      v => v,
      selection.maxRows
    );
  }

  throw new Error(`Unsupported selection type for snapshotFromSelection`);
}

/**
 * Takes a snapshot of the current selection as a tab/newline-separated string.
 *
 * For RangedSelection: uses the existing range-based model.textSnapshot path.
 * For KeyedSelection: filters a table copy by the selected keys and snapshots all rows.
 *
 * @param selection The current grid selection.
 * @param model The IrisGrid model.
 * @param includeHeaders Whether to prepend a header row.
 * @param formatValue Formatter applied to each cell value.
 * @param movedColumns Current column move operations (for model-index mapping).
 * @param userColumnWidths Used to determine hidden columns.
 */
export async function textSnapshotFromSelection(
  selection: Selection,
  model: IrisGridModel,
  includeHeaders: boolean,
  formatValue: (
    value: unknown,
    column: DhType.Column,
    row?: DhType.Row
  ) => string,
  movedColumns: readonly MoveOperation[],
  userColumnWidths: ModelSizeMap
): Promise<string> {
  if (isRangedSelection(selection)) {
    const modelRanges = computeModelRanges(
      selection.toRanges(),
      movedColumns,
      userColumnWidths
    );
    return model.textSnapshot(modelRanges, includeHeaders, formatValue);
  }

  if (selection instanceof KeyedSelection) {
    if (!isKeyedGridModel(model)) {
      throw new Error('KeyedSelection requires a KeyedGridModel');
    }
    const columns = computeVisibleColumns(
      model,
      movedColumns,
      userColumnWidths
    );
    return model.textSnapshotByKeys(
      columns,
      selection.selectedKeyValues,
      selection.invertedSelection,
      includeHeaders,
      formatValue,
      selection.maxRows
    );
  }

  throw new Error(`Unsupported selection type for textSnapshotFromSelection`);
}

export default textSnapshotFromSelection;
