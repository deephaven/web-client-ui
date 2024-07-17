import React, {
  ClipboardEvent,
  ChangeEvent,
  Component,
  ReactElement,
  RefObject,
} from 'react';
import classNames from 'classnames';
import memoize from 'memoize-one';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ContextActions,
  GLOBAL_SHORTCUTS,
  Popper,
  ContextAction,
  Button,
  Logo,
  BasicModal,
  NavTabList,
  type NavTabItem,
  SlideTransition,
  LoadingOverlay,
} from '@deephaven/components';
import { SHORTCUTS as IRIS_GRID_SHORTCUTS } from '@deephaven/iris-grid';
import {
  CreateDashboardPayload,
  DashboardUtils,
  DEFAULT_DASHBOARD_ID,
  DehydratedDashboardPanelProps,
  emitPanelOpen,
  getAllDashboardsData,
  getDashboardData,
  listenForCreateDashboard,
  PanelEvent,
  setDashboardData as setDashboardDataAction,
  setDashboardPluginData as setDashboardPluginDataAction,
  stopListenForCreateDashboard,
  updateDashboardData as updateDashboardDataAction,
} from '@deephaven/dashboard';
import {
  ConsolePlugin,
  InputFilterEvent,
  MarkdownEvent,
  NotebookEvent,
  getDashboardSessionWrapper,
  ControlType,
  ToolType,
  getDashboardConnection,
  NotebookPanel,
} from '@deephaven/dashboard-core-plugins';
import { vsGear, dhShapes, dhPanels, vsTerminal } from '@deephaven/icons';
import { getVariableDescriptor } from '@deephaven/jsapi-bootstrap';
import dh from '@deephaven/jsapi-shim';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { SessionConfig } from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import {
  getActiveTool,
  getWorkspace,
  getUser,
  setActiveTool as setActiveToolAction,
  updateWorkspaceData as updateWorkspaceDataAction,
  getPlugins,
  WorkspaceData,
  RootState,
  User,
  ServerConfigValues,
  CustomizableWorkspace,
  DashboardData,
} from '@deephaven/redux';
import {
  bindAllMethods,
  copyToClipboard,
  PromiseUtils,
  EMPTY_ARRAY,
  assertNotNull,
} from '@deephaven/utils';
import GoldenLayout, { EventHub } from '@deephaven/golden-layout';
import type { ItemConfig } from '@deephaven/golden-layout';
import { type PluginModuleMap, getDashboardPlugins } from '@deephaven/plugin';
import {
  AppDashboards,
  LayoutStorage,
  UserLayoutUtils,
} from '@deephaven/app-utils';
import JSZip from 'jszip';
import SettingsMenu from '../settings/SettingsMenu';
import AppControlsMenu from './AppControlsMenu';
import { getLayoutStorage, getServerConfigValues } from '../redux';
import './AppMainContainer.scss';
import WidgetList, { WindowMouseEvent } from './WidgetList';
import { getFormattedVersionInfo } from '../settings/SettingsUtils';
import EmptyDashboard from './EmptyDashboard';

const log = Log.module('AppMainContainer');

type InputFileFormat =
  | string
  | number[]
  | Uint8Array
  | ArrayBuffer
  | Blob
  | NodeJS.ReadableStream;

interface AppMainContainerProps {
  activeTool: string;
  allDashboardData: Record<string, DashboardData>;
  dashboardData: DashboardData;
  layoutStorage: LayoutStorage;
  match: {
    params: { notebookPath: string };
  };
  connection?: DhType.IdeConnection;
  session?: DhType.IdeSession;
  sessionConfig?: SessionConfig;
  setActiveTool: (tool: string) => void;
  setDashboardData: (id: string, data: DashboardData) => void;
  setDashboardPluginData: (
    dashboardId: string,
    pluginId: string,
    data: unknown
  ) => void;
  updateDashboardData: (id: string, data: Partial<DashboardData>) => void;
  updateWorkspaceData: (workspaceData: Partial<WorkspaceData>) => void;
  user: User;
  workspace: CustomizableWorkspace;
  plugins: PluginModuleMap;
  serverConfigValues: ServerConfigValues;
}

interface AppMainContainerState {
  contextActions: ContextAction[];
  isPanelsMenuShown: boolean;
  isResetLayoutPromptShown: boolean;
  isSettingsMenuShown: boolean;
  unsavedNotebookCount: number;
  widgets: DhType.ide.VariableDefinition[];
  tabs: NavTabItem[];
  activeTabKey: string;

