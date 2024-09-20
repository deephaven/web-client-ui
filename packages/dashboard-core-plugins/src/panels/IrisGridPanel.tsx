// Wrapper for the IrisGrid for use in a golden layout container
// Will probably need to handle window popping out from golden layout here.
import React, {
  PureComponent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import memoize from 'memoize-one';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import {
  type DashboardPanelProps,
  DEFAULT_DASHBOARD_ID,
  LayoutUtils,
  type PanelComponent,
  type PanelMetadata,
} from '@deephaven/dashboard';
import {
  AdvancedSettings,
  IrisGrid,
  type IrisGridType,
  IrisGridModel,
  IrisGridUtils,
  isIrisGridTableModelTemplate,
  type ColumnName,
  type PendingDataMap,
  type InputFilter,
  type IrisGridThemeType,
  type ReadonlyAdvancedFilterMap,
  type AggregationSettings,
  type AdvancedSettingsType,
  type UIRollupConfig,
  type UIRow,
  type ReadonlyQuickFilterMap,
  type FilterMap,
  type QuickFilter,
  type AdvancedFilter,
  type SidebarFormattingRule,
  type IrisGridState,
  type ChartBuilderSettings,
  type DehydratedIrisGridState,
  type DehydratedIrisGridPanelState,
  type ColumnHeaderGroup,
  type IrisGridContextMenuData,
  type PartitionConfig,
} from '@deephaven/iris-grid';
import {
  type AdvancedFilterOptions,
  type FormattingRule,
  type ReverseType,
  TableUtils,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import {
  getSettings,
  getUser,
  type RootState,
  type User,
  type WorkspaceSettings,
} from '@deephaven/redux';
import {
  assertNotNull,
  type CancelablePromise,
  type EventT,
  PromiseUtils,
} from '@deephaven/utils';
import { type ResolvableContextAction } from '@deephaven/components';
import type { dh } from '@deephaven/jsapi-types';
import {
  type GridState,
  type ModelIndex,
  type ModelSizeMap,
  type MoveOperation,
} from '@deephaven/grid';
import type {
  TablePluginComponent,
  TablePluginElement,
} from '@deephaven/plugin';
import { InputFilterEvent, IrisGridEvent } from '../events';
import {
  getInputFiltersForDashboard,
  getLinksForDashboard,
  getColumnSelectionValidatorForDashboard,
} from '../redux';
import WidgetPanel from './WidgetPanel';
import './IrisGridPanel.scss';
import { type Link, type LinkColumn } from '../linker/LinkerUtils';
import IrisGridPanelTooltip from './IrisGridPanelTooltip';
import {
  isIrisGridPanelMetadata,
  isLegacyIrisGridPanelMetadata,
} from './IrisGridPanelTypes';
import { type WidgetPanelDescriptor } from './WidgetPanelTypes';

const log = Log.module('IrisGridPanel');

const DEBOUNCE_PANEL_STATE_UPDATE = 500;

type ModelQueueFunction = (model: IrisGridModel) => void;

type ModelQueue = ModelQueueFunction[];

export interface PanelState {
  gridState: {
    isStuckToBottom: boolean;
    isStuckToRight: boolean;
    movedColumns: {
      from: string | ModelIndex | [string, string] | [ModelIndex, ModelIndex];
      to: string | ModelIndex;
    }[];
    movedRows: MoveOperation[];
  };
  irisGridState: DehydratedIrisGridState;
  irisGridPanelState: DehydratedIrisGridPanelState;
  pluginState: unknown;
}

// Some of the properties in the loaded panel state may be omitted
// even though they can't be undefined in the dehydrated state.
// This can happen when loading the state saved before the properties were added.
type LoadedPanelState = PanelState & {
  irisGridPanelState: PanelState['irisGridPanelState'] & {
    partitions?: (string | null)[];
    partition?: string | null;
  };
};

export interface OwnProps extends DashboardPanelProps {
  children?: ReactNode;
  panelState?: LoadedPanelState | null;
  makeModel: () => IrisGridModel | Promise<IrisGridModel>;

  onStateChange?: (irisGridState: IrisGridState, gridState: GridState) => void;
  onPanelStateUpdate?: (panelState: PanelState) => void;

  /** Override the default worker used by IrisGrid to download CSVs. */
  getDownloadWorker?: () => Promise<ServiceWorker>;

  /** Load a plugin defined by the table */
  loadPlugin: (pluginName: string) => TablePluginComponent;

  theme?: IrisGridThemeType;
}

interface StateProps {
  inputFilters: InputFilter[];
  links: Link[];
  columnSelectionValidator?: (
    panel: PanelComponent,
    tableColumn?: LinkColumn
  ) => boolean;
  user: User;
  settings: WorkspaceSettings;
}

interface IrisGridPanelState {
  error: unknown;
  isDisconnected: boolean;
  isLoaded: boolean;
  isLoading: boolean;
  isModelReady: boolean;
  model?: IrisGridModel;

  isStuckToBottom: boolean;
  isStuckToRight: boolean;

  // State is hydrated from panel state when table is loaded
  conditionalFormats: readonly SidebarFormattingRule[];
  selectDistinctColumns: readonly ColumnName[];
  advancedFilters: ReadonlyAdvancedFilterMap;
  aggregationSettings: AggregationSettings;
  advancedSettings: Map<AdvancedSettingsType, boolean>;
  customColumns: readonly ColumnName[];
  customColumnFormatMap: Map<string, FormattingRule>;
  isFilterBarShown: boolean;
  quickFilters: ReadonlyQuickFilterMap;
  sorts: readonly dh.Sort[];
  userColumnWidths: ModelSizeMap;
  userRowHeights: ModelSizeMap;
  reverseType: ReverseType;
  movedColumns: readonly MoveOperation[];
  movedRows: readonly MoveOperation[];
  isSelectingPartition: boolean;
  partitions: (string | null)[];
  partitionConfig?: PartitionConfig;
  rollupConfig?: UIRollupConfig;
  showSearchBar: boolean;
  searchValue: string;
  selectedSearchColumns?: readonly string[];
  invertSearchColumns: boolean;
  Plugin?: TablePluginComponent;
  pluginFilters: readonly dh.FilterCondition[];
  pluginFetchColumns: readonly string[];
  modelQueue: ModelQueue;
  pendingDataMap?: PendingDataMap<UIRow>;
  frozenColumns?: readonly ColumnName[];
  columnHeaderGroups?: readonly ColumnHeaderGroup[];

  // eslint-disable-next-line react/no-unused-state
  panelState?: PanelState | null; // Dehydrated panel state that can load this panel
  irisGridStateOverrides: Partial<DehydratedIrisGridState>;
  gridStateOverrides: Partial<GridState>;
}

function getTableNameFromMetadata(
  metadata: PanelMetadata | null | undefined
): string {
  if (metadata == null) {
    throw new Error('No metadata provided');
  }
  if (isIrisGridPanelMetadata(metadata)) {
    return metadata.name;
  }
  if (isLegacyIrisGridPanelMetadata(metadata)) {
    return metadata.table;
  }

  throw new Error(
    `Unable to determine table name from metadata: ${JSON.stringify(metadata)}`
  );
}

export type IrisGridPanelProps = OwnProps & StateProps;

export class IrisGridPanel extends PureComponent<
  IrisGridPanelProps,
  IrisGridPanelState
> {
  static defaultProps = {
    onStateChange: (): void => undefined,
    onPanelStateUpdate: (): void => undefined,
  };

  static displayName = 'IrisGridPanel';

  static COMPONENT = 'IrisGridPanel';

  constructor(props: IrisGridPanelProps) {
    super(props);

    this.handleAdvancedSettingsChange =
      this.handleAdvancedSettingsChange.bind(this);
    this.handleColumnsChanged = this.handleColumnsChanged.bind(this);
    this.handleTableChanged = this.handleTableChanged.bind(this);
    this.handleColumnSelected = this.handleColumnSelected.bind(this);
    this.handleDataSelected = this.handleDataSelected.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleGridStateChange = this.handleGridStateChange.bind(this);
    this.handlePluginStateChange = this.handlePluginStateChange.bind(this);
    this.handleCreateChart = this.handleCreateChart.bind(this);
    this.handleShow = this.handleShow.bind(this);
    this.handleTabClicked = this.handleTabClicked.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleReconnect = this.handleReconnect.bind(this);
    this.handleLoadSuccess = this.handleLoadSuccess.bind(this);
    this.handleLoadError = this.handleLoadError.bind(this);
    this.isColumnSelectionValid = this.isColumnSelectionValid.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handlePluginFilter = this.handlePluginFilter.bind(this);
    this.handlePluginFetchColumns = this.handlePluginFetchColumns.bind(this);
    this.handleClearAllFilters = this.handleClearAllFilters.bind(this);

    this.irisGrid = React.createRef();
    this.pluginRef = React.createRef();

    const { panelState } = props;

    this.pluginState = null;
    this.irisGridUtils = null;

    this.state = {
      error: null,
      isDisconnected: false,
      isLoaded: false,
      isLoading: true,
      isModelReady: false,
      model: undefined,

      // State is hydrated from panel state when table is loaded
      advancedFilters: new Map(),
      aggregationSettings: { aggregations: [], showOnTop: false },
      advancedSettings: new Map(AdvancedSettings.DEFAULTS),
      customColumns: [],
      customColumnFormatMap: new Map(),
      isFilterBarShown: false,
      quickFilters: new Map(),
      sorts: [],
      userColumnWidths: new Map(),
      userRowHeights: new Map(),
      reverseType: TableUtils.REVERSE_TYPE.NONE,
      movedColumns: [],
      movedRows: [],
      isSelectingPartition: false,
      partitions: [],
      rollupConfig: undefined,
      showSearchBar: false,
      searchValue: '',
      selectedSearchColumns: undefined,
      invertSearchColumns: true,
      Plugin: undefined,
      pluginFilters: [],
      pluginFetchColumns: [],
      modelQueue: [],
      pendingDataMap: new Map(),
      frozenColumns: undefined,

      // eslint-disable-next-line react/no-unused-state
      panelState, // Dehydrated panel state that can load this panel
      irisGridStateOverrides: {},
      gridStateOverrides: {},
      isStuckToBottom: false,
      isStuckToRight: false,
      conditionalFormats: [],
      selectDistinctColumns: [],
    };
  }

  componentDidMount(): void {
    this.initModel();
  }

  componentDidUpdate(
    prevProps: IrisGridPanelProps,
    prevState: IrisGridPanelState
  ): void {
    const { model } = this.state;
    const { makeModel } = this.props;
    if (model !== prevState.model) {
      if (prevState.model != null) {
        this.stopModelListening(prevState.model);
        prevState.model.close();
      }
      if (model != null) {
        this.startModelListening(model);
      }
    }

    if (makeModel !== prevProps.makeModel) {
      this.initModel();
    }
  }

  componentWillUnmount(): void {
    this.savePanelState.cancel();

    if (this.modelPromise != null) {
      this.modelPromise.cancel();
      this.modelPromise = undefined;
    }

    const { model } = this.state;
    if (model) {
      this.stopModelListening(model);
      model.close();
    }
  }

  irisGrid: RefObject<IrisGridType>;

  pluginRef: RefObject<TablePluginElement>;

  modelPromise?: CancelablePromise<IrisGridModel>;

  irisGridState?: IrisGridState;

  gridState?: GridState;

  pluginState: unknown;

  private irisGridUtils: IrisGridUtils | null;

  getTableName(): string {
    const { metadata } = this.props;
    return getTableNameFromMetadata(metadata);
  }

  getGridInputFilters = memoize(
    (columns: readonly dh.Column[], inputFilters: readonly InputFilter[]) =>
      IrisGridUtils.getInputFiltersForColumns(
        columns,
        // They may have picked a column, but not actually entered a value yet. In that case, don't need to update.
        inputFilters.filter(({ value, excludePanelIds }) => {
          const id = LayoutUtils.getIdFromPanel(this);
          return (
            value != null &&
            (excludePanelIds == null ||
              (id != null && !excludePanelIds.includes(id)))
          );
        })
      )
  );

  getAlwaysFetchColumns = memoize(
    (
      dashboardLinks: readonly Link[],
      pluginFetchColumns: readonly string[]
    ): string[] => {
      const id = LayoutUtils.getIdFromPanel(this);
      // Always fetch columns which are the start/source of a link or columns specified by a plugin
      const columnSet = new Set(pluginFetchColumns);
      for (let i = 0; i < dashboardLinks.length; i += 1) {
        const { start } = dashboardLinks[i];
        if (start != null && start.panelId === id) {
          columnSet.add(start.columnName);
        }
      }
      return [...columnSet];
    }
  );

  getPluginContent = memoize(
    (
      Plugin: TablePluginComponent | undefined,
      model: IrisGridModel | undefined,
      pluginState: unknown
    ) => {
      if (
        !model ||
        !isIrisGridTableModelTemplate(model) ||
        Plugin == null ||
        model.table == null
      ) {
        return null;
      }

      // TODO #2093: Find a better way to handle deprecated panel prop
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const deprecatedProps = {
        panel: this,
      };

      return (
        <div className="iris-grid-plugin">
          <Plugin
            ref={this.pluginRef}
            filter={this.handlePluginFilter}
            fetchColumns={this.handlePluginFetchColumns}
            model={model}
            table={model.table}
            tableName={this.getTableName()}
            selectedRanges={this.irisGrid.current?.state.selectedRanges}
            onStateChange={this.handlePluginStateChange}
            pluginState={pluginState}
          />
        </div>
      );
    }
  );

  getDehydratedIrisGridPanelState = memoize(
    (
      model: IrisGridModel,
      isSelectingPartition: boolean,
      partitions: (string | null)[],
      advancedSettings: Map<AdvancedSettingsType, boolean>
    ) =>
      IrisGridUtils.dehydrateIrisGridPanelState(model, {
        isSelectingPartition,
        partitions,
        advancedSettings,
      })
  );

  getDehydratedIrisGridState = memoize(
    (
      model: IrisGridModel,
      sorts: readonly dh.Sort[],
      advancedFilters: ReadonlyAdvancedFilterMap,
      customColumnFormatMap: Map<ColumnName, FormattingRule>,
      isFilterBarShown: boolean,
      quickFilters: ReadonlyQuickFilterMap,
      customColumns: readonly ColumnName[],
      reverseType: ReverseType,
      rollupConfig: UIRollupConfig | undefined,
      showSearchBar: boolean,
      searchValue: string,
      selectDistinctColumns: readonly ColumnName[],
      selectedSearchColumns: readonly ColumnName[],
      invertSearchColumns: boolean,
      userColumnWidths: ModelSizeMap,
      userRowHeights: ModelSizeMap,
      aggregationSettings: AggregationSettings,
      pendingDataMap: PendingDataMap<UIRow>,
      frozenColumns: readonly ColumnName[],
      conditionalFormats: readonly SidebarFormattingRule[],
      columnHeaderGroups: readonly ColumnHeaderGroup[],
      partitionConfig: PartitionConfig | undefined
    ) => {
      assertNotNull(this.irisGridUtils);
      return this.irisGridUtils.dehydrateIrisGridState(model, {
        advancedFilters,
        aggregationSettings,
        customColumnFormatMap,
        isFilterBarShown,
        metrics: {
          userColumnWidths,
          userRowHeights,
        },
        quickFilters,
        customColumns,
        reverseType,
        rollupConfig,
        showSearchBar,
        searchValue,
        selectDistinctColumns,
        selectedSearchColumns,
        sorts,
        invertSearchColumns,
        pendingDataMap,
        frozenColumns,
        conditionalFormats,
        columnHeaderGroups,
        partitionConfig,
      });
    }
  );

  getDehydratedGridState = memoize(
    (
      model: IrisGridModel,
      movedColumns: readonly MoveOperation[],
      movedRows: readonly MoveOperation[],
      isStuckToBottom: boolean,
      isStuckToRight: boolean
    ) =>
      IrisGridUtils.dehydrateGridState(model, {
        isStuckToBottom,
        isStuckToRight,
        movedColumns,
        movedRows,
      })
  );

  getCachedPanelState = memoize(
    (
      irisGridPanelState: PanelState['irisGridPanelState'],
      irisGridState: PanelState['irisGridState'],
      gridState: PanelState['gridState'],
      pluginState: PanelState['pluginState']
    ): PanelState => ({
      irisGridPanelState,
      irisGridState,
      gridState,
      pluginState,
    })
  );

  getWidgetPanelDescriptor = memoize(
    (
      metadata: IrisGridPanelProps['metadata'],
      description?: string
    ): WidgetPanelDescriptor => {
      const name = getTableNameFromMetadata(metadata);
      return {
        type: 'Table',
        displayType: 'Table',
        ...metadata,
        name,
        description,
      };
    }
  );

  initModel(): void {
    this.setState({
      isModelReady: false,
      isLoading: true,
      error: null,
      isDisconnected: false,
    });
    const { makeModel } = this.props;
    if (this.modelPromise != null) {
      this.modelPromise.cancel();
    }
    this.modelPromise = PromiseUtils.makeCancelable(makeModel(), resolved =>
      resolved.close()
    );
    this.modelPromise.then(this.handleLoadSuccess).catch(this.handleLoadError);
  }

  handleLoadSuccess(modelParam: IrisGridModel): void {
    const model = modelParam;
    const { panelState, irisGridStateOverrides } = this.state;
    const modelQueue: ((m: IrisGridModel) => void)[] = [];
    this.irisGridUtils = new IrisGridUtils(model.dh);
    if (panelState != null) {
      const { irisGridState } = panelState;
      const {
        aggregationSettings,
        customColumns,
        selectDistinctColumns = [],
        rollupConfig,
      } = { ...irisGridState, ...irisGridStateOverrides };

      if (customColumns.length > 0) {
        modelQueue.push(m => {
          // eslint-disable-next-line no-param-reassign
          m.customColumns = customColumns;
        });
      }

      if (rollupConfig != null && rollupConfig.columns.length > 0) {
        // originalColumns might change by the time this model queue item is applied.
        // Instead of pushing a static object, push the function
        // that calculates the config based on the updated model state.
        modelQueue.push(m => {
          // eslint-disable-next-line no-param-reassign
          m.rollupConfig = IrisGridUtils.getModelRollupConfig(
            m.originalColumns,
            rollupConfig,
            aggregationSettings
          );
        });
      }

      if (selectDistinctColumns.length > 0) {
        modelQueue.push(m => {
          // eslint-disable-next-line no-param-reassign
          m.selectDistinctColumns = selectDistinctColumns;
        });
      }
    }

    this.setState({ model, modelQueue });
    this.initModelQueue(model, modelQueue);
  }

  initModelQueue(modelParam: IrisGridModel, modelQueue: ModelQueue): void {
    const model = modelParam;
    if (modelQueue.length === 0) {
      this.modelInitialized(model);
      return;
    }
    const modelChange = modelQueue.shift();
    log.debug('initModelQueue', modelChange);
    // Apply next model change. Triggers columnschanged event.
    if (modelChange) {
      modelChange(model);
    }
    this.setState({ modelQueue });
  }

  handleAdvancedSettingsChange(
    key: AdvancedSettingsType,
    value: boolean
  ): void {
    log.debug('handleAdvancedSettingsChange', key, value);
    this.setState(({ advancedSettings }) =>
      advancedSettings.get(key) === value
        ? null
        : { advancedSettings: new Map(advancedSettings).set(key, value) }
    );
  }

  handlePluginFilter(filters: InputFilter[]): void {
    const { model } = this.state;
    assertNotNull(model);
    const { columns, formatter } = model;
    const pluginFilters =
      this.irisGridUtils?.getFiltersFromInputFilters(
        columns,
        filters,
        formatter.timeZone
      ) ?? [];
    this.setState({ pluginFilters });
  }

  handlePluginFetchColumns(pluginFetchColumns: string[]): void {
    this.setState({ pluginFetchColumns });
  }

  handleContextMenu(data: IrisGridContextMenuData): ResolvableContextAction[] {
    return this.pluginRef.current?.getMenu?.(data) ?? [];
  }

  isColumnSelectionValid(tableColumn: dh.Column | null): boolean {
    const { columnSelectionValidator } = this.props;
    if (columnSelectionValidator && tableColumn) {
      return columnSelectionValidator(this, tableColumn);
    }
    return false;
  }

  handleGridStateChange(
    irisGridState: IrisGridState,
    gridState: GridState
  ): void {
    this.irisGridState = irisGridState;
    this.gridState = gridState;

    // Grid sends it's first state change after it's finished loading
    this.setState({ isLoaded: true, isLoading: false });

    this.savePanelState();

    const { glEventHub, onStateChange } = this.props;
    glEventHub.emit(IrisGridEvent.STATE_CHANGED, this);
    onStateChange?.(irisGridState, gridState);
  }

  handlePluginStateChange(pluginState: unknown): void {
    const { irisGridState, gridState } = this;
    this.pluginState = pluginState;
    // Do not save if there is null state
    // The save will happen when the grid loads
    if (irisGridState !== null && gridState !== null) {
      this.savePanelState();
    }
  }

  handleColumnsChanged(event: EventT): void {
    const { isModelReady, model, modelQueue } = this.state;
    if (isModelReady) {
      this.sendColumnsChange((event as CustomEvent).detail);
    } else {
      assertNotNull(model);
      this.initModelQueue(model, modelQueue);
    }
  }

  handleTableChanged(event: EventT): void {
    log.debug('handleTableChanged', event);
    const { glEventHub } = this.props;
    const { detail: table } = event as CustomEvent;
    glEventHub.emit(InputFilterEvent.TABLE_CHANGED, this, table);
  }

  /**
   * Create a chart with the specified settings
   * @param settings The settings from the chart builder
   * @param settings.type The settings from the chart builder
   * @param settings.series The names of the series
   * @param model The IrisGridModel object
   */
  handleCreateChart(
    settings: ChartBuilderSettings,
    model: IrisGridModel
  ): void {
    // Panel state is stored with the created chart, so flush it first
    this.savePanelState.flush();

    this.setState(
      () => null,
      () => {
        const { glEventHub, inputFilters, metadata } = this.props;
        const table = this.getTableName();
        const { panelState } = this.state;
        const sourcePanelId = LayoutUtils.getIdFromPanel(this);
        let tableSettings;

        if (panelState) {
          tableSettings = IrisGridUtils.extractTableSettings(
            panelState,
            inputFilters
          );
        }
        glEventHub.emit(IrisGridEvent.CREATE_CHART, {
          metadata: {
            ...metadata,
            settings,
            sourcePanelId,
            table,
            tableSettings,
          },
          table: isIrisGridTableModelTemplate(model) ? model.table : undefined,
        });
      }
    );
  }

  handleColumnSelected(column: dh.Column): void {
    const { glEventHub } = this.props;
    glEventHub.emit(IrisGridEvent.COLUMN_SELECTED, this, column);
  }

  handleDataSelected(row: ModelIndex, dataMap: Record<string, unknown>): void {
    const { glEventHub } = this.props;
    glEventHub.emit(IrisGridEvent.DATA_SELECTED, this, dataMap);
  }

  handleShow(): void {
    this.updateGrid();
  }

  handleTabClicked(): void {
    if (this.irisGrid.current) {
      this.irisGrid.current.focus();
    }
  }

  handleError(error: unknown): void {
    log.error(error);
    this.setState({ error, isLoading: false });
  }

  handleDisconnect(): void {
    this.setState({
      error: new Error('Table disconnected'),
      isDisconnected: true,
      isLoading: false,
    });
  }

  handleReconnect(): void {
    this.setState({ isDisconnected: false, error: null });
  }

  handleLoadError(error: unknown): void {
    if (PromiseUtils.isCanceled(error)) {
      return;
    }

    this.handleError(error);
  }

  modelInitialized(model: IrisGridModel): void {
    const { glEventHub, loadPlugin } = this.props;

    this.modelPromise = undefined;

    // Custom columns at this point already initialized, can load state
    this.loadPanelState(model);

    this.setState({ isModelReady: true });

    if (isIrisGridTableModelTemplate(model)) {
      const { table } = model;
      const { pluginName } = table;

      if (pluginName !== '') {
        if (loadPlugin != null && pluginName != null) {
          const Plugin = loadPlugin(pluginName);
          this.setState({ Plugin });
        }
      }
      glEventHub.emit(InputFilterEvent.TABLE_CHANGED, this, table);
    }

    this.sendColumnsChange(model.columns);
  }

  handleClearAllFilters(): void {
    const irisGrid = this.irisGrid.current;
    const { isDisconnected } = this.state;
    if (irisGrid != null && !isDisconnected) {
      irisGrid.clearAllFilters();
    }
  }

  sendColumnsChange(columns: readonly dh.Column[]): void {
    log.debug2('sendColumnsChange', columns);
    const { glEventHub } = this.props;
    glEventHub.emit(InputFilterEvent.COLUMNS_CHANGED, this, columns);
  }

  startModelListening(model: IrisGridModel): void {
    model.addEventListener(
      IrisGridModel.EVENT.DISCONNECT,
      this.handleDisconnect
    );
    model.addEventListener(IrisGridModel.EVENT.RECONNECT, this.handleReconnect);
    model.addEventListener(
      IrisGridModel.EVENT.COLUMNS_CHANGED,
      this.handleColumnsChanged
    );
    model.addEventListener(
      IrisGridModel.EVENT.TABLE_CHANGED,
      this.handleTableChanged
    );
  }

  stopModelListening(model: IrisGridModel): void {
    model.removeEventListener(
      IrisGridModel.EVENT.DISCONNECT,
      this.handleDisconnect
    );
    model.removeEventListener(
      IrisGridModel.EVENT.RECONNECT,
      this.handleReconnect
    );
    model.removeEventListener(
      IrisGridModel.EVENT.COLUMNS_CHANGED,
      this.handleColumnsChanged
    );
    model.removeEventListener(
      IrisGridModel.EVENT.TABLE_CHANGED,
      this.handleTableChanged
    );
  }

  getCoordinateForColumn(columnName: ColumnName): [number, number] | null {
    const { model } = this.state;
    if (!model) {
      return null;
    }

    const irisGrid = this.irisGrid.current;
    const { gridWrapper } = irisGrid || {};
    const rect = gridWrapper?.getBoundingClientRect() ?? null;
    if (rect == null || rect.width <= 0 || rect.height <= 0) {
      return null;
    }
    assertNotNull(irisGrid);
    const { metrics } = irisGrid.state;
    assertNotNull(metrics);
    const {
      columnHeaderHeight,
      allColumnXs,
      allColumnWidths,
      right,
      columnHeaderMaxDepth,
    } = metrics;
    const columnIndex = model.getColumnIndexByName(columnName);
    assertNotNull(columnIndex);
    const visibleIndex = irisGrid.getVisibleColumn(columnIndex);
    const columnX = allColumnXs.get(visibleIndex) ?? 0;
    const columnWidth = allColumnWidths.get(visibleIndex) ?? 0;

    const x = Math.max(
      rect.left,
      Math.min(
        visibleIndex > right
          ? rect.right
          : rect.left + columnX + columnWidth * 0.5,
        rect.right
      )
    );
    const y = rect.top + columnHeaderHeight * columnHeaderMaxDepth;

    return [x, y];
  }

  setFilterMap(filterMap: FilterMap): void {
    const irisGrid = this.irisGrid.current;
    if (irisGrid != null) {
      irisGrid.setFilterMap(filterMap);
    }
  }

  setAdvancedFilterMap(filterMap: ReadonlyAdvancedFilterMap): void {
    const irisGrid = this.irisGrid.current;
    if (irisGrid != null) {
      irisGrid.setAdvancedFilterMap(filterMap);
    }
  }

  setFilters({
    quickFilters,
    advancedFilters,
  }: {
    quickFilters: { name: ColumnName; filter: QuickFilter }[];
    advancedFilters: { name: ColumnName; filter: AdvancedFilter }[];
  }): void {
    log.debug('setFilters', quickFilters, advancedFilters);
    const { model, isDisconnected } = this.state;
    const irisGrid = this.irisGrid.current;
    if (irisGrid == null || isDisconnected) {
      log.debug('Ignore setFilters, model disconnected');
      return;
    }
    assertNotNull(model);
    const { columns, formatter } = model;
    const indexedQuickFilters = IrisGridUtils.changeFilterColumnNamesToIndexes(
      model.columns,
      quickFilters
    ).filter(([columnIndex]) => model.isFilterable(columnIndex));
    const indexedAdvancedFilters =
      IrisGridUtils.changeFilterColumnNamesToIndexes(
        model.columns,
        advancedFilters
      ).filter(([columnIndex]) => model.isFilterable(columnIndex));
    assertNotNull(this.irisGridUtils);
    irisGrid.clearAllFilters();
    irisGrid.setFilters({
      quickFilters: this.irisGridUtils.hydrateQuickFilters(
        columns,
        indexedQuickFilters,
        formatter.timeZone
      ),
      advancedFilters: this.irisGridUtils.hydrateAdvancedFilters(
        columns,
        indexedAdvancedFilters,
        formatter.timeZone
      ),
    });
  }

  setStateOverrides(overrides: {
    irisGridState: Partial<DehydratedIrisGridState>;
    gridState: Partial<GridState>;
  }): void {
    log.debug('setStateOverrides', overrides);
    const {
      irisGridState: irisGridStateOverrides,
      gridState: gridStateOverrides,
    } = overrides;
    this.setState({ irisGridStateOverrides, gridStateOverrides }, () => {
      this.initModel();
    });
  }

  // eslint-disable-next-line class-methods-use-this
  unsetFilterValue(): void {
    // IrisGridPanel retains the set value after the link is broken
  }

  loadPanelState(model: IrisGridModel): void {
    const {
      panelState,
      irisGridStateOverrides: originalIrisGridStateOverrides,
      gridStateOverrides,
    } = this.state;
    if (panelState == null) {
      return;
    }

    try {
      const { gridState, irisGridState, irisGridPanelState } = panelState;
      const irisGridStateOverrides = { ...originalIrisGridStateOverrides };
      const {
        quickFilters: savedQuickFilters,
        advancedFilters: savedAdvancedFilters,
      } = irisGridStateOverrides;
      if (savedQuickFilters) {
        irisGridStateOverrides.quickFilters =
          IrisGridUtils.changeFilterColumnNamesToIndexes(
            model.columns,
            savedQuickFilters as unknown as {
              name: string;
              filter: {
                text: string;
              };
            }[]
          );
      }
      if (savedAdvancedFilters) {
        irisGridStateOverrides.advancedFilters =
          IrisGridUtils.changeFilterColumnNamesToIndexes(
            model.columns,
            savedAdvancedFilters as unknown as {
              name: string;
              filter: { options: AdvancedFilterOptions };
            }[]
          );
      }
      const { isSelectingPartition, partitions, advancedSettings } =
        IrisGridUtils.hydrateIrisGridPanelState(model, irisGridPanelState);
      assertNotNull(this.irisGridUtils);
      const {
        advancedFilters,
        customColumns,
        customColumnFormatMap,
        isFilterBarShown,
        quickFilters,
        reverseType,
        rollupConfig,
        aggregationSettings,
        sorts,
        userColumnWidths,
        userRowHeights,
        showSearchBar,
        searchValue,
        selectDistinctColumns,
        selectedSearchColumns,
        invertSearchColumns,
        pendingDataMap,
        frozenColumns,
        conditionalFormats,
        columnHeaderGroups,
        partitionConfig,
      } = this.irisGridUtils.hydrateIrisGridState(model, {
        ...irisGridState,
        ...irisGridStateOverrides,
      });
      const { isStuckToBottom, isStuckToRight, movedColumns, movedRows } =
        IrisGridUtils.hydrateGridState(
          model,
          { ...gridState, ...gridStateOverrides },
          irisGridState.customColumns
        );
      this.setState({
        advancedFilters,
        advancedSettings,
        conditionalFormats,
        customColumns,
        customColumnFormatMap,
        isFilterBarShown,
        isSelectingPartition,
        movedColumns,
        movedRows,
        partitions,
        quickFilters,
        reverseType,
        rollupConfig,
        aggregationSettings,
        sorts,
        userColumnWidths,
        userRowHeights,
        showSearchBar,
        searchValue,
        selectDistinctColumns,
        selectedSearchColumns,
        invertSearchColumns,
        pendingDataMap,
        frozenColumns,
        isStuckToBottom,
        isStuckToRight,
        columnHeaderGroups,
        partitionConfig,
      });
    } catch (error) {
      log.error('loadPanelState failed to load panelState', panelState, error);
    }
  }

  savePanelState = debounce(() => {
    const { irisGridState, gridState, pluginState } = this;
    assertNotNull(irisGridState);
    const { onPanelStateUpdate } = this.props;
    const {
      model,
      panelState: oldPanelState,
      isSelectingPartition,
      partitions,
      advancedSettings,
    } = this.state;
    const {
      advancedFilters,
      aggregationSettings,
      customColumnFormatMap,
      isFilterBarShown,
      quickFilters,
      customColumns,
      reverseType,
      rollupConfig,
      showSearchBar,
      searchValue,
      selectDistinctColumns,
      selectedSearchColumns,
      sorts,
      invertSearchColumns,
      metrics,
      pendingDataMap,
      frozenColumns,
      conditionalFormats,
      columnHeaderGroups,
      partitionConfig,
    } = irisGridState;
    assertNotNull(model);
    assertNotNull(metrics);
    const { userColumnWidths, userRowHeights } = metrics;
    assertNotNull(gridState);
    const { isStuckToBottom, isStuckToRight, movedColumns, movedRows } =
      gridState;

    const panelState = this.getCachedPanelState(
      this.getDehydratedIrisGridPanelState(
        model,
        isSelectingPartition,
        partitions,
        advancedSettings
      ),
      this.getDehydratedIrisGridState(
        model,
        sorts,
        advancedFilters,
        customColumnFormatMap,
        isFilterBarShown,
        quickFilters,
        customColumns,
        reverseType,
        rollupConfig,
        showSearchBar,
        searchValue,
        selectDistinctColumns,
        selectedSearchColumns,
        invertSearchColumns,
        userColumnWidths,
        userRowHeights,
        aggregationSettings,
        pendingDataMap,
        frozenColumns,
        conditionalFormats,
        columnHeaderGroups,
        partitionConfig
      ),
      this.getDehydratedGridState(
        model,
        movedColumns,
        movedRows,
        isStuckToBottom,
        isStuckToRight
      ),
      pluginState
    );

    if (panelState !== oldPanelState) {
      log.debug('Saving panel state', this, panelState);

      this.setState({ panelState });
      onPanelStateUpdate?.(panelState);
    }
  }, DEBOUNCE_PANEL_STATE_UPDATE);

  updateGrid(): void {
    const grid = this.irisGrid.current?.grid ?? null;
    if (!grid) return;

    // handle resize will verify state and draw and update
    grid.handleResize();
  }

  render(): ReactElement {
    const {
      children,
      glContainer,
      glEventHub,
      columnSelectionValidator,
      getDownloadWorker,
      inputFilters,
      links,
      metadata,
      panelState,
      user,
      settings,
      theme,
    } = this.props;
    const {
      advancedFilters,
      aggregationSettings,
      advancedSettings,
      conditionalFormats,
      customColumns,
      customColumnFormatMap,
      error,
      isDisconnected,
      isFilterBarShown,
      isSelectingPartition,
      isStuckToBottom,
      isStuckToRight,
      isLoaded,
      isLoading,
      isModelReady,
      model,
      movedColumns,
      movedRows,
      partitions,
      partitionConfig,
      quickFilters,
      reverseType,
      rollupConfig,
      sorts,
      userColumnWidths,
      userRowHeights,
      showSearchBar,
      searchValue,
      selectDistinctColumns,
      selectedSearchColumns,
      invertSearchColumns,
      Plugin,
      pluginFilters,
      pluginFetchColumns,
      pendingDataMap,
      frozenColumns,
      columnHeaderGroups,
    } = this.state;
    const errorMessage =
      error != null ? `Unable to open table. ${error}` : undefined;
    const description = model?.description ?? undefined;
    const pluginState = panelState?.pluginState ?? null;
    const childrenContent =
      children ?? this.getPluginContent(Plugin, model, pluginState);
    const { permissions } = user;
    const { canCopy, canDownloadCsv } = permissions;
    const widgetPanelDescriptor = this.getWidgetPanelDescriptor(
      metadata,
      description
    );

    return (
      <WidgetPanel
        errorMessage={errorMessage}
        isDisconnected={isDisconnected}
        isLoading={isLoading}
        isLoaded={isLoaded}
        className="iris-grid-panel"
        glContainer={glContainer}
        glEventHub={glEventHub}
        onClearAllFilters={this.handleClearAllFilters}
        onShow={this.handleShow}
        onTabFocus={this.handleShow}
        onTabClicked={this.handleTabClicked}
        componentPanel={this}
        descriptor={widgetPanelDescriptor}
        renderTabTooltip={() => (
          <IrisGridPanelTooltip
            descriptor={widgetPanelDescriptor}
            model={model}
          />
        )}
      >
        {isModelReady && model && (
          <IrisGrid
            advancedFilters={advancedFilters}
            aggregationSettings={aggregationSettings}
            advancedSettings={advancedSettings}
            alwaysFetchColumns={this.getAlwaysFetchColumns(
              links,
              pluginFetchColumns
            )}
            columnAllowedCursor="linker"
            columnNotAllowedCursor="linker-not-allowed"
            copyCursor="copy"
            customColumns={customColumns}
            customColumnFormatMap={customColumnFormatMap}
            columnSelectionValidator={this.isColumnSelectionValid}
            conditionalFormats={conditionalFormats}
            inputFilters={this.getGridInputFilters(model.columns, inputFilters)}
            applyInputFiltersOnInit={panelState == null}
            isFilterBarShown={isFilterBarShown}
            isSelectingColumn={columnSelectionValidator != null}
            isSelectingPartition={isSelectingPartition}
            isStuckToBottom={isStuckToBottom}
            isStuckToRight={isStuckToRight}
            movedColumns={movedColumns}
            movedRows={movedRows}
            partitions={partitions}
            partitionConfig={partitionConfig}
            quickFilters={quickFilters}
            reverseType={reverseType}
            rollupConfig={rollupConfig}
            settings={settings}
            sorts={sorts}
            userColumnWidths={userColumnWidths}
            userRowHeights={userRowHeights}
            model={model}
            showSearchBar={showSearchBar}
            searchValue={searchValue}
            selectedSearchColumns={selectedSearchColumns}
            selectDistinctColumns={selectDistinctColumns}
            invertSearchColumns={invertSearchColumns}
            onColumnSelected={this.handleColumnSelected}
            onCreateChart={this.handleCreateChart}
            onDataSelected={this.handleDataSelected}
            onError={this.handleError}
            onStateChange={this.handleGridStateChange}
            onContextMenu={this.handleContextMenu}
            onAdvancedSettingsChange={this.handleAdvancedSettingsChange}
            customFilters={pluginFilters}
            pendingDataMap={pendingDataMap}
            canCopy={canCopy}
            canDownloadCsv={canDownloadCsv}
            ref={this.irisGrid}
            getDownloadWorker={getDownloadWorker}
            frozenColumns={frozenColumns}
            theme={theme}
            columnHeaderGroups={columnHeaderGroups}
          >
            {childrenContent}
          </IrisGrid>
        )}
      </WidgetPanel>
    );
  }
}

const mapStateToProps = (
  state: RootState,
  { localDashboardId = DEFAULT_DASHBOARD_ID }: OwnProps
): StateProps => ({
  inputFilters: getInputFiltersForDashboard(state, localDashboardId),
  links: getLinksForDashboard(state, localDashboardId),
  columnSelectionValidator: getColumnSelectionValidatorForDashboard(
    state,
    localDashboardId
  ),
  user: getUser(state),
  settings: getSettings(state),
});

const ConnectedIrisGridPanel = connect(mapStateToProps, null, null, {
  forwardRef: true,
})(IrisGridPanel);

export default ConnectedIrisGridPanel;
