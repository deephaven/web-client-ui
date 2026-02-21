import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import type { MoveOperation, ModelIndex, ModelSizeMap } from '@deephaven/grid';
import type { Shortcut } from '@deephaven/components';
import type { ColumnName } from '../CommonTypes';
import type ColumnHeaderGroup from '../ColumnHeaderGroup';
import type IrisGridModel from '../IrisGridModel';
import type {
  AggregationSettings,
  UIRollupConfig,
  SidebarFormattingRule,
  ChartBuilderSettings,
} from '../sidebar';
import type AdvancedSettingsType from '../sidebar/AdvancedSettingsType';

// ============================================================================
// Grid State Snapshot (Read-Only)
// ============================================================================

/**
 * Read-only snapshot of IrisGrid state.
 * Panels receive this to read current configuration.
 */
export interface GridStateSnapshot {
  /** The IrisGrid model for accessing column info, etc. */
  model: IrisGridModel;

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

  /** Hidden column indices */
  hiddenColumns: readonly ModelIndex[];

  /** Whether the table has a rollup applied */
  isRollup: boolean;

  /** User column widths for download */
  userColumnWidths?: ModelSizeMap;

  /** Table name for download */
  name?: string;

  /** Selected ranges for download */
  selectedRanges?: readonly unknown[];

  /** Download in progress */
  isTableDownloading?: boolean;

  /** Download status */
  tableDownloadStatus?: string;

  /** Download progress (0-1) */
  tableDownloadProgress?: number;

  /** Estimated download time */
  tableDownloadEstimatedTime?: number | null;

  // ============================================================================
  // Toggle UI State
  // ============================================================================

  /** Whether the filter bar is shown */
  isFilterBarShown?: boolean;

  /** Whether the search bar is shown */
  showSearchBar?: boolean;

  /** Whether the Go To row panel is shown */
  isGotoShown?: boolean;

  /** Whether search bar can be toggled */
  canToggleSearch?: boolean;

  /** Whether CSV download is available */
  canDownloadCsv?: boolean;

  /** Whether there are advanced settings to show */
  hasAdvancedSettings?: boolean;

  /** Advanced settings map */
  advancedSettings?: ReadonlyMap<AdvancedSettingsType, boolean>;

  /** Whether chart builder is available */
  isChartBuilderAvailable?: boolean;
}

// ============================================================================
// Grid Actions (Dispatch)
// ============================================================================

/**
 * Actions that can be dispatched to modify grid state.
 */
export type GridAction =
  | { type: 'SET_CUSTOM_COLUMNS'; columns: readonly ColumnName[] }
  | { type: 'SET_SELECT_DISTINCT_COLUMNS'; columns: readonly ColumnName[] }
  | { type: 'SET_AGGREGATION_SETTINGS'; settings: AggregationSettings }
  | { type: 'SET_ROLLUP_CONFIG'; config: UIRollupConfig | undefined }
  | {
      type: 'SET_CONDITIONAL_FORMATS';
      formats: readonly SidebarFormattingRule[];
    }
  | {
      type: 'SET_MOVED_COLUMNS';
      columns: readonly MoveOperation[];
      onChangeApplied?: () => void;
    }
  | { type: 'SET_FROZEN_COLUMNS'; columns: readonly ColumnName[] }
  | {
      type: 'SET_COLUMN_HEADER_GROUPS';
      groups: readonly ColumnHeaderGroup[];
    }
  | {
      type: 'SET_COLUMN_VISIBILITY';
      columns: readonly ModelIndex[];
      isVisible: boolean;
    }
  | { type: 'RESET_COLUMN_VISIBILITY' }
  | { type: 'START_DOWNLOAD' }
  | {
      type: 'DOWNLOAD_TABLE';
      fileName: string;
      frozenTable: unknown;
      tableSubscription: unknown;
      snapshotRanges: unknown;
      modelRanges: unknown;
      includeColumnHeaders: boolean;
      useUnformattedValues: boolean;
    }
  | { type: 'CANCEL_DOWNLOAD' }
  | { type: 'TOGGLE_FILTER_BAR' }
  | { type: 'TOGGLE_SEARCH_BAR' }
  | { type: 'TOGGLE_GOTO' }
  | { type: 'SET_ADVANCED_SETTING'; key: AdvancedSettingsType; isOn: boolean }
  | { type: 'CREATE_CHART'; settings: ChartBuilderSettings }
  | { type: 'UPDATE_CHART_PREVIEW'; settings: ChartBuilderSettings };

/**
 * Function to dispatch grid actions.
 */
export type GridDispatch = (action: GridAction) => void;

// ============================================================================
// Table Option Panel Props
// ============================================================================

/**
 * Props passed to Table Option panel components.
 * @template TOptionState - Type of option-local state (void if no local state)
 */
export interface TableOptionPanelProps<TOptionState = void> {
  /** Read-only snapshot of grid state */
  gridState: GridStateSnapshot;

  /** Dispatch function to modify grid state */
  dispatch: GridDispatch;

  /** Option-local state (if the option defines a reducer) */
  optionState: TOptionState;

  /** Dispatch function for option-local actions */
  dispatchOption: (action: unknown) => void;

  /** Open a sub-panel (e.g., AGGREGATION_EDIT from AGGREGATIONS) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openSubPanel: (option: TableOption<any, any>) => void;

  /** Close the current panel (go back) */
  closePanel: () => void;
}

// ============================================================================
// Table Option Definition
// ============================================================================

/**
 * Menu item configuration for a Table Option.
 */
export interface TableOptionMenuItem {
  /** Display title */
  title: string;

  /** Optional subtitle/description */
  subtitle?: string;

  /** Icon to display */
  icon?: IconDefinition;

  /** Whether the option is available (e.g., model-dependent) */
  isAvailable?: (gridState: GridStateSnapshot) => boolean;

  /** Whether the option should be visible in the menu */
  isVisible?: (gridState: GridStateSnapshot) => boolean;

  /** Order for sorting in menu (lower = higher in list) */
  order?: number;
}

/**
 * Toggle configuration for options that act as on/off switches.
 * Used for Quick Filters, Search Bar, Go To Row.
 */
export interface TableOptionToggle {
  /** Get current toggle state */
  getValue: (gridState: GridStateSnapshot) => boolean;

  /** Action type to dispatch when toggled */
  actionType: GridAction['type'];

  /** Keyboard shortcut */
  shortcut?: Shortcut;
}

/**
 * Self-contained Table Option definition.
 * Each option is a module that defines its menu item, panel component,
 * and optionally its own local state management.
 *
 * @template TOptionState - Type of option-local state
 * @template TOptionAction - Type of option-local actions
 */
export interface TableOption<TOptionState = void, TOptionAction = unknown> {
  /** Unique type identifier */
  type: string;

  /** Menu item configuration */
  menuItem: TableOptionMenuItem;

  /**
   * Panel component to render when option is selected.
   * If undefined, the option is a toggle or action-only.
   */
  Panel?: React.ComponentType<TableOptionPanelProps<TOptionState>>;

  /**
   * For toggle options (Quick Filters, Search Bar, Go To).
   * If defined, renders a toggle button instead of opening a panel.
   */
  toggle?: TableOptionToggle;

  /**
   * Initial state for option-local state.
   * Required if the option has a reducer.
   */
  initialState?: TOptionState;

  /**
   * Reducer for option-local state management.
   * Use this for complex options that need their own state (e.g., TableExporter).
   */
  reducer?: (state: TOptionState, action: TOptionAction) => TOptionState;
}
