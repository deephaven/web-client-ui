// Wrapper for the IrisGrid for use in a golden layout container
// Will probably need to handle window popping out from golden layout here.
import React, { PureComponent } from 'react';
import memoize from 'memoize-one';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import Log from '@deephaven/log';
import { PromiseUtils } from '@deephaven/utils';
import { ContextMenuRoot } from '@deephaven/components';
import { IrisGridUtils, IrisGrid } from '../../iris-grid';
import { ChartUtils, ChartModelFactory } from '../../chart';
import {
  ChartEvent,
  ConsoleEvent,
  InputFilterEvent,
  IrisGridEvent,
} from '../events';
import {
  UIPropTypes,
  GLPropTypes,
  IrisPropTypes,
} from '../../include/prop-types';
import { PluginUtils } from '../../plugins';
import WidgetPanel from './WidgetPanel';
import {
  getInputFiltersForDashboard,
  getLinksForDashboard,
  getColumnSelectionValidatorForDashboard,
  getUser,
  getWorkspace,
} from '../../redux/selectors';
import './IrisGridPanel.scss';
import TableUtils from '../../iris-grid/TableUtils';
import LayoutUtils from '../../layout/LayoutUtils';
import IrisGridModel from '../../iris-grid/IrisGridModel';
import AdvancedSettings from '../../iris-grid/sidebar/AdvancedSettings';
import IrisGridTableModel from '../../iris-grid/IrisGridTableModel';

const log = Log.module('IrisGridPanel');

const DEBOUNCE_PANEL_STATE_UPDATE = 500;

const PLUGIN_COMPONENTS = { IrisGrid, IrisGridTableModel, ContextMenuRoot };

export class IrisGridPanel extends PureComponent {
  constructor(props) {
    super(props);

    this.savePanelState = debounce(
      this.savePanelState.bind(this),
      DEBOUNCE_PANEL_STATE_UPDATE
    );

    this.handleAdvancedSettingsChange = this.handleAdvancedSettingsChange.bind(
      this
    );
    this.handleColumnsChanged = this.handleColumnsChanged.bind(this);
    this.handleTableChanged = this.handleTableChanged.bind(this);
    this.handleColumnSelected = this.handleColumnSelected.bind(this);
    this.handleDataSelected = this.handleDataSelected.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleGridStateChange = this.handleGridStateChange.bind(this);
    this.handlePartitionAppend = this.handlePartitionAppend.bind(this);
    this.handleCreateChart = this.handleCreateChart.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleShow = this.handleShow.bind(this);
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
    this.modelPromise = null;

    const { panelState, metadata } = props;
    const queryName = metadata.query;

    this.state = {
      error: null,
      isDisconnected: false,
      isLoaded: false,
      isLoading: true,
      isModelReady: false,
      model: null,

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
      partition: null,
      partitionColumn: null,
      queryName,
      rollupConfig: null,
      showSearchBar: false,
      searchValue: '',
      selectedSearchColumns: null,
      invertSearchColumns: true,
      Plugin: null,
      pluginFilters: [],
      pluginFetchColumns: [],
      modelQueue: [],
      pendingDataMap: new Map(),

      // eslint-disable-next-line react/no-unused-state
      panelState, // Dehydrated panel state that can load this panel
    };
  }

  componentDidMount() {
    this.initModel();
  }

  componentDidUpdate(_, prevState) {
    const { model } = this.state;
    if (model !== prevState.model) {
      if (prevState.model != null) {
        this.stopModelListening(prevState.model);
        prevState.model.close();
      }
      if (model != null) {
        this.startModelListening(model);
      }
    }
  }

  componentWillUnmount() {
    this.savePanelState.cancel();

    if (this.modelPromise != null) {
      this.modelPromise.cancel();
      this.modelPromise = null;
    }

    const { model } = this.state;
    if (model) {
      this.stopModelListening(model);
      model.close();
    }
  }

  getTableName() {
    const { metadata } = this.props;
    return metadata.table;
  }

  getGridInputFilters = memoize((columns, inputFilters) =>
    IrisGridUtils.getInputFiltersForColumns(
      columns,
      // They may have picked a column, but not actually entered a value yet. In that case, don't need to update.
      inputFilters.filter(
        ({ value, excludePanelIds }) =>
          value != null &&
          (excludePanelIds == null ||
            !excludePanelIds.includes(LayoutUtils.getIdFromPanel(this)))
      )
    )
  );

