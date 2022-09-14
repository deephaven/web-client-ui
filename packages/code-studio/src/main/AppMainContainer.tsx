import React, {
  ClipboardEvent,
  ChangeEvent,
  Component,
  ReactElement,
  RefObject,
  ForwardRefExoticComponent,
} from 'react';
import classNames from 'classnames';
import memoize from 'memoize-one';
import { CSSTransition } from 'react-transition-group';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ContextActions,
  Tooltip,
  ThemeExport,
  GLOBAL_SHORTCUTS,
  Popper,
  ContextAction,
} from '@deephaven/components';
import {
  IrisGridModel,
  SHORTCUTS as IRIS_GRID_SHORTCUTS,
} from '@deephaven/iris-grid';
import {
  ClosedPanels,
  Dashboard,
  DashboardLayoutConfig,
  DashboardPanelProps,
  DashboardUtils,
  DEFAULT_DASHBOARD_ID,
  getDashboardData,
  PanelEvent,
  PanelProps,
  updateDashboardData as updateDashboardDataAction,
} from '@deephaven/dashboard';
import {
  ChartPlugin,
  ConsolePlugin,
  FilterPlugin,
  GridPlugin,
  InputFilterEvent,
  LinkerPlugin,
  MarkdownEvent,
  NotebookEvent,
  MarkdownPlugin,
  PandasPlugin,
  getDashboardSessionWrapper,
  ControlType,
  ToolType,
  ChartBuilderPlugin,
  FilterSet,
  Link,
  ChartPanelProps,
  PandasPanelProps,
  IrisGridPanelProps,
  ColumnSelectionValidator,
  SessionConfig,
  getDashboardConnection,
} from '@deephaven/dashboard-core-plugins';
import { vsGear, dhShapes, dhPanels } from '@deephaven/icons';
import dh, {
  IdeConnection,
  IdeSession,
  VariableDefinition,
  VariableTypeUnion,
} from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import {
  getActiveTool,
  getWorkspace,
  getUser,
  setActiveTool as setActiveToolAction,
  updateWorkspaceData as updateWorkspaceDataAction,
  getPlugins,
  Workspace,
  DeephavenPluginModuleMap,
  WorkspaceData,
  RootState,
  UserPermissions,
} from '@deephaven/redux';
import { PromiseUtils } from '@deephaven/utils';
import GoldenLayout, { ItemConfigType } from '@deephaven/golden-layout';
import JSZip from 'jszip';
import SettingsMenu from '../settings/SettingsMenu';
import AppControlsMenu from './AppControlsMenu';
import { getLayoutStorage } from '../redux';
import Logo from '../settings/community-wordmark-app.svg';
import './AppMainContainer.scss';
import WidgetList, { WindowMouseEvent } from './WidgetList';
import {
  createChartModel,
  createGridModel,
  GridPanelMetadata,
} from './WidgetUtils';
import EmptyDashboard from './EmptyDashboard';
import UserLayoutUtils from './UserLayoutUtils';
import DownloadServiceWorkerUtils from '../DownloadServiceWorkerUtils';
import { PluginUtils } from '../plugins';
import LayoutStorage from '../storage/LayoutStorage';

const log = Log.module('AppMainContainer');

type InputFileFormat =
  | string
  | number[]
  | Uint8Array
  | ArrayBuffer
  | Blob
  | NodeJS.ReadableStream;

export type AppDashboardData = {
  closed: ClosedPanels;
  columnSelectionValidator?: ColumnSelectionValidator;
  filterSets: FilterSet[];
  links: Link[];
  openedMap: Map<string | string[], Component>;
};

interface User {
  name: string;
  operateAs: string;
  groups: string[];
  permissions: UserPermissions;
}

interface AppMainContainerProps {
  activeTool: string;
  dashboardData: AppDashboardData;
  layoutStorage: LayoutStorage;
  match: {
    params: { notebookPath: string };
  };
  connection: IdeConnection;
  session?: IdeSession;
  sessionConfig?: SessionConfig;
  setActiveTool: (tool: string) => void;
  updateDashboardData: (id: string, data: Partial<AppDashboardData>) => void;
  updateWorkspaceData: (workspaceData: Partial<WorkspaceData>) => void;
  user: User;
  workspace: Workspace;
  plugins: DeephavenPluginModuleMap;
}

interface AppMainContainerState {
  contextActions: ContextAction[];
  isPanelsMenuShown: boolean;
  isSettingsMenuShown: boolean;
  widgets: VariableDefinition[];
}

