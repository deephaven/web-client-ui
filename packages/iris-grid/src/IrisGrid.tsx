import React, {
  ChangeEvent,
  Component,
  CSSProperties,
  ReactElement,
  ReactNode,
} from 'react';
import memoize from 'memoizee';
import classNames from 'classnames';
import { CSSTransition } from 'react-transition-group';
import PropTypes from 'prop-types';
import deepEqual from 'deep-equal';
import Log from '@deephaven/log';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ContextActions,
  Stack,
  Menu,
  Page,
  Popper,
  ThemeExport,
  Tooltip,
  ContextAction,
  PopperOptions,
  ReferenceObject,
  Button,
  ContextActionUtils,
  ResolvableContextAction,
} from '@deephaven/components';
import {
  Grid,
  GridMetrics,
  GridMouseHandler,
  GridRange,
  GridRangeIndex,
  GridThemeType,
  GridUtils,
  KeyHandler,
  ModelIndex,
  ModelSizeMap,
  MoveOperation,
  VisibleIndex,
  GridState,
  isEditableGridModel,
  BoundedAxisRange,
  isExpandableGridModel,
} from '@deephaven/grid';
import {
  dhEye,
  dhFilterFilled,
  dhGraphLineUp,
  dhTriangleDownSquare,
  vsClose,
  vsCloudDownload,
  vsEdit,
  vsFilter,
  vsMenu,
  vsReply,
  vsRuby,
  vsSearch,
  vsSplitHorizontal,
  vsSymbolOperator,
  vsTools,
} from '@deephaven/icons';
import type {
  Column,
  ColumnGroup,
  CustomColumn,
  DateWrapper,
  dh as DhType,
  FilterCondition,
  Sort,
  Table,
  TableViewportSubscription,
} from '@deephaven/jsapi-types';
import {
  DateUtils,
  Formatter,
  FormatterUtils,
  TableUtils,
  FormattingRule,
  ReverseType,
  RowDataMap,
  SortDirection,
  DateTimeColumnFormatterOptions,
  TableColumnFormat,
  Settings,
} from '@deephaven/jsapi-utils';
import {
  assertNotNull,
  copyToClipboard,
  EMPTY_ARRAY,
  EMPTY_MAP,
  Pending,
  PromiseUtils,
  ValidationError,
  getOrThrow,
} from '@deephaven/utils';
import {
  Type as FilterType,
  TypeValue as FilterTypeValue,
} from '@deephaven/filters';
import throttle from 'lodash.throttle';
import debounce from 'lodash.debounce';
import clamp from 'lodash.clamp';
import {
  FormattingRule as SidebarFormattingRule,
  getFormatColumns,
} from './sidebar/conditional-formatting/ConditionalFormattingUtils';
import PendingDataBottomBar from './PendingDataBottomBar';
import IrisGridCopyHandler, { CopyOperation } from './IrisGridCopyHandler';
import FilterInputField from './FilterInputField';
import {
  ClearFilterKeyHandler,
  CopyKeyHandler,
  ReverseKeyHandler,
} from './key-handlers';
import {
  IrisGridCellOverflowMouseHandler,
  IrisGridColumnSelectMouseHandler,
  IrisGridColumnTooltipMouseHandler,
  IrisGridContextMenuHandler,
  IrisGridDataSelectMouseHandler,
  IrisGridFilterMouseHandler,
  IrisGridRowTreeMouseHandler,
  IrisGridSortMouseHandler,
  IrisGridTokenMouseHandler,
  PendingMouseHandler,
} from './mousehandlers';
import ToastBottomBar from './ToastBottomBar';
import IrisGridMetricCalculator from './IrisGridMetricCalculator';
import IrisGridModelUpdater from './IrisGridModelUpdater';
import IrisGridRenderer from './IrisGridRenderer';
import IrisGridTheme, { IrisGridThemeType } from './IrisGridTheme';
import ColumnStatistics from './ColumnStatistics';
import './IrisGrid.scss';
import AdvancedFilterCreator from './AdvancedFilterCreator';
import {
  Aggregations,
  AggregationEdit,
  AggregationUtils,
  ChartBuilder,
  CustomColumnBuilder,
  OptionType,
  RollupRows,
  TableCsvExporter,
  TableSaver,
  VisibilityOrderingBuilder,
  DownloadServiceWorkerUtils,
} from './sidebar';
import IrisGridUtils from './IrisGridUtils';
import CrossColumnSearch from './CrossColumnSearch';
import IrisGridModel from './IrisGridModel';
import IrisGridPartitionSelector from './IrisGridPartitionSelector';
import SelectDistinctBuilder from './sidebar/SelectDistinctBuilder';
import AdvancedSettingsType from './sidebar/AdvancedSettingsType';
import AdvancedSettingsMenu, {
  AdvancedSettingsMenuCallback,
} from './sidebar/AdvancedSettingsMenu';
import SHORTCUTS from './IrisGridShortcuts';
import ConditionalFormattingMenu from './sidebar/conditional-formatting/ConditionalFormattingMenu';

import ConditionalFormatEditor from './sidebar/conditional-formatting/ConditionalFormatEditor';
import IrisGridCellOverflowModal from './IrisGridCellOverflowModal';
import GotoRow, { GotoRowElement } from './GotoRow';
import {
  Aggregation,
  AggregationSettings,
} from './sidebar/aggregations/Aggregations';
import { ChartBuilderSettings } from './sidebar/ChartBuilder';
import AggregationOperation from './sidebar/aggregations/AggregationOperation';
import { UIRollupConfig } from './sidebar/RollupRows';
import {
  ReadonlyAdvancedFilterMap,
  ColumnName,
  ReadonlyQuickFilterMap,
  ReadonlyAggregationMap,
  ReadonlyOperationMap,
  Action,
  OptionItem,
  UITotalsTableConfig,
  InputFilter,
  PendingDataMap,
  AdvancedFilterOptions,
  PendingDataErrorMap,
  QuickFilterMap,
  OperationMap,
} from './CommonTypes';
import ColumnHeaderGroup from './ColumnHeaderGroup';

const log = Log.module('IrisGrid');

const UPDATE_DOWNLOAD_THROTTLE = 500;

const SET_FILTER_DEBOUNCE = 250;

const SEEK_ROW_DEBOUNCE = 250;

const SET_CONDITIONAL_FORMAT_DEBOUNCE = 250;

const DEFAULT_AGGREGATION_SETTINGS = Object.freeze({
  aggregations: EMPTY_ARRAY,
  showOnTop: false,
});

const UNFORMATTED_DATE_PATTERN = `yyyy-MM-dd'T'HH:mm:ss.SSSSSSSSS z`;

function isEmptyConfig({
  advancedFilters,
  aggregationSettings,
  customColumns,
  quickFilters,
  reverseType,
  rollupConfig,
  searchFilter,
  selectDistinctColumns,
  sorts,
}: {
  advancedFilters: ReadonlyAdvancedFilterMap;
  aggregationSettings: AggregationSettings;
  customColumns: readonly ColumnName[];
  quickFilters: ReadonlyQuickFilterMap;
  reverseType: ReverseType;
  rollupConfig?: UIRollupConfig;
  searchFilter?: FilterCondition;
  selectDistinctColumns: readonly ColumnName[];
  sorts: readonly Sort[];
}): boolean {
  return (
    advancedFilters.size === 0 &&
    aggregationSettings.aggregations.length === 0 &&
    customColumns.length === 0 &&
    quickFilters.size === 0 &&
    reverseType === TableUtils.REVERSE_TYPE.NONE &&
    rollupConfig == null &&
    searchFilter == null &&
    selectDistinctColumns.length === 0 &&
    sorts.length === 0
  );
}
export type FilterData = {
  operator: FilterTypeValue;
  text: string;
  value: unknown;
  startColumnIndex: number;
};

export type FilterMap = Map<
  ColumnName,
  {
    columnType: string;
    filterList: FilterData[];
  }
>;

export interface IrisGridContextMenuData {
  model: IrisGridModel;
  value: unknown;
  valueText: string | null;
  column: Column;
  rowIndex: GridRangeIndex;
  columnIndex: GridRangeIndex;
  modelRow: GridRangeIndex;
  modelColumn: GridRangeIndex;
}

export interface IrisGridProps {
  children: React.ReactNode;
  advancedFilters: ReadonlyAdvancedFilterMap;
  advancedSettings: Map<AdvancedSettingsType, boolean>;
  alwaysFetchColumns: readonly ColumnName[];
  isFilterBarShown: boolean;
  applyInputFiltersOnInit: boolean;
  conditionalFormats: readonly SidebarFormattingRule[];
  customColumnFormatMap: Map<ColumnName, FormattingRule>;
  movedColumns: readonly MoveOperation[];
  movedRows: readonly MoveOperation[];
  inputFilters: readonly InputFilter[];
  customFilters: readonly FilterCondition[];
  model: IrisGridModel;
  onCreateChart: (settings: ChartBuilderSettings, model: IrisGridModel) => void;
  onColumnSelected: (column: Column) => void;
  onError: (error: unknown) => void;
  onDataSelected: (index: ModelIndex, map: Record<ColumnName, unknown>) => void;
  onStateChange: (irisGridState: IrisGridState, gridState: GridState) => void;
  onPartitionAppend?: (partitionColumn: Column, value: string) => void;
  onAdvancedSettingsChange: AdvancedSettingsMenuCallback;
  partition: string | null;
  partitionColumn: Column | null;
  sorts: readonly Sort[];
  reverseType: ReverseType;
  quickFilters: ReadonlyQuickFilterMap | null;
  customColumns: readonly ColumnName[];
  selectDistinctColumns: readonly ColumnName[];
  settings?: Settings;
  userColumnWidths: ModelSizeMap;
  userRowHeights: ModelSizeMap;
  onSelectionChanged: (gridRanges: readonly GridRange[]) => void;
  rollupConfig?: UIRollupConfig;
  aggregationSettings: AggregationSettings;

  isSelectingColumn: boolean;
  isSelectingPartition: boolean;
  isStuckToBottom: boolean;
  isStuckToRight: boolean;

  // eslint-disable-next-line react/no-unused-prop-types
  columnSelectionValidator: (value: Column | null) => boolean;
  columnAllowedCursor: string;

  // eslint-disable-next-line react/no-unused-prop-types
  columnNotAllowedCursor: string;
  name: string;
  onlyFetchVisibleColumns: boolean;

  showSearchBar: boolean;
  searchValue: string;
  selectedSearchColumns: readonly ColumnName[];
  invertSearchColumns: boolean;

  // eslint-disable-next-line react/no-unused-prop-types
  onContextMenu: (
    data: IrisGridContextMenuData
  ) => readonly ResolvableContextAction[];

  pendingDataMap?: PendingDataMap;
  getDownloadWorker: () => Promise<ServiceWorker>;

  canCopy: boolean;
  canDownloadCsv: boolean;
  frozenColumns: readonly ColumnName[];

  // Theme override for IrisGridTheme
  theme: GridThemeType;

  canToggleSearch: boolean;

  columnHeaderGroups?: readonly ColumnHeaderGroup[];
}

export interface IrisGridState {
  isFilterBarShown: boolean;
  isSelectingPartition: boolean;
  focusedFilterBarColumn: number | null;
  metricCalculator: IrisGridMetricCalculator;
  metrics?: GridMetrics;
  keyHandlers: readonly KeyHandler[];
  mouseHandlers: readonly GridMouseHandler[];

  partition: string | null;
  partitionColumn: Column | null;
  partitionTable: Table | null;
  partitionFilters: readonly FilterCondition[];
  // setAdvancedFilter and setQuickFilter mutate the arguments
  // so we want to always use map copies from the state instead of props
  quickFilters: ReadonlyQuickFilterMap;
  advancedFilters: ReadonlyAdvancedFilterMap;
  shownAdvancedFilter: number | null;
  hoverAdvancedFilter: number | null;

  sorts: readonly Sort[];
  reverseType: ReverseType;
  customColumns: readonly ColumnName[];
  selectDistinctColumns: readonly ColumnName[];

  // selected range in table
  selectedRanges: readonly GridRange[];

  // Current ongoing copy operation
  copyOperation: CopyOperation | null;

  // The filter that is currently being applied. Reset after update is received
  loadingText: string | null;
  loadingScrimProgress: number | null;
  loadingSpinnerShown: boolean;

  movedColumns: readonly MoveOperation[];
  movedRows: readonly MoveOperation[];

  shownColumnTooltip: number | null;

  formatter: Formatter;
  isMenuShown: boolean;
  customColumnFormatMap: Map<ColumnName, FormattingRule>;

  conditionalFormats: readonly SidebarFormattingRule[];
  conditionalFormatEditIndex: number | null;
  conditionalFormatPreview?: SidebarFormattingRule;

  // Column user is hovering over for selection
  hoverSelectColumn: GridRangeIndex;

  isTableDownloading: boolean;
  isReady: boolean;
  tableDownloadStatus: string;
  tableDownloadProgress: number;
  tableDownloadEstimatedTime: number | null;

  showSearchBar: boolean;
  searchFilter?: FilterCondition;
  searchValue: string;
  selectedSearchColumns: readonly ColumnName[];
  invertSearchColumns: boolean;

  rollupConfig?: UIRollupConfig;
  rollupSelectedColumns: readonly ColumnName[];
  aggregationSettings: AggregationSettings;
  selectedAggregation: Aggregation | null;

  openOptions: readonly OptionItem[];

  pendingRowCount: number;
  pendingDataMap: PendingDataMap;
  pendingDataErrors: PendingDataErrorMap;
  pendingSavePromise: Promise<void> | null;
  pendingSaveError: string | null;

  toastMessage: JSX.Element | null;
  frozenColumns: readonly ColumnName[];
  showOverflowModal: boolean;
  overflowText: string;
  overflowButtonTooltipProps: CSSProperties | null;
  expandCellTooltipProps: CSSProperties | null;
  expandTooltipDisplayValue: string;
  linkHoverTooltipProps: CSSProperties | null;
  linkHoverDisplayValue: string;

  gotoRow: string;
  gotoRowError: string;
  gotoValueError: string;
  isGotoShown: boolean;

  gotoValueSelectedColumnName: ColumnName;
  gotoValueSelectedFilter: FilterTypeValue;
  gotoValue: string;

  columnHeaderGroups: readonly ColumnHeaderGroup[];
}

export class IrisGrid extends Component<IrisGridProps, IrisGridState> {
  static minDebounce = 150;

  static maxDebounce = 500;

  static loadingSpinnerDelay = 800;

  static defaultProps = {
    children: null,
    advancedFilters: EMPTY_MAP,
    advancedSettings: EMPTY_MAP,
    alwaysFetchColumns: EMPTY_ARRAY,
    conditionalFormats: EMPTY_ARRAY,
    customColumnFormatMap: EMPTY_MAP,
    isFilterBarShown: false,
    applyInputFiltersOnInit: false,
    movedColumns: EMPTY_ARRAY,
    movedRows: EMPTY_ARRAY,
    inputFilters: EMPTY_ARRAY,
    customFilters: EMPTY_ARRAY,
    onCreateChart: undefined,
    onColumnSelected: (): void => undefined,
    onDataSelected: (): void => undefined,
    onError: (): void => undefined,
    onStateChange: (): void => undefined,
    onAdvancedSettingsChange: (): void => undefined,
    partition: null,
    partitionColumn: null,
    quickFilters: EMPTY_MAP,
    selectDistinctColumns: EMPTY_ARRAY,
    sorts: EMPTY_ARRAY,
    reverseType: TableUtils.REVERSE_TYPE.NONE,
    customColumns: EMPTY_ARRAY,
    aggregationSettings: DEFAULT_AGGREGATION_SETTINGS,
    rollupConfig: undefined,
    userColumnWidths: EMPTY_MAP,
    userRowHeights: EMPTY_MAP,
    onSelectionChanged: (): void => undefined,
    isSelectingColumn: false,
    isSelectingPartition: false,
    isStuckToBottom: false,
    isStuckToRight: false,
    columnSelectionValidator: null,
    columnAllowedCursor: null,
    columnNotAllowedCursor: null,
    name: 'table',
    onlyFetchVisibleColumns: true,
    showSearchBar: false,
    searchValue: '',
    selectedSearchColumns: null,
    invertSearchColumns: true,
    onContextMenu: (): readonly ResolvableContextAction[] => EMPTY_ARRAY,
    pendingDataMap: EMPTY_MAP,
    getDownloadWorker: DownloadServiceWorkerUtils.getServiceWorker,
    settings: {
      timeZone: 'America/New_York',
      defaultDateTimeFormat: DateUtils.FULL_DATE_FORMAT,
      showTimeZone: false,
      showTSeparator: true,
      truncateNumbersWithPound: false,
      formatter: EMPTY_ARRAY,
      decimalFormatOptions: PropTypes.shape({
        defaultFormatString: PropTypes.string,
      }),
      integerFormatOptions: PropTypes.shape({
        defaultFormatString: PropTypes.string,
      }),
    },
    canCopy: true,
    canDownloadCsv: true,
    frozenColumns: null,
    theme: IrisGridTheme,
    canToggleSearch: true,
  };

