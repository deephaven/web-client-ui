import GridModel from './GridModel';
import { ModelIndex } from './GridMetrics';

export function isExpandableGridModel(
  model: GridModel
): model is ExpandableGridModel {
  return (model as ExpandableGridModel)?.hasExpandableRows !== undefined;
}

/**
 * Expandable grid model. Allows for a grid with rows that can expand (e.g. A Tree Table)
 */
export interface ExpandableGridModel extends GridModel {
  /** Whether the grid has rows that can be expanded */
  hasExpandableRows: boolean;

  /** Whether the grid has columns that can be expanded */
  hasExpandableColumns: boolean;

  // TODO: Add isExpandAllRowsAvailable as a  separate property?
  /** Whether the grid can expand all */
  isExpandAllAvailable: boolean;

  /** Whether the grid can expand all columns */
  isExpandAllColumnsAvailable: boolean;

  /**
   * @param row Row to check
   * @returns True if the row is expandable
   */
  isRowExpandable: (row: ModelIndex) => boolean;

  /**
   * @param row Row to check
   * @returns True if the row is currently expanded
   */
  isRowExpanded: (row: ModelIndex) => boolean;

  /**
   * Change the expanded status of an expandable row
   * @param row Row to expand
   * @param isExpanded True to expand the row, false to collapse
   * @param expandDescendants True to expand nested rows, false otherwise
   */
  setRowExpanded: (
    row: ModelIndex,
    isExpanded: boolean,
    expandDescendants?: boolean
  ) => void;

  /**
   * Expand all rows
   */
  expandAll: () => void;

  /**
   * Collapse all rows
   */
  collapseAll: () => void;

  /**
   * Get the depth of a row (ie. How indented the row should be)
   * @param row Row to check
   * @returns Depth of the row
   */
  depthForRow: (row: ModelIndex) => number;

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

export default ExpandableGridModel;