  getAlwaysFetchColumns = memoize((dashboardLinks, pluginFetchColumns) => {
    const id = LayoutUtils.getIdFromPanel(this);
    // Always fetch columns which are the start/source of a link or columns specified by a plugin
    const columnSet = new Set(pluginFetchColumns);
    for (let i = 0; i < dashboardLinks.length; i += 1) {
      const { start } = dashboardLinks[i];
      if (start && start.panelId === id) {
        columnSet.add(start.columnName);
      }
    }
    return [...columnSet];
  });

  getPluginContent = memoize((Plugin, table, user, workspace) => {
    if (Plugin == null || table == null) {
      return null;
    }

    return (
      <div className="iris-grid-plugin">
        <Plugin
          ref={this.pluginRef}
          onFilter={this.handlePluginFilter}
          onFetchColumns={this.handlePluginFetchColumns}
          table={table}
          user={user}
          panel={this}
          workspace={workspace}
          components={PLUGIN_COMPONENTS}
        />
      </div>
    );
  });

  getDehydratedIrisGridPanelState = memoize(
    (table, isSelectingPartition, partition, partitionColumn) =>
      IrisGridUtils.dehydrateIrisGridPanelState(table, {
        isSelectingPartition,
        partition,
        partitionColumn,
      })
  );

  getDehydratedIrisGridState = memoize(
    (
      table,
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
      advancedSettings,
      pendingDataMap
    ) =>
      IrisGridUtils.dehydrateIrisGridState(table, {
        advancedFilters,
        advancedSettings,
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
      })
  );

  getDehydratedGridState = memoize((table, movedColumns, movedRows) =>
    IrisGridUtils.dehydrateGridState(table, { movedColumns, movedRows })
  );

  getCachedPanelState = memoize(
    (irisGridPanelState, irisGridState, gridState) => ({
      irisGridPanelState,
      irisGridState,
      gridState,
    })
  );

  initModel() {
    this.setState({ isModelReady: false, isLoading: true, error: null });
    const { makeModel } = this.props;
    if (this.modelPromise != null) {
      this.modelPromise.cancel();
    }
    this.modelPromise = PromiseUtils.makeCancelable(
      makeModel(),
      resolved => resolved.close
    );
    this.modelPromise.then(this.handleLoadSuccess).catch(this.handleLoadError);
  }