  constructor(props: IrisGridProps) {
    super(props);

    this.handleAdvancedFilterChange =
      this.handleAdvancedFilterChange.bind(this);
    this.handleAdvancedFilterSortChange =
      this.handleAdvancedFilterSortChange.bind(this);
    this.handleAdvancedFilterDone = this.handleAdvancedFilterDone.bind(this);
    this.handleAdvancedMenuOpened = this.handleAdvancedMenuOpened.bind(this);
    this.handleGotoRowOpened = this.handleGotoRowOpened.bind(this);
    this.handleGotoRowClosed = this.handleGotoRowClosed.bind(this);
    this.handleAdvancedMenuClosed = this.handleAdvancedMenuClosed.bind(this);
    this.handleAggregationChange = this.handleAggregationChange.bind(this);
    this.handleAggregationsChange = this.handleAggregationsChange.bind(this);
    this.handleAggregationEdit = this.handleAggregationEdit.bind(this);
    this.handleAnimationLoop = this.handleAnimationLoop.bind(this);
    this.handleAnimationStart = this.handleAnimationStart.bind(this);
    this.handleAnimationEnd = this.handleAnimationEnd.bind(this);
    this.handleChartChange = this.handleChartChange.bind(this);
    this.handleChartCreate = this.handleChartCreate.bind(this);
    this.handleGridError = this.handleGridError.bind(this);
    this.handleFilterBarChange = this.handleFilterBarChange.bind(this);
    this.handleFilterBarDone = this.handleFilterBarDone.bind(this);
    this.handleFilterBarTab = this.handleFilterBarTab.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleMenu = this.handleMenu.bind(this);
    this.handleMenuClose = this.handleMenuClose.bind(this);
    this.handleMenuSelect = this.handleMenuSelect.bind(this);
    this.handleMenuBack = this.handleMenuBack.bind(this);
    this.handleRequestFailed = this.handleRequestFailed.bind(this);
    this.handleSelectionChanged = this.handleSelectionChanged.bind(this);
    this.handleMovedColumnsChanged = this.handleMovedColumnsChanged.bind(this);
    this.handleHeaderGroupsChanged = this.handleHeaderGroupsChanged.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleTooltipRef = this.handleTooltipRef.bind(this);
    this.handleViewChanged = this.handleViewChanged.bind(this);
    this.handleFormatSelection = this.handleFormatSelection.bind(this);
    this.handleConditionalFormatCreate =
      this.handleConditionalFormatCreate.bind(this);
    this.handleConditionalFormatEdit =
      this.handleConditionalFormatEdit.bind(this);
    this.handleConditionalFormatsChange =
      this.handleConditionalFormatsChange.bind(this);
    this.handleConditionalFormatEditorSave =
      this.handleConditionalFormatEditorSave.bind(this);
    this.handleConditionalFormatEditorCancel =
      this.handleConditionalFormatEditorCancel.bind(this);
    this.handleUpdateCustomColumns = this.handleUpdateCustomColumns.bind(this);
    this.handleCustomColumnsChanged =
      this.handleCustomColumnsChanged.bind(this);
    this.handleDataBarRangeChange = this.handleDataBarRangeChange.bind(this);
    this.handleSelectDistinctChanged =
      this.handleSelectDistinctChanged.bind(this);
    this.handlePendingDataUpdated = this.handlePendingDataUpdated.bind(this);
    this.handlePendingCommitClicked =
      this.handlePendingCommitClicked.bind(this);
    this.handlePendingDiscardClicked =
      this.handlePendingDiscardClicked.bind(this);
    this.handleGotoRowSelectedRowNumberSubmit =
      this.handleGotoRowSelectedRowNumberSubmit.bind(this);
    this.focusRowInGrid = this.focusRowInGrid.bind(this);
    this.handleDownloadTable = this.handleDownloadTable.bind(this);
    this.handleDownloadTableStart = this.handleDownloadTableStart.bind(this);
    this.handleCancelDownloadTable = this.handleCancelDownloadTable.bind(this);
    this.handleDownloadCanceled = this.handleDownloadCanceled.bind(this);
    this.handleDownloadCompleted = this.handleDownloadCompleted.bind(this);
    this.handlePartitionAppend = this.handlePartitionAppend.bind(this);
    this.handlePartitionChange = this.handlePartitionChange.bind(this);
    this.handlePartitionFetchAll = this.handlePartitionFetchAll.bind(this);
    this.handlePartitionDone = this.handlePartitionDone.bind(this);
    this.handleColumnVisibilityChanged =
      this.handleColumnVisibilityChanged.bind(this);
    this.handleColumnVisibilityReset =
      this.handleColumnVisibilityReset.bind(this);
    this.handleCrossColumnSearch = this.handleCrossColumnSearch.bind(this);
    this.handleRollupChange = this.handleRollupChange.bind(this);
    this.handleOverflowClose = this.handleOverflowClose.bind(this);
    this.getColumnBoundingRect = this.getColumnBoundingRect.bind(this);
    this.handleGotoRowSelectedRowNumberChanged =
      this.handleGotoRowSelectedRowNumberChanged.bind(this);
    this.handleGotoValueSelectedColumnNameChanged =
      this.handleGotoValueSelectedColumnNameChanged.bind(this);
    this.handleGotoValueSelectedFilterChanged =
      this.handleGotoValueSelectedFilterChanged.bind(this);
    this.handleGotoValueChanged = this.handleGotoValueChanged.bind(this);
    this.handleGotoValueSubmitted = this.handleGotoValueSubmitted.bind(this);

    this.grid = null;
    this.gridWrapper = null;
    this.lastLoadedConfig = null;
    this.pending = new Pending();
    this.globalColumnFormats = EMPTY_ARRAY;
    this.decimalFormatOptions = {};
    this.integerFormatOptions = {};
    this.truncateNumbersWithPound = false;

    // When the loading scrim started/when it should extend to the end of the screen.
    this.renderer = new IrisGridRenderer();
    this.tableSaver = null;
    this.crossColumnRef = React.createRef();
    this.isAnimating = false;
    this.filterInputRef = React.createRef();

    this.gotoRowRef = React.createRef();

    this.toggleFilterBarAction = {
      action: () => this.toggleFilterBar(),
      shortcut: SHORTCUTS.TABLE.TOGGLE_QUICK_FILTER,
    };

    this.toggleSearchBarAction = {
      action: () => this.toggleSearchBar(),
      shortcut: SHORTCUTS.TABLE.TOGGLE_SEARCH,
    };

    this.toggleGotoRowAction = {
      action: () => this.toggleGotoRow(),
      shortcut: SHORTCUTS.TABLE.GOTO_ROW,
    };

    this.discardAction = {
      action: () => {
        const { model } = this.props;
        if (
          isEditableGridModel(model) &&
          model.isEditable &&
          model.pendingDataMap.size > 0
        ) {
          this.discardPending().catch(log.error);
        }
      },
      shortcut: SHORTCUTS.INPUT_TABLE.DISCARD,
    };
    this.commitAction = {
      action: () => {
        const { model } = this.props;
        if (
          isEditableGridModel(model) &&
          model.isEditable &&
          model.pendingDataMap.size > 0 &&
          model.pendingDataErrors.size === 0
        ) {
          this.commitPending().catch(log.error);
        }
      },
      shortcut: SHORTCUTS.INPUT_TABLE.COMMIT,
    };
    this.contextActions = [
      this.toggleFilterBarAction,
      this.toggleSearchBarAction,
      this.toggleGotoRowAction,
      this.discardAction,
      this.commitAction,
    ];

    const {
      aggregationSettings,
      conditionalFormats,
      customColumnFormatMap,
      isFilterBarShown,
      isSelectingPartition,
      model,
      movedColumns: movedColumnsProp,
      movedRows: movedRowsProp,
      partition,
      partitionColumn,
      rollupConfig,
      userColumnWidths,
      userRowHeights,
      showSearchBar,
      searchValue,
      selectedSearchColumns,
      invertSearchColumns,
      advancedFilters,
      quickFilters,
      selectDistinctColumns,
      pendingDataMap,
      canCopy,
      frozenColumns,
      columnHeaderGroups,
    } = props;

    const keyHandlers: KeyHandler[] = [
      new ReverseKeyHandler(this),
      new ClearFilterKeyHandler(this),
    ];
    if (canCopy) {
      keyHandlers.push(new CopyKeyHandler(this));
    }
    const { dh } = model;
    const mouseHandlers = [
      new IrisGridCellOverflowMouseHandler(this),
      new IrisGridRowTreeMouseHandler(this),
      new IrisGridTokenMouseHandler(this),
      new IrisGridColumnSelectMouseHandler(this),
      new IrisGridColumnTooltipMouseHandler(this),
      new IrisGridSortMouseHandler(this),
      new IrisGridFilterMouseHandler(this),
      new IrisGridContextMenuHandler(this, dh),
      new IrisGridDataSelectMouseHandler(this),
      new PendingMouseHandler(this),
    ];

    const movedColumns =
      movedColumnsProp.length > 0
        ? movedColumnsProp
        : model.initialMovedColumns;
    const movedRows =
      movedRowsProp.length > 0 ? movedRowsProp : model.initialMovedRows;

    const metricCalculator = new IrisGridMetricCalculator({
      userColumnWidths: new Map(userColumnWidths),
      userRowHeights: new Map(userRowHeights),
      movedColumns,
      initialColumnWidths: new Map(
        model?.layoutHints?.hiddenColumns?.map(name => [
          model.getColumnIndexByName(name),
          0,
        ])
      ),
    });
    const searchColumns = selectedSearchColumns ?? [];
    const searchFilter = CrossColumnSearch.createSearchFilter(
      dh,
      searchValue,
      searchColumns,
      model.columns,
      invertSearchColumns
    );

    this.tableUtils = new TableUtils(dh);

    this.state = {
      isFilterBarShown,
      isSelectingPartition,
      focusedFilterBarColumn: null,
      metricCalculator,
      metrics: undefined,
      keyHandlers,
      mouseHandlers,

      partition,
      partitionColumn,
      partitionTable: null,
      partitionFilters: [],
      // setAdvancedFilter and setQuickFilter mutate the arguments
      // so we want to always use map copies from the state instead of props
      quickFilters: quickFilters ? new Map(quickFilters) : new Map(),
      advancedFilters: new Map(advancedFilters),
      shownAdvancedFilter: null,
      hoverAdvancedFilter: null,
      sorts: [],
      reverseType: TableUtils.REVERSE_TYPE.NONE,
      customColumns: [],
      selectDistinctColumns,

      // selected range in table
      selectedRanges: [],

      // Current ongoing copy operation
      copyOperation: null,

      // The filter that is currently being applied. Reset after update is received
      loadingText: null,
      loadingScrimProgress: null,
      loadingSpinnerShown: false,

      movedColumns,
      movedRows,

      shownColumnTooltip: null,

      formatter: new Formatter(dh),
      isMenuShown: false,
      customColumnFormatMap: new Map(customColumnFormatMap),

      conditionalFormats,
      conditionalFormatEditIndex: null,
      conditionalFormatPreview: undefined,

      // Column user is hovering over for selection
      hoverSelectColumn: null,

      isTableDownloading: false,
      isReady: false,
      tableDownloadStatus: '',
      tableDownloadProgress: 0,
      tableDownloadEstimatedTime: 0,

      showSearchBar,
      searchFilter,
      searchValue,
      selectedSearchColumns: searchColumns,
      invertSearchColumns,

      rollupConfig,
      rollupSelectedColumns: [],
      aggregationSettings,
      selectedAggregation: null,

      openOptions: [],

      pendingRowCount: 0,
      pendingDataMap: pendingDataMap ?? new Map(),
      pendingDataErrors: new Map(),
      pendingSavePromise: null,
      pendingSaveError: null,

      toastMessage: null,
      frozenColumns,
      showOverflowModal: false,
      overflowText: '',
      overflowButtonTooltipProps: null,
      expandCellTooltipProps: null,
      expandTooltipDisplayValue: 'expand',
      linkHoverTooltipProps: null,
      linkHoverDisplayValue: '',
      isGotoShown: false,
      gotoRow: '',
      gotoRowError: '',
      gotoValueError: '',

      gotoValueSelectedColumnName: model.columns[0]?.name ?? '',
      gotoValueSelectedFilter: FilterType.eqIgnoreCase,
      gotoValue: '',
      columnHeaderGroups: columnHeaderGroups ?? model.initialColumnHeaderGroups,
    };
  }

  componentDidMount(): void {
    const { partitionColumn, model } = this.props;
    const column =
      partitionColumn ?? model.columns.find(c => c.isPartitionColumn);
    if (
      model.isFilterRequired &&
      model.isValuesTableAvailable &&
      column != null
    ) {
      this.loadPartitionsTable(column);
    } else {
      this.initState();
    }
    this.startListening(model);
  }

  componentDidUpdate(prevProps: IrisGridProps): void {
    const {
      inputFilters,
      isSelectingColumn,
      settings,
      model,
      customFilters,
      sorts,
    } = this.props;

    if (model !== prevProps.model) {
      this.stopListening(prevProps.model);
      this.startListening(model);
    }

    const changedInputFilters =
      inputFilters !== prevProps.inputFilters
        ? inputFilters.filter(
            inputFilter => !prevProps.inputFilters.includes(inputFilter)
          )
        : [];
    if (changedInputFilters.length > 0) {
      const { advancedSettings } = this.props;
      const replaceExistingFilters =
        advancedSettings.get(
          AdvancedSettingsType.FILTER_CONTROL_CHANGE_CLEARS_ALL_FILTERS
        ) ?? false;
      if (replaceExistingFilters) {
        this.clearGridInputField();
        this.clearCrossColumSearch();
      }
      this.startLoading('Filtering...', true);
      this.applyInputFilters(changedInputFilters, replaceExistingFilters);
    }

    if (isSelectingColumn !== prevProps.isSelectingColumn) {
      this.resetColumnSelection();
    }
    if (settings !== prevProps.settings) {
      this.updateFormatterSettings(settings);
    }
    if (customFilters !== prevProps.customFilters) {
      this.startLoading('Filtering...', true);
    }
    if (sorts !== prevProps.sorts) {
      this.updateSorts(sorts);
    }
    const { loadingScrimStartTime, loadingScrimFinishTime } = this;
    if (loadingScrimStartTime != null && loadingScrimFinishTime != null) {
      window.requestAnimationFrame(() => {
        const now = Date.now();
        const currentTime = now - loadingScrimStartTime;
        const totalTime = loadingScrimFinishTime - loadingScrimStartTime;
        const loadingScrimProgress = Math.min(currentTime / totalTime, 1);
        if (loadingScrimFinishTime < now) {
          this.loadingScrimStartTime = undefined;
          this.loadingScrimFinishTime = undefined;
        }

        this.setState(state => {
          if (state.loadingScrimProgress == null) {
            log.debug2('Ignoring scrim update because loading cancelled.');
            return null;
          }

          return { loadingScrimProgress };
        });
      });
    }

    this.sendStateChange();
  }

  componentWillUnmount(): void {
    const { model } = this.props;
    this.stopListening(model);
    this.pending.cancel();
    this.updateSearchFilter.cancel();

    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
    }
    this.handleDownloadProgressUpdate.cancel();
    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  grid: Grid | null;

  gridWrapper: HTMLDivElement | null;

  lastFocusedFilterBarColumn?: number;

  lastLoadedConfig: Pick<
    IrisGridState,
    | 'advancedFilters'
    | 'aggregationSettings'
    | 'customColumns'
    | 'quickFilters'
    | 'reverseType'
    | 'rollupConfig'
    | 'searchFilter'
    | 'selectDistinctColumns'
    | 'sorts'
  > | null;

  tooltip?: Tooltip;

  pending: Pending;

  globalColumnFormats?: readonly FormattingRule[];

  dateTimeFormatterOptions?: DateTimeColumnFormatterOptions;

  decimalFormatOptions: { defaultFormatString?: string };

  integerFormatOptions: { defaultFormatString?: string };

  truncateNumbersWithPound: boolean;

  // When the loading scrim started/when it should extend to the end of the screen.
  loadingScrimStartTime?: number;

  loadingScrimFinishTime?: number;

  animationFrame?: number;

  loadingTimer?: ReturnType<typeof setTimeout>;

  renderer: IrisGridRenderer;

  tableSaver: TableSaver | null;

  crossColumnRef: React.RefObject<CrossColumnSearch>;

  isAnimating: boolean;

  filterInputRef: React.RefObject<FilterInputField>;

  gotoRowRef: React.RefObject<GotoRowElement>;

  toggleFilterBarAction: Action;

  toggleSearchBarAction: Action;

  toggleGotoRowAction: Action;

  discardAction: Action;

  commitAction: Action;

  contextActions: ContextAction[];

  tableUtils: TableUtils;

  getAdvancedMenuOpenedHandler = memoize(
    (column: ModelIndex) => this.handleAdvancedMenuOpened.bind(this, column),
    { max: 100 }
  );

  getCachedAdvancedFilterMenuActions = memoize(
    (
      model: IrisGridModel,
      column: Column,
      advancedFilterOptions: AdvancedFilterOptions | undefined,
      sortDirection: SortDirection | undefined,
      formatter: Formatter
    ) => (
      <AdvancedFilterCreator
        model={model}
        column={column}
        onFilterChange={this.handleAdvancedFilterChange}
        onSortChange={this.handleAdvancedFilterSortChange}
        onDone={this.handleAdvancedFilterDone}
        options={advancedFilterOptions}
        sortDirection={sortDirection}
        formatter={formatter}
        tableUtils={this.tableUtils}
      />
    ),
    { max: 50 }
  );

