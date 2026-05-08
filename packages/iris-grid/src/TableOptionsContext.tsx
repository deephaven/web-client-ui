import { useCallback, useMemo } from 'react';
import type { MoveOperation } from '@deephaven/grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import type { SortDescriptor } from '@deephaven/jsapi-utils';
import type {
  ColumnName,
  ReadonlyQuickFilterMap,
  ReadonlyAdvancedFilterMap,
} from './CommonTypes';
import type ColumnHeaderGroup from './ColumnHeaderGroup';
import type IrisGridModel from './IrisGridModel';
import type {
  AggregationSettings,
  UIRollupConfig,
  SidebarFormattingRule,
} from './sidebar';
import { useTableOptionsHost } from './table-options/TableOptionsHostContext';

/**
 * Context value for Table Options panel components.
 * Provides access to IrisGrid state and update methods that custom
 * Table Options can use to read and modify grid configuration.
 *
 * This is a convenience interface that wraps the dispatch-based
 * TableOptionsHostContext with ergonomic setter methods.
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

  // ===== Filters and Sorts =====

  /** Quick filters applied to columns */
  quickFilters: ReadonlyQuickFilterMap;

  /** Advanced filters applied to columns */
  advancedFilters: ReadonlyAdvancedFilterMap;

  /** Search filter from the search bar */
  searchFilter?: DhType.FilterCondition;

  /** Current search bar text value */
  searchValue: string;

  /** Columns selected for cross-column search */
  selectedSearchColumns: readonly ColumnName[];

  /** Whether search column selection is inverted */
  invertSearchColumns: boolean;

  /** Current sort configuration */
  sorts: readonly SortDescriptor[];

  /** Whether sort order is reversed */
  reverse: boolean;

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

  /** Update quick filters */
  setQuickFilters: (filters: ReadonlyQuickFilterMap) => void;

  /** Update advanced filters */
  setAdvancedFilters: (filters: ReadonlyAdvancedFilterMap) => void;

  /** Update sorts */
  setSorts: (sorts: readonly SortDescriptor[]) => void;

  /** Update reverse sort */
  setReverse: (reverse: boolean) => void;

  /** Clear all filters (quick, advanced, and search) */
  clearAllFilters: () => void;

  /** Update cross-column search */
  setCrossColumnSearch: (
    searchValue: string,
    selectedSearchColumns: readonly ColumnName[],
    invertSearchColumns: boolean
  ) => void;

  // ===== Navigation Methods =====

  /** Close the current option panel (go back) */
  closeCurrentOption: () => void;
}

