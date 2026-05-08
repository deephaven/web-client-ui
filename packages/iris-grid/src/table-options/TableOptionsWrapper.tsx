import React, { useCallback, useMemo } from 'react';
import Log from '@deephaven/log';
import type {
  GridRange,
  MoveOperation,
  ModelIndex,
  ModelSizeMap,
} from '@deephaven/grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import type { SortDescriptor } from '@deephaven/jsapi-utils';
import type {
  GridStateSnapshot,
  GridAction,
  GridDispatch,
} from './TableOption';
import type { TableOptionsRegistry } from './TableOptionsRegistry';
import { defaultTableOptionsRegistry } from './TableOptionsRegistry';
import { TableOptionsHost } from './TableOptionsHost';
import type IrisGridModel from '../IrisGridModel';
import type ColumnHeaderGroup from '../ColumnHeaderGroup';
import type {
  ColumnName,
  ReadonlyQuickFilterMap,
  ReadonlyAdvancedFilterMap,
} from '../CommonTypes';
import type {
  AggregationSettings,
  UIRollupConfig,
  SidebarFormattingRule,
  ChartBuilderSettings,
} from '../sidebar';
import type AdvancedSettingsType from '../sidebar/AdvancedSettingsType';

// Import to register built-in options
import './registerBuiltinOptions';

const log = Log.module('TableOptionsWrapper');

/**
 * Props for the TableOptionsWrapper component.
 * These are the values from IrisGrid state/props needed to build GridStateSnapshot.
 */
export interface TableOptionsWrapperProps {
  /** The IrisGrid model */
  model: IrisGridModel;

  /** Grid state values */
  customColumns: readonly ColumnName[];
  selectDistinctColumns: readonly ColumnName[];
  aggregationSettings: AggregationSettings;
  rollupConfig: UIRollupConfig | undefined;
  conditionalFormats: readonly SidebarFormattingRule[];
  movedColumns: readonly MoveOperation[];
  frozenColumns: readonly ColumnName[];
  columnHeaderGroups: readonly ColumnHeaderGroup[];
  hiddenColumns: readonly ModelIndex[];
  isRollup: boolean;

  /** Download state */
  name?: string;
  userColumnWidths?: ModelSizeMap;
  selectedRanges?: readonly GridRange[];
  isTableDownloading?: boolean;
  tableDownloadStatus?: string;
  tableDownloadProgress?: number;
  tableDownloadEstimatedTime?: number | null;

  /** Toggle UI state */
  isFilterBarShown?: boolean;
  showSearchBar?: boolean;
  isGotoShown?: boolean;
  canToggleSearch?: boolean;
  canDownloadCsv?: boolean;
  hasAdvancedSettings?: boolean;
  advancedSettings?: ReadonlyMap<AdvancedSettingsType, boolean>;
  isChartBuilderAvailable?: boolean;

  /** Filters and sorts */
  quickFilters: ReadonlyQuickFilterMap;
  advancedFilters: ReadonlyAdvancedFilterMap;
  searchFilter?: DhType.FilterCondition;
  searchValue: string;
  selectedSearchColumns: readonly ColumnName[];
  invertSearchColumns: boolean;
  sorts: readonly SortDescriptor[];
  reverse: boolean;

  /** Callbacks for grid actions */
  onSetCustomColumns: (columns: readonly ColumnName[]) => void;
  onSetSelectDistinctColumns: (columns: readonly ColumnName[]) => void;
  onSetAggregationSettings: (settings: AggregationSettings) => void;
  onSetRollupConfig: (config: UIRollupConfig) => void;
  onSetConditionalFormats: (formats: readonly SidebarFormattingRule[]) => void;
  onSetMovedColumns: (
    columns: readonly MoveOperation[],
    onChangeApplied?: () => void
  ) => void;
  onSetFrozenColumns: (columns: readonly ColumnName[]) => void;
  onSetColumnHeaderGroups: (groups: readonly ColumnHeaderGroup[]) => void;
  onSetColumnVisibility: (
    columns: readonly ModelIndex[],
    isVisible: boolean
  ) => void;
  onResetColumnVisibility: () => void;
  onStartDownload: () => void;
  onDownloadTable: (
    fileName: string,
    frozenTable: DhType.Table,
    tableSubscription: DhType.TableViewportSubscription,
    snapshotRanges: readonly GridRange[],
    modelRanges: readonly GridRange[],
    includeColumnHeaders: boolean,
    useUnformattedValues: boolean
  ) => void;
  onCancelDownload: () => void;