  getCachedOptionItems = memoize(
    (
      isChartBuilderAvailable: boolean,
      isCustomColumnsAvailable: boolean,
      isFormatColumnsAvailable: boolean,
      isRollupAvailable: boolean,
      isTotalsAvailable: boolean,
      isSelectDistinctAvailable: boolean,
      isExportAvailable: boolean,
      toggleFilterBarAction: Action,
      toggleSearchBarAction: Action,
      toggleGotoRowAction: Action,
      isFilterBarShown: boolean,
      showSearchBar: boolean,
      canDownloadCsv: boolean,
      canToggleSearch: boolean,
      showGotoRow: boolean,
      hasAdvancedSettings: boolean
    ): readonly OptionItem[] => {
      const optionItems: OptionItem[] = [];
      if (isChartBuilderAvailable) {
        optionItems.push({
          type: OptionType.CHART_BUILDER,
          title: 'Chart Builder',
          icon: dhGraphLineUp,
        });
      }
      optionItems.push({
        type: OptionType.VISIBILITY_ORDERING_BUILDER,
        title: 'Organize Columns',
        icon: dhEye,
      });
      if (isFormatColumnsAvailable) {
        optionItems.push({
          type: OptionType.CONDITIONAL_FORMATTING,
          title: 'Conditional Formatting',
          icon: vsEdit,
        });
      }
      if (isCustomColumnsAvailable) {
        optionItems.push({
          type: OptionType.CUSTOM_COLUMN_BUILDER,
          title: 'Custom Columns',
          icon: vsSplitHorizontal,
        });
      }
      if (isRollupAvailable) {
        optionItems.push({
          type: OptionType.ROLLUP_ROWS,
          title: 'Rollup Rows',
          icon: dhTriangleDownSquare,
        });
      }
      if (isTotalsAvailable) {
        optionItems.push({
          type: OptionType.AGGREGATIONS,
          title: 'Aggregate Columns',
          icon: vsSymbolOperator,
        });
      }
      if (isSelectDistinctAvailable) {
        optionItems.push({
          type: OptionType.SELECT_DISTINCT,
          title: 'Select Distinct Values',
          icon: vsRuby,
        });
      }
      if (isExportAvailable && canDownloadCsv) {
        optionItems.push({
          type: OptionType.TABLE_EXPORTER,
          title: 'Download CSV',
          icon: vsCloudDownload,
        });
      }
      if (hasAdvancedSettings) {
        optionItems.push({
          type: OptionType.ADVANCED_SETTINGS,
          title: 'Advanced Settings',
          icon: vsTools,
        });
      }
      optionItems.push({
        type: OptionType.QUICK_FILTERS,
        title: 'Quick Filters',
        subtitle: toggleFilterBarAction.shortcut.getDisplayText(),
        icon: vsFilter,
        isOn: isFilterBarShown,
        onChange: toggleFilterBarAction.action,
      });
      if (canToggleSearch) {
        optionItems.push({
          type: OptionType.SEARCH_BAR,
          title: 'Search Bar',
          subtitle: toggleSearchBarAction.shortcut.getDisplayText(),
          icon: vsSearch,
          isOn: showSearchBar,
          onChange: toggleSearchBarAction.action,
        });
      }
      optionItems.push({
        type: OptionType.GOTO,
        title: 'Go to',
        subtitle: toggleGotoRowAction.shortcut.getDisplayText(),
        icon: vsReply,
        isOn: showGotoRow,
        onChange: toggleGotoRowAction.action,
      });

      return Object.freeze(optionItems);
    },
    { max: 1 }
  );

  getCachedHiddenColumns = memoize(
    (
      metricCalculator: IrisGridMetricCalculator,
      userColumnWidths: ModelSizeMap
    ): readonly ModelIndex[] =>
      IrisGridUtils.getHiddenColumns(
        new Map([...metricCalculator.initialColumnWidths, ...userColumnWidths])
      ),
    { max: 1 }
  );

  getAggregationMap = memoize(
    (
      columns: readonly Column[],
      aggregations: readonly Aggregation[]
    ): ReadonlyAggregationMap => {
      const aggregationMap = {} as Record<AggregationOperation, string[]>;
      aggregations.forEach(({ operation, selected, invert }) => {
        aggregationMap[operation] = AggregationUtils.getOperationColumnNames(
          columns,
          operation,
          selected,
          invert
        );
      });
      return aggregationMap;
    }
  );

  getOperationMap = memoize(
    (
      columns: readonly Column[],
      aggregations: readonly Aggregation[]
    ): ReadonlyOperationMap => {
      const operationMap: OperationMap = {};
      aggregations
        .filter(
          (a: Aggregation) => !AggregationUtils.isRollupOperation(a.operation)
        )
        .forEach(({ operation, selected, invert }) => {
          AggregationUtils.getOperationColumnNames(
            columns,
            operation,
            selected,
            invert
          ).forEach(name => {
            const newOperations = [...(operationMap[name] ?? []), operation];
            operationMap[name] = Object.freeze(newOperations);
          });
        });
      return operationMap;
    }
  );

  getOperationOrder = memoize(
    (aggregations: readonly Aggregation[]): AggregationOperation[] =>
      aggregations
        .map((a: Aggregation) => a.operation)
        .filter(
          (o: AggregationOperation) => !AggregationUtils.isRollupOperation(o)
        )
  );

  getCachedFormatColumns = memoize(
    (
      dh: DhType,
      columns: readonly Column[],
      rules: readonly SidebarFormattingRule[]
    ) => getFormatColumns(dh, columns, rules)
  );

  /**
   * Builds formatColumns array based on the provided formatting rules with optional preview
   * @param columns Array of columns
   * @param rulesParam Array of formatting rules
   * @param preview Optional temporary formatting rule for previewing live changes
   * @param editIndex Index in the rulesParam array to replace with the preview, null if preview not applicable
   * @returns Format columns array
   */
  getCachedPreviewFormatColumns = memoize(
    (
      dh: DhType,
      columns: readonly Column[],
      rulesParam: readonly SidebarFormattingRule[],
      preview?: SidebarFormattingRule,
      editIndex?: number
    ): CustomColumn[] => {
      log.debug(
        'getCachedPreviewFormatColumns',
        rulesParam,
        preview,
        editIndex
      );
      if (preview !== undefined && editIndex !== undefined) {
        const rules = [...rulesParam];
        rules[editIndex] = preview;
        return this.getCachedFormatColumns(dh, columns, rules);
      }

      return this.getCachedFormatColumns(dh, columns, rulesParam);
    }
  );

  getModelRollupConfig = memoize(
    (
      originalColumns: readonly Column[],
      config: UIRollupConfig | undefined,
      aggregationSettings: AggregationSettings
    ) =>
      IrisGridUtils.getModelRollupConfig(
        originalColumns,
        config,
        aggregationSettings
      )
  );

  getModelTotalsConfig = memoize(
    (
      columns: readonly Column[],
      config: UIRollupConfig | undefined,
      aggregationSettings: AggregationSettings
    ): UITotalsTableConfig | null => {
      const { aggregations, showOnTop } = aggregationSettings;
      // If we've got rollups, then aggregations are applied as part of that...
      if (
        (config?.columns?.length ?? 0) > 0 ||
        (aggregations?.length ?? 0) === 0
      ) {
        return null;
      }

      const operationMap = this.getOperationMap(columns, aggregations);
      const operationOrder = this.getOperationOrder(aggregations);

      return { operationMap, operationOrder, showOnTop };
    }
  );

  getCachedStateOverride = memoize(
    (
      hoverSelectColumn: GridRangeIndex,
      isFilterBarShown: boolean,
      isSelectingColumn: boolean,
      loadingScrimProgress: number | null,
      quickFilters: ReadonlyQuickFilterMap,
      advancedFilters: ReadonlyAdvancedFilterMap,
      sorts: readonly Sort[],
      reverseType: ReverseType,
      rollupConfig: UIRollupConfig | undefined,
      isMenuShown: boolean
    ) => ({
      hoverSelectColumn,
      isFilterBarShown,
      isSelectingColumn,
      loadingScrimProgress,
      quickFilters,
      advancedFilters,
      sorts,
      reverseType,
      rollupConfig,
      isMenuShown,
    }),
    { max: 1 }
  );

  getCachedFilter = memoize(
    (
      customFilters: readonly FilterCondition[],
      quickFilters: ReadonlyQuickFilterMap,
      advancedFilters: ReadonlyAdvancedFilterMap,
      partitionFilters: readonly FilterCondition[],
      searchFilter: FilterCondition | undefined
    ) => [
      ...(customFilters ?? []),
      ...(partitionFilters ?? []),
      ...IrisGridUtils.getFiltersFromFilterMap(quickFilters),
      ...IrisGridUtils.getFiltersFromFilterMap(advancedFilters),
      ...(searchFilter !== undefined ? [searchFilter] : []),
    ],
    { max: 1 }
  );

  getCachedTheme = memoize(
    (
      theme: GridThemeType,
      isEditable: boolean,
      floatingRowCount: number
    ): Partial<IrisGridThemeType> => ({
      ...IrisGridTheme,
      ...theme,
      autoSelectRow: !isEditable,
      // We only show the row footers when we have floating rows for aggregations
      rowFooterWidth: floatingRowCount > 0 ? theme.rowFooterWidth : 0,
    }),
    { max: 1 }
  );

  getValueForCell(
    columnIndex: GridRangeIndex,
    rowIndex: GridRangeIndex,
    rawValue = false
  ): string | unknown {
    const { model } = this.props;
    const { dh } = model;
    const modelColumn = this.getModelColumn(columnIndex);
    const modelRow = this.getModelRow(rowIndex);
    if (rawValue && modelColumn != null && modelRow != null) {
      const value = model.valueForCell(modelColumn, modelRow);
      if (TableUtils.isDateType(model.columns[modelColumn].type)) {
        // The returned value is just a long value, we should return the value formatted as a full date string
        const { formatter } = model;
        return dh.i18n.DateTimeFormat.format(
          UNFORMATTED_DATE_PATTERN,
          value as number | Date | DateWrapper,
          dh.i18n.TimeZone.getTimeZone(formatter.timeZone)
        );
      }
      return value;
    }
    if (rawValue) {
      return null;
    }
    if (modelColumn != null && modelRow != null) {
      return model.textForCell(modelColumn, modelRow);
    }
    return '';
  }

  getModelColumn(columnIndex: GridRangeIndex): ModelIndex | null | undefined {
    const { metrics } = this.state;
    assertNotNull(metrics);
    const { modelColumns } = metrics;
    if (modelColumns == null) {
      return null;
    }

    return columnIndex != null ? modelColumns.get(columnIndex) : null;
  }

  getModelRow(rowIndex: GridRangeIndex): ModelIndex | null | undefined {
    const { metrics } = this.state;
    assertNotNull(metrics);
    const { modelRows } = metrics;
    if (modelRows == null) {
      return null;
    }

    return rowIndex != null ? modelRows.get(rowIndex) : null;
  }

  getTheme(): Partial<IrisGridThemeType> {
    const { model, theme } = this.props;
    return this.getCachedTheme(
      theme,
      (isEditableGridModel(model) && model.isEditable) ?? false,
      model.floatingTopRowCount + model.floatingBottomRowCount
    );
  }

  getVisibleColumn(modelIndex: ModelIndex): VisibleIndex {
    const { movedColumns } = this.state;
    return GridUtils.getVisibleIndex(modelIndex, movedColumns);
  }

  makeQuickFilter(
    column: Column,
    text: string,
    timeZone: string
  ): FilterCondition | null {
    try {
      return this.tableUtils.makeQuickFilter(column, text, timeZone);
    } catch (err) {
      log.error('Error creating quick filter', err);
    }
    return null;
  }

  /**
   * Applies the provided input filters as quick filters,
   * and clears any existing quickFilters or advancedFilters on that column
   * @param inputFilters Array of input filters to apply
   * @param replaceExisting If true, new filters will replace the existing ones, instead of merging
   */
  applyInputFilters(
    inputFilters: InputFilter[],
    replaceExisting = false
  ): void {
    const { model } = this.props;
    const { advancedFilters, quickFilters } = this.state;
    const newAdvancedFilters = replaceExisting
      ? new Map()
      : new Map(advancedFilters);
    const newQuickFilters = replaceExisting ? new Map() : new Map(quickFilters);

    let isChanged = replaceExisting && advancedFilters.size > 0;
    inputFilters.forEach(({ name, type, value }) => {
      const modelIndex = model.columns.findIndex(
        ({ name: columnName, type: columnType }) =>
          columnName === name && columnType === type
      );
      if (modelIndex >= 0) {
        isChanged = newAdvancedFilters.delete(modelIndex) || isChanged;
        isChanged =
          this.applyQuickFilter(modelIndex, value, newQuickFilters) ||
          isChanged;
      } else {
        log.error('Unable to find column for inputFilter', name, type, value);
      }
    });
    if (isChanged) {
      this.setState({
        quickFilters: newQuickFilters,
        advancedFilters: newAdvancedFilters,
      });
    }
  }

  /**
   * Applies a quick filter
   * @param modelIndex The index in the model of the column to set
   * @param value The string value to set to the quick filter
   * @param quickFilters The quick filters map
   * @returns True if the filters have changed because this quick filter was applied
   */
  applyQuickFilter(
    modelIndex: ModelIndex,
    value: string | null,
    quickFilters: QuickFilterMap
  ): boolean {
    const { model } = this.props;
    const { formatter } = model;
    const column = model.columns[modelIndex];

    if (value != null && `${value}`.trim().length > 0) {
      const quickFilter = quickFilters.get(modelIndex);
      if (quickFilter != null) {
        const { text } = quickFilter;
        if (text === value) {
          log.debug2('Ignoring change to existing filter');
          return false;
        }
      }
      quickFilters.set(modelIndex, {
        text: value,
        filter: this.makeQuickFilter(column, value, formatter.timeZone),
      });
      return true;
    }
    return quickFilters.delete(modelIndex);
  }

  setAdvancedFilterMap(advancedFilters: ReadonlyAdvancedFilterMap): void {
    this.setState({ advancedFilters });
  }

  setAdvancedFilter(
    modelIndex: ModelIndex,
    filter: FilterCondition | null,
    options: AdvancedFilterOptions
  ): void {
    log.debug('Setting advanced filter', modelIndex, filter);

    this.startLoading('Filtering...', true);

    this.setState(({ advancedFilters }) => {
      const newAdvancedFilters = new Map(advancedFilters);
      if (filter == null) {
        newAdvancedFilters.delete(modelIndex);
      } else {
        newAdvancedFilters.set(modelIndex, {
          filter,
          options,
        });
      }
      return { advancedFilters: newAdvancedFilters };
    });
  }

  /**
   * Sets a quick filter against the provided column
   * @param modelIndex The index in the model for the column this filter is applied to
   * @param filter A filter to apply to the column, or null if there was an error
   * @param text The original text the filter was created with
   */
  setQuickFilter(
    modelIndex: ModelIndex,
    filter: FilterCondition | null,
    text: string
  ): void {
    log.debug('Setting quick filter', modelIndex, filter, text);

    this.startLoading('Filtering...', true);

    this.setState(({ quickFilters }) => {
      const newQuickFilters = new Map(quickFilters);
      newQuickFilters.set(modelIndex, { filter, text });
      return { quickFilters: newQuickFilters };
    });
  }

  /**
   * Set grid filters based on the filter map
   * @param filterMap Filter map
   */
  setFilterMap(filterMap: FilterMap): void {
    log.debug('setFilterMap', filterMap);

    const { advancedSettings } = this.props;
    const clearFiltersOnLinkerFilterUpdate =
      advancedSettings.get(
        AdvancedSettingsType.LINK_CHANGE_CLEARS_ALL_FILTERS
      ) ?? false;
    if (clearFiltersOnLinkerFilterUpdate) {
      this.clearAllFilters();
    }

    const { model } = this.props;
    filterMap.forEach(({ columnType, filterList }, columnName) => {
      const column = model.columns.find(
        c => c.name === columnName && c.type === columnType
      );
      if (column == null) {
        return;
      }
      const columnIndex = model.getColumnIndexByName(column.name);
      assertNotNull(columnIndex);
      const combinedText = IrisGridUtils.combineFiltersFromList(
        columnType,
        filterList
      );
      if (combinedText.length === 0) {
        this.removeQuickFilter(columnIndex);
      } else {
        const { formatter } = model;
        this.setQuickFilter(
          columnIndex,
          this.makeQuickFilter(column, combinedText, formatter.timeZone),
          `${combinedText}`
        );
      }
    });
  }

  removeColumnFilter(modelColumn: ModelIndex): void {
    this.startLoading('Filtering...', true);

    this.setState(
      ({ advancedFilters, quickFilters }: Partial<IrisGridState>) => {
        const newAdvancedFilters = advancedFilters
          ? new Map(advancedFilters)
          : new Map();
        const newQuickFilters = quickFilters
          ? new Map(quickFilters)
          : new Map();
        newQuickFilters.delete(modelColumn);
        newAdvancedFilters.delete(modelColumn);

        return {
          quickFilters: newQuickFilters,
          advancedFilters: newAdvancedFilters,
        };
      }
    );
  }

  removeQuickFilter(modelColumn: ModelIndex): void {
    this.startLoading('Clearing Filter...', true);

    this.setState(({ quickFilters }) => {
      const newQuickFilters = new Map(quickFilters);
      newQuickFilters.delete(modelColumn);

      return { quickFilters: newQuickFilters };
    });
  }