  handleLoadSuccess(modelParam) {
    const model = modelParam;
    const { panelState } = this.props;
    const modelQueue = [];

    if (panelState != null) {
      const { irisGridState } = panelState;
      const {
        aggregationSettings,
        customColumns,
        selectDistinctColumns = [],
        rollupConfig,
      } = irisGridState;

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

  initModelQueue(modelParam, modelQueue) {
    const model = modelParam;
    if (modelQueue.length === 0) {
      this.modelInitialized(model);
      return;
    }
    const modelChange = modelQueue.shift();
    log.debug('initModelQueue', modelChange);
    // Apply next model change. Triggers columnschanged event.
    modelChange(model);
    this.setState({ modelQueue });
  }

  handleAdvancedSettingsChange(key, value) {
    log.debug('handleAdvancedSettingsChange', key, value);
    this.setState(({ advancedSettings }) =>
      advancedSettings.get(key) === value
        ? null
        : { advancedSettings: new Map(advancedSettings).set(key, value) }
    );
  }

  handlePluginFilter(filters) {
    const { model } = this.state;
    const pluginFilters = IrisGridUtils.getFiltersFromInputFilters(
      model.columns,
      filters
    );
    this.setState({ pluginFilters });
  }

  handlePluginFetchColumns(pluginFetchColumns) {
    this.setState({ pluginFetchColumns });
  }

  handleContextMenu(data) {
    return this.pluginRef.current?.getMenu?.(data) ?? [];
  }

  isColumnSelectionValid(tableColumn) {
    const { columnSelectionValidator } = this.props;
    if (columnSelectionValidator) {
      return columnSelectionValidator(this, tableColumn);
    }
    return false;
  }

  handleGridStateChange(irisGridState, gridState) {
    // Grid sends it's first state change after it's finished loading
    this.setState({ isLoaded: true, isLoading: false });

    this.savePanelState(irisGridState, gridState);

    const { glEventHub, onStateChange } = this.props;
    glEventHub.emit(IrisGridEvent.STATE_CHANGED, this);
    onStateChange(irisGridState, gridState);
  }

  handleColumnsChanged(event) {
    const { isModelReady, model, modelQueue } = this.state;
    if (isModelReady) {
      this.sendColumnsChange(event.detail);
    } else {
      this.initModelQueue(model, modelQueue);
    }
  }

  handleTableChanged(event) {
    log.debug('handleTableChanged', event);
    const { glEventHub } = this.props;
    const { detail: table } = event;
    glEventHub.emit(InputFilterEvent.TABLE_CHANGED, this, table);
  }

  handlePartitionAppend(column, value) {
    const { glEventHub } = this.props;
    const { name } = column;
    const tableName = this.getTableName();
    const command = `${tableName} = ${tableName}.where("${name}=\`${value}\`")`;
    glEventHub.emit(ConsoleEvent.SEND_COMMAND, command, false, true);
  }

  handleCreateChart(settings, table) {
    // Panel state is stored with the created chart, so flush it first
    this.savePanelState.flush();

    this.setState(
      () => null,
      () => {
        const makeModel = () =>
          ChartModelFactory.makeModelFromSettings(settings, table);

        const { glEventHub, inputFilters, metadata } = this.props;
        const { querySerial, table: tableName } = metadata;
        const { panelState } = this.state;
        const id = LayoutUtils.getIdFromPanel(this);

        const tableSettings = IrisGridUtils.extractTableSettings(
          panelState,
          inputFilters
        );
        const title = ChartUtils.titleFromSettings(settings);
        glEventHub.emit(ChartEvent.OPEN, title, makeModel, {
          querySerial,
          settings: ChartUtils.dehydrateSettings(settings),
          sourcePanelId: id,
          table: tableName,
          tableSettings,
        });
      }
    );
  }

  handleColumnSelected(column) {
    const { glEventHub } = this.props;
    glEventHub.emit(IrisGridEvent.COLUMN_SELECTED, this, column);
  }

  handleDataSelected(row, dataMap) {
    const { glEventHub } = this.props;
    glEventHub.emit(IrisGridEvent.DATA_SELECTED, this, dataMap);
  }

  handleResize() {
    this.updateGrid();
  }

  handleShow() {
    this.updateGrid();
  }

  handleError(error) {
    log.error(error);
    this.setState({ error, isLoading: false });
  }

  handleDisconnect() {
    this.setState({
      error: new Error('Table disconnected'),
      isDisconnected: true,
      isLoading: false,
    });
  }

  handleReconnect() {
    this.setState({ isDisconnected: false, error: null });
  }

  handleLoadError(error) {
    if (PromiseUtils.isCanceled(error)) {
      return;
    }

    this.handleError(error);
  }

  modelInitialized(model) {
    const { glEventHub } = this.props;

    this.modelPromise = null;

    // Custom columns at this point already initialized, can load state
    this.loadPanelState(model);

    this.setState({ isModelReady: true });

    const { table } = model;
    const { pluginName } = table;
    if (pluginName) {
      const Plugin = PluginUtils.loadPlugin(pluginName);
      this.setState({ Plugin });
    }
    glEventHub.emit(InputFilterEvent.TABLE_CHANGED, this, table);

    this.sendColumnsChange(model.columns);
  }

  handleClearAllFilters() {
    const irisGrid = this.irisGrid.current;
    const { isDisconnected } = this.state;
    if (irisGrid != null && !isDisconnected) {
      irisGrid.clearAllFilters();
    }
  }

  sendColumnsChange(columns) {
    log.debug2('sendColumnsChange', columns);
    const { glEventHub } = this.props;
    glEventHub.emit(InputFilterEvent.COLUMNS_CHANGED, this, columns);
  }

  startModelListening(model) {
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

  stopModelListening(model) {
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

  getCoordinateForColumn(columnName) {
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

    const { metrics } = irisGrid.state;
    const {
      columnHeaderHeight,
      visibleColumnXs,
      visibleColumnWidths,
      right,
    } = metrics;
    const column = model.columns.find(c => c.name === columnName);
    const visibleIndex = irisGrid.getVisibleColumn(column.index);
    const columnX = visibleColumnXs.get(visibleIndex) || 0;
    const columnWidth = visibleColumnWidths.get(visibleIndex) || 0;

    const x = Math.max(
      rect.left,
      Math.min(
        visibleIndex > right
          ? rect.right
          : rect.left + columnX + columnWidth * 0.5,
        rect.right
      )
    );
    const y = rect.top + columnHeaderHeight;

    return [x, y];
  }

  setFilterMap(filterMap) {
    const irisGrid = this.irisGrid.current;
    if (irisGrid != null) {
      irisGrid.setFilterMap(filterMap);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  unsetFilterValue() {
    // IrisGridPanel retains the set value after the link is broken
  }

  loadPanelState(model) {
    const { table } = model;
    const { panelState } = this.props;
    if (panelState == null) {
      return;
    }

    try {
      const { gridState, irisGridState, irisGridPanelState } = panelState;
      const {
        isSelectingPartition,
        partition,
        partitionColumn,
      } = IrisGridUtils.hydrateIrisGridPanelState(table, irisGridPanelState);
      const {
        advancedFilters,
        advancedSettings,
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
      } = IrisGridUtils.hydrateIrisGridState(table, irisGridState);
      const { movedColumns, movedRows } = IrisGridUtils.hydrateGridState(
        table,
        gridState,
        irisGridState.customColumns
      );
      this.setState({
        advancedFilters,
        advancedSettings,
        customColumns,
        customColumnFormatMap,
        isFilterBarShown,
        isSelectingPartition,
        movedColumns,
        movedRows,
        partition,
        partitionColumn,
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
      });
    } catch (error) {
      log.error('loadPanelState failed to load panelState', panelState, error);
    }
  }

  savePanelState(irisGridState, gridState) {
    const { onPanelStateUpdate } = this.props;
    const {
      model,
      panelState: oldPanelState,
      isSelectingPartition,
      partition,
      partitionColumn,
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
    } = irisGridState;
    const { userColumnWidths, userRowHeights } = metrics;
    const { movedColumns, movedRows } = gridState;

    const { table } = model;

    const panelState = this.getCachedPanelState(
      this.getDehydratedIrisGridPanelState(
        table,
        isSelectingPartition,
        partition,
        partitionColumn
      ),
      this.getDehydratedIrisGridState(
        table,
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
        advancedSettings,
        pendingDataMap
      ),
      this.getDehydratedGridState(table, movedColumns, movedRows)
    );

    if (panelState !== oldPanelState) {
      log.debug('Saving panel state', this, panelState);

      this.setState({ panelState });
      onPanelStateUpdate(panelState);
    }
  }

  updateGrid() {
    const grid = this.irisGrid.current?.grid ?? null;
    if (!grid) return;

    // handle resize will verify state and draw and update
    grid.handleResize();
  }

  render() {
    const {
      children,
      glContainer,
      glEventHub,
      columnSelectionValidator,
      metadata,
      inputFilters,
      links,
      panelState,
      user,
      workspace,
    } = this.props;
    const {
      advancedFilters,
      aggregationSettings,
      advancedSettings,
      customColumns,
      customColumnFormatMap,
      error,
      isDisconnected,
      isFilterBarShown,
      isSelectingPartition,
      isLoaded,
      isLoading,
      isModelReady,
      model,
      movedColumns,
      movedRows,
      partition,
      partitionColumn,
      queryName,
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
    } = this.state;
    const errorMessage = error ? `Unable to open table. ${error}` : null;
    const { table: name, querySerial } = metadata;
    const description = model?.description ?? null;
    const childrenContent =
      children ?? this.getPluginContent(Plugin, model?.table, user, workspace);

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
        onResize={this.handleResize}
        onShow={this.handleShow}
        onTabFocus={this.handleShow}
        queryName={queryName}
        querySerial={querySerial}
        widgetName={name}
        widgetType="Table"
        description={description}
        componentPanel={this}
      >
        {isModelReady && (
          <IrisGrid
            advancedFilters={advancedFilters}
            aggregationSettings={aggregationSettings}
            advancedSettings={advancedSettings}
            alwaysFetchColumns={this.getAlwaysFetchColumns(
              links,
              pluginFetchColumns
            )}
            columnAllowedCursor="linker"
            columnNotAllowedCursor="not-allowed"
            customColumns={customColumns}
            customColumnFormatMap={customColumnFormatMap}
            columnSelectionValidator={this.isColumnSelectionValid}
            inputFilters={this.getGridInputFilters(model.columns, inputFilters)}
            applyInputFiltersOnInit={panelState == null}
            isFilterBarShown={isFilterBarShown}
            isSelectingColumn={columnSelectionValidator != null}
            isSelectingPartition={isSelectingPartition}
            movedColumns={movedColumns}
            movedRows={movedRows}
            partition={partition}
            partitionColumn={partitionColumn}
            quickFilters={quickFilters}
            reverseType={reverseType}
            rollupConfig={rollupConfig}
            sorts={sorts}
            userColumnWidths={userColumnWidths}
            userRowHeights={userRowHeights}
            model={model}
            tableName={name}
            showSearchBar={showSearchBar}
            searchValue={searchValue}
            selectedSearchColumns={selectedSearchColumns}
            selectDistinctColumns={selectDistinctColumns}
            invertSearchColumns={invertSearchColumns}
            onColumnSelected={this.handleColumnSelected}
            onCreateChart={this.handleCreateChart}
            onDataSelected={this.handleDataSelected}
            onError={this.handleError}
            onPartitionAppend={this.handlePartitionAppend}
            onStateChange={this.handleGridStateChange}
            onContextMenu={this.handleContextMenu}
            onAdvancedSettingsChange={this.handleAdvancedSettingsChange}
            customFilters={pluginFilters}
            pendingDataMap={pendingDataMap}
            ref={this.irisGrid}
          >
            {childrenContent}
          </IrisGrid>
        )}

        {!isModelReady && <></>}
      </WidgetPanel>
    );
  }
}

IrisGridPanel.propTypes = {
  children: PropTypes.node,
  glContainer: GLPropTypes.Container.isRequired,
  glEventHub: GLPropTypes.EventHub.isRequired,
  metadata: PropTypes.shape({
    table: PropTypes.string.isRequired,
    query: PropTypes.string,
    querySerial: PropTypes.string,
  }).isRequired,
  panelState: PropTypes.shape({
    gridState: PropTypes.shape({}),
    irisGridState: PropTypes.shape({
      aggregationSettings: PropTypes.shape({}),
      customColumns: PropTypes.arrayOf(PropTypes.string),
      selectDistinctColumns: PropTypes.arrayOf(PropTypes.string),
      rollupConfig: PropTypes.shape({
        columns: PropTypes.arrayOf(PropTypes.string).isRequired,
      }),
      pendingDataMap: PropTypes.arrayOf(PropTypes.array),
    }),
    irisGridPanelState: PropTypes.shape({}),
  }),
  makeModel: PropTypes.func.isRequired,
  inputFilters: PropTypes.arrayOf(UIPropTypes.InputFilter).isRequired,
  links: UIPropTypes.Links.isRequired,
  columnSelectionValidator: PropTypes.func,
  onStateChange: PropTypes.func,
  onPanelStateUpdate: PropTypes.func,
  user: IrisPropTypes.User.isRequired,
  workspace: PropTypes.shape({}).isRequired,
};

IrisGridPanel.defaultProps = {
  children: null,
  panelState: null,
  columnSelectionValidator: null,
  onStateChange: () => {},
  onPanelStateUpdate: () => {},
};

IrisGridPanel.displayName = 'IrisGridPanel';

const mapStateToProps = (state, ownProps) => {
  const { localDashboardId } = ownProps;
  return {
    inputFilters: getInputFiltersForDashboard(state, localDashboardId),
    links: getLinksForDashboard(state, localDashboardId),
    columnSelectionValidator: getColumnSelectionValidatorForDashboard(
      state,
      localDashboardId
    ),
    user: getUser(state),
    workspace: getWorkspace(state),
  };
};

export default connect(mapStateToProps, null, null, { forwardRef: true })(
  IrisGridPanel
);
