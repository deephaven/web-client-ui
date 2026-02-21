import React, { useCallback, useMemo } from 'react';
import Log from '@deephaven/log';
import type {
  GridRange,
  MoveOperation,
  ModelIndex,
  ModelSizeMap,
} from '@deephaven/grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
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
import type { ColumnName } from '../CommonTypes';
import type {
  AggregationSettings,
  UIRollupConfig,
  SidebarFormattingRule,
} from '../sidebar';

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