  clearAllFilters(): void {
    log.debug('Clearing all filters');

    const { advancedFilters, quickFilters, searchFilter } = this.state;
    if (
      quickFilters.size === 0 &&
      advancedFilters.size === 0 &&
      searchFilter === null
    ) {
      return;
    }

    // if there is an active quick filter input field, reset it as well
    this.clearGridInputField();

    this.startLoading('Clearing Filters...', true);
    this.setState({
      quickFilters: new Map(),
      advancedFilters: new Map(),
      searchValue: '',
      searchFilter: undefined,
    });
  }

  clearCrossColumSearch(): void {
    log.debug('Clearing cross-column search');

    this.setState({
      searchValue: '',
      searchFilter: undefined,
    });
  }

  clearGridInputField(): void {
    if (this.filterInputRef.current != null) {
      this.filterInputRef.current.setValue('');
    }
  }

  /**
   * Rebuilds all the current filters. Necessary if something like the time zone has changed.
   */
  rebuildFilters(): void {
    log.debug('Rebuilding filters');

    const { model } = this.props;
    const { advancedFilters, quickFilters } = this.state;
    const { columns, formatter } = model;

    const newAdvancedFilters = new Map();
    const newQuickFilters = new Map();

    advancedFilters.forEach((value, key) => {
      const { options } = value;
      const column = columns[key];
      const filter = this.tableUtils.makeAdvancedFilter(
        column,
        options,
        formatter.timeZone
      );
      newAdvancedFilters.set(key, {
        options,
        filter,
      });
    });

    quickFilters.forEach((value, key) => {
      const { text } = value;
      const column = columns[key];
      newQuickFilters.set(key, {
        text,
        filter: this.makeQuickFilter(column, text, formatter.timeZone),
      });
    });

    this.startLoading('Rebuilding filters...', true);
    this.setState({
      quickFilters: newQuickFilters,
      advancedFilters: newAdvancedFilters,
    });
  }

  setFilters({
    quickFilters,
    advancedFilters,
  }: Pick<IrisGridState, 'quickFilters' | 'advancedFilters'>): void {
    this.setState({
      quickFilters,
      advancedFilters,
    });
  }

  updateFormatterSettings(settings?: Settings, forceUpdate = true): void {
    const globalColumnFormats = FormatterUtils.getColumnFormats(settings);
    const dateTimeFormatterOptions =
      FormatterUtils.getDateTimeFormatterOptions(settings);

    const defaultDecimalFormatOptions =
      settings?.defaultDecimalFormatOptions ?? {};
    const defaultIntegerFormatOptions =
      settings?.defaultIntegerFormatOptions ?? {};
    const truncateNumbersWithPound =
      settings?.truncateNumbersWithPound ?? false;

    const isColumnFormatChanged = !deepEqual(
      this.globalColumnFormats,
      globalColumnFormats
    );
    const isDateFormattingChanged = !deepEqual(
      this.dateTimeFormatterOptions,
      dateTimeFormatterOptions
    );
    const isDecimalFormattingChanged = !deepEqual(
      this.decimalFormatOptions,
      settings?.defaultDecimalFormatOptions
    );
    const isIntegerFormattingChanged = !deepEqual(
      this.integerFormatOptions,
      defaultIntegerFormatOptions
    );
    const isTruncateNumbersChanged =
      this.truncateNumbersWithPound !== truncateNumbersWithPound;
    if (
      isColumnFormatChanged ||
      isDateFormattingChanged ||
      isDecimalFormattingChanged ||
      isIntegerFormattingChanged ||
      isTruncateNumbersChanged
    ) {
      this.globalColumnFormats = globalColumnFormats;
      this.dateTimeFormatterOptions = dateTimeFormatterOptions;
      this.decimalFormatOptions = defaultDecimalFormatOptions;
      this.integerFormatOptions = defaultIntegerFormatOptions;
      this.truncateNumbersWithPound = truncateNumbersWithPound;
      this.updateFormatter({}, forceUpdate);

      if (isDateFormattingChanged && forceUpdate) {
        this.rebuildFilters();
      }
    }
  }

  getAlwaysFetchColumns = memoize(
    (
      alwaysFetchColumns: readonly ColumnName[],
      columns: readonly Column[],
      movedColumns: readonly MoveOperation[],
      floatingLeftColumnCount: number,
      floatingRightColumnCount: number,
      draggingRange?: BoundedAxisRange
    ): readonly ColumnName[] => {
      const floatingColumns: ColumnName[] = [];

      for (let i = 0; i < floatingLeftColumnCount; i += 1) {
        floatingColumns.push(
          columns[GridUtils.getModelIndex(i, movedColumns)].name
        );
      }

      for (let i = 0; i < floatingRightColumnCount; i += 1) {
        floatingColumns.push(
          columns[GridUtils.getModelIndex(columns.length - 1 - i, movedColumns)]
            .name
        );
      }

      if (draggingRange) {
        for (let i = draggingRange[0]; i <= draggingRange[1]; i += 1) {
          floatingColumns.push(
            columns[GridUtils.getModelIndex(i, movedColumns)].name
          );
        }
      }

      const columnSet = new Set([...alwaysFetchColumns, ...floatingColumns]);

      return Object.freeze([...columnSet]);
    }
  );

  updateFormatter(
    updatedFormats: { customColumnFormatMap?: Map<ColumnName, FormattingRule> },
    forceUpdate = true
  ): void {
    const { customColumnFormatMap } = this.state;
    const { model } = this.props;
    const update = {
      customColumnFormatMap,
      ...updatedFormats,
    };
    const mergedColumnFormats = [
      ...(this.globalColumnFormats ?? []),
      ...update.customColumnFormatMap.values(),
    ];
    const formatter = new Formatter(
      model.dh,
      mergedColumnFormats,
      this.dateTimeFormatterOptions,
      this.decimalFormatOptions,
      this.integerFormatOptions,
      this.truncateNumbersWithPound
    );

    log.debug('updateFormatter', this.globalColumnFormats, mergedColumnFormats);

    this.setState({ ...update, formatter }, () => {
      if (forceUpdate && this.grid) {
        this.grid.forceUpdate();
      }
    });
  }

  initFormatter(): void {
    const { settings } = this.props;
    this.updateFormatterSettings(settings);
  }

  initState(): void {
    const {
      applyInputFiltersOnInit,
      inputFilters,
      sorts,
      model,
      reverseType,
      customColumns,
      searchValue,
      selectedSearchColumns,
      invertSearchColumns,
    } = this.props;

    const searchColumns = selectedSearchColumns ?? [];
    const searchFilter = CrossColumnSearch.createSearchFilter(
      model.dh,
      searchValue,
      searchColumns,
      model.columns,
      invertSearchColumns
    );

    if (applyInputFiltersOnInit) {
      // There may be more than one input filter on the same column with value === '' applied last
      // We don't want to skip it here, so only excluding the ones that were never applied (null)
      const inputFiltersWithValues = inputFilters.filter(
        inputFilter => inputFilter.value != null
      );
      this.applyInputFilters(inputFiltersWithValues);
    }

    this.setState({
      sorts,
      reverseType,
      customColumns,
      isReady: true,
      searchFilter,
    });
    this.initFormatter();
  }

  async loadPartitionsTable(partitionColumn: Column): Promise<void> {
    const { model } = this.props;
    this.setState({ isSelectingPartition: true });

    try {
      const partitionTable = await this.pending.add(
        model.valuesTable(partitionColumn),
        resolved => resolved.close()
      );

      const column = partitionTable.columns[0];
      const sort = column.sort().desc();
      partitionTable.applySort([sort]);
      partitionTable.setViewport(0, 0, [column]);

      const data = await this.pending.add(partitionTable.getViewportData());
      if (data.rows.length > 0) {
        const row = data.rows[0];
        const value = row.get(column);

        this.updatePartition(value, partitionColumn);

        this.setState({ isSelectingPartition: true });
      } else {
        log.info('Table does not have any data, just fetching all');
        this.setState({ isSelectingPartition: false });
        this.handlePartitionFetchAll();
      }
      this.setState({ partitionTable, partitionColumn }, () => {
        this.initState();
      });
    } catch (error) {
      this.handleTableLoadError(error);
    }
  }

  updatePartition(partition: string, partitionColumn: Column): void {
    if (TableUtils.isCharType(partitionColumn.type) && partition === '') {
      return;
    }

    const { model } = this.props;

    const partitionText = TableUtils.isCharType(partitionColumn.type)
      ? model.displayString(
          partition,
          partitionColumn.type,
          partitionColumn.name
        )
      : partition;
    const partitionFilter = this.tableUtils.makeQuickFilterFromComponent(
      partitionColumn,
      partitionText
    );
    if (partitionFilter === null) {
      return;
    }

    const partitionFilters = [partitionFilter];
    this.setState({
      partition,
      partitionFilters,
    });
  }

  copyCell(
    columnIndex: GridRangeIndex,
    rowIndex: GridRangeIndex,
    rawValue = false
  ): void {
    const { canCopy } = this.props;
    if (canCopy) {
      const value = String(
        this.getValueForCell(columnIndex, rowIndex, rawValue)
      );
      copyToClipboard(value).catch(e => log.error('Unable to copy cell', e));
    } else {
      log.error('Attempted to copyCell for user without copy permission.');
    }
  }

  /**
   * Copy the provided ranges to the clipboard
   * @paramranges The ranges to copy
   * @param includeHeaders Include the headers or not
   * @param formatValues Whether to format values or not
   * @param error Error message if one occurred
   */
  copyRanges(
    ranges: readonly GridRange[],
    includeHeaders = false,
    formatValues = true,
    error?: string
  ): void {
    const { model, canCopy } = this.props;
    const { metricCalculator, movedColumns } = this.state;
    const userColumnWidths = metricCalculator.getUserColumnWidths();

    if (canCopy) {
      const copyOperation = {
        ranges: GridRange.boundedRanges(
          ranges,
          model.columnCount,
          model.rowCount
        ),
        includeHeaders,
        formatValues,
        movedColumns,
        userColumnWidths,
        error,
      };

      this.setState({ copyOperation });
    } else {
      log.error('Attempted copyRanges for user without copy permission.');
    }
  }

  startLoading(loadingText: string, resetRanges = false): void {
    this.setState({ loadingText });

    const theme = this.getTheme();

    if (resetRanges && this.grid) {
      this.grid.clearSelectedRanges();
      this.grid.setViewState({ top: 0 }, true);
    }

    if (this.loadingScrimStartTime == null) {
      const { minScrimTransitionTime, maxScrimTransitionTime } = theme;
      assertNotNull(minScrimTransitionTime);
      assertNotNull(maxScrimTransitionTime);
      const height = this.gridWrapper?.getBoundingClientRect().height ?? 0;
      const scrimTransitionTime = Math.max(
        minScrimTransitionTime,
        Math.min(height / 2, maxScrimTransitionTime)
      );
      this.loadingScrimStartTime = Date.now();
      this.loadingScrimFinishTime =
        this.loadingScrimStartTime + scrimTransitionTime;
      this.setState({
        loadingScrimProgress: 0,
      });
      this.loadingTimer = setTimeout(() => {
        this.setState({
          loadingSpinnerShown: true,
        });
      }, IrisGrid.loadingSpinnerDelay);
    }
  }

  stopLoading(): void {
    this.loadingScrimStartTime = undefined;
    this.loadingScrimFinishTime = undefined;
    this.setState({
      loadingText: null,
      loadingScrimProgress: null,
      loadingSpinnerShown: false,
    });

    if (this.loadingTimer != null) {
      clearTimeout(this.loadingTimer);
      this.loadingTimer = undefined;
    }
  }

  /**
   * Rolls back the table state to the last known safe state, or if that's not available then clears all sorts/filters/custom columns.
   */
  rollback(): void {
    if (this.lastLoadedConfig) {
      log.debug('loading last loading config', this.lastLoadedConfig);
      const {
        advancedFilters,
        aggregationSettings,
        customColumns,
        quickFilters,
        reverseType,
        rollupConfig,
        searchFilter,
        selectDistinctColumns,
        sorts,
      } = this.lastLoadedConfig;

      this.lastLoadedConfig = null;
      this.setState({
        advancedFilters,
        aggregationSettings,
        customColumns,
        quickFilters,
        reverseType,
        rollupConfig,
        searchFilter,
        selectDistinctColumns,
        sorts,
      });
    } else {
      log.debug('remove all sorts, filters, and custom columns');
      this.setState({
        advancedFilters: new Map(),
        aggregationSettings: DEFAULT_AGGREGATION_SETTINGS,
        customColumns: [],
        quickFilters: new Map(),
        reverseType: TableUtils.REVERSE_TYPE.NONE,
        rollupConfig: undefined,
        selectDistinctColumns: [],
        sorts: [],
      });
    }
  }

  /**
   * Check if we can rollback the current state to a safe state.
   * @returns true if there's a previously known safe state or if some of the current state isn't empty.
   */
  canRollback(): boolean {
    return this.lastLoadedConfig != null || !isEmptyConfig(this.state);
  }

  startListening(model: IrisGridModel): void {
    model.addEventListener(IrisGridModel.EVENT.UPDATED, this.handleUpdate);
    model.addEventListener(
      IrisGridModel.EVENT.REQUEST_FAILED,
      this.handleRequestFailed
    );
    model.addEventListener(
      IrisGridModel.EVENT.COLUMNS_CHANGED,
      this.handleCustomColumnsChanged
    );
    model.addEventListener(
      IrisGridModel.EVENT.PENDING_DATA_UPDATED,
      this.handlePendingDataUpdated
    );
  }

  stopListening(model: IrisGridModel): void {
    model.removeEventListener(IrisGridModel.EVENT.UPDATED, this.handleUpdate);
    model.removeEventListener(
      IrisGridModel.EVENT.REQUEST_FAILED,
      this.handleRequestFailed
    );
    model.removeEventListener(
      IrisGridModel.EVENT.COLUMNS_CHANGED,
      this.handleCustomColumnsChanged
    );
    model.removeEventListener(
      IrisGridModel.EVENT.PENDING_DATA_UPDATED,
      this.handlePendingDataUpdated
    );
  }

  focus(): void {
    this.grid?.focus();
  }

  focusFilterBar(column: VisibleIndex): void {
    const { movedColumns } = this.state;
    const { model } = this.props;
    const { columnCount } = model;
    const modelColumn = GridUtils.getModelIndex(column, movedColumns);

    if (
      column == null ||
      column < 0 ||
      columnCount <= column ||
      !model.isFilterable(modelColumn)
    ) {
      this.setState({ focusedFilterBarColumn: null });
      return;
    }

    const { metricCalculator, metrics } = this.state;
    assertNotNull(metrics);
    const { left, rightVisible, lastLeft } = metrics;
    if (column < left) {
      this.grid?.setViewState({ left: column }, true);
    } else if (rightVisible < column) {
      const metricState = this.grid?.getMetricState();
      assertNotNull(metricState);
      const newLeft = metricCalculator.getLastLeft(
        metricState,
        column,
        metricCalculator.getVisibleWidth(metricState)
      );
      this.grid?.setViewState(
        { left: Math.min(newLeft, lastLeft), leftOffset: 0 },
        true
      );
    }
    this.lastFocusedFilterBarColumn = column;
    this.setState({ focusedFilterBarColumn: column, isFilterBarShown: true });
  }

  hideColumnByVisibleIndex(columnVisibleIndex: VisibleIndex): void {
    const { metricCalculator, movedColumns } = this.state;
    metricCalculator.setColumnWidth(
      GridUtils.getModelIndex(columnVisibleIndex, movedColumns),
      0
    );

    this.grid?.forceUpdate();
  }

  freezeColumnByColumnName(columnName: ColumnName): void {
    const { frozenColumns, movedColumns } = this.state;
    const { model } = this.props;
    log.debug2('freezing column', columnName);

    const allFrozenColumns =
      frozenColumns == null
        ? new Set(model.frozenColumns)
        : new Set(frozenColumns);

    allFrozenColumns.add(columnName);

    const modelIndex = model.getColumnIndexByName(columnName);
    assertNotNull(modelIndex);
    const visibleIndex = GridUtils.getVisibleIndex(modelIndex, movedColumns);
    const newMovedColumns = GridUtils.moveItem(
      visibleIndex,
      allFrozenColumns.size - 1,
      movedColumns
    );

    this.setState({
      frozenColumns: [...allFrozenColumns],
      movedColumns: newMovedColumns,
    });
  }

  unFreezeColumnByColumnName(columnName: ColumnName): void {
    const { frozenColumns, movedColumns } = this.state;
    const { model } = this.props;
    log.debug2('unfreezing column', columnName);

    const allFrozenColumns =
      frozenColumns == null
        ? new Set(model.frozenColumns)
        : new Set(frozenColumns);

    allFrozenColumns.delete(columnName);

    const modelIndex = model.getColumnIndexByName(columnName);
    assertNotNull(modelIndex);
    const visibleIndex = GridUtils.getVisibleIndex(modelIndex, movedColumns);

    // Move to after remaining frozen columns and front columns
    const newMovedColumns = GridUtils.moveItem(
      visibleIndex,
      allFrozenColumns.size + model.frontColumns.length,
      movedColumns
    );

    this.setState({
      frozenColumns: [...allFrozenColumns],
      movedColumns: newMovedColumns,
    });
  }