  /** Toggle callbacks */
  onToggleFilterBar: () => void;
  onToggleSearchBar: () => void;
  onToggleGoto: () => void;

  /** Advanced settings callback */
  onAdvancedSettingsChange?: (key: AdvancedSettingsType, isOn: boolean) => void;

  /** Chart builder callbacks */
  onCreateChart?: (settings: ChartBuilderSettings) => void;
  onChartChange?: (settings: ChartBuilderSettings) => void;

  /** Filter/sort callbacks */
  onSetQuickFilters: (filters: ReadonlyQuickFilterMap) => void;
  onSetAdvancedFilters: (filters: ReadonlyAdvancedFilterMap) => void;
  onSetSorts: (sorts: readonly SortDescriptor[]) => void;
  onSetReverse: (reverse: boolean) => void;
  onClearAllFilters: () => void;
  onSetCrossColumnSearch: (
    searchValue: string,
    selectedSearchColumns: readonly ColumnName[],
    invertSearchColumns: boolean
  ) => void;

  /** Menu callbacks */
  onClose: () => void;

  /** Optional custom registry (defaults to defaultTableOptionsRegistry) */
  registry?: TableOptionsRegistry;
}

/**
 * Wrapper component that bridges IrisGrid (class component) to TableOptionsHost.
 * Creates GridStateSnapshot and GridDispatch from IrisGrid props/callbacks.
 */
