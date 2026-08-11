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
    const ranges = selection.toRanges();
    const hiddenColumns = IrisGridUtils.getHiddenColumns(userColumnWidths);
    let modelRanges = GridUtils.getModelRanges(ranges, movedColumns);
    if (hiddenColumns.length > 0) {
      const subtractRanges = hiddenColumns.map(GridRange.makeColumn);
      modelRanges = GridRange.subtractRangesFromRanges(
        modelRanges,
        subtractRanges
      );
    }
    return model.textSnapshot(modelRanges, includeHeaders, formatValue);
  }

  if (selection instanceof KeyedSelection) {
    if (!isKeyedGridModel(model)) {
      throw new Error('KeyedSelection requires a KeyedGridModel');
    }
    // Compute ordered, visible columns (same hidden/moved logic as the ranged path)
    const allColumnsRange = [new GridRange(0, 0, model.columnCount - 1, 0)];
    const hiddenColumns = IrisGridUtils.getHiddenColumns(userColumnWidths);
    let columnRanges = GridUtils.getModelRanges(allColumnsRange, movedColumns);
    if (hiddenColumns.length > 0) {
      const subtractRanges = hiddenColumns.map(GridRange.makeColumn);
      columnRanges = GridRange.subtractRangesFromRanges(
        columnRanges,
        subtractRanges
      );
    }
    const columns = IrisGridUtils.columnsFromRanges(
      columnRanges,
      model.columns
    );
    return model.textSnapshotByKeys(
      columns,
      selection.selectedKeyValues,
      selection.invertedSelection,
      includeHeaders,
      formatValue
    );
  }

  throw new Error(`Unsupported selection type for textSnapshotFromSelection`);
}

export default textSnapshotFromSelection;