  handleColumnVisibilityChanged(
    modelIndexes: readonly ModelIndex[],
    isVisible: boolean
  ): void {
    const { metricCalculator, metrics } = this.state;
    assertNotNull(metrics);
    if (isVisible) {
      modelIndexes.forEach(modelIndex => {
        const defaultWidth =
          metricCalculator.initialColumnWidths.get(modelIndex);
        const calculatedWidth = getOrThrow(
          metrics.calculatedColumnWidths,
          modelIndex
        );

        if (defaultWidth !== calculatedWidth) {
          metricCalculator.setColumnWidth(modelIndex, calculatedWidth);
        } else {
          metricCalculator.resetColumnWidth(modelIndex);
        }
      });
    } else {
      modelIndexes.forEach(modelIndex => {
        metricCalculator.setColumnWidth(modelIndex, 0);
      });
    }
    this.grid?.forceUpdate();
  }

  handleColumnVisibilityReset(): void {
    const { metricCalculator, metrics } = this.state;
    const { model } = this.props;
    assertNotNull(metrics);
    for (let i = 0; i < metrics.columnCount; i += 1) {
      metricCalculator.resetColumnWidth(i);
    }
    this.handleMovedColumnsChanged(model.initialMovedColumns);
    this.handleHeaderGroupsChanged(model.initialColumnHeaderGroups);
    this.setState({
      frozenColumns: model.layoutHints?.frozenColumns ?? [],
    });
  }

  handleCrossColumnSearch(
    searchValue: string,
    selectedSearchColumns: readonly ColumnName[],
    invertSearchColumns: boolean
  ): void {
    const { model } = this.props;
    this.startLoading('Searching...');

    this.updateSearchFilter(
      searchValue,
      selectedSearchColumns,
      model.columns,
      invertSearchColumns
    );

    this.setState({
      searchValue,
      selectedSearchColumns,
      invertSearchColumns,
    });
  }

  updateSearchFilter = debounce(
    (
      searchValue: string,
      selectedSearchColumns: readonly ColumnName[],
      columns: readonly Column[],
      invertSearchColumns: boolean
    ): void => {
      const { model } = this.props;
      const searchFilter = CrossColumnSearch.createSearchFilter(
        model.dh,
        searchValue,
        selectedSearchColumns,
        columns,
        invertSearchColumns
      );
      this.setState({ searchFilter });
    },
    SET_FILTER_DEBOUNCE
  );

  handleAnimationLoop(): void {
    this.grid?.updateCanvas();

    if (this.isAnimating) {
      this.animationFrame = requestAnimationFrame(this.handleAnimationLoop);
    }
  }

  handleAnimationStart(): void {
    log.debug2('handleAnimationStart');

    this.isAnimating = true;

    this.animationFrame = requestAnimationFrame(this.handleAnimationLoop);
  }

  handleAnimationEnd(): void {
    log.debug2('handleAnimationEnd');

    this.isAnimating = false;
  }

  handlePartitionAppend(value: string): void {
    const { onPartitionAppend } = this.props;
    const { partitionColumn } = this.state;
    if (partitionColumn == null) {
      return;
    }
    onPartitionAppend?.(partitionColumn, value);
  }

  handlePartitionChange(partition: string): void {
    const { partitionColumn } = this.state;
    if (partitionColumn == null) {
      return;
    }
    this.updatePartition(partition, partitionColumn);
  }

  handlePartitionFetchAll(): void {
    this.setState({
      partitionFilters: [],
      isSelectingPartition: false,
    });
  }

  handlePartitionDone(): void {
    this.setState({ isSelectingPartition: false });
  }

  handleTableLoadError(error: unknown): void {
    if (PromiseUtils.isCanceled(error)) {
      return;
    }

    log.error(error);

    const { onError } = this.props;
    onError(error);
  }

  showAllColumns(): void {
    const { metricCalculator } = this.state;
    const userColumnWidths = metricCalculator.getUserColumnWidths();
    const entries = [...userColumnWidths.entries()];
    for (let i = 0; i < entries.length; i += 1) {
      const [modelIndex, columnWidth] = entries[i];
      if (columnWidth === 0) {
        metricCalculator.resetColumnWidth(modelIndex);
      }
    }
    this.grid?.forceUpdate();
  }

  toggleSort(columnIndex: VisibleIndex, addToExisting: boolean): void {
    log.info('Toggling sort for column', columnIndex);

    const { model } = this.props;
    const modelColumn = this.getModelColumn(columnIndex);
    assertNotNull(modelColumn);
    if (model.isColumnSortable(columnIndex)) {
      const { sorts: currentSorts } = this.state;
      const sorts = TableUtils.toggleSortForColumn(
        currentSorts,
        model.columns,
        modelColumn,
        addToExisting
      );

      this.updateSorts(sorts);
    } else {
      log.debug('Column type was not sortable', model.columns[columnIndex]);
    }
  }

  updateSorts(sorts: readonly Sort[]): void {
    this.startLoading('Sorting...');
    this.setState({ sorts });
    this.grid?.forceUpdate();
  }

  sortColumn(
    modelColumn: ModelIndex,
    direction: SortDirection = TableUtils.sortDirection.none,
    isAbs = false,
    addToExisting = false
  ): void {
    assertNotNull(modelColumn);
    const { model } = this.props;
    const sorts = TableUtils.sortColumn(
      model.sort,
      model.columns,
      modelColumn,
      direction,
      isAbs,
      addToExisting
    );
    this.startLoading('Sorting...');
    this.setState({ sorts });
    this.grid?.forceUpdate();
  }

  reverse(reverseType: ReverseType): void {
    this.startLoading('Reversing...');
    this.setState({ reverseType });
    this.grid?.forceUpdate();
  }

  isReversible(): boolean {
    const { model } = this.props;
    return model.isReversible;
  }

  toggleFilterBar(focusIndex = this.lastFocusedFilterBarColumn): void {
    let { isFilterBarShown } = this.state;
    isFilterBarShown = !isFilterBarShown;
    this.setState({ isFilterBarShown });

    if (isFilterBarShown) {
      if (focusIndex != null) {
        this.focusFilterBar(focusIndex);
      } else {
        let columnIndex = 0;
        const { model } = this.props;
        const { columnCount } = model;
        for (let i = 0; i < columnCount; i += 1) {
          const modelColumn = this.getModelColumn(i);
          if (modelColumn != null) {
            const column = model.columns[modelColumn];
            if (column != null && TableUtils.isTextType(column.type)) {
              columnIndex = i;
              break;
            }
          }
        }
        this.focusFilterBar(columnIndex);
      }
    } else {
      this.grid?.focus();
    }
  }

  isTableSearchAvailable(): boolean {
    const { model, canToggleSearch } = this.props;
    const { dh } = model;
    const searchDisplayMode = model?.layoutHints?.searchDisplayMode;

    if (searchDisplayMode === dh.SearchDisplayMode?.SEARCH_DISPLAY_HIDE) {
      return false;
    }
    if (searchDisplayMode === dh.SearchDisplayMode?.SEARCH_DISPLAY_SHOW) {
      return true;
    }

    return canToggleSearch;
  }

  toggleSearchBar(): void {
    const { showSearchBar } = this.state;
    if (!this.isTableSearchAvailable()) {
      return;
    }

    const update = !showSearchBar;
    this.setState(
      {
        showSearchBar: update,
      },
      () => {
        if (update && this.crossColumnRef?.current) {
          this.crossColumnRef?.current.focus();
        } else {
          this.grid?.focus();
        }
      }
    );
  }

  toggleGotoRow(row = '', value = '', columnName = ''): void {
    const { isGotoShown } = this.state;
    if (row || value) {
      // if invoked with a row, keep open instead of toggle
      this.setState({
        isGotoShown: true,
        gotoValue: value,
        gotoValueSelectedColumnName: columnName,
        gotoRowError: '',
        gotoValueError: '',
      });
      this.focusRowInGrid(row);
      this.gotoRowRef.current?.focus();
      return;
    }

    const cursorRow = this.grid?.state.cursorRow;
    const cursorColumn = this.grid?.state.cursorColumn;

    if (cursorRow == null || cursorColumn == null) {
      // if a cell is not selected / grid is not rendered
      this.setState({
        isGotoShown: !isGotoShown,
        gotoRow: '',
        gotoValue: '',
        gotoRowError: '',
        gotoValueError: '',
      });
      return;
    }
    // if a row is selected
    const { model } = this.props;
    const { name, type } = model.columns[cursorColumn];

    const cellValue = model.valueForCell(cursorColumn, cursorRow);
    const text = IrisGridUtils.convertValueToText(cellValue, type);
    this.setState({
      isGotoShown: !isGotoShown,
      gotoRow: `${cursorRow + 1}`,
      gotoValue: text,
      gotoValueSelectedColumnName: name,
      gotoRowError: '',
      gotoValueError: '',
    });
  }

  async commitPending(): Promise<void> {
    const { model } = this.props;
    if (!isEditableGridModel(model) || !model.isEditable) {
      throw new Error('Cannot save, table is not editable');
    }

    const { pendingSavePromise } = this.state;
    if (pendingSavePromise != null) {
      throw new Error('Save already in progress');
    }

    const containsGridCellInputField =
      document?.activeElement?.classList.contains('grid-cell-input-field');
    if (containsGridCellInputField != null && containsGridCellInputField) {
      if (
        document.activeElement != null &&
        document.activeElement.classList.contains('error')
      ) {
        throw new ValidationError('Current input is invalid');
      }

      // Focus the grid again to commit any pending input changes
      this.grid?.focus();
    }

    const newPendingSavePromise = this.pending
      .add(model.commitPending())
      .then(() => {
        this.setState({ pendingSaveError: null, pendingSavePromise: null });
      })
      .catch(err => {
        if (!PromiseUtils.isCanceled(err)) {
          this.setState({ pendingSaveError: err, pendingSavePromise: null });
        }
      });
    this.setState({ pendingSavePromise: newPendingSavePromise });
    return newPendingSavePromise;
  }

  async discardPending(): Promise<void> {
    const { pendingSavePromise } = this.state;
    if (pendingSavePromise != null) {
      throw new Error('Cannot cancel a save in progress');
    }

    this.setState({
      pendingSavePromise: null,
      pendingSaveError: null,
      pendingDataMap: new Map(),
      pendingDataErrors: new Map(),
    });
  }

  /**
   * Select the passed in column and notify listener
   * @param column The column in this table to link
   */
  selectColumn(column: Column): void {
    const { onColumnSelected } = this.props;
    onColumnSelected(column);
  }

  /**
   * Select all the data for a given row and notify listener
   */
  selectData(columnIndex: ModelIndex, rowIndex: ModelIndex): void {
    const { model } = this.props;
    const { columns, groupedColumns } = model;
    const dataMap: RowDataMap = {};
    for (let i = 0; i < columns.length; i += 1) {
      const column = columns[i];
      const { name, type } = column;
      const value = model.valueForCell(i, rowIndex);
      const text = model.textForCell(i, rowIndex);
      const visibleIndex = this.getVisibleColumn(i);
      const isExpandable =
        isExpandableGridModel(model) && model.isRowExpandable(rowIndex);
      const isGrouped = groupedColumns.find(c => c.name === name) != null;
      dataMap[name] = {
        value,
        text,
        type,
        isGrouped,
        isExpandable,
        visibleIndex,
      };
    }
    const { onDataSelected } = this.props;
    onDataSelected(rowIndex, dataMap);
  }

  handleAdvancedFilterChange(
    column: Column,
    filter: FilterCondition | null,
    options: AdvancedFilterOptions
  ): void {
    const { model } = this.props;
    const index = model.getColumnIndexByName(column.name);
    assertNotNull(index);
    this.setAdvancedFilter(index, filter, options);
  }

  handleAdvancedFilterSortChange(
    column: Column,
    direction: SortDirection,
    addToExisting = false
  ): void {
    const { model } = this.props;
    const columnIndex = model.getColumnIndexByName(column.name);
    assertNotNull(columnIndex);
    const columnName = model.columns[columnIndex].name;
    const oldSort = TableUtils.getSortForColumn(model.sort, columnName);
    let newSort = null;

    if (oldSort == null || oldSort.direction !== direction) {
      if (direction === TableUtils.sortDirection.descending) {
        newSort = column.sort().desc();
      } else {
        newSort = column.sort().asc();
      }
    }

    const sorts = TableUtils.setSortForColumn(
      model.sort,
      columnName,
      newSort,
      addToExisting
    );
    log.info('Setting table sorts', sorts);

    this.startLoading('Sorting...');
    this.setState({ sorts });

    this.grid?.forceUpdate();
  }

  handleAdvancedFilterDone(): void {
    this.grid?.focus();
  }

  handleAdvancedMenuOpened(column: GridRangeIndex): void {
    this.setState({ shownAdvancedFilter: column });
  }

  handleGotoRowOpened(): void {
    this.setState({ isGotoShown: true });
  }

  handleGotoRowClosed(): void {
    this.setState({ isGotoShown: false });
  }

  handleAdvancedMenuClosed(columnIndex: number): void {
    const { focusedFilterBarColumn, isFilterBarShown } = this.state;
    if (
      isFilterBarShown &&
      focusedFilterBarColumn === columnIndex &&
      this.filterInputRef?.current !== null
    ) {
      this.filterInputRef?.current.focus();
      this.setState({ shownAdvancedFilter: null });
    } else {
      this.setState({
        focusedFilterBarColumn: null,
        shownAdvancedFilter: null,
      });
    }
  }

  handleCancel(): void {
    this.rollback();
  }

  // eslint-disable-next-line class-methods-use-this
  handleChartChange(): void {
    // TODO: IDS-4242 Update Chart Preview
  }

  handleChartCreate(settings: ChartBuilderSettings): void {
    const { model, onCreateChart } = this.props;
    onCreateChart(settings, model);
  }

  handleGridError(error?: Error): void {
    log.warn('Grid Error', error);
    this.setState({
      toastMessage: <div className="error-message">{`${error}`}</div>,
    });
  }

  handleFilterBarChange(value: string): void {
    this.startLoading('Filtering...', true);

    this.setState(({ focusedFilterBarColumn, quickFilters }) => {
      const newQuickFilters = new Map(quickFilters);
      if (focusedFilterBarColumn != null) {
        const modelIndex = this.getModelColumn(focusedFilterBarColumn);
        assertNotNull(modelIndex);
        this.applyQuickFilter(modelIndex, value, newQuickFilters);
      }
      return { quickFilters: newQuickFilters };
    });
  }

  handleFilterBarDone(setGridFocus = true, defocusInput = true): void {
    if (setGridFocus) {
      this.grid?.focus();
    }
    if (defocusInput) {
      this.setState({ focusedFilterBarColumn: null });
    }
  }

  handleFilterBarTab(backward: boolean): void {
    const { focusedFilterBarColumn } = this.state;
    assertNotNull(focusedFilterBarColumn);
    if (backward) {
      this.focusFilterBar(focusedFilterBarColumn - 1);
    } else {
      this.focusFilterBar(focusedFilterBarColumn + 1);
    }
  }

  handleFormatSelection(
    modelIndex: ModelIndex,
    selectedFormat: TableColumnFormat | null
  ): void {
    const { model } = this.props;
    const column = model.columns[modelIndex];
    const { customColumnFormatMap: prevCustomColumnFormatMap } = this.state;
    const customColumnFormatMap = new Map(prevCustomColumnFormatMap);

    if (selectedFormat != null) {
      const normalizedType = TableUtils.getNormalizedType(column.type);
      assertNotNull(normalizedType);
      const columnFormattingRule = Formatter.makeColumnFormattingRule(
        normalizedType,
        column.name,
        selectedFormat
      );

      customColumnFormatMap.set(column.name, columnFormattingRule);
    } else {
      customColumnFormatMap.delete(column.name);
    }

    this.updateFormatter({ customColumnFormatMap });
  }

  handleMenu(e: React.MouseEvent<HTMLButtonElement>): void {
    e.stopPropagation();
    this.setState({ isMenuShown: true });
  }

  handleMenuClose(): void {
    this.setState({ isMenuShown: false, openOptions: [] });
  }

  handleMenuBack(): void {
    this.setState(({ openOptions }) => {
      const newOptions = [...openOptions];
      newOptions.pop();
      return { openOptions: newOptions };
    });
  }

  handleMenuSelect(option: OptionItem): void {
    this.setState(({ openOptions }) => ({
      openOptions: [...openOptions, option],
    }));
  }

  handleRequestFailed(event: Event): void {
    const customEvent = event as CustomEvent;
    log.error('request failed:', customEvent.detail);
    this.stopLoading();
    if (this.canRollback()) {
      this.startLoading('Rolling back changes...', true);
      this.rollback();
    } else {
      log.error('Table failed and unable to rollback');
      const { onError } = this.props;
      onError(new Error(`Error displaying table: ${customEvent.detail}`));
    }
  }

  handleUpdate(): void {
    log.debug2('Received model update');

    const {
      advancedFilters,
      aggregationSettings,
      customColumns,
      quickFilters,
      reverseType,
      rollupConfig,
      searchFilter,
      selectDistinctColumns,
      sorts,
    } = this.state;

    const config = {
      advancedFilters,
      aggregationSettings,
      customColumns,
      quickFilters,
      reverseType,
      rollupConfig,
      searchFilter,
      selectDistinctColumns,
      sorts,
    };

    if (!isEmptyConfig(config)) {
      this.lastLoadedConfig = config;
    } else {
      this.lastLoadedConfig = null;
    }

    this.grid?.forceUpdate();
    this.stopLoading();
  }