  // Number of times the layout has been re-initialized
  layoutIteration: number;
}

export class AppMainContainer extends Component<
  AppMainContainerProps & RouteComponentProps,
  AppMainContainerState
> {
  static handleWindowBeforeUnload(event: BeforeUnloadEvent): void {
    // in development, allow auto-reload
    if (import.meta.env.PROD) {
      event.preventDefault();
      // returnValue is required for beforeReload event prompt
      // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload#example
      // eslint-disable-next-line no-param-reassign
      event.returnValue = '';
    }
  }

  static hydrateConsole(
    props: DehydratedDashboardPanelProps,
    id: string
  ): DehydratedDashboardPanelProps {
    return DashboardUtils.hydrate(
      {
        ...props,
        unzip: (zipFile: InputFileFormat) =>
          JSZip.loadAsync(zipFile).then(zip => Object.values(zip.files)),
      },
      id
    );
  }

  static handleRefresh(): void {
    log.info('Refreshing application');
    window.location.reload();
  }

  constructor(props: AppMainContainerProps & RouteComponentProps) {
    super(props);

    bindAllMethods(this);

    this.importElement = React.createRef();

    const { allDashboardData } = this.props;

    this.dashboardLayouts = new Map();

    this.state = {
      contextActions: [
        {
          action: () => {
            // Copies the version info to the clipboard for easy pasting into a ticket
            const { serverConfigValues } = this.props;
            const versionInfo = getFormattedVersionInfo(serverConfigValues);
            const versionInfoText = Object.entries(versionInfo)
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n');
            copyToClipboard(versionInfoText);
          },
          shortcut: GLOBAL_SHORTCUTS.COPY_VERSION_INFO,
          isGlobal: true,
        },
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
            this.sendReopenLast();
          },
          shortcut: GLOBAL_SHORTCUTS.REOPEN_CLOSED_PANEL,
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
      isResetLayoutPromptShown: false,
      isSettingsMenuShown: false,
      unsavedNotebookCount: 0,
      widgets: [],
      tabs: Object.entries(allDashboardData).map(([key, value]) => ({
        key,
        title: value.title ?? 'Untitled',
        isClosable: key !== DEFAULT_DASHBOARD_ID,
        icon: key === DEFAULT_DASHBOARD_ID ? vsTerminal : undefined,
      })),
      activeTabKey: DEFAULT_DASHBOARD_ID,
      layoutIteration: 0,
    };
  }

  componentDidMount(): void {
    this.initWidgets();
    this.initDashboardData();

    window.addEventListener(
      'beforeunload',
      AppMainContainer.handleWindowBeforeUnload
    );
  }

  componentDidUpdate(
    prevProps: AppMainContainerProps,
    prevState: AppMainContainerState
  ): void {
    const { dashboardData } = this.props;
    if (prevProps.dashboardData !== dashboardData) {
      this.handleDataChange(dashboardData);
    }
  }

  componentWillUnmount(): void {
    this.deinitWidgets();

    this.dashboardLayouts.forEach(layout => {
      stopListenForCreateDashboard(layout.eventHub, this.handleCreateDashboard);
    });

    window.removeEventListener(
      'beforeunload',
      AppMainContainer.handleWindowBeforeUnload
    );
  }

  /** Map from the dashboard ID to the GoldenLayout instance for that dashboard */
  dashboardLayouts: Map<string, GoldenLayout>;

  importElement: RefObject<HTMLInputElement>;

  widgetListenerRemover?: () => void;

  initWidgets(): void {
    const { connection } = this.props;
    if (connection == null) {
      return;
    }

    if (connection.subscribeToFieldUpdates == null) {
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
          if (toAdd.name != null && toAdd.name !== '') {
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

  initDashboardData(): void {
    // TODO: #1746 We should be loading data from a dashboard storage store
    // For now only the default dashboard data is stored with the workspace and set on the default dashboard
    const { setDashboardPluginData, updateDashboardData, workspace } =
      this.props;
    const { data: workspaceData } = workspace;
    const { filterSets, links, pluginDataMap } = workspaceData;
    updateDashboardData(DEFAULT_DASHBOARD_ID, {
      filterSets,
      links,
    });
    if (pluginDataMap != null) {
      const pluginKeys = Object.keys(pluginDataMap);
      for (let i = 0; i < pluginKeys.length; i += 1) {
        const pluginId = pluginKeys[i];
        const pluginData = pluginDataMap[pluginId];
        log.debug('initDashboardData plugin data', pluginId, pluginData);
        setDashboardPluginData(DEFAULT_DASHBOARD_ID, pluginId, pluginData);
      }
    }
  }

  openNotebookFromURL(): void {
    const { match } = this.props;
    const { notebookPath } = match.params;

    if (notebookPath) {
      const { session, sessionConfig } = this.props;
      if (session == null || sessionConfig == null) {
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

  sendReopenLast(): void {
    this.emitLayoutEvent(PanelEvent.REOPEN_LAST);
  }

  getActiveEventHub(): EventHub {
    const { activeTabKey } = this.state;
    const layout = this.dashboardLayouts.get(activeTabKey);
    assertNotNull(layout, 'No active layout found');
    return layout.eventHub;
  }

  emitLayoutEvent(event: string, ...args: unknown[]): void {
    this.getActiveEventHub().emit(event, ...args);
  }

  handleCancelResetLayoutPrompt(): void {
    this.setState({
      isResetLayoutPromptShown: false,
    });
  }

  handleConfirmResetLayoutPrompt(): void {
    this.setState({
      isResetLayoutPromptShown: false,
    });

    this.resetLayout();
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

  handleControlSelect(type: string, dragEvent: Event): void {
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

  handleDataChange(data: DashboardData): void {
    const { updateWorkspaceData } = this.props;

    // Only save the data that is serializable/we want to persist to the workspace
    const { closed, filterSets, links, pluginDataMap } = data;
    updateWorkspaceData({ closed, filterSets, links, pluginDataMap });
  }

  handleGoldenLayoutChange(newLayout: GoldenLayout): void {
    const { activeTabKey } = this.state;
    const oldLayout = this.dashboardLayouts.get(activeTabKey);
    if (oldLayout === newLayout) return;

    if (oldLayout != null) {
      stopListenForCreateDashboard(
        oldLayout.eventHub,
        this.handleCreateDashboard
      );
    }

    this.dashboardLayouts.set(activeTabKey, newLayout);

    listenForCreateDashboard(newLayout.eventHub, this.handleCreateDashboard);
  }

  handleCreateDashboard({
    pluginId,
    title,
    data,
  }: CreateDashboardPayload): void {
    const newId = nanoid();
    const { setDashboardPluginData } = this.props;
    setDashboardPluginData(newId, pluginId, data);
    this.setState(({ tabs }) => ({
      tabs: [
        ...tabs,
        {
          key: newId,
          title,
        },
      ],
      activeTabKey: newId,
    }));
  }

  handleWidgetMenuClick(): void {
    this.setState(({ isPanelsMenuShown }) => ({
      isPanelsMenuShown: !isPanelsMenuShown,
    }));
  }

  handleWidgetSelect(
    widget: DhType.ide.VariableDefinition,
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
      const exportedConfig = UserLayoutUtils.exportLayout(data);

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

    this.setState({
      isPanelsMenuShown: false,
      isResetLayoutPromptShown: true,
      unsavedNotebookCount: NotebookPanel.unsavedNotebookCount(),
    });
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
      const { filterSets, layoutConfig, links, pluginDataMap } =
        UserLayoutUtils.normalizeLayout(exportedLayout);

      updateWorkspaceData({ layoutConfig });
      updateDashboardData(DEFAULT_DASHBOARD_ID, {
        filterSets,
        links,
        pluginDataMap,
      });
      this.setState(({ layoutIteration }) => ({
        layoutIteration: layoutIteration + 1,
      }));
    } catch (e) {
      log.error('Unable to import layout', e);
    }
  }

  /**
   * Resets the users layout to the default layout
   */
  async resetLayout(): Promise<void> {
    const { layoutStorage, session } = this.props;
    const { filterSets, layoutConfig, links } =
      await UserLayoutUtils.getDefaultLayout(
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
    if (
      event.target instanceof HTMLElement &&
      event.target.closest('.monaco-editor')
    ) {
      // Skip if this is inside a monaco editor
      return;
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
   * Open a widget up, using a drag event if specified.
   * @param widget The widget to open
   * @param dragEvent The mouse drag event that trigger it, undefined if it was not triggered by a drag
   */
  openWidget(
    widget: DhType.ide.VariableDefinition,
    dragEvent?: WindowMouseEvent
  ): void {
    const { connection } = this.props;
    emitPanelOpen(this.getActiveEventHub(), {
      widget: getVariableDescriptor(widget),
      dragEvent,
      fetch: async () => connection?.getObject(widget),
    });
  }

  getDashboardPlugins = memoize((plugins: PluginModuleMap) =>
    getDashboardPlugins(plugins)
  );

  handleHomeClick(): void {
    this.handleTabSelect(DEFAULT_DASHBOARD_ID);
  }

  handleTabSelect(tabId: string): void {
    this.setState({ activeTabKey: tabId });
  }

  handleTabReorder(from: number, to: number): void {
    this.setState(({ tabs: oldTabs }) => {
      const newTabs = [...oldTabs];
      const [t] = newTabs.splice(from, 1);
      newTabs.splice(to, 0, t);
      return { tabs: newTabs };
    });
  }

  handleTabClose(tabId: string): void {
    // TODO: #1746 Do something to mark the dashboard as closed
    // Remove any dashboard data we no longer need to keep so
    // the dashboard data store doesn't grow unbounded
    this.setState(({ tabs: oldTabs, activeTabKey }) => {
      const newTabs = oldTabs.filter(tab => tab.key !== tabId);
      let newActiveTabKey = activeTabKey;
      if (activeTabKey === tabId && newTabs.length > 0) {
        const oldActiveTabIndex = oldTabs.findIndex(tab => tab.key === tabId);
        newActiveTabKey =
          oldActiveTabIndex < oldTabs.length - 1
            ? oldTabs[oldActiveTabIndex + 1].key
            : oldTabs[oldActiveTabIndex - 1].key;
      }

      if (newTabs.length === 0) {
        newActiveTabKey = DEFAULT_DASHBOARD_ID;
      }

      return { tabs: newTabs, activeTabKey: newActiveTabKey };
    });
  }

  getDashboards(): {
    id: string;
    layoutConfig: ItemConfig[];
    key?: string;
  }[] {
    const { layoutIteration, tabs } = this.state;
    const { allDashboardData, workspace } = this.props;
    const { data: workspaceData } = workspace;
    const { layoutConfig } = workspaceData;
    // TODO: #1746 Read the default dashboard layout from dashboardData instead of workspaceData
    return [
      {
        id: DEFAULT_DASHBOARD_ID,
        layoutConfig: layoutConfig as ItemConfig[],
        key: `${DEFAULT_DASHBOARD_ID}-${layoutIteration}`,
      },
      ...tabs
        .filter(tab => tab.key !== DEFAULT_DASHBOARD_ID)
        .map(tab => ({
          id: tab.key,
          layoutConfig: (allDashboardData[tab.key]?.layoutConfig ??
            EMPTY_ARRAY) as ItemConfig[],
          key: `${tab.key}-${layoutIteration}`,
        })),
    ];
  }

  render(): ReactElement {
    const { activeTool, plugins, user, serverConfigValues } = this.props;
    const { permissions } = user;
    const { canUsePanels } = permissions;
    const {
      contextActions,
      isPanelsMenuShown,
      isResetLayoutPromptShown,
      isSettingsMenuShown,
      unsavedNotebookCount,
      widgets,
      tabs,
      activeTabKey,
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
        <div className="app-main-top-nav-menus">
          <Logo className="ml-1" style={{ maxHeight: '20px' }} />
          {/* Only show the Code Studio tab if there is also an open dashboard */}
          {tabs.length > 1 && (
            <div style={{ flexShrink: 0, flexGrow: 1, display: 'flex' }}>
              <NavTabList
                tabs={tabs}
                activeKey={activeTabKey}
                onSelect={this.handleTabSelect}
                onReorder={this.handleTabReorder}
                onClose={this.handleTabClose}
              />
            </div>
          )}
          <div className="app-main-right-menu-buttons">
            <Button
              kind="ghost"
              className="btn-panels-menu"
              icon={dhShapes}
              onClick={() => {
                // no-op: click is handled in `AppControlsMenu` (which uses a `DropdownMenu`)
              }}
            >
              Controls
              <AppControlsMenu
                handleControlSelect={this.handleControlSelect}
                handleToolSelect={this.handleToolSelect}
                onClearFilter={this.handleClearFilter}
              />
            </Button>
            {canUsePanels && (
              <Button
                kind="ghost"
                className="btn-panels-menu btn-show-panels"
                data-testid="app-main-panels-button"
                onClick={this.handleWidgetMenuClick}
                icon={dhPanels}
              >
                Panels
                <Popper
                  isShown={isPanelsMenuShown}
                  className="panels-menu-popper"
                  onExited={this.handleWidgetsMenuClose}
                  options={{
                    placement: 'bottom',
                  }}
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
              </Button>
            )}
            <Button
              kind="ghost"
              className={classNames('btn-settings-menu', {
                'text-warning':
                  user.operateAs != null && user.operateAs !== user.name,
              })}
              onClick={this.handleSettingsMenuShow}
              icon={
                <span className="fa-layers">
                  <FontAwesomeIcon icon={vsGear} transform="grow-3" />
                </span>
              }
              tooltip="User Settings"
            />
          </div>
        </div>
        <AppDashboards
          dashboards={this.getDashboards()}
          activeDashboard={activeTabKey}
          onGoldenLayoutChange={this.handleGoldenLayoutChange}
          emptyDashboard={
            activeTabKey === DEFAULT_DASHBOARD_ID ? (
              <EmptyDashboard onAutoFillClick={this.handleAutoFillClick} />
            ) : (
              <LoadingOverlay />
            )
          }
          plugins={[
            <ConsolePlugin
              key="ConsolePlugin"
              hydrateConsole={AppMainContainer.hydrateConsole}
              notebooksUrl={
                new URL(
                  `${import.meta.env.VITE_ROUTE_NOTEBOOKS}`,
                  document.baseURI
                ).href
              }
            />,
            ...dashboardPlugins,
          ]}
        />
        <SlideTransition in={isSettingsMenuShown} mountOnEnter unmountOnExit>
          <SettingsMenu
            serverConfigValues={serverConfigValues}
            pluginData={plugins}
            onDone={this.handleSettingsMenuHide}
            user={user}
          />
        </SlideTransition>
        <ContextActions actions={contextActions} />
        <input
          ref={this.importElement}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={this.handleImportLayoutFiles}
          data-testid="input-import-layout"
        />
        <BasicModal
          confirmButtonText="Reset"
          onConfirm={this.handleConfirmResetLayoutPrompt}
          onCancel={this.handleCancelResetLayoutPrompt}
          isConfirmDanger
          isOpen={isResetLayoutPromptShown}
          headerText={
            unsavedNotebookCount === 0
              ? 'Reset Layout'
              : 'Reset layout and discard unsaved changes'
          }
          bodyText={
            unsavedNotebookCount === 0
              ? 'Do you want to reset your layout? Your existing layout will be lost.'
              : 'Do you want to reset your layout? Any unsaved notebooks will be lost.'
          }
        />
      </div>
    );
  }
}

const mapStateToProps = (
  state: RootState
): Omit<
  AppMainContainerProps,
  | 'match'
  | 'setActiveTool'
  | 'updateDashboardData'
  | 'updateWorkspaceData'
  | 'setDashboardData'
  | 'setDashboardPluginData'
> => ({
  activeTool: getActiveTool(state),
  allDashboardData: getAllDashboardsData(state),
  dashboardData: getDashboardData(state, DEFAULT_DASHBOARD_ID),
  layoutStorage: getLayoutStorage(state),
  plugins: getPlugins(state),
  connection: getDashboardConnection(state, DEFAULT_DASHBOARD_ID),
  session: getDashboardSessionWrapper(state, DEFAULT_DASHBOARD_ID)?.session,
  sessionConfig: getDashboardSessionWrapper(state, DEFAULT_DASHBOARD_ID)
    ?.config,
  user: getUser(state),
  workspace: getWorkspace(state),
  serverConfigValues: getServerConfigValues(state),
});

const ConnectedAppMainContainer = connect(mapStateToProps, {
  setActiveTool: setActiveToolAction,
  setDashboardData: setDashboardDataAction,
  setDashboardPluginData: setDashboardPluginDataAction,
  updateDashboardData: updateDashboardDataAction,
  updateWorkspaceData: updateWorkspaceDataAction,
})(withRouter(AppMainContainer));

export default ConnectedAppMainContainer;
