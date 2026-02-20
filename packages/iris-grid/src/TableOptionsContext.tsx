import { createContext, useContext } from 'react';
import type { MoveOperation } from '@deephaven/grid';
import type { ColumnName } from './CommonTypes';
import type ColumnHeaderGroup from './ColumnHeaderGroup';
import type IrisGridModel from './IrisGridModel';
import type {
  AggregationSettings,
  UIRollupConfig,
  SidebarFormattingRule,
} from './sidebar';

/**
 * Context value for Table Options panel components.
 * Provides access to IrisGrid state and update methods that custom
 * Table Options can use to read and modify grid configuration.
 */
export interface TableOptionsContextValue {
  /** The IrisGrid model for accessing column info, etc. */
  model: IrisGridModel;

  // ===== State Values =====

  /** Custom columns created by user */
  customColumns: readonly ColumnName[];

  /** Columns used for Select Distinct operation */
  selectDistinctColumns: readonly ColumnName[];

  /** Aggregation configuration */
  aggregationSettings: AggregationSettings;

  /** Rollup rows configuration */
  rollupConfig?: UIRollupConfig;

  /** Conditional formatting rules */
  conditionalFormats: readonly SidebarFormattingRule[];

  /** Column move/reorder operations */
  movedColumns: readonly MoveOperation[];

  /** Frozen/pinned columns */
  frozenColumns: readonly ColumnName[];

  /** Column header grouping configuration */
  columnHeaderGroups: readonly ColumnHeaderGroup[];

  // ===== Update Methods =====

  /** Update custom columns */
  setCustomColumns: (columns: readonly ColumnName[]) => void;

  /** Update select distinct columns */
  setSelectDistinctColumns: (columns: readonly ColumnName[]) => void;

  /** Update aggregation settings */
  setAggregationSettings: (settings: AggregationSettings) => void;

  /** Update rollup configuration */
  setRollupConfig: (config: UIRollupConfig | undefined) => void;

  /** Update conditional formatting rules */
  setConditionalFormats: (formats: readonly SidebarFormattingRule[]) => void;

  /** Update moved columns (reorder) */
  setMovedColumns: (
    columns: readonly MoveOperation[],
    onChangeApplied?: () => void
  ) => void;

  /** Update frozen columns */
  setFrozenColumns: (columns: readonly ColumnName[]) => void;

  /** Update column header groups */
  setColumnHeaderGroups: (groups: readonly ColumnHeaderGroup[]) => void;

  // ===== Navigation Methods =====

  /** Close the current option panel (go back) */
  closeCurrentOption: () => void;
}

/**
 * Context for Table Options panel components.
 * Use `useTableOptions()` hook to access the context value.
 */
export const TableOptionsContext =
  createContext<TableOptionsContextValue | null>(null);
TableOptionsContext.displayName = 'TableOptionsContext';

/**
 * Hook to access the Table Options context.
 * Must be used within a TableOptionsContext.Provider.
 *
 * @returns The Table Options context value
 * @throws Error if used outside of TableOptionsContext.Provider
 *
 * @example
 * function MyCustomOptionPanel() {
 *   const { selectDistinctColumns, setSelectDistinctColumns, closeCurrentOption } = useTableOptions();
 *
 *   const handleApply = (columns: string[]) => {
 *     setSelectDistinctColumns(columns);
 *     closeCurrentOption();
 *   };
 *
 *   return <MyPanel columns={selectDistinctColumns} onApply={handleApply} />;
 * }
 */
export function useTableOptions(): TableOptionsContextValue {
  const context = useContext(TableOptionsContext);
  if (context == null) {
    throw new Error(
      'useTableOptions must be used within a TableOptionsContext.Provider'
    );
  }
  return context;
}