  handleViewChanged(metrics?: GridMetrics): void {
    const { model } = this.props;
    const { selectionEndRow = 0 } = this.grid?.state ?? {};
    let pendingRowCount = 0;
    if (isEditableGridModel(model) && model.isEditable) {
      assertNotNull(metrics);
      const { bottomViewport } = metrics;

      // We have an editable table that we can add new rows to
      // Display empty rows beneath the table rows that user can fill in
      const bottomNonFloating = model.rowCount - model.floatingBottomRowCount;
      if (selectionEndRow === bottomNonFloating - 1) {
        // Selection is in the last row, add another blank row
        pendingRowCount = model.pendingRowCount + 1;
      } else if (selectionEndRow === bottomNonFloating - 2) {
        // We may have just added a row based on selection moving, so just leave it as is
        pendingRowCount = model.pendingRowCount;
      } else {
        // Otherwise fill up the viewport with empty cells
        pendingRowCount = Math.max(
          0,
          bottomViewport -
            (model.rowCount - model.pendingRowCount) -
            model.floatingTopRowCount -
            model.floatingBottomRowCount -
            1
        );
      }
    }

    this.setState({ metrics, pendingRowCount });
  }

  handleSelectionChanged(selectedRanges?: readonly GridRange[]): void {
    assertNotNull(selectedRanges);
    const { onSelectionChanged } = this.props;
    const { copyOperation } = this.state;
    this.setState({ selectedRanges });
    if (copyOperation != null) {
      this.setState({ copyOperation: null });
    }
    if (this.grid?.state.cursorRow != null) {
      this.setState({ gotoRow: `${this.grid.state.cursorRow + 1}` });
    }
    onSelectionChanged(selectedRanges);
  }

  handleMovedColumnsChanged(
    movedColumns: readonly MoveOperation[],
    onChangeApplied?: () => void
  ): void {
    this.setState({ movedColumns }, onChangeApplied);
  }

  handleHeaderGroupsChanged(columnHeaderGroups: readonly ColumnGroup[]): void {
    const { model } = this.props;
    this.setState(
      {
        columnHeaderGroups: IrisGridUtils.parseColumnHeaderGroups(
          model,
          columnHeaderGroups
        ).groups,
      },
      () => this.grid?.forceUpdate()
    );
  }

  handleTooltipRef(tooltip: Tooltip): void {
    // Need to start the timer right away, since we're creating the tooltip when we want the timer to start
    if (tooltip != null) {
      tooltip.startTimer();
    }

    this.tooltip = tooltip;
  }

  handleConditionalFormatsChange(
    conditionalFormats: readonly SidebarFormattingRule[]
  ): void {
    log.debug('Updated conditional formats', conditionalFormats);
    this.setState({ conditionalFormats });
  }

  handleConditionalFormatCreate(): void {
    log.debug('Create new conditional format');
    const { openOptions, conditionalFormats } = this.state;
    this.setState({
      openOptions: [
        ...openOptions,
        {
          type: OptionType.CONDITIONAL_FORMATTING_EDIT,
          title: `Create Formatting Rule`,
        },
      ],
      conditionalFormatEditIndex: conditionalFormats.length,
      // Start with a blank rule
      conditionalFormatPreview: undefined,
    });
  }

  handleConditionalFormatEdit(index: number): void {
    log.debug('Edit conditional format', index);
    const { openOptions, conditionalFormats } = this.state;
    this.setState({
      openOptions: [
        ...openOptions,
        {
          type: OptionType.CONDITIONAL_FORMATTING_EDIT,
          title: `Edit Formatting Rule`,
        },
      ],
      conditionalFormatEditIndex: index,
      // Clone rule to preview temporary changes
      conditionalFormatPreview: { ...conditionalFormats[index] },
    });
  }

  // Apply live changes
  handleConditionalFormatEditorUpdate = debounce(
    (conditionalFormatPreview?: SidebarFormattingRule): void => {
      this.setState({ conditionalFormatPreview });
    },
    SET_CONDITIONAL_FORMAT_DEBOUNCE
  );

  handleConditionalFormatEditorSave(config: SidebarFormattingRule): void {
    log.debug('Save conditional format changes', config);
    this.setState(
      state => {
        if (state.conditionalFormatEditIndex === null) {
          log.debug('Invalid format index');
          return null;
        }
        const conditionalFormats = [...state.conditionalFormats];
        conditionalFormats[state.conditionalFormatEditIndex] = config;
        return { conditionalFormats };
      },
      () => {
        this.handleMenuBack();
      }
    );
  }

  handleConditionalFormatEditorCancel(): void {
    this.handleMenuBack();
    // Not resetting conditionalFormatPreview here
    // to prevent editor fields change during the menu transition
    this.setState({ conditionalFormatEditIndex: null });
  }

  handleUpdateCustomColumns(customColumns: readonly string[]): void {
    log.info(`handleUpdateCustomColumns:`, customColumns);

    const { model } = this.props;
    const {
      movedColumns,
      sorts,
      quickFilters,
      advancedFilters,
      selectDistinctColumns,
    } = this.state;

    const { columns } = model;
    const oldCustomColumns = model.customColumns.map(
      customColumn => `${customColumn}`
    );

    const removedColumnNames = IrisGridUtils.getRemovedCustomColumnNames(
      oldCustomColumns,
      customColumns
    );
    if (removedColumnNames.length > 0) {
      const newSorts = IrisGridUtils.removeSortsInColumns(
        sorts,
        removedColumnNames
      );
      const newQuickFilters = IrisGridUtils.removeFiltersInColumns(
        columns,
        quickFilters,
        removedColumnNames
      );
      const newAdvancedFilters = IrisGridUtils.removeFiltersInColumns(
        columns,
        advancedFilters,
        removedColumnNames
      );
      const newMovedColumns = IrisGridUtils.removeColumnFromMovedColumns(
        columns,
        movedColumns,
        removedColumnNames
      );
      const newSelectDistinctColumns =
        IrisGridUtils.removeColumnsFromSelectDistinctColumns(
          selectDistinctColumns,
          removedColumnNames
        );
      if (newSorts.length !== sorts.length) {
        log.debug('removing sorts from removed custom columns...');
        this.setState({ sorts: newSorts });
      }
      if (
        newQuickFilters.size !== quickFilters.size ||
        newAdvancedFilters.size !== advancedFilters.size
      ) {
        log.debug(`removing filters from removed custom columns...`);
        this.setState({
          quickFilters: newQuickFilters,
          advancedFilters: newAdvancedFilters,
        });
      }
      if (!deepEqual(movedColumns, newMovedColumns)) {
        log.debug(
          `change moved columns for removed custom columns`,
          newMovedColumns
        );
        this.setState({ movedColumns: newMovedColumns });
      }
      if (!deepEqual(selectDistinctColumns, newSelectDistinctColumns)) {
        log.debug(
          `change selectDistinct columns for removed custom columns`,
          newMovedColumns
        );
        this.setState({ selectDistinctColumns: newSelectDistinctColumns });
      }
    }

    this.setState({ customColumns });
    if (customColumns.length > 0) {
      // If there are no custom columns, the change handler never fires
      // This causes the loader to stay until canceled by the user
      this.startLoading('Applying custom columns...');
    }
  }

  handleCustomColumnsChanged(): void {
    log.debug('custom columns changed');
    const { isReady } = this.state;
    if (isReady) {
      this.stopLoading();
      this.grid?.forceUpdate();
    } else {
      this.initState();
    }
  }

  handlePendingCommitClicked(): Promise<void> {
    return this.commitPending();
  }

  handlePendingDiscardClicked(): Promise<void> {
    return this.discardPending();
  }

  handlePendingDataUpdated(): void {
    log.debug('pending data updated');
    const { model } = this.props;
    const { pendingDataMap, pendingDataErrors } = model;
    this.setState({
      pendingDataMap,
      pendingDataErrors,
      pendingSaveError: null,
    });
    this.grid?.forceUpdate();
  }

  /**
   * User added, removed, or changed the order of aggregations, or position
   * @param aggregationSettings The new aggregation settings
   */
  handleAggregationsChange(aggregationSettings: AggregationSettings): void {
    log.debug('handleAggregationsChange', aggregationSettings);

    this.startLoading(
      `Aggregating ${aggregationSettings.aggregations
        .map(a => a.operation)
        .join(', ')}...`
    );
    this.setState({ aggregationSettings });
  }

  /**
   * A specific aggregation has been modified
   * @param aggregation The new aggregation
   */
  handleAggregationChange(aggregation: Aggregation): void {
    log.debug('handleAggregationChange', aggregation);

    this.startLoading(`Aggregating ${aggregation.operation}...`);
    this.setState(({ aggregationSettings }) => ({
      selectedAggregation: aggregation,
      aggregationSettings: {
        ...aggregationSettings,
        aggregations: aggregationSettings.aggregations.map(a =>
          a.operation === aggregation.operation ? aggregation : a
        ),
      },
    }));
  }

  /**
   * An aggregations has been selected for editing
   * @param aggregation The aggregation to edit
   */
  handleAggregationEdit(aggregation: Aggregation): void {
    log.debug('handleAggregationEdit', aggregation);

    const { openOptions } = this.state;

    this.setState({
      openOptions: [
        ...openOptions,
        {
          type: OptionType.AGGREGATION_EDIT,
          title: `Edit Columns to ${aggregation.operation}`,
        },
      ],
      selectedAggregation: aggregation,
    });
  }

  // Rename to handleDataBarColumnChange
  handleDataBarRangeChange(column: string): void {
    log.info('Data Bar range change', column);

    const aggregations: Aggregation[] = [
      {
        invert: false,
        operation: 'Max',
        selected: [column],
      } as Aggregation,
      {
        invert: false,
        operation: 'Min',
        selected: [column],
      } as Aggregation,
    ];

    const aggregationSettings: AggregationSettings = {
      aggregations,
      showOnTop: false,
    };

    this.setState({ aggregationSettings });
  }

  handleRollupChange(rollupConfig: UIRollupConfig): void {
    log.info('Rollup change', rollupConfig);

    this.resetGridViewState();
    this.showAllColumns();
    this.clearAllFilters();

    this.startLoading(
      `Grouping by columns ${rollupConfig?.columns?.join(', ') ?? ''}...`
    );

    // Have to clear select distinct since rollup uses the original columns, not the current ones.
    // IrisGridProxyModel has a check to prevent model update
    // when selectDistinctModel is cleared and the rollupConfig is set on the model.
    this.setState({
      rollupConfig,
      movedColumns: [],
      frozenColumns: [],
      sorts: [],
      reverseType: TableUtils.REVERSE_TYPE.NONE,
      selectDistinctColumns: [],
    });
  }

  handleSelectDistinctChanged(columnNames: readonly ColumnName[]): void {
    log.debug('SelectDistinct change', columnNames);

    this.resetGridViewState();

    this.showAllColumns();
    this.clearAllFilters();

    this.startLoading(
      `Selecting distinct values in ${
        columnNames.length > 0 ? columnNames.join(', ') : ''
      }...`
    );

    this.setState({
      selectDistinctColumns: columnNames,
      movedColumns: [],
      sorts: [],
      reverseType: TableUtils.REVERSE_TYPE.NONE,
    });
  }

  handleDownloadTableStart(): void {
    const { canDownloadCsv } = this.props;
    if (canDownloadCsv) {
      this.setState({
        isTableDownloading: true,
        tableDownloadProgress: 0,
        tableDownloadEstimatedTime: null,
        tableDownloadStatus: TableCsvExporter.DOWNLOAD_STATUS.INITIATING,
      });
    } else {
      log.error(
        'Attempted to handleDownloadTableStart for user without download CSV permission.'
      );
    }
  }

  handleDownloadTable(
    fileName: string,
    frozenTable: Table,
    tableSubscription: TableViewportSubscription,
    snapshotRanges: readonly GridRange[],
    modelRanges: readonly GridRange[],
    includeColumnHeaders: boolean,
    useUnformattedValues: boolean
  ): void {
    const { canDownloadCsv } = this.props;
    if (canDownloadCsv) {
      log.info(
        'start table downloading',
        fileName,
        frozenTable,
        tableSubscription,
        snapshotRanges,
        modelRanges,
        includeColumnHeaders,
        useUnformattedValues
      );
      this.setState(() => {
        if (this.tableSaver) {
          this.tableSaver.startDownload(
            fileName,
            frozenTable,
            tableSubscription,
            snapshotRanges,
            modelRanges,
            includeColumnHeaders,
            useUnformattedValues
          );
        }
        return {
          tableDownloadStatus: TableCsvExporter.DOWNLOAD_STATUS.DOWNLOADING,
        };
      });
    } else {
      log.error(
        'Attempted to handleDownloadTable for user without download CSV permission.'
      );
    }
  }

  async seekRow(inputString: string, isBackwards = false): Promise<void> {
    const {
      gotoValueSelectedColumnName: selectedColumnName,
      gotoValueSelectedFilter,
    } = this.state;
    const { model } = this.props;
    const { dh } = model;
    if (!model.isSeekRowAvailable) {
      return;
    }

    if (inputString === '') {
      return;
    }
    const selectedColumn = IrisGridUtils.getColumnByName(
      model.columns,
      selectedColumnName
    );

    if (selectedColumn === undefined) {
      return;
    }

    let searchFromRow = this.grid?.state.cursorRow;

    if (searchFromRow == null) {
      searchFromRow = 0;
    }

    const isContains =
      gotoValueSelectedFilter === FilterType.contains ||
      gotoValueSelectedFilter === FilterType.containsIgnoreCase;
    const isIgnoreCase =
      gotoValueSelectedFilter === FilterType.eqIgnoreCase ||
      gotoValueSelectedFilter === FilterType.containsIgnoreCase;

    try {
      const { formatter } = model;
      const columnDataType = TableUtils.getNormalizedType(selectedColumn.type);

      let rowIndex;

      switch (columnDataType) {
        case TableUtils.dataType.CHAR:
        case TableUtils.dataType.STRING: {
          rowIndex = await model.seekRow(
            searchFromRow,
            selectedColumn,
            dh.ValueType.STRING,
            inputString,
            isIgnoreCase,
            isContains,
            isBackwards ?? false
          );
          break;
        }
        case TableUtils.dataType.DATETIME: {
          const [startDate] = DateUtils.parseDateRange(
            dh,
            inputString,
            formatter.timeZone
          );
          rowIndex = await model.seekRow(
            searchFromRow,
            selectedColumn,
            dh.ValueType.DATETIME,
            startDate,
            undefined,
            undefined,
            isBackwards ?? false
          );
          break;
        }
        case TableUtils.dataType.DECIMAL:
        case TableUtils.dataType.INT: {
          if (
            !TableUtils.isBigDecimalType(selectedColumn.type) &&
            !TableUtils.isBigIntegerType(selectedColumn.type)
          ) {
            let inputValue = parseInt(inputString, 10);
            if (inputString === '-Infinity') {
              inputValue = Number.NEGATIVE_INFINITY;
            } else if (inputString === 'Infinity') {
              inputValue = Number.POSITIVE_INFINITY;
            }

            rowIndex = await model.seekRow(
              searchFromRow,
              selectedColumn,
              dh.ValueType.NUMBER,
              inputValue,
              undefined,
              undefined,
              isBackwards ?? false
            );
          } else {
            rowIndex = await model.seekRow(
              searchFromRow,
              selectedColumn,
              dh.ValueType.STRING,
              inputString,
              undefined,
              undefined,
              isBackwards ?? false
            );
          }
          break;
        }
        default: {
          rowIndex = await model.seekRow(
            searchFromRow,
            selectedColumn,
            dh.ValueType.STRING,
            this.tableUtils.makeValue(
              selectedColumn.type,
              inputString,
              formatter.timeZone
            ),
            undefined,
            undefined,
            isBackwards ?? false
          );
        }
      }

      this.grid?.setFocusRow(rowIndex);
      this.setState({ gotoValueError: '' });
    } catch (e: unknown) {
      this.setState({ gotoValueError: 'invalid input' });
    }
  }

  handleCancelDownloadTable(): void {
    this.tableSaver?.cancelDownload();
    this.setState({ isTableDownloading: false });
  }

  handleDownloadProgressUpdate = throttle(
    (
      tableDownloadProgress: number,
      tableDownloadEstimatedTime: number | null
    ) => {
      const { tableDownloadStatus } = this.state;
      if (
        tableDownloadStatus === TableCsvExporter.DOWNLOAD_STATUS.DOWNLOADING
      ) {
        this.setState({
          tableDownloadProgress,
          tableDownloadEstimatedTime,
        });
      }
    },
    UPDATE_DOWNLOAD_THROTTLE
  );

  handleDownloadCompleted(): void {
    this.setState({
      isTableDownloading: false,
      tableDownloadProgress: 100,
      tableDownloadStatus: TableCsvExporter.DOWNLOAD_STATUS.FINISHED,
    });
  }

  handleDownloadCanceled(): void {
    this.setState({
      isTableDownloading: false,
      tableDownloadProgress: 0,
      tableDownloadStatus: TableCsvExporter.DOWNLOAD_STATUS.CANCELED,
    });
  }

  /**
   * Delete the specified ranges from the table.
   * @param ranges The ranges to delete
   */
  deleteRanges(ranges: readonly GridRange[]): void {
    const { model } = this.props;
    this.pending.add(model.delete(ranges)).catch(e => {
      if (!PromiseUtils.isCanceled(e)) {
        log.error('Unable to delete ranges', ranges, e);
      }
    });
  }

  resetColumnSelection(): void {
    if (this.grid == null) {
      return;
    }
    const { isSelectingColumn } = this.props;
    if (isSelectingColumn) {
      const { columnAllowedCursor } = this.props;
      this.grid.setState({ cursor: columnAllowedCursor });
    } else {
      this.grid.setState({ cursor: null });
      this.setState({ hoverSelectColumn: null });
    }
  }

