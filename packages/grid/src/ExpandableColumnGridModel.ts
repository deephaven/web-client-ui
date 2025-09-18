import type GridModel from './GridModel';
import { type ModelIndex } from './GridMetrics';

export function isExpandableColumnGridModel(
  model: GridModel
): model is ExpandableColumnGridModel {
  return (
    (model as ExpandableColumnGridModel)?.hasExpandableColumns !== undefined
  );
}

/**
 * Expandable grid model. Allows for a grid with columns that can expand (e.g. Pivot Table)
 */
export interface ExpandableColumnGridModel extends GridModel {
  /** Whether the grid has columns that can be expanded */
  hasExpandableColumns: boolean;

  /** Whether the grid can expand all columns */
  isExpandAllColumnsAvailable: boolean;

  /**
   * @param column Column to check
   * @returns True if the column is expandable
   */
  isColumnExpandable: (column: ModelIndex) => boolean;

  /**
   * @param column Column to check
   * @returns True if the column is currently expanded
   */
  isColumnExpanded: (column: ModelIndex) => boolean;

  /**
   * Change the expanded status of an expandable column
   * @param column Column to expand
   * @param isExpanded True to expand the column, false to collapse
   * @param expandDescendants True to expand nested columns, false otherwise
   */
  setColumnExpanded: (
    column: ModelIndex,
    isExpanded: boolean,
    expandDescendants?: boolean
  ) => void;

  /**
   * Expand all columns
   */
  expandAllColumns: () => void;

  /**
   * Collapse all columns
   */
  collapseAllColumns: () => void;

  /**
   * Get the depth of a column (ie. How indented the column should be)
   * @param column Column to check
   * @returns Depth of the column
   */
  depthForColumn: (column: ModelIndex) => number;
}

export default ExpandableColumnGridModel;
