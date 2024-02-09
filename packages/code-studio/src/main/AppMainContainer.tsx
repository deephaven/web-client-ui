import React, {
  ClipboardEvent,
  ChangeEvent,
  Component,
  ReactElement,
  RefObject,
} from 'react';
import classNames from 'classnames';
import memoize from 'memoize-one';
import { CSSTransition } from 'react-transition-group';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import shortid from 'shortid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ContextActions,
  ThemeExport,
  GLOBAL_SHORTCUTS,
  Popper,
  ContextAction,
  Button,
  InfoModal,
  LoadingSpinner,
  Logo,
  BasicModal,
  DebouncedModal,
  NavTabList,
  type NavTabItem,
} from '@deephaven/components';
import { SHORTCUTS as IRIS_GRID_SHORTCUTS } from '@deephaven/iris-grid';
import {
  CreateDashboardPayload,
  DashboardUtils,
  DEFAULT_DASHBOARD_ID,
  DehydratedDashboardPanelProps,
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
  FilterSet,
  Link,
  getDashboardConnection,
  NotebookPanel,
} from '@deephaven/dashboard-core-plugins';
import {
  vsGear,
  dhShapes,
  dhPanels,
  vsDebugDisconnect,
  dhSquareFilled,
  vsHome,
} from '@deephaven/icons';
import { getVariableDescriptor } from '@deephaven/jsapi-bootstrap';
import dh from '@deephaven/jsapi-shim';
import type {
  IdeConnection,
  IdeSession,
  VariableDefinition,
} from '@deephaven/jsapi-types';
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
} from '@deephaven/utils';
import GoldenLayout from '@deephaven/golden-layout';
import type { ItemConfigType } from '@deephaven/golden-layout';
import {
  type DashboardPlugin,
  isDashboardPlugin,
  type LegacyDashboardPlugin,
  isLegacyDashboardPlugin,
  type PluginModuleMap,
} from '@deephaven/plugin';
import JSZip from 'jszip';
import SettingsMenu from '../settings/SettingsMenu';
import AppControlsMenu from './AppControlsMenu';
import { getLayoutStorage, getServerConfigValues } from '../redux';
import './AppMainContainer.scss';
import WidgetList, { WindowMouseEvent } from './WidgetList';
import UserLayoutUtils from './UserLayoutUtils';
import LayoutStorage from '../storage/LayoutStorage';
import AppDashboards from './AppDashboards';
import { getFormattedVersionInfo } from '../settings/SettingsUtils';

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
  connection?: IdeConnection;
  session?: IdeSession;
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
  isAuthFailed: boolean;
  isDisconnected: boolean;
  isPanelsMenuShown: boolean;
  isResetLayoutPromptShown: boolean;
  isSettingsMenuShown: boolean;
  unsavedNotebookCount: number;
  widgets: VariableDefinition[];
  tabs: NavTabItem[];
  activeTabKey: string;
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
            log.debug('Consume unhandled save shortcut');
          },
          shortcut: GLOBAL_SHORTCUTS.SAVE,
          isGlobal: true,
        },
      ],
      isAuthFailed: false,
      isDisconnected: false,
      isPanelsMenuShown: false,
      isResetLayoutPromptShown: false,
      isSettingsMenuShown: false,
      unsavedNotebookCount: 0,
      widgets: [],
      tabs: Object.entries(allDashboardData)
        .filter(([key]) => key !== DEFAULT_DASHBOARD_ID)
        .map(([key, value]) => ({
          key,
          title: value.title ?? 'Untitled',
        })),
      activeTabKey: DEFAULT_DASHBOARD_ID,
    };
  }

  componentDidMount(): void {
    this.initWidgets();
    this.startListeningForDisconnect();

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
    this.stopListeningForDisconnect();

    if (this.goldenLayout != null) {
      stopListenForCreateDashboard(
        this.goldenLayout.eventHub,
        this.handleCreateDashboard
      );
    }

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

  emitLayoutEvent(event: string, ...args: unknown[]): void {
    this.goldenLayout?.eventHub.emit(event, ...args);
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
    const { closed, filterSets, links } = data;
    updateWorkspaceData({ closed, filterSets, links });
  }

  handleGoldenLayoutChange(goldenLayout: GoldenLayout): void {
    if (this.goldenLayout === goldenLayout) return;

    if (this.goldenLayout != null) {
      stopListenForCreateDashboard(
        this.goldenLayout.eventHub,
        this.handleCreateDashboard
      );
    }

    this.goldenLayout = goldenLayout;

    listenForCreateDashboard(
      this.goldenLayout.eventHub,
      this.handleCreateDashboard
    );
  }

  handleCreateDashboard({
    pluginId,
    title,
    data,
  }: CreateDashboardPayload): void {
    const newId = shortid();
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
          layoutConfig: ItemConfigType[];
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

  handleDisconnect(): void {
    log.info('Disconnected from server');
    this.setState({ isDisconnected: true });
  }

  handleReconnect(): void {
    log.info('Reconnected to server');
    this.setState({ isDisconnected: false });
  }

  handleReconnectAuthFailed(): void {
    log.warn('Reconnect authentication failed');
    this.setState({ isAuthFailed: true });
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
      const { filterSets, layoutConfig, links } =
        UserLayoutUtils.normalizeLayout(exportedLayout);

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

  startListeningForDisconnect(): void {
    const { connection } = this.props;
    if (connection == null) {
      return;
    }

    connection.addEventListener(
      dh.IdeConnection.EVENT_DISCONNECT,
      this.handleDisconnect
    );
    connection.addEventListener(
      dh.IdeConnection.EVENT_RECONNECT,
      this.handleReconnect
    );
    connection.addEventListener(
      dh.CoreClient.EVENT_RECONNECT_AUTH_FAILED,
      this.handleReconnectAuthFailed
    );
  }

  stopListeningForDisconnect(): void {
    const { connection } = this.props;
    if (connection == null) {
      return;
    }

    connection.removeEventListener(
      dh.IdeConnection.EVENT_DISCONNECT,
      this.handleDisconnect
    );
    connection.removeEventListener(
      dh.IdeConnection.EVENT_RECONNECT,
      this.handleReconnect
    );
    connection.removeEventListener(
      dh.CoreClient.EVENT_RECONNECT_AUTH_FAILED,
      this.handleReconnectAuthFailed
    );
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
      fetch: async () => connection?.getObject(widget),
      widget: getVariableDescriptor(widget),
    });
  }

  getDashboardPlugins = memoize((plugins: PluginModuleMap) => {
    const dashboardPlugins = [...plugins.entries()].filter(
      ([, plugin]) =>
        isDashboardPlugin(plugin) || isLegacyDashboardPlugin(plugin)
    ) as [string, DashboardPlugin | LegacyDashboardPlugin][];

    return dashboardPlugins.map(([name, plugin]) => {
      if (isLegacyDashboardPlugin(plugin)) {
        const { DashboardPlugin: DPlugin } = plugin;
        return <DPlugin key={name} />;
      }

      const { component: DPlugin } = plugin;
      return <DPlugin key={name} />;
    });
  });

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
    layoutConfig: ItemConfigType[];
  }[] {
    const { tabs } = this.state;
    const { allDashboardData, workspace } = this.props;
    const { data: workspaceData } = workspace;
    const { layoutConfig } = workspaceData;
    // TODO: #1746 Read the default dashboard layout from dashboardData instead of workspaceData
    return [
      {
        id: DEFAULT_DASHBOARD_ID,
        layoutConfig: layoutConfig as ItemConfigType[],
      },
      ...tabs.map(tab => ({
        id: tab.key,
        layoutConfig: (allDashboardData[tab.key]?.layoutConfig ??
          EMPTY_ARRAY) as ItemConfigType[],
      })),
    ];
  }

  render(): ReactElement {
    const { activeTool, plugins, user, serverConfigValues } = this.props;
    const { permissions } = user;
    const { canUsePanels } = permissions;
    const {
      contextActions,
      isAuthFailed,
      isDisconnected,
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
          {tabs.length > 0 && (
            <div style={{ flexShrink: 0, flexGrow: 1, display: 'flex' }}>
              <Button
                kind="ghost"
                icon={vsHome}
                tooltip="Go to Code Studio"
                onClick={this.handleHomeClick}
              />
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
                  {isDisconnected && !isAuthFailed && (
                    <>
                      <FontAwesomeIcon
                        icon={dhSquareFilled}
                        color={ThemeExport.background}
                        transform="grow-2 right-8 down-8.5 rotate-45"
                      />
                      <FontAwesomeIcon
                        icon={vsDebugDisconnect}
                        color={ThemeExport.danger}
                        transform="shrink-5 right-6 down-6"
                      />
                    </>
                  )}
                </span>
              }
              tooltip={
                isDisconnected && !isAuthFailed
                  ? 'Server disconnected'
                  : 'User Settings'
              }
            />
          </div>
        </div>
        <AppDashboards
          dashboards={this.getDashboards()}
          activeDashboard={activeTabKey}
          onGoldenLayoutChange={this.handleGoldenLayoutChange}
          onAutoFillClick={this.handleAutoFillClick}
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
        <CSSTransition
          in={isSettingsMenuShown}
          timeout={ThemeExport.transitionMidMs}
          classNames="slide-left"
          mountOnEnter
          unmountOnExit
        >
          <SettingsMenu
            serverConfigValues={serverConfigValues}
            onDone={this.handleSettingsMenuHide}
            user={user}
          />
        </CSSTransition>
        <ContextActions actions={contextActions} />
        <input
          ref={this.importElement}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={this.handleImportLayoutFiles}
        />
        <DebouncedModal
          isOpen={isDisconnected && !isAuthFailed}
          debounceMs={1000}
        >
          <InfoModal
            icon={vsDebugDisconnect}
            title={
              <>
                <LoadingSpinner /> Attempting to reconnect...
              </>
            }
            subtitle="Please check your network connection."
          />
        </DebouncedModal>
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
        <BasicModal
          confirmButtonText="Refresh"
          onConfirm={AppMainContainer.handleRefresh}
          isOpen={isAuthFailed}
          headerText="Authentication failed"
          bodyText="Credentials are invalid. Please refresh your browser to try and reconnect."
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