  resetGridViewState(forceUpdate = true): void {
    if (!this.grid) {
      return;
    }

    this.grid.clearSelectedRanges();
    this.grid.setViewState(
      { left: 0, top: 0, topOffset: 0, leftOffset: 0 },
      forceUpdate
    );
  }

  sendStateChange(): void {
    if (!this.grid) {
      return;
    }
    const { state: irisGridState } = this;
    const { state: gridState } = this.grid;
    const { onStateChange } = this.props;

    onStateChange(irisGridState, gridState);
  }

  handleOverflowClose(): void {
    this.setState({
      showOverflowModal: false,
    });
  }

  getColumnBoundingRect(): DOMRect {
    const { metrics, shownColumnTooltip } = this.state;
    assertNotNull(metrics);
    assertNotNull(shownColumnTooltip);
    const gridRect = this.gridWrapper?.getBoundingClientRect();
    const popperMargin = 20;
    assertNotNull(gridRect);
    const {
      columnHeaderHeight,
      allColumnXs,
      allColumnWidths,
      width,
      columnHeaderMaxDepth,
    } = metrics;
    const columnX = allColumnXs.get(shownColumnTooltip);
    const columnWidth = allColumnWidths.get(shownColumnTooltip);

    assertNotNull(columnX);
    assertNotNull(columnWidth);

    const left =
      gridRect.left +
      clamp(columnX + columnWidth / 2, popperMargin, width - popperMargin);

    return {
      top: gridRect.top + (columnHeaderMaxDepth - 1) * columnHeaderHeight,
      left:
        gridRect.left +
        clamp(columnX + columnWidth / 2, popperMargin, width - popperMargin),
      bottom: gridRect.top + columnHeaderMaxDepth * columnHeaderHeight,
      right:
        gridRect.left +
        clamp(columnX + columnWidth / 2, popperMargin, width - popperMargin) +
        1,
      width: 1,
      height: columnHeaderHeight,
      x: left,
      y: gridRect.top,
      toJSON: () => {
        throw new Error('not implemented');
      },
    };
  }

  getOverflowButtonTooltip = memoize(
    (overflowButtonTooltipProps: CSSProperties): ReactNode => {
      if (overflowButtonTooltipProps == null) {
        return null;
      }

      const wrapperStyle: CSSProperties = {
        position: 'absolute',
        ...overflowButtonTooltipProps,
        pointerEvents: 'none',
      };

      const popperOptions: PopperOptions = {
        placement: 'left',
        modifiers: {
          flip: {
            behavior: ['left', 'right'],
          },
        },
      };

      return (
        <div style={wrapperStyle}>
          <Tooltip
            key={Date.now()}
            options={popperOptions}
            ref={this.handleTooltipRef}
          >
            View full contents
          </Tooltip>
        </div>
      );
    }
  );

  getExpandCellTooltip = memoize(
    (expandCellTooltipProps: CSSProperties): ReactNode => {
      if (expandCellTooltipProps == null) {
        return null;
      }

      const { expandTooltipDisplayValue } = this.state;

      const wrapperStyle: CSSProperties = {
        position: 'absolute',
        ...expandCellTooltipProps,
        pointerEvents: 'none',
      };

      const popperOptions: PopperOptions = {
        placement: 'bottom-start',
      };

      return (
        <div style={wrapperStyle}>
          <Tooltip
            key={Date.now()}
            options={popperOptions}
            ref={this.handleTooltipRef}
          >
            <div style={{ textAlign: 'left' }}>
              Click to {expandTooltipDisplayValue} row
              <br />
              {ContextActionUtils.isMacPlatform() ? '⌘' : 'Ctrl+'}Click to
              expand row and all children
            </div>
          </Tooltip>
        </div>
      );
    }
  );

  getLinkHoverTooltip = memoize(
    (linkHoverTooltipProps: CSSProperties): ReactNode => {
      if (linkHoverTooltipProps == null) {
        return null;
      }

      const { linkHoverDisplayValue } = this.state;

      const wrapperStyle: CSSProperties = {
        position: 'absolute',
        ...linkHoverTooltipProps,
        pointerEvents: 'none',
      };

      const popperOptions: PopperOptions = {
        placement: 'bottom',
      };

      return (
        <div style={wrapperStyle}>
          <Tooltip options={popperOptions} ref={this.handleTooltipRef}>
            <div className="link-hover-tooltip">
              {linkHoverDisplayValue} - Click once to follow.
              <br />
              Click and hold to select this cell.
            </div>
          </Tooltip>
        </div>
      );
    }
  );

  handleGotoRowSelectedRowNumberSubmit(): void {
    const { gotoRow: rowNumber } = this.state;
    this.focusRowInGrid(rowNumber);
  }

  focusRowInGrid(rowNumber: string): void {
    const { model } = this.props;
    const { rowCount } = model;
    this.setState({ gotoRow: rowNumber });
    if (rowNumber === '') {
      this.setState({ gotoRowError: '', gotoValueError: '' });
      return;
    }
    const rowInt = parseInt(rowNumber, 10);
    if (rowInt > rowCount || rowInt < -rowCount) {
      this.setState({ gotoRowError: 'Invalid row index' });
    } else if (rowInt === 0) {
      this.setState({ gotoRowError: '', gotoValueError: '' });
      this.grid?.setFocusRow(0);
    } else if (rowInt < 0) {
      this.setState({ gotoRowError: '', gotoValueError: '' });
      this.grid?.setFocusRow(rowInt + rowCount);
    } else {
      this.grid?.setFocusRow(rowInt - 1);
      this.setState({ gotoRowError: '', gotoValueError: '' });
    }
  }

  handleGotoRowSelectedRowNumberChanged(
    event: ChangeEvent<HTMLInputElement>
  ): void {
    const rowNumber = event.target.value;
    this.focusRowInGrid(rowNumber);
  }

  getColumnTooltip(
    visibleIndex: VisibleIndex,
    metrics: GridMetrics,
    model: IrisGridModel
  ): ReactNode {
    const {
      columnHeaderHeight,
      columnHeaderMaxDepth,
      allColumnXs,
      allColumnWidths,
      width,
    } = metrics;
    const columnX = allColumnXs.get(visibleIndex);
    const columnWidth = allColumnWidths.get(visibleIndex);

    if (columnX == null || columnWidth == null) {
      return null;
    }

    /**
     * Create a wrapper dom element, the size of the column header.
     * The wrapper acts as tooltip parent, the  tooltip component
     * will trigger hide on mouseleave of wrapper or tooltip.
     * The wrapper should be bound to within the grid dimensions,
     * so popper only remains triggered while mouse is inside the panel.
     */
    const boundedLeft = Math.max(0, columnX);
    let boundedWidth = columnWidth;
    if (columnX + columnWidth > width) {
      // column is extending past right edge
      boundedWidth = width - columnX;
    } else if (columnX < 0) {
      // column is extending past left edge
      boundedWidth = columnWidth - Math.abs(columnX);
    }

    const wrapperStyle: CSSProperties = {
      position: 'absolute',
      top: (columnHeaderMaxDepth - 1) * columnHeaderHeight,
      left: boundedLeft,
      width: boundedWidth,
      height: columnHeaderHeight,
      pointerEvents: 'none',
    };

    /**
     * Because the popper parent wrapper center is no longer the same as
     * the column label center, we create a popper virtual ref, to handle
     * positioning and keep the popper centered on the label. Creates a
     * 1px x headerHeight virtual object, placed centered on the column
     * label, clamped to 0 + margin to width - margin. We add a margin,
     * otherwise the arrow wants to escape the boundary.
     */
    const virtualReference: ReferenceObject = {
      clientWidth: 1,
      clientHeight: columnHeaderHeight,
      getBoundingClientRect: this.getColumnBoundingRect,
    };

    const popperOptions: PopperOptions = {
      placement: 'bottom',
      modifiers: {
        flip: {
          behavior: ['bottom', 'top'],
        },
      },
    };

    const modelColumn = this.getModelColumn(visibleIndex);
    if (modelColumn == null) return null;

    const column = model.columns[modelColumn];
    if (column == null) return null;

    return (
      <div style={wrapperStyle}>
        <Tooltip
          key={column.name}
          timeout={400}
          interactive
          options={popperOptions}
          ref={this.handleTooltipRef}
          referenceObject={virtualReference}
          onExited={() => {
            this.setState({ shownColumnTooltip: null });
          }}
        >
          <ColumnStatistics
            model={model}
            column={column}
            onStatistics={() => {
              this.tooltip?.update();
            }}
          />
        </Tooltip>
      </div>
    );
  }

  handleGotoValueSelectedColumnNameChanged(columnName: ColumnName): void {
    const { model } = this.props;
    const cursorRow = this.grid?.state.cursorRow;

    if (cursorRow != null) {
      const index = model.getColumnIndexByName(columnName);
      const column = IrisGridUtils.getColumnByName(model.columns, columnName);
      if (index == null || column == null) {
        return;
      }
      const value = model.valueForCell(index, cursorRow);
      const text = IrisGridUtils.convertValueToText(value, column.type);
      this.setState({
        gotoValueSelectedColumnName: columnName,
        gotoValue: text,
        gotoValueError: '',
      });
    }
    this.setState({
      gotoValueSelectedColumnName: columnName,
      gotoValueError: '',
    });
  }

  handleGotoValueSelectedFilterChanged(value: FilterTypeValue): void {
    this.setState({ gotoValueSelectedFilter: value, gotoValueError: '' });
  }

  handleGotoValueChanged = (input: string): void => {
    this.setState({ gotoValue: input });
    this.debouncedSeekRow(input);
  };

  debouncedSeekRow = debounce((input: string): void => {
    this.seekRow(input);
  }, SEEK_ROW_DEBOUNCE);

  handleGotoValueSubmitted(isBackwards?: boolean): void {
    const { gotoValue } = this.state;
    this.seekRow(gotoValue, isBackwards);
  }