export class AppMainContainer extends Component<
  AppMainContainerProps & RouteComponentProps,
  AppMainContainerState
> {
  static handleWindowBeforeUnload(event: BeforeUnloadEvent): void {
    event.preventDefault();
    // returnValue is required for beforeReload event prompt
    // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload#example
    // eslint-disable-next-line no-param-reassign
    event.returnValue = '';
  }

  static hydrateConsole(props: PanelProps, id: string): DashboardPanelProps {
    return DashboardUtils.hydrate(
      {
        ...props,
        unzip: (zipFile: InputFileFormat) =>
          JSZip.loadAsync(zipFile).then(zip => Object.values(zip.files)),
      },
      id
    );
  }

  constructor(props: AppMainContainerProps & RouteComponentProps) {
    super(props);
    this.handleSettingsMenuHide = this.handleSettingsMenuHide.bind(this);
    this.handleSettingsMenuShow = this.handleSettingsMenuShow.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleControlSelect = this.handleControlSelect.bind(this);
    this.handleToolSelect = this.handleToolSelect.bind(this);
    this.handleClearFilter = this.handleClearFilter.bind(this);
    this.handleDataChange = this.handleDataChange.bind(this);
    this.handleAutoFillClick = this.handleAutoFillClick.bind(this);
    this.handleGoldenLayoutChange = this.handleGoldenLayoutChange.bind(this);
    this.handleLayoutConfigChange = this.handleLayoutConfigChange.bind(this);
    this.handleExportLayoutClick = this.handleExportLayoutClick.bind(this);
    this.handleImportLayoutClick = this.handleImportLayoutClick.bind(this);
    this.handleImportLayoutFiles = this.handleImportLayoutFiles.bind(this);
    this.handleLoadTablePlugin = this.handleLoadTablePlugin.bind(this);
    this.handleResetLayoutClick = this.handleResetLayoutClick.bind(this);
    this.handleWidgetMenuClick = this.handleWidgetMenuClick.bind(this);
    this.handleWidgetsMenuClose = this.handleWidgetsMenuClose.bind(this);
    this.handleWidgetSelect = this.handleWidgetSelect.bind(this);
    this.handlePaste = this.handlePaste.bind(this);
    this.hydrateChart = this.hydrateChart.bind(this);
    this.hydrateGrid = this.hydrateGrid.bind(this);
    this.hydratePandas = this.hydratePandas.bind(this);
    this.hydrateDefault = this.hydrateDefault.bind(this);
    this.openNotebookFromURL = this.openNotebookFromURL.bind(this);

    this.importElement = React.createRef();

    this.state = {
      contextActions: [
        {
          action: () => {
            this.handleToolSelect(ToolType.LINKER);
          },
          shortcut: GLOBAL_SHORTCUTS.LINKER,
          isGlobal: true,
        },
        {
          action: () => {
            // triggers clear all filters tab event, which in turn triggers a glEventhub event
            // widget panels can subscribe to his event, and execute their own clearing logic
            this.sendClearFilter();
          },
          shortcut: IRIS_GRID_SHORTCUTS.TABLE.CLEAR_ALL_FILTERS,
          isGlobal: true,
        },
        {
          action: () => {
            log.debug('Consume unhandled save shortcut');
          },
          shortcut: GLOBAL_SHORTCUTS.SAVE,
          isGlobal: true,
        },
      ],
      isPanelsMenuShown: false,
      isSettingsMenuShown: false,
      widgets: [],
    };
  }

  componentDidMount(): void {
    this.initWidgets();

    window.addEventListener(
      'beforeunload',
      AppMainContainer.handleWindowBeforeUnload
    );
  }

  componentDidUpdate(prevProps: AppMainContainerProps): void {
    const { dashboardData } = this.props;
    if (prevProps.dashboardData !== dashboardData) {
      this.handleDataChange(dashboardData);
    }
  }

  componentWillUnmount(): void {
    this.deinitWidgets();

    window.removeEventListener(
      'beforeunload',
      AppMainContainer.handleWindowBeforeUnload
    );
  }

  goldenLayout?: GoldenLayout;

  importElement: RefObject<HTMLInputElement>;

  widgetListenerRemover?: () => void;

  initWidgets(): void {
    const { connection } = this.props;
    if (!connection.subscribeToFieldUpdates) {
      log.warn(
        'subscribeToFieldUpdates not supported, not initializing widgets'
      );
      return;
    }

    this.widgetListenerRemover = connection.subscribeToFieldUpdates(updates => {
      log.debug('Got updates', updates);
      this.setState(({ widgets }) => {
        const { updated, created, removed } = updates;

        // Remove from the array if it's been removed OR modified. We'll add it back after if it was modified.
        const widgetsToRemove = [...updated, ...removed];
        const newWidgets = widgets.filter(
          widget =>
            !widgetsToRemove.some(toRemove => toRemove.name === widget.name)
        );

        // Now add all the modified and updated widgets back in
        const widgetsToAdd = [...updated, ...created];
        widgetsToAdd.forEach(toAdd => {
          if (toAdd.name) {
            newWidgets.push(toAdd);
          }
        });

        return { widgets: newWidgets };
      });
    });
  }

  deinitWidgets(): void {
    this.widgetListenerRemover?.();
  }

  openNotebookFromURL(): void {
    const { match } = this.props;
    const { notebookPath } = match.params;

    if (notebookPath) {
      const { session, sessionConfig } = this.props;
      if (!session || !sessionConfig) {
        log.error('No session available to open notebook URL', notebookPath);
        return;
      }
      const fileMetadata = {
        id: `/${notebookPath}`,
        itemName: `/${notebookPath}`,
      };

      const language = sessionConfig.type;
      const notebookSettings = {
        value: null,
        language,
      };

      this.emitLayoutEvent(
        NotebookEvent.SELECT_NOTEBOOK,
        session,
        language,
        notebookSettings,
        fileMetadata,
        true
      );
    }
  }

  sendClearFilter(): void {
    this.emitLayoutEvent(InputFilterEvent.CLEAR_ALL_FILTERS);
  }

  emitLayoutEvent(event: string, ...args: unknown[]): void {
    this.goldenLayout?.eventHub.emit(event, ...args);
  }

  // eslint-disable-next-line class-methods-use-this
  handleError(error: unknown): void {
    if (PromiseUtils.isCanceled(error)) {
      return;
    }
    log.error(error);
  }

  handleSettingsMenuHide(): void {
    this.setState({ isSettingsMenuShown: false });
  }

  handleSettingsMenuShow(): void {
    this.setState({ isSettingsMenuShown: true });
  }

  handleControlSelect(
    type: string,
    dragEvent: KeyboardEvent | null = null
  ): void {
    log.debug('handleControlSelect', type);

    switch (type) {
      case ControlType.DROPDOWN_FILTER:
        this.emitLayoutEvent(InputFilterEvent.OPEN_DROPDOWN, {
          title: 'DropdownFilter',
          type,
          createNewStack: true,
          dragEvent,
        });
        break;
      case ControlType.INPUT_FILTER:
        this.emitLayoutEvent(InputFilterEvent.OPEN_INPUT, {
          title: 'InputFilter',
          type,
          createNewStack: true,
          dragEvent,
        });
        break;
      case ControlType.MARKDOWN:
        this.emitLayoutEvent(MarkdownEvent.OPEN, {
          title: 'Markdown',
          type,
          dragEvent,
        });
        break;
      case ControlType.FILTER_SET_MANAGER:
        this.emitLayoutEvent(InputFilterEvent.OPEN_FILTER_SET_MANAGER, {
          title: 'FilterSets',
          type,
          dragEvent,
        });
        break;
      default:
        throw new Error(`Unrecognized control type ${type}`);
    }
  }

  handleToolSelect(toolType: string): void {
    log.debug('handleToolSelect', toolType);

    const { activeTool, setActiveTool } = this.props;
    if (activeTool === toolType) {
      setActiveTool(ToolType.DEFAULT);
    } else {
      setActiveTool(toolType);
    }
  }

  handleClearFilter(): void {
    this.sendClearFilter();
  }

  handleDataChange(data: AppDashboardData): void {
    const { updateWorkspaceData } = this.props;

    // Only save the data that is serializable/we want to persist to the workspace
    const { closed, filterSets, links } = data;
    updateWorkspaceData({ closed, filterSets, links });
  }

  handleGoldenLayoutChange(goldenLayout: GoldenLayout): void {
    this.goldenLayout = goldenLayout;
  }

  handleLayoutConfigChange(layoutConfig?: DashboardLayoutConfig): void {
    const { updateWorkspaceData } = this.props;
    updateWorkspaceData({ layoutConfig });
  }

  handleWidgetMenuClick(): void {
    this.setState(({ isPanelsMenuShown }) => ({
      isPanelsMenuShown: !isPanelsMenuShown,
    }));
  }

  handleWidgetSelect(
    widget: VariableDefinition,
    dragEvent?: WindowMouseEvent
  ): void {
    this.setState({ isPanelsMenuShown: false });

    log.debug('handleWidgetSelect', widget, dragEvent);

    this.openWidget(widget, dragEvent);
  }

  handleWidgetsMenuClose(): void {
    this.setState({ isPanelsMenuShown: false });
  }

  handleAutoFillClick(): void {
    const { widgets } = this.state;

    log.debug('handleAutoFillClick', widgets);

    const sortedWidgets = widgets.sort((a, b) =>
      a.title != null && b.title != null ? a.title.localeCompare(b.title) : 0
    );
    for (let i = 0; i < sortedWidgets.length; i += 1) {
      this.openWidget(sortedWidgets[i]);
    }
  }

  handleExportLayoutClick(): void {
    log.info('handleExportLayoutClick');

    this.setState({ isPanelsMenuShown: false });

    try {
      const { workspace } = this.props;
      const { data } = workspace;
      const exportedConfig = UserLayoutUtils.exportLayout(
        data as {
          filterSets: FilterSet[];
          links: Link[];
          layoutConfig: GoldenLayout.ItemConfigType[];
        }
      );

      log.info('handleExportLayoutClick exportedConfig', exportedConfig);

      const blob = new Blob([JSON.stringify(exportedConfig)], {
        type: 'application/json',
      });
      const timestamp = dh.i18n.DateTimeFormat.format(
        'yyyy-MM-dd-HHmmss',
        new Date()
      );
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `deephaven-app-layout-${timestamp}.json`;
      link.click();
    } catch (e) {
      log.error('Unable to export layout', e);
    }
  }

  handleImportLayoutClick(): void {
    log.info('handleImportLayoutClick');

    this.setState({ isPanelsMenuShown: false });

    // Reset the file list on the import element, otherwise user won't be prompted again
    if (this.importElement.current != null) {
      this.importElement.current.value = '';
      this.importElement.current.click();
    }
  }

  handleResetLayoutClick(): void {
    log.info('handleResetLayoutClick');

    this.setState({ isPanelsMenuShown: false });

    this.resetLayout();
  }

  handleImportLayoutFiles(event: ChangeEvent<HTMLInputElement>): void {
    event.stopPropagation();
    event.preventDefault();

    if (event.target.files != null) {
      this.importLayoutFile(event.target.files?.[0]);
    }
  }

  /**
   * Import the provided file and set it in the workspace data (which should then load it in the dashboard)
   * @param file JSON file to import
   */
  async importLayoutFile(file: File): Promise<void> {
    try {
      const { updateDashboardData, updateWorkspaceData } = this.props;
      const fileText = await file.text();
      const exportedLayout = JSON.parse(fileText);
      const {
        filterSets,
        layoutConfig,
        links,
      } = UserLayoutUtils.normalizeLayout(exportedLayout);

      updateWorkspaceData({ layoutConfig });
      updateDashboardData(DEFAULT_DASHBOARD_ID, {
        filterSets,
        links,
      });
    } catch (e) {
      log.error('Unable to import layout', e);
    }
  }

  /**
   * Resets the users layout to the default layout
   */
  async resetLayout(): Promise<void> {
    const { layoutStorage, session } = this.props;
    const {
      filterSets,
      layoutConfig,
      links,
    } = await UserLayoutUtils.getDefaultLayout(
      layoutStorage,
      session !== undefined
    );

    const { updateDashboardData, updateWorkspaceData } = this.props;
    updateWorkspaceData({ layoutConfig });
    updateDashboardData(DEFAULT_DASHBOARD_ID, {
      filterSets,
      links,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  handlePaste(event: ClipboardEvent<HTMLDivElement>): void {
    let element = event.currentTarget.parentElement;

    while (element != null) {
      if (element.classList.contains('monaco-editor')) {
        return;
      }
      element = element.parentElement;
    }

    const { clipboardData } = event;
    const pastedData = clipboardData.getData('Text');
    const replacedChars = /“|”/g;
    if (replacedChars.test(pastedData)) {
      event.preventDefault();
      event.stopPropagation();

      document.execCommand(
        'insertText',
        false,
        pastedData.replace(replacedChars, '"')
      );
    }
  }

  /**
   * Load a Table plugin specified by a table
   * @param pluginName The name of the plugin to load
   * @returns An element from the plugin
   */
  handleLoadTablePlugin(
    pluginName: string
  ): ForwardRefExoticComponent<React.RefAttributes<unknown>> {
    const { plugins } = this.props;

    // First check if we have any plugin modules loaded that match the TablePlugin.
    const pluginModule = plugins.get(pluginName);
    if (
      pluginModule != null &&
      (pluginModule as { TablePlugin: ReactElement }).TablePlugin
    ) {
      return (pluginModule as {
        TablePlugin: ForwardRefExoticComponent<React.RefAttributes<unknown>>;
      }).TablePlugin;
    }

    return PluginUtils.loadComponentPlugin(pluginName);
  }

  hydrateDefault(
    props: {
      metadata?: { type?: VariableTypeUnion; id?: string; name?: string };
    } & PanelProps,
    id: string
  ): DashboardPanelProps & { fetch?: () => Promise<unknown> } {
    const { connection } = this.props;
    const { metadata } = props;
    if (metadata?.type && (metadata?.id || metadata?.name)) {
      // Looks like a widget, hydrate it as such
      const widget: VariableDefinition = metadata.id
        ? {
            type: metadata.type,
            id: metadata.id,
          }
        : { type: metadata.type, name: metadata.name, title: metadata.name };
      return {
        fetch: () => connection.getObject(widget),
        localDashboardId: id,
        ...props,
      };
    }
    return DashboardUtils.hydrate(props, id);
  }

  hydrateGrid(props: IrisGridPanelProps, id: string): IrisGridPanelProps {
    return this.hydrateTable(props, id, dh.VariableType.TABLE);
  }

  hydratePandas(props: PandasPanelProps, id: string): PandasPanelProps {
    return this.hydrateTable(props, id, dh.VariableType.PANDAS);
  }

  hydrateTable<T extends { metadata: GridPanelMetadata }>(
    props: T,
    id: string,
    type: VariableTypeUnion = dh.VariableType.TABLE
  ): T & {
    getDownloadWorker: () => Promise<ServiceWorker>;
    loadPlugin: (
      pluginName: string
    ) => React.ForwardRefExoticComponent<React.RefAttributes<unknown>>;
    localDashboardId: string;
    makeModel: () => Promise<IrisGridModel>;
  } {
    const { connection } = this.props;
    return {
      ...props,
      getDownloadWorker: DownloadServiceWorkerUtils.getServiceWorker,
      loadPlugin: this.handleLoadTablePlugin,
      localDashboardId: id,
      makeModel: () => createGridModel(connection, props.metadata, type),
    };
  }

  hydrateChart(props: ChartPanelProps, id: string): ChartPanelProps {
    const { connection } = this.props;
    return {
      ...props,
      localDashboardId: id,
      makeModel: () => {
        const { metadata, panelState } = props;
        return createChartModel(connection, metadata, panelState);
      },
    };
  }

  /**
   * Open a widget up, using a drag event if specified.
   * @param widget The widget to open
   * @param dragEvent The mouse drag event that trigger it, undefined if it was not triggered by a drag
   */
  openWidget(widget: VariableDefinition, dragEvent?: WindowMouseEvent): void {
    const { connection } = this.props;
    this.emitLayoutEvent(PanelEvent.OPEN, {
      dragEvent,
      fetch: () => connection.getObject(widget),
      widget,
    });
  }

  getDashboardPlugins = memoize(plugins =>
    [...plugins.entries()]
      .filter(([, { DashboardPlugin }]) => DashboardPlugin)
      .map(([name, { DashboardPlugin }]) => <DashboardPlugin key={name} />)
  );

  render(): ReactElement {
    const { activeTool, plugins, user, workspace } = this.props;
    const { data: workspaceData } = workspace;
    const { layoutConfig } = workspaceData;
    const { permissions } = user;
    const { canUsePanels } = permissions;
    const {
      contextActions,
      isPanelsMenuShown,
      isSettingsMenuShown,
      widgets,
    } = this.state;
    const dashboardPlugins = this.getDashboardPlugins(plugins);

    return (
      <div
        className={classNames(
          'app-main-tabs',
          'w-100',
          'h-100',
          'd-flex',
          'flex-column',
          activeTool ? `active-tool-${activeTool.toLowerCase()}` : ''
        )}
        onPaste={this.handlePaste}
        tabIndex={-1}
      >
        <nav className="nav-container">
          <div className="app-main-top-nav-menus">
            <img
              src={Logo}
              alt="Deephaven Data Labs"
              width="115px"
              className="ml-1"
            />
            <div>
              <button type="button" className="btn btn-link btn-panels-menu">
                <FontAwesomeIcon icon={dhShapes} />
                Controls
                <AppControlsMenu
                  handleControlSelect={this.handleControlSelect}
                  handleToolSelect={this.handleToolSelect}
                  onClearFilter={this.handleClearFilter}
                />
              </button>
              {canUsePanels && (
                <button
                  type="button"
                  className="btn btn-link btn-panels-menu btn-show-panels"
                  data-testid="app-main-panels-button"
                  onClick={this.handleWidgetMenuClick}
                >
                  <FontAwesomeIcon icon={dhPanels} />
                  Panels
                  <Popper
                    isShown={isPanelsMenuShown}
                    className="panels-menu-popper"
                    onExited={this.handleWidgetsMenuClose}
                    closeOnBlur
                    interactive
                  >
                    <WidgetList
                      widgets={widgets}
                      onExportLayout={this.handleExportLayoutClick}
                      onImportLayout={this.handleImportLayoutClick}
                      onResetLayout={this.handleResetLayoutClick}
                      onSelect={this.handleWidgetSelect}
                    />
                  </Popper>
                </button>
              )}
              <button
                type="button"
                className={classNames(
                  'btn btn-link btn-link-icon btn-settings-menu',
                  { 'text-warning': user.operateAs !== user.name }
                )}
                onClick={this.handleSettingsMenuShow}
              >
                <FontAwesomeIcon
                  icon={vsGear}
                  transform="grow-3 right-1 down-1"
                />
                <Tooltip>User Settings</Tooltip>
              </button>
            </div>
          </div>
        </nav>
        <Dashboard
          emptyDashboard={
            <EmptyDashboard onAutoFillClick={this.handleAutoFillClick} />
          }
          id={DEFAULT_DASHBOARD_ID}
          layoutConfig={layoutConfig as ItemConfigType[]}
          onGoldenLayoutChange={this.handleGoldenLayoutChange}
          onLayoutConfigChange={this.handleLayoutConfigChange}
          onLayoutInitialized={this.openNotebookFromURL}
          hydrate={this.hydrateDefault}
        >
          <GridPlugin
            hydrate={this.hydrateGrid}
            getDownloadWorker={DownloadServiceWorkerUtils.getServiceWorker}
            loadPlugin={this.handleLoadTablePlugin}
          />
          <ChartPlugin hydrate={this.hydrateChart} />
          <ChartBuilderPlugin />
          <ConsolePlugin
            hydrateConsole={AppMainContainer.hydrateConsole}
            notebooksUrl={
              new URL(
                `${import.meta.env.VITE_NOTEBOOKS_URL}/`,
                `${window.location}`
              ).href
            }
          />
          <FilterPlugin />
          <PandasPlugin hydrate={this.hydratePandas} />
          <MarkdownPlugin />
          <LinkerPlugin />
          {dashboardPlugins}
        </Dashboard>
        <CSSTransition
          in={isSettingsMenuShown}
          timeout={ThemeExport.transitionMidMs}
          classNames="slide-left"
          mountOnEnter
          unmountOnExit
        >
          <SettingsMenu onDone={this.handleSettingsMenuHide} />
        </CSSTransition>
        <ContextActions actions={contextActions} />
        <input
          ref={this.importElement}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={this.handleImportLayoutFiles}
        />
      </div>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  activeTool: getActiveTool(state),
  dashboardData: getDashboardData(
    state,
    DEFAULT_DASHBOARD_ID
  ) as AppDashboardData,
  layoutStorage: getLayoutStorage(state),
  plugins: getPlugins(state),
  connection: getDashboardConnection(state, DEFAULT_DASHBOARD_ID),
  session: getDashboardSessionWrapper(state, DEFAULT_DASHBOARD_ID)?.session,
  sessionConfig: getDashboardSessionWrapper(state, DEFAULT_DASHBOARD_ID)
    ?.config,
  user: getUser(state),
  workspace: getWorkspace(state),
});

export default connect(mapStateToProps, {
  setActiveTool: setActiveToolAction,
  updateDashboardData: updateDashboardDataAction,
  updateWorkspaceData: updateWorkspaceDataAction,
})(withRouter(AppMainContainer));