/**
 * Hook to access Table Options state and update methods.
 * This hook wraps the dispatch-based TableOptionsHostContext
 * and provides ergonomic setter methods for common operations.
 *
 * Must be used within a TableOptionsHostContext.Provider
 * (which is provided by TableOptionsHost or TableOptionsWrapper).
 *
 * @returns The Table Options context value with setter methods
 * @throws Error if used outside of TableOptionsHostContext.Provider
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
  const { gridState, dispatch, closePanel } = useTableOptionsHost();

  // Create stable setter callbacks that dispatch actions
  const setCustomColumns = useCallback(
    (columns: readonly ColumnName[]) => {
      dispatch({ type: 'SET_CUSTOM_COLUMNS', columns });
    },
    [dispatch]
  );

  const setSelectDistinctColumns = useCallback(
    (columns: readonly ColumnName[]) => {
      dispatch({ type: 'SET_SELECT_DISTINCT_COLUMNS', columns });
    },
    [dispatch]
  );

  const setAggregationSettings = useCallback(
    (settings: AggregationSettings) => {
      dispatch({ type: 'SET_AGGREGATION_SETTINGS', settings });
    },
    [dispatch]
  );

  const setRollupConfig = useCallback(
    (config: UIRollupConfig | undefined) => {
      dispatch({ type: 'SET_ROLLUP_CONFIG', config });
    },
    [dispatch]
  );

  const setConditionalFormats = useCallback(
    (formats: readonly SidebarFormattingRule[]) => {
      dispatch({ type: 'SET_CONDITIONAL_FORMATS', formats });
    },
    [dispatch]
  );

  const setMovedColumns = useCallback(
    (columns: readonly MoveOperation[], onChangeApplied?: () => void) => {
      dispatch({ type: 'SET_MOVED_COLUMNS', columns, onChangeApplied });
    },
    [dispatch]
  );

  const setFrozenColumns = useCallback(
    (columns: readonly ColumnName[]) => {
      dispatch({ type: 'SET_FROZEN_COLUMNS', columns });
    },
    [dispatch]
  );

  const setColumnHeaderGroups = useCallback(
    (groups: readonly ColumnHeaderGroup[]) => {
      dispatch({ type: 'SET_COLUMN_HEADER_GROUPS', groups });
    },
    [dispatch]
  );

  const setQuickFilters = useCallback(
    (filters: ReadonlyQuickFilterMap) => {
      dispatch({ type: 'SET_QUICK_FILTERS', filters });
    },
    [dispatch]
  );

  const setAdvancedFilters = useCallback(
    (filters: ReadonlyAdvancedFilterMap) => {
      dispatch({ type: 'SET_ADVANCED_FILTERS', filters });
    },
    [dispatch]
  );

  const setSorts = useCallback(
    (sorts: readonly SortDescriptor[]) => {
      dispatch({ type: 'SET_SORTS', sorts });
    },
    [dispatch]
  );

  const setReverse = useCallback(
    (reverse: boolean) => {
      dispatch({ type: 'SET_REVERSE', reverse });
    },
    [dispatch]
  );

  const clearAllFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' });
  }, [dispatch]);

  const setCrossColumnSearch = useCallback(
    (
      searchValue: string,
      selectedSearchColumns: readonly ColumnName[],
      invertSearchColumns: boolean
    ) => {
      dispatch({
        type: 'SET_CROSS_COLUMN_SEARCH',
        searchValue,
        selectedSearchColumns,
        invertSearchColumns,
      });
    },
    [dispatch]
  );

  // Build the context value with memoization
  return useMemo<TableOptionsContextValue>(
    () => ({
      model: gridState.model,
      customColumns: gridState.customColumns,
      selectDistinctColumns: gridState.selectDistinctColumns,
      aggregationSettings: gridState.aggregationSettings,
      rollupConfig: gridState.rollupConfig,
      conditionalFormats: gridState.conditionalFormats,
      movedColumns: gridState.movedColumns,
      frozenColumns: gridState.frozenColumns,
      columnHeaderGroups: gridState.columnHeaderGroups,
      quickFilters: gridState.quickFilters,
      advancedFilters: gridState.advancedFilters,
      searchFilter: gridState.searchFilter,
      searchValue: gridState.searchValue,
      selectedSearchColumns: gridState.selectedSearchColumns,
      invertSearchColumns: gridState.invertSearchColumns,
      sorts: gridState.sorts,
      reverse: gridState.reverse,
      setCustomColumns,
      setSelectDistinctColumns,
      setAggregationSettings,
      setRollupConfig,
      setConditionalFormats,
      setMovedColumns,
      setFrozenColumns,
      setColumnHeaderGroups,
      setQuickFilters,
      setAdvancedFilters,
      setSorts,
      setReverse,
      clearAllFilters,
      setCrossColumnSearch,
      closeCurrentOption: closePanel,
    }),
    [
      gridState,
      setCustomColumns,
      setSelectDistinctColumns,
      setAggregationSettings,
      setRollupConfig,
      setConditionalFormats,
      setMovedColumns,
      setFrozenColumns,
      setColumnHeaderGroups,
      setQuickFilters,
      setAdvancedFilters,
      setSorts,
      setReverse,
      clearAllFilters,
      setCrossColumnSearch,
      closePanel,
    ]
  );
}