export function TableOptionsWrapper({
  model,
  customColumns,
  selectDistinctColumns,
  aggregationSettings,
  rollupConfig,
  conditionalFormats,
  movedColumns,
  frozenColumns,
  columnHeaderGroups,
  hiddenColumns,
  isRollup,
  name,
  userColumnWidths,
  selectedRanges,
  isTableDownloading,
  tableDownloadStatus,
  tableDownloadProgress,
  tableDownloadEstimatedTime,
  isFilterBarShown,
  showSearchBar,
  isGotoShown,
  canToggleSearch,
  canDownloadCsv,
  hasAdvancedSettings,
  advancedSettings,
  isChartBuilderAvailable,
  quickFilters,
  advancedFilters,
  searchFilter,
  searchValue,
  selectedSearchColumns,
  invertSearchColumns,
  sorts,
  reverse,
  onSetCustomColumns,
  onSetSelectDistinctColumns,
  onSetAggregationSettings,
  onSetRollupConfig,
  onSetConditionalFormats,
  onSetMovedColumns,
  onSetFrozenColumns,
  onSetColumnHeaderGroups,
  onSetColumnVisibility,
  onResetColumnVisibility,
  onStartDownload,
  onDownloadTable,
  onCancelDownload,
  onToggleFilterBar,
  onToggleSearchBar,
  onToggleGoto,
  onAdvancedSettingsChange,
  onCreateChart,
  onChartChange,
  onSetQuickFilters,
  onSetAdvancedFilters,
  onSetSorts,
  onSetReverse,
  onClearAllFilters,
  onSetCrossColumnSearch,
  onClose,
  registry = defaultTableOptionsRegistry,
}: TableOptionsWrapperProps): JSX.Element {
  // Create grid state snapshot from props
  const gridState = useMemo<GridStateSnapshot>(
    () => ({
      model,
      customColumns,
      selectDistinctColumns,
      aggregationSettings,
      rollupConfig,
      conditionalFormats,
      movedColumns,
      frozenColumns,
      columnHeaderGroups,
      hiddenColumns,
      isRollup,
      name,
      userColumnWidths,
      selectedRanges,
      isTableDownloading,
      tableDownloadStatus,
      tableDownloadProgress,
      tableDownloadEstimatedTime,
      isFilterBarShown,
      showSearchBar,
      isGotoShown,
      canToggleSearch,
      canDownloadCsv,
      hasAdvancedSettings,
      advancedSettings,
      isChartBuilderAvailable,
      quickFilters,
      advancedFilters,
      searchFilter,
      searchValue,
      selectedSearchColumns,
      invertSearchColumns,
      sorts,
      reverse,
    }),
    [
      model,
      customColumns,
      selectDistinctColumns,
      aggregationSettings,
      rollupConfig,
      conditionalFormats,
      movedColumns,
      frozenColumns,
      columnHeaderGroups,
      hiddenColumns,
      isRollup,
      name,
      userColumnWidths,
      selectedRanges,
      isTableDownloading,
      tableDownloadStatus,
      tableDownloadProgress,
      tableDownloadEstimatedTime,
      isFilterBarShown,
      showSearchBar,
      isGotoShown,
      canToggleSearch,
      canDownloadCsv,
      hasAdvancedSettings,
      advancedSettings,
      isChartBuilderAvailable,
      quickFilters,
      advancedFilters,
      searchFilter,
      searchValue,
      selectedSearchColumns,
      invertSearchColumns,
      sorts,
      reverse,
    ]
  );

  // Create dispatch function
  const dispatch = useCallback<GridDispatch>(
    (action: GridAction) => {
      switch (action.type) {
        case 'SET_CUSTOM_COLUMNS':
          onSetCustomColumns(action.columns);
          break;
        case 'SET_SELECT_DISTINCT_COLUMNS':
          onSetSelectDistinctColumns(action.columns);
          break;
        case 'SET_AGGREGATION_SETTINGS':
          onSetAggregationSettings(action.settings);
          break;
        case 'SET_ROLLUP_CONFIG':
          // Only call if config is defined - undefined means clear rollup
          if (action.config != null) {
            onSetRollupConfig(action.config);
          }
          break;
        case 'SET_CONDITIONAL_FORMATS':
          onSetConditionalFormats(action.formats);
          break;
        case 'SET_MOVED_COLUMNS':
          onSetMovedColumns(action.columns, action.onChangeApplied);
          break;
        case 'SET_FROZEN_COLUMNS':
          onSetFrozenColumns(action.columns);
          break;
        case 'SET_COLUMN_HEADER_GROUPS':
          onSetColumnHeaderGroups(action.groups);
          break;
        case 'SET_COLUMN_VISIBILITY':
          onSetColumnVisibility(action.columns, action.isVisible);
          break;
        case 'RESET_COLUMN_VISIBILITY':
          onResetColumnVisibility();
          break;
        case 'START_DOWNLOAD':
          onStartDownload();
          break;
        case 'DOWNLOAD_TABLE':
          onDownloadTable(
            action.fileName,
            action.frozenTable as DhType.Table,
            action.tableSubscription as DhType.TableViewportSubscription,
            action.snapshotRanges as readonly GridRange[],
            action.modelRanges as readonly GridRange[],
            action.includeColumnHeaders,
            action.useUnformattedValues
          );
          break;
        case 'CANCEL_DOWNLOAD':
          onCancelDownload();
          break;
        case 'TOGGLE_FILTER_BAR':
          onToggleFilterBar();
          break;
        case 'TOGGLE_SEARCH_BAR':
          onToggleSearchBar();
          break;
        case 'TOGGLE_GOTO':
          onToggleGoto();
          break;
        case 'SET_ADVANCED_SETTING':
          onAdvancedSettingsChange?.(action.key, action.isOn);
          break;
        case 'CREATE_CHART':
          onCreateChart?.(action.settings);
          break;
        case 'UPDATE_CHART_PREVIEW':
          onChartChange?.(action.settings);
          break;
        case 'SET_QUICK_FILTERS':
          onSetQuickFilters(action.filters);
          break;
        case 'SET_ADVANCED_FILTERS':
          onSetAdvancedFilters(action.filters);
          break;
        case 'SET_SORTS':
          onSetSorts(action.sorts);
          break;
        case 'SET_REVERSE':
          onSetReverse(action.reverse);
          break;
        case 'CLEAR_ALL_FILTERS':
          onClearAllFilters();
          break;
        case 'SET_CROSS_COLUMN_SEARCH':
          onSetCrossColumnSearch(
            action.searchValue,
            action.selectedSearchColumns,
            action.invertSearchColumns
          );
          break;
        default:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          log.warn(`Unknown action type: ${(action as any).type}`);
      }
    },
    [
      onSetCustomColumns,
      onSetSelectDistinctColumns,
      onSetAggregationSettings,
      onSetRollupConfig,
      onSetConditionalFormats,
      onSetMovedColumns,
      onSetFrozenColumns,
      onSetColumnHeaderGroups,
      onSetColumnVisibility,
      onResetColumnVisibility,
      onStartDownload,
      onDownloadTable,
      onCancelDownload,
      onToggleFilterBar,
      onToggleSearchBar,
      onToggleGoto,
      onAdvancedSettingsChange,
      onCreateChart,
      onChartChange,
      onSetQuickFilters,
      onSetAdvancedFilters,
      onSetSorts,
      onSetReverse,
      onClearAllFilters,
      onSetCrossColumnSearch,
    ]
  );

  return (
    <TableOptionsHost
      registry={registry}
      gridState={gridState}
      dispatch={dispatch}
      onClose={onClose}
    />
  );
}

export default TableOptionsWrapper;
