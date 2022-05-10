import React, { Component } from 'react';
import memoize from 'memoizee';
import classNames from 'classnames';
import { CSSTransition } from 'react-transition-group';
import PropTypes from 'prop-types';
import deepEqual from 'deep-equal';
import Log from '@deephaven/log';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ContextActionUtils,
  ContextActions,
  DeephavenSpinner,
  Stack,
  Menu,
  Page,
  Popper,
  ThemeExport,
  Tooltip,
} from '@deephaven/components';
import { Grid, GridRange, GridUtils } from '@deephaven/grid';
import {
  dhEye,
  dhFilterFilled,
  dhGraphLineUp,
  dhTriangleDownSquare,
  vsCloudDownload,
  vsEdit,
  vsFilter,
  vsMenu,
  vsRuby,
  vsSearch,
  vsSplitHorizontal,
  vsSymbolOperator,
  vsTools,
} from '@deephaven/icons';
import dh, { PropTypes as APIPropTypes } from '@deephaven/jsapi-shim';
import { Pending, PromiseUtils, ValidationError } from '@deephaven/utils';
import throttle from 'lodash.throttle';
import debounce from 'lodash.debounce';
import clamp from 'lodash.clamp';
import PendingDataBottomBar from './PendingDataBottomBar';
import IrisGridCopyHandler from './IrisGridCopyHandler';
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
  IrisGridSortMouseHandler,
  PendingMouseHandler,
} from './mousehandlers';
import ToastBottomBar from './ToastBottomBar';
import IrisGridMetricCalculator from './IrisGridMetricCalculator';
import IrisGridModelUpdater from './IrisGridModelUpdater';
import IrisGridRenderer from './IrisGridRenderer';
import IrisGridTheme from './IrisGridTheme';
import ColumnStatistics from './ColumnStatistics';
import './IrisGrid.scss';
import Formatter from './Formatter';
import FormatterUtils from './FormatterUtils';
import TableUtils from './TableUtils';
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
} from './sidebar';
import IrisGridUtils from './IrisGridUtils';
import CrossColumnSearch from './CrossColumnSearch';
import IrisGridModel from './IrisGridModel';
import IrisGridPartitionSelector from './IrisGridPartitionSelector';
import SelectDistinctBuilder from './sidebar/SelectDistinctBuilder';
import AdvancedSettingsType from './sidebar/AdvancedSettingsType';
import AdvancedSettingsMenu from './sidebar/AdvancedSettingsMenu';
import SHORTCUTS from './IrisGridShortcuts';
import DateUtils from './DateUtils';
import ConditionalFormattingMenu from './sidebar/conditional-formatting/ConditionalFormattingMenu';
import { getFormatColumns } from './sidebar/conditional-formatting/ConditionalFormattingUtils';
import ConditionalFormatEditor from './sidebar/conditional-formatting/ConditionalFormatEditor';
import IrisGridCellOverflowModal from './IrisGridCellOverflowModal';

const log = Log.module('IrisGrid');

const UPDATE_DOWNLOAD_THROTTLE = 500;

const SET_FILTER_DEBOUNCE = 250;

const SET_CONDITIONAL_FORMAT_DEBOUNCE = 250;