  render(): ReactElement | null {
    const {
      children,
      customFilters,
      getDownloadWorker,
      isSelectingColumn,
      isStuckToBottom,
      isStuckToRight,
      model,
      name,
      onlyFetchVisibleColumns,
      alwaysFetchColumns,
      advancedSettings,
      onAdvancedSettingsChange,
      canDownloadCsv,
      onCreateChart,
      onPartitionAppend,
    } = this.props;
    const {
      metricCalculator,
      metrics,
      isFilterBarShown,
      isSelectingPartition,
      isMenuShown,
      isReady,
      copyOperation,
      focusedFilterBarColumn,
      loadingText,
      loadingScrimProgress,
      loadingSpinnerShown,
      keyHandlers,
      mouseHandlers,
      shownColumnTooltip,
      hoverAdvancedFilter,
      shownAdvancedFilter,
      hoverSelectColumn,
      quickFilters,
      advancedFilters,
      partition,
      partitionFilters,
      partitionTable,
      partitionColumn,
      searchFilter,
      selectDistinctColumns,

      movedColumns,
      movedRows,

      formatter,
      conditionalFormats,
      conditionalFormatPreview,
      conditionalFormatEditIndex,

      sorts,
      reverseType,
      customColumns,

      selectedRanges,
      isTableDownloading,
      tableDownloadStatus,
      tableDownloadProgress,
      tableDownloadEstimatedTime,

      showSearchBar,
      searchValue,
      selectedSearchColumns,
      invertSearchColumns,

      aggregationSettings,
      selectedAggregation,
      rollupConfig,
      openOptions,
      pendingSavePromise,
      pendingSaveError,
      pendingRowCount,
      pendingDataErrors,
      pendingDataMap,
      toastMessage,
      frozenColumns,
      columnHeaderGroups,
      showOverflowModal,
      overflowText,
      overflowButtonTooltipProps,
      expandCellTooltipProps,
      linkHoverTooltipProps,
      isGotoShown,
      gotoRow,
      gotoRowError,
      gotoValueError,
      gotoValueSelectedColumnName,
      gotoValue,
      gotoValueSelectedFilter,
    } = this.state;
    if (!isReady) {
      return null;
    }

    const theme = this.getTheme();

    const filter = this.getCachedFilter(
      customFilters,
      quickFilters,
      advancedFilters,
      partitionFilters,
      searchFilter
    );

    const userColumnWidths = metricCalculator.getUserColumnWidths();
    const stateOverride = this.getCachedStateOverride(
      hoverSelectColumn,
      isFilterBarShown,
      isSelectingColumn,
      loadingScrimProgress,
      quickFilters,
      advancedFilters,
      sorts,
      reverseType,
      rollupConfig,
      isMenuShown
    );
    const top = metrics ? metrics.top : 0;
    const bottom = metrics ? metrics.bottomViewport : 0;
    let left = null;
    let right = null;
    if (onlyFetchVisibleColumns) {
      left = metrics ? metrics.left : 0;
      right = metrics ? metrics.right : 0;
    }
    const isVisible =
      metrics != null && metrics.width > 0 && metrics.height > 0;
    const isRollup = (rollupConfig?.columns?.length ?? 0) > 0;

    let focusField = null;

    const debounceMs = metrics
      ? Math.min(
          Math.max(IrisGrid.minDebounce, Math.round(metrics.rowCount / 200)),
          IrisGrid.maxDebounce
        )
      : IrisGrid.maxDebounce;

    if (isFilterBarShown && focusedFilterBarColumn != null && metrics != null) {
      const { gridX, gridY, allColumnXs, allColumnWidths, width } = metrics;
      const columnX = allColumnXs.get(focusedFilterBarColumn);
      const columnWidth = allColumnWidths.get(focusedFilterBarColumn);
      if (columnX != null && columnWidth != null) {
        const x = gridX + columnX;
        const y = gridY - (theme.filterBarHeight ?? 0);
        const fieldWidth = columnWidth + 1; // cover right border
        const fieldHeight = (theme.filterBarHeight ?? 0) - 1; // remove bottom border
        const style = {
          top: y,
          left: x,
          minWidth: Math.min(fieldWidth, width - x), // Don't cause overflow
          height: fieldHeight,
        };
        let value = '';
        let isValid = true;
        const modelColumn = this.getModelColumn(focusedFilterBarColumn);
        assertNotNull(modelColumn);
        const quickFilter = quickFilters.get(modelColumn);
        const advancedFilter = advancedFilters.get(modelColumn);
        if (quickFilter != null) {
          value = quickFilter.text;
          isValid = quickFilter.filter != null;
        }
        const isBarFiltered =
          quickFilters.size !== 0 || advancedFilters.size !== 0;
        focusField = (
          <FilterInputField
            ref={this.filterInputRef}
            style={style}
            className={classNames({
              error: !isValid,
              active: value !== '' || advancedFilter != null,
              'iris-grid-has-filter': isBarFiltered,
            })}
            isAdvancedFilterSet={advancedFilter != null}
            onAdvancedFiltersTriggered={() => {
              this.setState({ shownAdvancedFilter: focusedFilterBarColumn });
            }}
            key={focusedFilterBarColumn}
            onChange={this.handleFilterBarChange}
            onDone={this.handleFilterBarDone}
            onTab={this.handleFilterBarTab}
            onContextMenu={this.grid?.handleContextMenu}
            debounceMs={debounceMs}
            value={value}
          />
        );
      }
    }

    let loadingElement = null;
    if (loadingText != null) {
      const loadingStatus = (
        <div className="iris-grid-loading-status">
          <div
            className={classNames('iris-grid-loading-status-bar', {
              show: loadingSpinnerShown,
            })}
          >
            {loadingText}
          </div>
          <button
            type="button"
            onClick={this.handleCancel}
            className={classNames('iris-grid-btn-cancel', {
              show: loadingSpinnerShown,
            })}
          >
            <FontAwesomeIcon icon={vsClose} transform="down-1" />
            Cancel
          </button>
        </div>
      );
      const gridY = metrics ? metrics.gridY : 0;
      loadingElement = (
        <div className="iris-grid-loading" style={{ top: gridY }}>
          {loadingStatus}
        </div>
      );
    }

    let columnTooltip: React.ReactNode = null;
    if (shownColumnTooltip != null && metrics) {
      columnTooltip = this.getColumnTooltip(shownColumnTooltip, metrics, model);
      // #510 We may need to update the position of the tooltip if it's already opened and columns are resized
      this.tooltip?.update();
    }

    const filterBar = [];
    if (metrics && isFilterBarShown) {
      const { gridX, gridY, visibleColumns, allColumnXs, allColumnWidths } =
        metrics;
      const { filterBarHeight } = theme;

      for (let i = 0; i < visibleColumns.length; i += 1) {
        const columnIndex = visibleColumns[i];

        const columnX = allColumnXs.get(columnIndex);
        const columnWidth = allColumnWidths.get(columnIndex);
        const modelColumn = this.getModelColumn(columnIndex);
        if (modelColumn != null) {
          const isFilterable = model.isFilterable(modelColumn);
          if (
            isFilterable &&
            columnX != null &&
            columnWidth != null &&
            columnWidth > 0
          ) {
            const x = gridX + columnX + columnWidth - 24;
            const y = gridY - (filterBarHeight ?? 0) + 2; // 2 acts as top margin for the button
            const style: CSSProperties = {
              position: 'absolute',
              top: y,
              left: x,
            };
            const advancedFilter = advancedFilters.get(modelColumn);
            const isFilterSet = advancedFilter != null;
            const isFilterVisible =
              columnIndex === hoverAdvancedFilter ||
              columnIndex === focusedFilterBarColumn ||
              isFilterSet;
            const element = (
              <div
                className={classNames('advanced-filter-button-container', {
                  hidden: !isFilterVisible,
                })}
                key={columnIndex}
                style={style}
              >
                {isFilterVisible && (
                  <Button
                    kind="ghost"
                    className={classNames(
                      'btn-link-icon advanced-filter-button',
                      {
                        'filter-set': isFilterSet,
                      }
                    )}
                    onClick={() => {
                      this.setState({ shownAdvancedFilter: columnIndex });
                    }}
                    onContextMenu={event => {
                      this.grid?.handleContextMenu(event);
                    }}
                    onMouseEnter={() => {
                      this.setState({ hoverAdvancedFilter: columnIndex });
                    }}
                    onMouseLeave={() => {
                      this.setState({ hoverAdvancedFilter: null });
                    }}
                  >
                    <div className="fa-layers">
                      <FontAwesomeIcon
                        icon={dhFilterFilled}
                        className="filter-solid"
                      />
                      <FontAwesomeIcon
                        icon={vsFilter}
                        className="filter-light"
                      />
                    </div>
                  </Button>
                )}
              </div>
            );
            filterBar.push(element);
          }
        }
      }
    }
    const advancedFilterMenus = [];
    if (metrics) {
      const {
        gridX,
        visibleColumns,
        allColumnXs,
        allColumnWidths,
        columnHeaderHeight,
      } = metrics;
      for (let i = 0; i < visibleColumns.length; i += 1) {
        const columnIndex = visibleColumns[i];
        const columnX = allColumnXs.get(columnIndex);
        const columnWidth = allColumnWidths.get(columnIndex);
        if (columnX != null && columnWidth != null && columnWidth > 0) {
          const xColumnHeader = gridX + columnX;
          const xFilterBar = gridX + columnX + columnWidth - 20;
          const style: CSSProperties = isFilterBarShown
            ? {
                position: 'absolute',
                top: columnHeaderHeight,
                left: xFilterBar,
                width: 20,
                height: theme.filterBarHeight,
              }
            : {
                position: 'absolute',
                top: 0,
                left: xColumnHeader,
                width: columnWidth,
                height: columnHeaderHeight,
              };
          const modelColumn = this.getModelColumn(columnIndex);
          if (modelColumn != null) {
            const column = model.columns[modelColumn];
            if (column == null) {
              // Grid metrics is likely out of sync with model
              log.warn(
                `Column does not exist at index ${modelColumn} for column array of length ${model.columns.length}`
              );
              // eslint-disable-next-line no-continue
              continue;
            }
            const advancedFilter = advancedFilters.get(modelColumn);
            const { options: advancedFilterOptions } = advancedFilter || {};
            const sort = TableUtils.getSortForColumn(model.sort, column.name);
            const sortDirection = sort ? sort.direction : null;
            const element = (
              <div
                key={columnIndex}
                className="advanced-filter-menu-container"
                style={style}
              >
                <Popper
                  className="advanced-filter-menu-popper"
                  onEntered={this.getAdvancedMenuOpenedHandler(columnIndex)}
                  onExited={() => {
                    this.handleAdvancedMenuClosed(columnIndex);
                  }}
                  isShown={shownAdvancedFilter === columnIndex}
                  interactive
                  closeOnBlur
                  options={{
                    positionFixed: true,
                  }}
                >
                  {this.getCachedAdvancedFilterMenuActions(
                    model,
                    column,
                    advancedFilterOptions,
                    sortDirection,
                    formatter
                  )}
                </Popper>
              </div>
            );
            advancedFilterMenus.push(element);
          }
        }
      }
    }

    const optionItems = this.getCachedOptionItems(
      onCreateChart !== undefined && model.isChartBuilderAvailable,
      model.isCustomColumnsAvailable,
      model.isFormatColumnsAvailable,
      model.isRollupAvailable,
      model.isTotalsAvailable || isRollup,
      model.isSelectDistinctAvailable,
      model.isExportAvailable,
      this.toggleFilterBarAction,
      this.toggleSearchBarAction,
      this.toggleGotoRowAction,
      isFilterBarShown,
      showSearchBar,
      canDownloadCsv,
      this.isTableSearchAvailable(),
      isGotoShown,
      advancedSettings.size > 0
    );

    const hiddenColumns = this.getCachedHiddenColumns(
      metricCalculator,
      userColumnWidths
    );

    const openOptionsStack = openOptions.map(option => {
      switch (option.type) {
        case OptionType.CHART_BUILDER:
          return (
            <ChartBuilder
              model={model}
              onChange={this.handleChartChange}
              onSubmit={this.handleChartCreate}
              key={OptionType.CHART_BUILDER}
            />
          );
        case OptionType.VISIBILITY_ORDERING_BUILDER:
          return (
            <VisibilityOrderingBuilder
              model={model}
              movedColumns={movedColumns}
              hiddenColumns={hiddenColumns}
              columnHeaderGroups={columnHeaderGroups}
              onColumnVisibilityChanged={this.handleColumnVisibilityChanged}
              onReset={this.handleColumnVisibilityReset}
              onMovedColumnsChanged={this.handleMovedColumnsChanged}
              onColumnHeaderGroupChanged={this.handleHeaderGroupsChanged}
              key={OptionType.VISIBILITY_ORDERING_BUILDER}
            />
          );
        case OptionType.CONDITIONAL_FORMATTING:
          return (
            <ConditionalFormattingMenu
              rules={conditionalFormats}
              onChange={this.handleConditionalFormatsChange}
              onCreate={this.handleConditionalFormatCreate}
              onSelect={this.handleConditionalFormatEdit}
            />
          );
        case OptionType.CONDITIONAL_FORMATTING_EDIT:
          assertNotNull(model.columns);
          assertNotNull(this.handleConditionalFormatEditorUpdate);
          return (
            <ConditionalFormatEditor
              dh={model.dh}
              columns={model.columns}
              rule={conditionalFormatPreview}
              onUpdate={this.handleConditionalFormatEditorUpdate}
              onSave={this.handleConditionalFormatEditorSave}
              onCancel={this.handleConditionalFormatEditorCancel}
              onDataBarRangeChange={this.handleDataBarRangeChange}
            />
          );
        case OptionType.CUSTOM_COLUMN_BUILDER:
          return (
            <CustomColumnBuilder
              model={model}
              customColumns={customColumns}
              onSave={this.handleUpdateCustomColumns}
              onCancel={this.handleMenuBack}
              key={OptionType.CUSTOM_COLUMN_BUILDER}
            />
          );
        case OptionType.ROLLUP_ROWS:
          return (
            <RollupRows
              model={model}
              onChange={this.handleRollupChange}
              config={rollupConfig}
              key={OptionType.ROLLUP_ROWS}
            />
          );
        case OptionType.AGGREGATIONS:
          return (
            <Aggregations
              settings={aggregationSettings}
              isRollup={isRollup}
              onChange={this.handleAggregationsChange}
              onEdit={this.handleAggregationEdit}
            />
          );
        case OptionType.AGGREGATION_EDIT:
          return (
            selectedAggregation && (
              <AggregationEdit
                aggregation={selectedAggregation}
                columns={model.originalColumns}
                onChange={this.handleAggregationChange}
              />
            )
          );
        case OptionType.TABLE_EXPORTER:
          return (
            <TableCsvExporter
              model={model}
              name={name}
              userColumnWidths={userColumnWidths}
              movedColumns={movedColumns}
              isDownloading={isTableDownloading}
              tableDownloadStatus={tableDownloadStatus}
              tableDownloadProgress={tableDownloadProgress}
              tableDownloadEstimatedTime={
                tableDownloadEstimatedTime ?? undefined
              }
              onDownload={this.handleDownloadTable}
              onDownloadStart={this.handleDownloadTableStart}
              onCancel={this.handleCancelDownloadTable}
              selectedRanges={selectedRanges}
              key={OptionType.TABLE_EXPORTER}
            />
          );
        case OptionType.SELECT_DISTINCT:
          return (
            <SelectDistinctBuilder
              model={model}
              selectDistinctColumns={selectDistinctColumns}
              onChange={this.handleSelectDistinctChanged}
            />
          );
        case OptionType.ADVANCED_SETTINGS:
          return (
            <AdvancedSettingsMenu
              items={advancedSettings}
              onChange={onAdvancedSettingsChange}
            />
          );

        default:
          throw Error(`Unexpected option type ${option.type}`);
      }
    });

    return (
      <div className="iris-grid" role="presentation">
        <div className="iris-grid-column">
          {children != null && <div className="iris-grid-bar">{children}</div>}
          <CSSTransition
            in={isSelectingPartition}
            timeout={ThemeExport.transitionSlowMs}
            classNames="iris-grid-bar-horizontal"
            onEnter={this.handleAnimationStart}
            onEntered={this.handleAnimationEnd}
            onExit={this.handleAnimationStart}
            onExited={this.handleAnimationEnd}
            mountOnEnter
            unmountOnExit
          >
            <div className="iris-grid-partition-selector-wrapper iris-grid-bar iris-grid-bar-primary">
              {partitionTable && partitionColumn && partition != null && (
                <IrisGridPartitionSelector
                  dh={model.dh}
                  table={partitionTable}
                  getFormattedString={(
                    value: unknown,
                    type: string,
                    stringName: string
                  ) => model.displayString(value, type, stringName)}
                  column={partitionColumn}
                  partition={partition}
                  onChange={this.handlePartitionChange}
                  onFetchAll={this.handlePartitionFetchAll}
                  onAppend={
                    onPartitionAppend !== undefined
                      ? this.handlePartitionAppend
                      : undefined
                  }
                  onDone={this.handlePartitionDone}
                />
              )}
            </div>
          </CSSTransition>
          <CSSTransition
            in={showSearchBar}
            timeout={ThemeExport.transitionSlowMs}
            classNames="iris-grid-bar-horizontal"
            onEnter={this.handleAnimationStart}
            onEntered={this.handleAnimationEnd}
            onExit={this.handleAnimationStart}
            onExited={this.handleAnimationEnd}
            mountOnEnter
            unmountOnExit
          >
            <div className="iris-grid-bar">
              <CrossColumnSearch
                value={searchValue}
                selectedColumns={selectedSearchColumns}
                invertSelection={invertSearchColumns}
                onChange={this.handleCrossColumnSearch}
                columns={model.columns}
                ref={this.crossColumnRef}
              />
            </div>
          </CSSTransition>
          <div
            className="grid-wrapper"
            ref={gridWrapper => {
              this.gridWrapper = gridWrapper;
            }}
          >
            <Grid
              ref={grid => {
                this.grid = grid;
              }}
              isStickyBottom={!isEditableGridModel(model) || !model.isEditable}
              isStuckToBottom={isStuckToBottom}
              isStuckToRight={isStuckToRight}
              metricCalculator={metricCalculator}
              model={model}
              keyHandlers={keyHandlers}
              mouseHandlers={mouseHandlers}
              movedColumns={movedColumns}
              movedRows={movedRows}
              onError={this.handleGridError}
              onViewChanged={this.handleViewChanged}
              onSelectionChanged={this.handleSelectionChanged}
              onMovedColumnsChanged={this.handleMovedColumnsChanged}
              renderer={this.renderer}
              stateOverride={stateOverride}
              theme={theme}
            />
            <IrisGridCellOverflowModal
              isOpen={showOverflowModal}
              text={overflowText}
              onClose={this.handleOverflowClose}
            />
            {isVisible && (
              <IrisGridModelUpdater
                model={model}
                modelColumns={model.columns}
                top={top}
                bottom={bottom}
                left={left}
                right={right}
                filter={filter}
                formatter={formatter}
                sorts={sorts}
                reverseType={reverseType}
                movedColumns={movedColumns}
                customColumns={customColumns}
                hiddenColumns={hiddenColumns}
                alwaysFetchColumns={this.getAlwaysFetchColumns(
                  alwaysFetchColumns,
                  model.columns,
                  movedColumns,
                  model.floatingLeftColumnCount,
                  model.floatingRightColumnCount,
                  this.grid?.state.draggingColumn?.range
                )}
                formatColumns={this.getCachedPreviewFormatColumns(
                  model.dh,
                  model.columns,
                  conditionalFormats,
                  conditionalFormatPreview,
                  // Disable the preview format when we press Back on the format edit page
                  openOptions[openOptions.length - 1]?.type ===
                    OptionType.CONDITIONAL_FORMATTING_EDIT
                    ? conditionalFormatEditIndex ?? undefined
                    : undefined
                )}
                rollupConfig={this.getModelRollupConfig(
                  model.originalColumns,
                  rollupConfig,
                  aggregationSettings
                )}
                totalsConfig={this.getModelTotalsConfig(
                  model.columns,
                  rollupConfig,
                  aggregationSettings
                )}
                selectDistinctColumns={selectDistinctColumns}
                pendingRowCount={pendingRowCount}
                pendingDataMap={pendingDataMap}
                frozenColumns={frozenColumns}
                columnHeaderGroups={columnHeaderGroups}
              />
            )}
            {!isMenuShown && (
              <div className="grid-settings-button">
                <Button
                  kind="ghost"
                  data-testid={`btn-iris-grid-settings-button-${name}`}
                  onClick={this.handleMenu}
                  icon={<FontAwesomeIcon icon={vsMenu} transform="up-1" />}
                  tooltip="Table Options"
                />
              </div>
            )}
            {focusField}
            {loadingElement}
            {filterBar}
            {columnTooltip}
            {advancedFilterMenus}
            {overflowButtonTooltipProps &&
              this.getOverflowButtonTooltip(overflowButtonTooltipProps)}
            {expandCellTooltipProps &&
              this.getExpandCellTooltip(expandCellTooltipProps)}
            {linkHoverTooltipProps &&
              this.getLinkHoverTooltip(linkHoverTooltipProps)}
          </div>
          <GotoRow
            ref={this.gotoRowRef}
            model={model}
            isShown={isGotoShown}
            gotoRow={gotoRow}
            gotoRowError={gotoRowError}
            gotoValueError={gotoValueError}
            onGotoRowSubmit={this.handleGotoRowSelectedRowNumberSubmit}
            onGotoRowNumberChanged={this.handleGotoRowSelectedRowNumberChanged}
            onClose={this.handleGotoRowClosed}
            onEntering={this.handleAnimationStart}
            onEntered={this.handleAnimationEnd}
            onExiting={() => {
              this.handleAnimationStart();
              this.focus();
            }}
            onExited={this.handleAnimationEnd}
            gotoValueSelectedColumnName={gotoValueSelectedColumnName}
            gotoValue={gotoValue}
            gotoValueFilter={gotoValueSelectedFilter}
            onGotoValueSelectedColumnNameChanged={
              this.handleGotoValueSelectedColumnNameChanged
            }
            onGotoValueSelectedFilterChanged={
              this.handleGotoValueSelectedFilterChanged
            }
            onGotoValueChanged={this.handleGotoValueChanged}
            onGotoValueSubmit={this.handleGotoValueSubmitted}
          />

          <PendingDataBottomBar
            error={pendingSaveError}
            isSaving={pendingSavePromise != null}
            saveTooltip={`Commit (${this.commitAction.shortcut.getDisplayText()})`}
            discardTooltip={`Discard (${this.discardAction.shortcut.getDisplayText()})`}
            pendingDataErrors={pendingDataErrors}
            pendingDataMap={pendingDataMap}
            onEntering={this.handleAnimationStart}
            onEntered={this.handleAnimationEnd}
            onExiting={this.handleAnimationStart}
            onExited={this.handleAnimationEnd}
            onSave={this.handlePendingCommitClicked}
            onDiscard={this.handlePendingDiscardClicked}
          />
          <ToastBottomBar>{toastMessage}</ToastBottomBar>
          <IrisGridCopyHandler
            model={model}
            copyOperation={copyOperation ?? undefined}
            onEntering={this.handleAnimationStart}
            onEntered={this.handleAnimationEnd}
            onExiting={this.handleAnimationStart}
            onExited={this.handleAnimationEnd}
          />
          <TableSaver
            dh={model.dh}
            ref={tableSaver => {
              this.tableSaver = tableSaver;
            }}
            getDownloadWorker={getDownloadWorker}
            onDownloadCompleted={this.handleDownloadCompleted}
            onDownloadCanceled={this.handleDownloadCanceled}
            onDownloadProgressUpdate={this.handleDownloadProgressUpdate}
            isDownloading={
              tableDownloadStatus ===
              TableCsvExporter.DOWNLOAD_STATUS.DOWNLOADING
            }
            formatter={formatter}
          />
        </div>
        <CSSTransition
          in={isMenuShown}
          timeout={ThemeExport.transitionMidMs}
          classNames="slide-left"
          onEntering={this.handleAnimationStart}
          onEntered={this.handleAnimationEnd}
          onExiting={this.handleAnimationStart}
          onExited={this.handleAnimationEnd}
          mountOnEnter
          unmountOnExit
        >
          <div className="table-sidebar">
            <Stack>
              <Page title="Table Options" onClose={this.handleMenuClose}>
                <Menu
                  onSelect={i => this.handleMenuSelect(optionItems[i])}
                  items={optionItems}
                />
              </Page>
              {openOptionsStack.map((option, i) => (
                <Page
                  title={openOptions[i].title}
                  onBack={this.handleMenuBack}
                  onClose={this.handleMenuClose}
                  key={openOptions[i].type}
                >
                  {option}
                </Page>
              ))}
            </Stack>
          </div>
        </CSSTransition>
        <ContextActions actions={this.contextActions} />
      </div>
    );
  }
}

export default IrisGrid;