const DEFAULT_AGGREGATION_SETTINGS = Object.freeze({
  aggregations: [],
  showOnTop: false,
});

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
}) {
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

export class IrisGrid extends Component {
  static minDebounce = 150;

  static maxDebounce = 500;

  static loadingSpinnerDelay = 800;

  static makeQuickFilter(column, text, timeZone) {
    try {
      return TableUtils.makeQuickFilter(column, text, timeZone);
    } catch (err) {
      log.error('Error creating quick filter', err);
    }
    return null;
  }

  constructor(props) {
    super(props);

    this.handleAdvancedFilterChange = this.handleAdvancedFilterChange.bind(
      this
    );
    this.handleAdvancedFilterSortChange = this.handleAdvancedFilterSortChange.bind(
      this
    );
    this.handleAdvancedFilterDone = this.handleAdvancedFilterDone.bind(this);
    this.handleAdvancedMenuOpened = this.handleAdvancedMenuOpened.bind(this);
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
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleTooltipRef = this.handleTooltipRef.bind(this);
    this.handleViewChanged = this.handleViewChanged.bind(this);
    this.handleFormatSelection = this.handleFormatSelection.bind(this);
    this.handleConditionalFormatCreate = this.handleConditionalFormatCreate.bind(
      this
    );
    this.handleConditionalFormatEdit = this.handleConditionalFormatEdit.bind(
      this
    );
    this.handleConditionalFormatsChange = this.handleConditionalFormatsChange.bind(
      this
    );
    this.handleConditionalFormatEditorSave = this.handleConditionalFormatEditorSave.bind(
      this
    );
    this.handleConditionalFormatEditorUpdate = debounce(
      this.handleConditionalFormatEditorUpdate.bind(this),
      SET_CONDITIONAL_FORMAT_DEBOUNCE
    );
    this.handleConditionalFormatEditorCancel = this.handleConditionalFormatEditorCancel.bind(
      this
    );
    this.handleUpdateCustomColumns = this.handleUpdateCustomColumns.bind(this);
    this.handleCustomColumnsChanged = this.handleCustomColumnsChanged.bind(
      this
    );
    this.handleSelectDistinctChanged = this.handleSelectDistinctChanged.bind(
      this
    );
    this.handlePendingDataUpdated = this.handlePendingDataUpdated.bind(this);
    this.handlePendingCommitClicked = this.handlePendingCommitClicked.bind(
      this
    );
    this.handlePendingDiscardClicked = this.handlePendingDiscardClicked.bind(
      this
    );

    this.handleDownloadTable = this.handleDownloadTable.bind(this);
    this.handleDownloadTableStart = this.handleDownloadTableStart.bind(this);
    this.handleCancelDownloadTable = this.handleCancelDownloadTable.bind(this);
    this.handleDownloadCanceled = this.handleDownloadCanceled.bind(this);
    this.handleDownloadProgressUpdate = throttle(
      this.handleDownloadProgressUpdate.bind(this),
      UPDATE_DOWNLOAD_THROTTLE
    );
    this.handleDownloadCompleted = this.handleDownloadCompleted.bind(this);
    this.handlePartitionAppend = this.handlePartitionAppend.bind(this);
    this.handlePartitionChange = this.handlePartitionChange.bind(this);
    this.handlePartitionFetchAll = this.handlePartitionFetchAll.bind(this);
    this.handlePartitionDone = this.handlePartitionDone.bind(this);
    this.handleColumnVisibilityChanged = this.handleColumnVisibilityChanged.bind(
      this
    );
    this.handleCrossColumnSearch = this.handleCrossColumnSearch.bind(this);
    this.handleRollupChange = this.handleRollupChange.bind(this);
    this.handleOverflowClose = this.handleOverflowClose.bind(this);
    this.getColumnBoundingRect = this.getColumnBoundingRect.bind(this);

    this.updateSearchFilter = debounce(
      this.updateSearchFilter.bind(this),
      SET_FILTER_DEBOUNCE
    );

    this.grid = null;
    this.gridWrapper = null;
    this.lastFocusedFilterBarColumn = null;
    this.lastLoadedConfig = null;
    this.tooltip = null;
    this.pending = new Pending();
    this.globalColumnFormats = [];
    this.dateTimeFormatterOptions = {};
    this.decimalFormatOptions = {};
    this.integerFormatOptions = {};
    this.truncateNumbersWithPound = false;

    // When the loading scrim started/when it should extend to the end of the screen.
    this.loadingScrimStartTime = null;
    this.loadingScrimFinishTime = null;
    this.loadingTimer = null;
    this.renderer = new IrisGridRenderer();
    this.tableSaver = null;
    this.crossColumnRef = React.createRef();
    this.isAnimating = false;
    this.animationFrame = null;
    this.filterInputRef = React.createRef();

    this.toggleFilterBarAction = {
      action: () => this.toggleFilterBar(),
      shortcut: SHORTCUTS.TABLE.TOGGLE_QUICK_FILTER,
    };
    this.toggleSearchBarAction = {
      action: () => this.toggleSearchBar(),
      shortcut: SHORTCUTS.TABLE.TOGGLE_SEARCH,
    };
    this.discardAction = {
      action: () => {
        const { model } = this.props;
        if (model.isEditable && model.pendingDataMap.size > 0) {
          this.discardPending().catch(log.error);
        }
      },
      shortcut: SHORTCUTS.INPUT_TABLE.DISCARD,
    };
    this.commitAction = {
      action: () => {
        const { model } = this.props;
        if (
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
    } = props;

    const keyHandlers = [
      new ReverseKeyHandler(this),
      new ClearFilterKeyHandler(this),
    ];
    if (canCopy) {
      keyHandlers.push(new CopyKeyHandler(this));
    }
    const mouseHandlers = [
      new IrisGridCellOverflowMouseHandler(this),
      new IrisGridColumnSelectMouseHandler(this),
      new IrisGridColumnTooltipMouseHandler(this),
      new IrisGridSortMouseHandler(this),
      new IrisGridFilterMouseHandler(this),
      new IrisGridContextMenuHandler(this),
      new IrisGridDataSelectMouseHandler(this),
      new PendingMouseHandler(this),
    ];

    const movedColumns =
      movedColumnsProp.length > 0 ? movedColumnsProp : model.movedColumns;
    const movedRows =
      movedRowsProp.length > 0 ? movedRowsProp : model.movedRows;

    const metricCalculator = new IrisGridMetricCalculator({
      userColumnWidths: new Map(userColumnWidths),
      userRowHeights: new Map(userRowHeights),
      movedColumns,
    });
    const searchColumns = selectedSearchColumns ?? [];
    const searchFilter = CrossColumnSearch.createSearchFilter(
      searchValue,
      searchColumns,
      model.columns,
      invertSearchColumns
    );

    this.state = {
      isFilterBarShown,
      isSelectingPartition,
      focusedFilterBarColumn: null,
      metricCalculator,
      metrics: null,
      keyHandlers,
      mouseHandlers,

      partition,
      partitionColumn,
      partitionTable: null,
      partitionFilters: [],
      // setAdvancedFilter and setQuickFilter mutate the arguments
      // so we want to always use map copies from the state instead of props
      quickFilters: new Map(quickFilters),
      advancedFilters: new Map(advancedFilters),
      shownAdvancedFilter: null,
      hoverAdvancedFilter: null,

      filter: [],
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

      formatter: new Formatter(),
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
      pendingDataMap,
      pendingDataErrors: new Map(),
      pendingSavePromise: null,
      pendingSaveError: null,

      toastMessage: null,
      frozenColumns,
      showOverflowModal: false,
      overflowText: '',
      overflowButtonTooltipProps: null,
    };
  }

  componentDidMount() {
    const { partitionColumn, model } = this.props;
    const column =
      partitionColumn || model.columns.find(c => c.isPartitionColumn);
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

  componentDidUpdate(prevProps) {
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
          this.loadingScrimStartTime = null;
          this.loadingScrimFinishTime = null;
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

  componentWillUnmount() {
    const { model } = this.props;
    this.stopListening(model);
    this.pending.cancel();
    this.updateSearchFilter.cancel();

    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
    }
    this.handleDownloadProgressUpdate.cancel();
    cancelAnimationFrame(this.animationFrame);
  }

  getAdvancedMenuOpenedHandler = memoize(
    column => this.handleAdvancedMenuOpened.bind(this, column),
    { max: 100 }
  );

  getCachedAdvancedFilterMenuActions = memoize(
    (model, column, advancedFilterOptions, sortDirection, formatter) => (
      <AdvancedFilterCreator
        model={model}
        column={column}
        onFilterChange={this.handleAdvancedFilterChange}
        onSortChange={this.handleAdvancedFilterSortChange}
        onDone={this.handleAdvancedFilterDone}
        options={advancedFilterOptions}
        sortDirection={sortDirection}
        formatter={formatter}
      />
    ),
    { max: 50 }
  );

  getCachedOptionItems = memoize(
    (
      isChartBuilderAvailable,
      isCustomColumnsAvailable,
      isFormatColumnsAvailable,
      isRollupAvailable,
      isTotalsAvailable,
      isSelectDistinctAvailable,
      isExportAvailable,
      toggleFilterBarAction,
      toggleSearchBarAction,
      isFilterBarShown,
      showSearchBar,
      canDownloadCsv,
      canToggleSearch
    ) => {
      const optionItems = [];
      if (isChartBuilderAvailable) {
        optionItems.push({
          type: OptionType.CHART_BUILDER,
          title: 'Chart Builder',
          icon: dhGraphLineUp,
        });
      }
      optionItems.push({
        type: OptionType.VISIBILITY_ORDERING_BUILDER,
        title: 'Column Visibility & Ordering',
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
          title: 'Manage Custom Columns',
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
      optionItems.push({
        type: OptionType.ADVANCED_SETTINGS,
        title: 'Advanced Settings',
        icon: vsTools,
      });
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

      return optionItems;
    },
    { max: 1 }
  );

  getCachedHiddenColumns = memoize(hiddenColumns => hiddenColumns, {
    max: 1,
    normalizer: ([hiddenColumns]) => hiddenColumns.join(),
  });

  getAggregationMap = memoize((columns, aggregations) => {
    const aggregationMap = {};
    aggregations.forEach(({ operation, selected, invert }) => {
      aggregationMap[operation] = AggregationUtils.getOperationColumnNames(
        columns,
        operation,
        selected,
        invert
      );
    });
    return aggregationMap;
  });

  getOperationMap = memoize((columns, aggregations) => {
    const operationMap = {};
    aggregations
      .filter(a => !AggregationUtils.isRollupOperation(a.operation))
      .forEach(({ operation, selected, invert }) => {
        AggregationUtils.getOperationColumnNames(
          columns,
          operation,
          selected,
          invert
        ).forEach(name => {
          const newOperations = [...(operationMap[name] ?? []), operation];
          operationMap[name] = newOperations;
        });
      });
    return operationMap;
  });

  getOperationOrder = memoize(aggregations =>
    aggregations
      .map(a => a.operation)
      .filter(o => !AggregationUtils.isRollupOperation(o))
  );

  getCachedFormatColumns = memoize((columns, rules) =>
    getFormatColumns(columns, rules)
  );

  // customColumns arg is needed to invalidate the cache
  // eslint-disable-next-line no-unused-vars
  getCachedModelColumns = memoize((model, customColumns) => model.columns);

  /**
   * Builds formatColumns array based on the provided formatting rules with optional preview
   * @param {Column[]} columns Array of columns
   * @param {FormattingRule[]} rulesParam Array of formatting rules
   * @param {FormattingRule?} preview Optional temporary formatting rule for previewing live changes
   * @param {Number|null} editIndex Index in the rulesParam array to replace with the preview, null if preview not applicable
   * @returns {CustomColumn[]} Format columns array
   */
  getCachedPreviewFormatColumns = memoize(
    (columns, rulesParam, preview, editIndex) => {
      log.debug(
        'getCachedPreviewFormatColumns',
        rulesParam,
        preview,
        editIndex
      );
      if (preview !== undefined && editIndex !== null) {
        const rules = [...rulesParam];
        rules[editIndex] = preview;
        return this.getCachedFormatColumns(columns, rules);
      }

      return this.getCachedFormatColumns(columns, rulesParam);
    }
  );

  getModelRollupConfig = memoize(
    (originalColumns, config, aggregationSettings) =>
      IrisGridUtils.getModelRollupConfig(
        originalColumns,
        config,
        aggregationSettings
      )
  );

  getModelTotalsConfig = memoize((columns, config, aggregationSettings) => {
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
  });

  getCachedStateOverride = memoize(
    (
      hoverSelectColumn,
      isFilterBarShown,
      isSelectingColumn,
      loadingScrimProgress,
      quickFilters,
      advancedFilters,
      sorts,
      reverseType,
      rollupConfig
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
    }),
    { max: 1 }
  );

  getCachedFilter = memoize(
    (
      customFilters,
      quickFilters,
      advancedFilters,
      partitionFilters,
      searchFilter
    ) => [
      ...customFilters,
      ...partitionFilters,
      ...IrisGridUtils.getFiltersFromFilterMap(quickFilters),
      ...IrisGridUtils.getFiltersFromFilterMap(advancedFilters),
      ...(searchFilter ? [searchFilter] : []), // null check
    ],
    { max: 1 }
  );

  getCachedTheme = memoize(
    (theme, isEditable) => ({
      ...IrisGridTheme,
      autoSelectRow: !isEditable,
      ...theme,
    }),
    { max: 1 }
  );

  getValueForCell(columnIndex, rowIndex, rawValue = false) {
    const { model } = this.props;
    const modelColumn = this.getModelColumn(columnIndex);
    const modelRow = this.getModelRow(rowIndex);
    if (rawValue) {
      return model.valueForCell(modelColumn, modelRow);
    }
    return model.textForCell(modelColumn, modelRow);
  }

  getModelColumn(columnIndex) {
    const { metrics } = this.state;
    const { modelColumns } = metrics;
    if (!modelColumns) {
      return null;
    }

    return modelColumns.get(columnIndex);
  }

  getModelRow(rowIndex) {
    const { metrics } = this.state;
    const { modelRows } = metrics;
    if (!modelRows) {
      return null;
    }

    return modelRows.get(rowIndex);
  }

  getTheme() {
    const { model, theme } = this.props;
    return this.getCachedTheme(theme, model.isEditable);
  }

  getVisibleColumn(modelIndex) {
    const { movedColumns } = this.state;
    return GridUtils.getVisibleIndex(modelIndex, movedColumns);
  }

  /**
   * Applies the provided input filters as quick filters,
   * and clears any existing quickFilters or advancedFilters on that column
   * @param {inputFilter[]} inputFilters Array of input filters to apply
   * @param {boolean} replaceExisting If true, new filters will replace the existing ones, instead of merging
   */
  applyInputFilters(inputFilters, replaceExisting = false) {
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
   * @param {number} modelIndex The index in the model of the column to set
   * @param {string} value The string value to set to the quick filter
   * @param {Map} quickFilters The quick filters map
   * @returns {boolean} True if the filters have changed because this quick filter was applied
   */
  applyQuickFilter(modelIndex, value, quickFilters) {
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
        filter: IrisGrid.makeQuickFilter(column, value, formatter.timeZone),
      });
      return true;
    }
    return quickFilters.delete(modelIndex);
  }

  setAdvancedFilter(modelIndex, filter, options) {
    if (modelIndex == null) {
      log.error('Invalid model index to filter on');
      return;
    }

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
   * @param {Number} modelIndex The index in the model for the column this filter is applied to
   * @param {dh.FilterCondition} filter A filter to apply to the column, or null if there was an error
   * @param {String} text The original text the filter was created with
   */
  setQuickFilter(modelIndex, filter, text) {
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
   * @param {Map<string, Object>} filterMap Filter map
   */
  setFilterMap(filterMap) {
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
    filterMap.forEach(({ columnType, text, value }, columnName) => {
      const column = model.columns.find(
        c => c.name === columnName && c.type === columnType
      );
      if (column == null) {
        return;
      }
      const columnIndex = model.getColumnIndexByName(column.name);
      if (value === null) {
        this.setQuickFilter(columnIndex, column.filter().isNull(), '=null');
      } else {
        const filterValue = TableUtils.isTextType(columnType)
          ? dh.FilterValue.ofString(value)
          : dh.FilterValue.ofNumber(value);
        this.setQuickFilter(
          columnIndex,
          column.filter().eq(filterValue),
          `${text}`
        );
      }
    });
  }

  removeColumnFilter(modelColumn) {
    this.startLoading('Filtering...', true);

    this.setState(({ advancedFilters, quickFilters }) => {
      const newAdvancedFilters = new Map(advancedFilters);
      const newQuickFilters = new Map(quickFilters);
      newQuickFilters.delete(modelColumn);
      newAdvancedFilters.delete(modelColumn);

      return {
        quickFilters: newQuickFilters,
        advancedFilters: newAdvancedFilters,
      };
    });
  }

  clearAllFilters() {
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
      searchFilter: null,
    });
  }

  clearCrossColumSearch() {
    log.debug('Clearing cross-column search');

    this.setState({
      searchValue: '',
      searchFilter: null,
    });
  }

  clearGridInputField() {
    if (this.filterInputRef.current != null) {
      this.filterInputRef.current.setValue('');
    }
  }

  /**
   * Rebuilds all the current filters. Necessary if something like the time zone has changed.
   */
  rebuildFilters() {
    log.debug('Rebuilding filters');

    const { model } = this.props;
    const { advancedFilters, quickFilters } = this.state;
    const { columns, formatter } = model;

    const newAdvancedFilters = new Map();
    const newQuickFilters = new Map();

    advancedFilters.forEach((value, key) => {
      const { options } = value;
      const column = columns[key];
      const filter = TableUtils.makeAdvancedFilter(
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
        filter: IrisGrid.makeQuickFilter(column, text, formatter.timeZone),
      });
    });

    this.startLoading('Rebuilding filters...', true);
    this.setState({
      quickFilters: newQuickFilters,
      advancedFilters: newAdvancedFilters,
    });
  }

  setFilters({ quickFilters, advancedFilters }) {
    this.setState({
      quickFilters,
      advancedFilters,
    });
  }

  updateFormatterSettings(settings, forceUpdate = true) {
    const globalColumnFormats = FormatterUtils.getColumnFormats(settings);
    const dateTimeFormatterOptions = FormatterUtils.getDateTimeFormatterOptions(
      settings
    );
    const {
      defaultDecimalFormatOptions = {},
      defaultIntegerFormatOptions = {},
      truncateNumbersWithPound = false,
    } = settings;

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
      defaultDecimalFormatOptions
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
      alwaysFetchColumns,
      columns,
      floatingLeftColumnCount,
      floatingRightColumnCount
    ) => {
      let floatingLeftColumns = [];
      let floatingRightColumns = [];

      if (floatingLeftColumnCount) {
        floatingLeftColumns = columns
          .slice(0, floatingLeftColumnCount)
          .map(col => col.name);
      }

      if (floatingRightColumnCount) {
        floatingRightColumns = columns
          .slice(-floatingRightColumnCount)
          .map(col => col.name);
      }

      const columnSet = new Set([
        ...alwaysFetchColumns,
        ...floatingLeftColumns,
        ...floatingRightColumns,
      ]);

      return [...columnSet];
    }
  );

  updateFormatter(updatedFormats, forceUpdate = true) {
    const { customColumnFormatMap } = this.state;
    const update = {
      customColumnFormatMap,
      ...updatedFormats,
    };
    const mergedColumnFormats = [
      ...this.globalColumnFormats,
      ...update.customColumnFormatMap.values(),
    ];
    const formatter = new Formatter(
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

  initFormatter() {
    const { settings } = this.props;
    this.updateFormatterSettings(settings);
  }

  initState() {
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

  async loadPartitionsTable(partitionColumn) {
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

  updatePartition(partition, partitionColumn) {
    const partitionFilter = partitionColumn
      .filter()
      .eq(dh.FilterValue.ofString(partition));
    const partitionFilters = [partitionFilter];
    this.setState({
      partition,
      partitionFilters,
    });
  }

  copyCell(columnIndex, rowIndex, rawValue = false) {
    const { canCopy } = this.props;
    if (canCopy) {
      const value = this.getValueForCell(columnIndex, rowIndex, rawValue);
      ContextActionUtils.copyToClipboard(value).catch(e =>
        log.error('Unable to copy cell', e)
      );
    } else {
      log.error('Attempted to copyCell for user without copy permission.');
    }
  }

  /**
   * Copy the provided ranges to the clipboard
   * @param {GridRange[]} ranges The ranges to copy
   * @param {boolean} includeHeaders Include the headers or not
   * @param {boolean} formatValues Whether to format values or not
   * @param {string|null} error Error message if one occurred
   */
  copyRanges(
    ranges,
    includeHeaders = false,
    formatValues = true,
    error = null
  ) {
    const { model, canCopy } = this.props;
    const { metricCalculator, movedColumns } = this.state;
    const { userColumnWidths } = metricCalculator;

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

  startLoading(loadingText, resetRanges = false) {
    this.setState({ loadingText });

    const theme = this.getTheme();

    if (resetRanges && this.grid) {
      this.grid.clearSelectedRanges();
      this.grid.setViewState({ top: 0 }, true);
    }

    if (this.loadingScrimStartTime == null) {
      const { minScrimTransitionTime, maxScrimTransitionTime } = theme;
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

  stopLoading() {
    this.loadingScrimStartTime = null;
    this.loadingScrimFinishTime = null;
    this.setState({
      loadingText: null,
      loadingScrimProgress: null,
      loadingSpinnerShown: false,
    });

    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
      this.loadingTimer = null;
    }
  }

  /**
   * Rolls back the table state to the last known safe state, or if that's not available then clears all sorts/filters/custom columns.
   */
  rollback() {
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
        rollupConfig: null,
        selectDistinctColumns: [],
        sorts: [],
      });
    }
  }

  /**
   * Check if we can rollback the current state to a safe state.
   * @returns {boolean} true if there's a previously known safe state or if some of the current state isn't empty.
   */
  canRollback() {
    return this.lastLoadedConfig != null || !isEmptyConfig(this.state);
  }

  startListening(model) {
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

  stopListening(model) {
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

  focus() {
    if (this.grid) this.grid.focus();
  }

  focusFilterBar(column) {
    const { model } = this.props;
    const { columnCount } = model;
    const modelColumn = this.getModelColumn(column);

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
    const { gridX, left, rightVisible, lastLeft } = metrics;
    if (column < left) {
      this.grid.setViewState({ left: column }, true);
    } else if (rightVisible < column) {
      const metricState = this.grid.getMetricState();
      const newLeft = metricCalculator.getLastLeft(metricState, column, gridX);
      this.grid.setViewState({ left: Math.min(newLeft, lastLeft) }, true);
    }
    this.lastFocusedFilterBarColumn = column;
    this.setState({ focusedFilterBarColumn: column, isFilterBarShown: true });
  }

  hideColumnByVisibleIndex(columnVisibleIndex) {
    const { metricCalculator, movedColumns } = this.state;
    metricCalculator.setColumnWidth(
      GridUtils.getModelIndex(columnVisibleIndex, movedColumns),
      0
    );

    this.grid.forceUpdate();
  }

  freezeColumnByColumnName(columnName) {
    const { frozenColumns, movedColumns } = this.state;
    const { model } = this.props;
    log.debug2('freezing column', columnName);

    const allFrozenColumns =
      frozenColumns == null
        ? new Set(model.layoutHints?.frozenColumns)
        : new Set(frozenColumns);

    allFrozenColumns.add(columnName);

    const modelIndex = model.getColumnIndexByName(columnName);
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

  unFreezeColumnByColumnName(columnName) {
    const { frozenColumns, movedColumns } = this.state;
    const { model } = this.props;
    log.debug2('unfreezing column', columnName);

    const allFrozenColumns =
      frozenColumns == null
        ? new Set(model.layoutHints?.frozenColumns)
        : new Set(frozenColumns);

    allFrozenColumns.delete(columnName);

    const modelIndex = model.getColumnIndexByName(columnName);
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

  handleColumnVisibilityChanged(modelIndexes, visibilityOption) {
    const { metricCalculator } = this.state;
    if (
      visibilityOption === VisibilityOrderingBuilder.VISIBILITY_OPTIONS.SHOW
    ) {
      modelIndexes.forEach(modelIndex => {
        metricCalculator.resetColumnWidth(modelIndex);
      });
    } else {
      modelIndexes.forEach(modelIndex => {
        metricCalculator.setColumnWidth(modelIndex, 0);
      });
    }
    this.grid.forceUpdate();
  }

  handleCrossColumnSearch(
    searchValue,
    selectedSearchColumns,
    invertSearchColumns
  ) {
    const { model } = this.props;

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

  updateSearchFilter(
    searchValue,
    selectedSearchColumns,
    columns,
    invertSearchColumns
  ) {
    const searchFilter = CrossColumnSearch.createSearchFilter(
      searchValue,
      selectedSearchColumns,
      columns,
      invertSearchColumns
    );
    this.setState({ searchFilter });
  }

  handleAnimationLoop() {
    this.grid.updateCanvasScale();
    this.grid.updateCanvas();

    if (this.isAnimating) {
      this.animationFrame = requestAnimationFrame(this.handleAnimationLoop);
    }
  }

  handleAnimationStart() {
    log.debug2('handleAnimationStart');

    this.isAnimating = true;

    this.animationFrame = requestAnimationFrame(this.handleAnimationLoop);
  }

  handleAnimationEnd() {
    log.debug2('handleAnimationEnd');

    this.isAnimating = false;
  }

  handlePartitionAppend(value) {
    const { onPartitionAppend } = this.props;
    const { partitionColumn } = this.state;
    onPartitionAppend(partitionColumn, value);
  }

  handlePartitionChange(partition) {
    const { partitionColumn } = this.state;
    this.updatePartition(partition, partitionColumn);
  }

  handlePartitionFetchAll() {
    this.setState({
      partitionFilters: [],
      isSelectingPartition: false,
    });
  }

  handlePartitionDone() {
    this.setState({ isSelectingPartition: false });
  }

  handleTableLoadError(error) {
    if (PromiseUtils.isCanceled(error)) {
      return;
    }

    log.error(error);

    const { onError } = this.props;
    onError(error);
  }

  showAllColumns() {
    const { metricCalculator } = this.state;
    const { userColumnWidths } = metricCalculator;
    const entries = [...userColumnWidths.entries()];
    for (let i = 0; i < entries.length; i += 1) {
      const [modelIndex, columnWidth] = entries[i];
      if (columnWidth === 0) {
        metricCalculator.resetColumnWidth(modelIndex);
      }
    }
    this.grid.forceUpdate();
  }

  toggleSort(columnIndex, addToExisting) {
    log.info('Toggling sort for column', columnIndex);

    const { model } = this.props;
    const { sorts: currentSorts } = this.state;
    const modelColumn = this.getModelColumn(columnIndex);
    const sorts = TableUtils.toggleSortForColumn(
      currentSorts,
      model.table,
      modelColumn,
      addToExisting
    );
    this.updateSorts(sorts);
  }

  updateSorts(sorts) {
    this.startLoading('Sorting...');
    this.setState({ sorts });
    this.grid.forceUpdate();
  }

  sortColumn(modelColumn, direction, isAbs = false, addToExisting = false) {
    const { model } = this.props;
    const sorts = TableUtils.sortColumn(
      model.table,
      modelColumn,
      direction,
      isAbs,
      addToExisting
    );
    this.startLoading('Sorting...');
    this.setState({ sorts });
    this.grid.forceUpdate();
  }

  reverse(reverseType) {
    this.startLoading('Reversing...');
    this.setState({ reverseType });
    this.grid.forceUpdate();
  }

  isReversible() {
    const { model } = this.props;
    return model.isReversible;
  }

  toggleFilterBar(focusIndex = this.lastFocusedFilterBarColumn) {
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
      this.grid.focus();
    }
  }

  isTableSearchAvailable() {
    const { model, canToggleSearch } = this.props;
    const searchDisplayMode = model?.layoutHints?.searchDisplayMode;

    if (searchDisplayMode === dh.SearchDisplayMode?.SEARCH_DISPLAY_HIDE) {
      return false;
    }
    if (searchDisplayMode === dh.SearchDisplayMode?.SEARCH_DISPLAY_SHOW) {
      return true;
    }

    return canToggleSearch;
  }

  toggleSearchBar() {
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
        if (update && this.crossColumnRef.current) {
          this.crossColumnRef.current.focus();
        } else {
          this.grid.focus();
        }
      }
    );
  }

  async commitPending() {
    const { model } = this.props;
    if (!model.isEditable) {
      throw new Error('Cannot save, table is not editable');
    }

    const { pendingSavePromise } = this.state;
    if (pendingSavePromise != null) {
      throw new Error('Save already in progress');
    }

    if (document.activeElement.classList.contains('grid-cell-input-field')) {
      if (document.activeElement.classList.contains('error')) {
        throw new ValidationError('Current input is invalid');
      }

      // Focus the grid again to commit any pending input changes
      this.grid.focus();
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

  async discardPending() {
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
   * @param {dh.Column} column The column in this table to link
   */
  selectColumn(column) {
    const { onColumnSelected } = this.props;
    onColumnSelected(column);
  }

  /**
   * Select all the data for a given row and notify listener
   */
  selectData(columnIndex, rowIndex) {
    const { model } = this.props;
    const { columns } = model;
    const dataMap = {};
    for (let i = 0; i < columns.length; i += 1) {
      const column = columns[i];
      const { name, type } = column;
      const value = model.valueForCell(i, rowIndex);
      const text = model.textForCell(i, rowIndex);
      dataMap[name] = { value, text, type };
    }

    const { onDataSelected } = this.props;
    onDataSelected(rowIndex, dataMap);
  }

  handleAdvancedFilterChange(column, filter, options) {
    const { model } = this.props;
    this.setAdvancedFilter(
      model.getColumnIndexByName(column.name),
      filter,
      options
    );
  }

  handleAdvancedFilterSortChange(column, direction, addToExisting = false) {
    const { model } = this.props;
    const columnIndex = model.getColumnIndexByName(column.name);
    const oldSort = TableUtils.getSortForColumn(model.sort, columnIndex);
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
      columnIndex,
      newSort,
      addToExisting
    );
    log.info('Setting table sorts', sorts);

    this.startLoading('Sorting...');
    this.setState({ sorts });

    this.grid.forceUpdate();
  }

  handleAdvancedFilterDone() {
    this.grid.focus();
  }

  handleAdvancedMenuOpened(column) {
    this.setState({ shownAdvancedFilter: column });
  }

  handleAdvancedMenuClosed(columnIndex) {
    const { focusedFilterBarColumn, isFilterBarShown } = this.state;
    if (
      isFilterBarShown &&
      focusedFilterBarColumn === columnIndex &&
      this.filterInputRef.current !== null
    ) {
      this.filterInputRef.current.focus();
      this.setState({ shownAdvancedFilter: null });
    } else {
      this.setState({
        focusedFilterBarColumn: null,
        shownAdvancedFilter: null,
      });
    }
  }

  handleCancel() {
    this.rollback();
  }

  // eslint-disable-next-line class-methods-use-this
  handleChartChange() {
    // TODO: IDS-4242 Update Chart Preview
  }

  handleChartCreate(settings) {
    const { model, onCreateChart } = this.props;
    onCreateChart(settings, model);
  }

  handleGridError(error) {
    log.warn('Grid Error', error);
    this.setState({
      toastMessage: <div className="error-message">{`${error}`}</div>,
    });
  }

  handleFilterBarChange(value) {
    this.startLoading('Filtering...', true);

    this.setState(({ focusedFilterBarColumn, quickFilters }) => {
      const newQuickFilters = new Map(quickFilters);
      const modelIndex = this.getModelColumn(focusedFilterBarColumn);
      this.applyQuickFilter(modelIndex, value, newQuickFilters);
      return { quickFilters: newQuickFilters };
    });
  }

  handleFilterBarDone(setGridFocus = true, defocusInput = true) {
    if (setGridFocus) {
      this.grid.focus();
    }
    if (defocusInput) {
      this.setState({ focusedFilterBarColumn: null });
    }
  }

  handleFilterBarTab(backward) {
    const { focusedFilterBarColumn } = this.state;
    if (backward) {
      this.focusFilterBar(focusedFilterBarColumn - 1);
    } else {
      this.focusFilterBar(focusedFilterBarColumn + 1);
    }
  }

  handleFormatSelection(modelIndex, selectedFormat) {
    const { model } = this.props;
    const column = model.columns[modelIndex];
    const { customColumnFormatMap: prevCustomColumnFormatMap } = this.state;
    const customColumnFormatMap = new Map(prevCustomColumnFormatMap);

    if (selectedFormat) {
      const normalizedType = TableUtils.getNormalizedType(column.type);
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

  handleMenu() {
    this.setState({ isMenuShown: true });
  }

  handleMenuClose() {
    this.setState({ isMenuShown: false, openOptions: [] });
  }

  handleMenuBack() {
    this.setState(({ openOptions }) => {
      const newOptions = [...openOptions];
      newOptions.pop();
      return { openOptions: newOptions };
    });
  }

  handleMenuSelect(option) {
    this.setState(({ openOptions }) => ({
      openOptions: [...openOptions, option],
    }));
  }

  handleRequestFailed(event) {
    log.error('request failed:', event.detail);
    this.stopLoading();
    if (this.canRollback()) {
      this.startLoading('Rolling back changes...', true);
      this.rollback();
    } else {
      log.error('Table failed and unable to rollback');
      const { onError } = this.props;
      onError(new Error(`Error displaying table: ${event.detail}`));
    }
  }

  handleUpdate() {
    this.stopLoading();
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

    this.grid.forceUpdate();
  }

  handleViewChanged(metrics) {
    const { model } = this.props;
    const { bottomViewport } = metrics;
    const { selectionEndRow = 0 } = this.grid?.state ?? {};
    let pendingRowCount = 0;
    if (model.isEditable) {
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

  handleSelectionChanged(selectedRanges) {
    const { onSelectionChanged } = this.props;
    const { copyOperation } = this.state;
    this.setState({ selectedRanges });
    if (copyOperation != null) {
      this.setState({ copyOperation: null });
    }
    onSelectionChanged(selectedRanges);
  }

  handleMovedColumnsChanged(movedColumns, onChangeApplied = () => {}) {
    this.setState({ movedColumns }, onChangeApplied);
  }

  handleTooltipRef(tooltip) {
    // Need to start the timer right away, since we're creating the tooltip when we want the timer to start
    if (tooltip) {
      tooltip.startTimer();
    }

    this.tooltip = tooltip;
  }

  handleConditionalFormatsChange(conditionalFormats) {
    log.debug('Updated conditional formats', conditionalFormats);
    this.setState({ conditionalFormats });
  }

  handleConditionalFormatCreate() {
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

  handleConditionalFormatEdit(index) {
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
  handleConditionalFormatEditorUpdate(conditionalFormatPreview) {
    this.setState({ conditionalFormatPreview });
  }

  handleConditionalFormatEditorSave(config) {
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

  handleConditionalFormatEditorCancel() {
    this.handleMenuBack();
    // Not resetting conditionalFormatPreview here
    // to prevent editor fields change during the menu transition
    this.setState({ conditionalFormatEditIndex: null });
  }

  handleUpdateCustomColumns(customColumns) {
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
      const newSelectDistinctColumns = IrisGridUtils.removeColumnsFromSelectDistinctColumns(
        selectDistinctColumns,
        removedColumnNames
      );
      if (newSorts.length !== sorts) {
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

    this.setState({ customColumns, top: 0 });
    this.startLoading('Applying custom columns...');
  }

  handleCustomColumnsChanged() {
    log.debug('custom columns changed');
    const { isReady } = this.state;
    if (isReady) {
      this.stopLoading();
      this.grid.forceUpdate();
    } else {
      this.initState();
    }
  }

  handlePendingCommitClicked() {
    return this.commitPending();
  }

  handlePendingDiscardClicked() {
    return this.discardPending();
  }

  handlePendingDataUpdated() {
    log.debug('pending data updated');
    const { model } = this.props;
    const { pendingDataMap, pendingDataErrors } = model;
    this.setState({
      pendingDataMap,
      pendingDataErrors,
      pendingSaveError: null,
    });
    this.grid.forceUpdate();
  }

  /**
   * User added, removed, or changed the order of aggregations, or position
   * @param {AggregationSettings} aggregationSettings The new aggregation settings
   */
  handleAggregationsChange(aggregationSettings) {
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
   * @param {Aggregation} aggregation The new aggregation
   */
  handleAggregationChange(aggregation) {
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
   * @param {Aggregation} aggregation The aggregation to edit
   */
  handleAggregationEdit(aggregation) {
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

  handleRollupChange(rollupConfig) {
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
      sorts: [],
      reverseType: TableUtils.REVERSE_TYPE.NONE,
      selectDistinctColumns: [],
    });
  }

  handleSelectDistinctChanged(columnNames) {
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

  handleDownloadTableStart() {
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

  handleDownloadTable(...args) {
    const { canDownloadCsv } = this.props;
    if (canDownloadCsv) {
      log.info('start table downloading', ...args);
      this.setState(() => {
        if (this.tableSaver) {
          this.tableSaver.startDownload(...args);
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

  handleCancelDownloadTable() {
    this.tableSaver.cancelDownload();
    this.setState({ isTableDownloading: false });
  }

  handleDownloadProgressUpdate(
    tableDownloadProgress,
    tableDownloadEstimatedTime
  ) {
    const { tableDownloadStatus } = this.state;
    if (tableDownloadStatus === TableCsvExporter.DOWNLOAD_STATUS.DOWNLOADING) {
      this.setState({
        tableDownloadProgress,
        tableDownloadEstimatedTime,
      });
    }
  }

  handleDownloadCompleted() {
    this.setState({
      isTableDownloading: false,
      tableDownloadProgress: 100,
      tableDownloadStatus: TableCsvExporter.DOWNLOAD_STATUS.FINISHED,
    });
  }

  handleDownloadCanceled() {
    this.setState({
      isTableDownloading: false,
      tableDownloadProgress: 0,
      tableDownloadStatus: TableCsvExporter.DOWNLOAD_STATUS.CANCELED,
    });
  }

  /**
   * Delete the specified ranges from the table.
   * @param {GridRange[]} ranges The ranges to delete
   */
  deleteRanges(ranges) {
    const { model } = this.props;
    this.pending.add(model.delete(ranges)).catch(e => {
      if (!PromiseUtils.isCanceled(e)) {
        log.error('Unable to delete ranges', ranges, e);
      }
    });
  }

  resetColumnSelection() {
    if (this.grid == null) {
      return;
    }
    const { isSelectingColumn } = this.props;
    if (isSelectingColumn) {
      const { columnAllowedCursor } = this.props;
      this.grid.setState({ cursor: columnAllowedCursor });
    } else {
      this.grid.setState({ cursor: Grid.CURSOR_TYPE_DEFAULT });
      this.setState({ hoverSelectColumn: null });
    }
  }

  resetGridViewState(forceUpdate = true) {
    if (!this.grid) {
      return;
    }

    this.grid.clearSelectedRanges();
    this.grid.setViewState(
      { left: 0, top: 0, topOffset: 0, leftOffset: 0 },
      forceUpdate
    );
  }

  sendStateChange() {
    if (!this.grid) {
      return;
    }
    const { state: irisGridState } = this;
    const { state: gridState } = this.grid;
    const { onStateChange } = this.props;

    onStateChange(irisGridState, gridState);
  }

  handleOverflowClose() {
    this.setState({
      showOverflowModal: false,
    });
  }

  getColumnBoundingRect() {
    const { metrics, shownColumnTooltip } = this.state;
    const gridRect = this.gridWrapper.getBoundingClientRect();
    const popperMargin = 20;
    const {
      columnHeaderHeight,
      visibleColumnXs,
      visibleColumnWidths,
      width,
    } = metrics;
    const columnX = visibleColumnXs.get(shownColumnTooltip);
    const columnWidth = visibleColumnWidths.get(shownColumnTooltip);
    return {
      top: gridRect.top,
      left:
        gridRect.left +
        clamp(columnX + columnWidth / 2, popperMargin, width - popperMargin),
      bottom: gridRect.top + columnHeaderHeight,
      right:
        gridRect.left +
        clamp(columnX + columnWidth / 2, popperMargin, width - popperMargin) +
        1,
      width: 1,
      height: columnHeaderHeight,
    };
  }

  getOverflowButtonTooltip = memoize(overflowButtonTooltipProps => {
    if (overflowButtonTooltipProps == null) {
      return null;
    }

    const wrapperStyle = {
      position: 'absolute',
      ...overflowButtonTooltipProps,
      pointerEvents: 'none',
    };

    const popperOptions = {
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
  });

  render() {
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
      showOverflowModal,
      overflowText,
      overflowButtonTooltipProps,
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

    const { userColumnWidths } = metricCalculator;
    const stateOverride = this.getCachedStateOverride(
      hoverSelectColumn,
      isFilterBarShown,
      isSelectingColumn,
      loadingScrimProgress,
      quickFilters,
      advancedFilters,
      sorts,
      reverseType,
      rollupConfig
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
      const { gridX, gridY, visibleColumnXs, visibleColumnWidths } = metrics;
      const columnX = visibleColumnXs.get(focusedFilterBarColumn);
      const columnWidth = visibleColumnWidths.get(focusedFilterBarColumn);
      if (columnX != null && columnWidth != null) {
        const x = gridX + columnX;
        const y = gridY - theme.filterBarHeight;
        const fieldWidth = columnWidth + 1; // cover right border
        const fieldHeight = theme.filterBarHeight - 1; // remove bottom border
        const style = {
          top: y,
          left: x,
          minWidth: fieldWidth,
          height: fieldHeight,
        };
        let value = '';
        let isValid = true;
        const modelColumn = this.getModelColumn(focusedFilterBarColumn);
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
            onContextMenu={this.grid.handleContextMenu}
            debounceMs={debounceMs}
            value={value}
          />
        );
      }
    }

    let loadingElement = null;
    if (loadingText != null) {
      const loadingStatus = (
        <div className="iris-grid-loading-status">{loadingText}</div>
      );
      const loader = <DeephavenSpinner show={loadingSpinnerShown} />;
      const cancelButton = (
        <button
          type="button"
          onClick={this.handleCancel}
          className={classNames(
            'btn btn-secondary btn-cancelable iris-grid-btn-cancel',
            {
              show: loadingSpinnerShown,
            }
          )}
        >
          Cancel
        </button>
      );

      const gridY = metrics ? metrics.gridY : 0;
      loadingElement = (
        <div className="iris-grid-loading" style={{ top: gridY }}>
          {loadingStatus}
          {loader}
          {cancelButton}
        </div>
      );
    }

    let columnTooltip = null;
    if (shownColumnTooltip != null && metrics && this.gridWrapper) {
      const {
        columnHeaderHeight,
        visibleColumnXs,
        visibleColumnWidths,
        width,
      } = metrics;
      const columnX = visibleColumnXs.get(shownColumnTooltip);
      const columnWidth = visibleColumnWidths.get(shownColumnTooltip);

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

      const wrapperStyle = {
        position: 'absolute',
        top: 0,
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
      const virtualReference = {
        clientWidth: 1,
        clientHeight: columnHeaderHeight,
        getBoundingClientRect: this.getColumnBoundingRect,
      };

      const popperOptions = {
        placement: 'bottom',
        modifiers: {
          flip: {
            behavior: ['bottom', 'top'],
          },
        },
      };

      const modelColumn = this.getModelColumn(shownColumnTooltip);
      const column = model.columns[modelColumn];

      if (column != null) {
        columnTooltip = (
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
                  if (this.tooltip) this.tooltip.update();
                }}
              />
            </Tooltip>
          </div>
        );

        // #510 We may need to update the position of the tooltip if it's already opened and columns are resized
        this.tooltip?.update();
      }
    }

    const filterBar = [];
    if (metrics && isFilterBarShown) {
      const {
        gridX,
        gridY,
        visibleColumns,
        visibleColumnXs,
        visibleColumnWidths,
      } = metrics;
      const { filterBarHeight } = theme;

      for (let i = 0; i < visibleColumns.length; i += 1) {
        const columnIndex = visibleColumns[i];

        const columnX = visibleColumnXs.get(columnIndex);
        const columnWidth = visibleColumnWidths.get(columnIndex);
        const modelColumn = this.getModelColumn(columnIndex);
        const isFilterable = model.isFilterable(modelColumn);
        if (
          isFilterable &&
          columnX != null &&
          columnWidth != null &&
          columnWidth > 0
        ) {
          const x = gridX + columnX + columnWidth - 24;
          const y = gridY - filterBarHeight + 2; // 2 acts as top margin for the button
          const style = {
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
                <button
                  type="button"
                  className={classNames(
                    'btn btn-link btn-link-icon advanced-filter-button',
                    {
                      'filter-set': isFilterSet,
                    }
                  )}
                  onClick={() => {
                    this.setState({ shownAdvancedFilter: columnIndex });
                  }}
                  onContextMenu={event => {
                    this.grid.handleContextMenu(event);
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
                    <FontAwesomeIcon icon={vsFilter} className="filter-light" />
                  </div>
                </button>
              )}
            </div>
          );
          filterBar.push(element);
        }
      }
    }
    const advancedFilterMenus = [];
    if (metrics) {
      const {
        gridX,
        visibleColumns,
        visibleColumnXs,
        visibleColumnWidths,
        columnHeaderHeight,
      } = metrics;
      for (let i = 0; i < visibleColumns.length; i += 1) {
        const columnIndex = visibleColumns[i];
        const columnX = visibleColumnXs.get(columnIndex);
        const columnWidth = visibleColumnWidths.get(columnIndex);
        if (columnX != null && columnWidth != null && columnWidth > 0) {
          const xColumnHeader = gridX + columnX;
          const xFilterBar = gridX + columnX + columnWidth - 20;
          const style = isFilterBarShown
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
          const column = model.columns[modelColumn];
          const advancedFilter = advancedFilters.get(modelColumn);
          const { options: advancedFilterOptions } = advancedFilter || {};
          const sort = TableUtils.getSortForColumn(model.sort, modelColumn);
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

    const optionItems = this.getCachedOptionItems(
      onCreateChart !== undefined && model.isChartBuilderAvailable,
      model.isCustomColumnsAvailable,
      model.isFormatColumnsAvailable,
      model.isRollupAvailable,
      model.isTotalsAvailable,
      model.isSelectDistinctAvailable,
      model.isExportAvailable,
      this.toggleFilterBarAction,
      this.toggleSearchBarAction,
      isFilterBarShown,
      showSearchBar,
      canDownloadCsv,
      this.isTableSearchAvailable()
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
              userColumnWidths={userColumnWidths}
              onColumnVisibilityChanged={this.handleColumnVisibilityChanged}
              onMovedColumnsChanged={this.handleMovedColumnsChanged}
              key={OptionType.VISIBILITY_ORDERING_BUILDER}
            />
          );
        case OptionType.CONDITIONAL_FORMATTING:
          return (
            <ConditionalFormattingMenu
              columns={model.columns}
              rules={conditionalFormats}
              onChange={this.handleConditionalFormatsChange}
              onCreate={this.handleConditionalFormatCreate}
              onSelect={this.handleConditionalFormatEdit}
            />
          );
        case OptionType.CONDITIONAL_FORMATTING_EDIT:
          return (
            <ConditionalFormatEditor
              columns={model.columns}
              rule={conditionalFormatPreview}
              onUpdate={this.handleConditionalFormatEditorUpdate}
              onSave={this.handleConditionalFormatEditorSave}
              onCancel={this.handleConditionalFormatEditorCancel}
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
              metrics={metrics}
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
            <AggregationEdit
              aggregation={selectedAggregation}
              columns={model.originalColumns}
              onChange={this.handleAggregationChange}
            />
          );
        case OptionType.TABLE_EXPORTER:
          return (
            <TableCsvExporter
              model={model}
              name={name}
              isDownloading={isTableDownloading}
              tableDownloadStatus={tableDownloadStatus}
              tableDownloadProgress={tableDownloadProgress}
              tableDownloadEstimatedTime={tableDownloadEstimatedTime}
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
          throw Error('Unexpected option type', option.type);
      }
    });

    const hiddenColumns = this.getCachedHiddenColumns(
      IrisGridUtils.getHiddenColumns(userColumnWidths)
    );

    return (
      <div className="iris-grid" role="presentation">
        <div className="iris-grid-column">
          {children && <div className="iris-grid-bar">{children}</div>}
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
              {partitionTable && partitionColumn && (
                <IrisGridPartitionSelector
                  table={partitionTable}
                  getFormattedString={(...args) => model.displayString(...args)}
                  columnName={partitionColumn.name}
                  partition={partition}
                  onChange={this.handlePartitionChange}
                  onFetchAll={this.handlePartitionFetchAll}
                  onAppend={this.handlePartitionAppend}
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
              isStickyBottom={!model.isEditable}
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
                  model.floatingLeftColumnCount,
                  model.floatingRightColumnCount
                )}
                formatColumns={this.getCachedPreviewFormatColumns(
                  this.getCachedModelColumns(model, customColumns),
                  conditionalFormats,
                  conditionalFormatPreview,
                  // Disable the preview format when we press Back on the format edit page
                  openOptions[openOptions.length - 1]?.type ===
                    OptionType.CONDITIONAL_FORMATTING_EDIT
                    ? conditionalFormatEditIndex
                    : null
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
              />
            )}
            <div
              className={classNames('grid-settings-button', {
                'is-menu-shown': isMenuShown,
              })}
            >
              <button
                type="button"
                data-testid={`btn-iris-grid-settings-button-${name}`}
                className="btn btn-link btn-link-icon"
                onClick={this.handleMenu}
              >
                <FontAwesomeIcon icon={vsMenu} transform="up-1" />
              </button>
            </div>
            {focusField}
            {loadingElement}
            {filterBar}
            {columnTooltip}
            {advancedFilterMenus}
            {this.getOverflowButtonTooltip(overflowButtonTooltipProps)}
          </div>
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
            copyOperation={copyOperation}
            onEntering={this.handleAnimationStart}
            onEntered={this.handleAnimationEnd}
            onExiting={this.handleAnimationStart}
            onExited={this.handleAnimationEnd}
          />
          <TableSaver
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

IrisGrid.propTypes = {
  children: PropTypes.node,
  advancedFilters: PropTypes.instanceOf(Map),
  advancedSettings: PropTypes.instanceOf(Map),
  alwaysFetchColumns: PropTypes.arrayOf(PropTypes.string),
  isFilterBarShown: PropTypes.bool,
  applyInputFiltersOnInit: PropTypes.bool,
  conditionalFormats: PropTypes.arrayOf(PropTypes.shape({})),
  customColumnFormatMap: PropTypes.instanceOf(Map),
  movedColumns: PropTypes.arrayOf(
    PropTypes.shape({
      from: PropTypes.number.isRequired,
      to: PropTypes.number.isRequired,
    })
  ),
  movedRows: PropTypes.arrayOf(
    PropTypes.shape({
      from: PropTypes.number.isRequired,
      to: PropTypes.number.isRequired,
    })
  ),
  inputFilters: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    })
  ),
  customFilters: PropTypes.arrayOf(PropTypes.shape({})),
  model: PropTypes.instanceOf(IrisGridModel).isRequired,
  onCreateChart: PropTypes.func,
  onColumnSelected: PropTypes.func,
  onError: PropTypes.func,
  onDataSelected: PropTypes.func,
  onStateChange: PropTypes.func,
  onPartitionAppend: PropTypes.func,
  onAdvancedSettingsChange: PropTypes.func,
  partition: PropTypes.string,
  partitionColumn: APIPropTypes.Column,
  sorts: PropTypes.arrayOf(PropTypes.shape({})),
  reverseType: PropTypes.string,
  quickFilters: PropTypes.instanceOf(Map),
  customColumns: PropTypes.arrayOf(PropTypes.string),
  selectDistinctColumns: PropTypes.arrayOf(PropTypes.string),
  // These settings come from the redux store
  settings: PropTypes.shape({
    timeZone: PropTypes.string.isRequired,
    defaultDateTimeFormat: PropTypes.string.isRequired,
    showTimeZone: PropTypes.bool.isRequired,
    showTSeparator: PropTypes.bool.isRequired,
    truncateNumbersWithPound: PropTypes.bool.isRequired,
    formatter: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  }),
  userColumnWidths: PropTypes.instanceOf(Map),
  userRowHeights: PropTypes.instanceOf(Map),
  onSelectionChanged: PropTypes.func,
  rollupConfig: PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.string),
    showConstituents: PropTypes.bool,
    showNonAggregatedColumns: PropTypes.bool,
    includeDescriptions: PropTypes.bool,
  }),
  aggregationSettings: PropTypes.shape({
    aggregations: PropTypes.arrayOf(
      PropTypes.shape({
        operation: PropTypes.string.isRequired,
        selected: PropTypes.arrayOf(PropTypes.string).isRequired,
        invert: PropTypes.bool.isRequired,
      })
    ),
    showOnTop: PropTypes.bool,
  }),

  isSelectingColumn: PropTypes.bool,
  isSelectingPartition: PropTypes.bool,
  isStuckToBottom: PropTypes.bool,
  isStuckToRight: PropTypes.bool,

  // eslint-disable-next-line react/no-unused-prop-types
  columnSelectionValidator: PropTypes.func,
  columnAllowedCursor: PropTypes.string,

  // eslint-disable-next-line react/no-unused-prop-types
  columnNotAllowedCursor: PropTypes.string,
  name: PropTypes.string,
  onlyFetchVisibleColumns: PropTypes.bool,

  showSearchBar: PropTypes.bool,
  searchValue: PropTypes.string,
  selectedSearchColumns: PropTypes.arrayOf(PropTypes.string),
  invertSearchColumns: PropTypes.bool,

  // eslint-disable-next-line react/no-unused-prop-types
  onContextMenu: PropTypes.func,

  pendingDataMap: PropTypes.instanceOf(Map),
  getDownloadWorker: PropTypes.func,

  canCopy: PropTypes.bool,
  canDownloadCsv: PropTypes.bool,
  frozenColumns: PropTypes.arrayOf(PropTypes.string),

  // Theme override for IrisGridTheme
  theme: PropTypes.shape({}),

  canToggleSearch: PropTypes.bool,
};

IrisGrid.defaultProps = {
  children: null,
  advancedFilters: new Map(),
  advancedSettings: new Map(),
  alwaysFetchColumns: [],
  conditionalFormats: [],
  customColumnFormatMap: new Map(),
  isFilterBarShown: false,
  applyInputFiltersOnInit: false,
  movedColumns: [],
  movedRows: [],
  inputFilters: [],
  customFilters: [],
  onCreateChart: undefined,
  onColumnSelected: () => {},
  onDataSelected: () => {},
  onError: () => {},
  onStateChange: () => {},
  onPartitionAppend: () => {},
  onAdvancedSettingsChange: () => {},
  partition: null,
  partitionColumn: null,
  quickFilters: new Map(),
  selectDistinctColumns: [],
  sorts: [],
  reverseType: TableUtils.REVERSE_TYPE.NONE,
  customColumns: [],
  aggregationSettings: DEFAULT_AGGREGATION_SETTINGS,
  rollupConfig: null,
  userColumnWidths: new Map(),
  userRowHeights: new Map(),
  onSelectionChanged: () => {},
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
  onContextMenu: () => [],
  pendingDataMap: new Map(),
  getDownloadWorker: undefined,
  settings: {
    timeZone: 'America/New_York',
    defaultDateTimeFormat: DateUtils.FULL_DATE_FORMAT,
    showTimeZone: false,
    showTSeparator: true,
    truncateNumbersWithPound: false,
    formatter: [],
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
  theme: {},
  canToggleSearch: true,
};

export default IrisGrid;
