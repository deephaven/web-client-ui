import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import memoize from 'memoize-one';
import { CSSTransition } from 'react-transition-group';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  ContextActions,
  Tooltip,
  ThemeExport,
  GLOBAL_SHORTCUTS,
  Popper,
} from '@deephaven/components';
import {
  Dashboard,
  DashboardUtils,
  DEFAULT_DASHBOARD_ID,
  getDashboardData,
  PanelEvent,
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
  UIPropTypes,
  ControlType,
  ToolType,
  ChartBuilderPlugin,
} from '@deephaven/dashboard-core-plugins';
import { vsGear, dhShapes, dhPanels } from '@deephaven/icons';
import dh, { PropTypes as APIPropTypes } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import {
  getActiveTool,
  getWorkspace,
  getUser,
  setActiveTool as setActiveToolAction,
  updateWorkspaceData as updateWorkspaceDataAction,
  getPlugins,
} from '@deephaven/redux';
import { PromiseUtils } from '@deephaven/utils';
import JSZip from 'jszip';
import SettingsMenu from '../settings/SettingsMenu';
import AppControlsMenu from './AppControlsMenu';
import { getLayoutStorage } from '../redux';
import Logo from '../settings/community-wordmark-app.svg';
import './AppMainContainer.scss';
import WidgetList from './WidgetList';
import { createChartModel, createGridModel } from './WidgetUtils';
import EmptyDashboard from './EmptyDashboard';
import UserLayoutUtils from './UserLayoutUtils';
import DownloadServiceWorkerUtils from '../DownloadServiceWorkerUtils';
import { PluginUtils } from '../plugins';

const log = Log.module('AppMainContainer');

export class AppMainContainer extends Component {
  static handleWindowBeforeUnload(event) {
    event.preventDefault();
    // returnValue is required for beforeReload event prompt
    // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload#example
    // eslint-disable-next-line no-param-reassign
    event.returnValue = '';
  }

  static hydrateConsole(props, id) {
    return DashboardUtils.hydrate(
      {
        ...props,
        unzip: zipFile =>
          JSZip.loadAsync(zipFile).then(zip => Object.values(zip.files)),
      },
      id
    );
  }

  constructor(props) {
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

    this.goldenLayout = null;
    this.importElement = React.createRef();
    this.widgetListenerRemover = null;

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
          order: 50,
          shortcut: GLOBAL_SHORTCUTS.CLEAR_ALL_FILTERS,
        },
        {
          action: () => {
            log.debug('Consume unhandled save shortcut');
          },
          shortcut: GLOBAL_SHORTCUTS.SAVE,
        },
        {
          action: () => {
            this.sendRestartSession();
          },
        },
        {
          action: () => {
            this.sendDisconnectSession();
          },
        },
      ],
      isPanelsMenuShown: false,
      isSettingsMenuShown: false,
      widgets: [],
    };
  }

  componentDidMount() {
    this.initWidgets();

    window.addEventListener(
      'beforeunload',
      AppMainContainer.handleWindowBeforeUnload
    );
  }

  componentDidUpdate(prevProps) {
    const { dashboardData } = this.props;
    if (prevProps.dashboardData !== dashboardData) {
      this.handleDataChange(dashboardData);
    }
  }

  componentWillUnmount() {
    this.deinitWidgets();

    window.removeEventListener(
      'beforeunload',
      AppMainContainer.handleWindowBeforeUnload
    );
  }

  initWidgets() {
    const { session } = this.props;
    if (!session.connection.subscribeToFieldUpdates) {
      log.warn(
        'subscribeToFieldUpdates not supported, not initializing widgets'
      );
      return;
    }

    this.widgetListenerRemover = session.connection.subscribeToFieldUpdates(
      updates => {
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
      }
    );
  }

  deinitWidgets() {
    this.widgetListenerRemover?.();
  }

  openNotebookFromURL() {
    const { match } = this.props;
    const { notebookPath } = match.params;

    if (notebookPath) {
      const fileMetadata = {
        id: `/${notebookPath}`,
        itemName: `/${notebookPath}`,
      };

      const { session, sessionConfig } = this.props;
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

  sendClearFilter() {
    this.emitLayoutEvent(InputFilterEvent.CLEAR_ALL_FILTERS);
  }

  emitLayoutEvent(event, ...args) {
    this.goldenLayout?.eventHub.emit(event, ...args);
  }

  // eslint-disable-next-line class-methods-use-this
  handleError(error) {
    if (PromiseUtils.isCanceled(error)) {
      return;
    }
    log.error(error);
  }

  handleSettingsMenuHide() {
    this.setState({ isSettingsMenuShown: false });
  }

  handleSettingsMenuShow() {
    this.setState({ isSettingsMenuShown: true });
  }

  handleControlSelect(type, dragEvent = null) {
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
        throw new Error('Unrecognized control type', type);
    }
  }

  handleToolSelect(toolType) {
    log.debug('handleToolSelect', toolType);

    const { activeTool, setActiveTool } = this.props;
    if (activeTool === toolType) {
      setActiveTool(ToolType.DEFAULT);
    } else {
      setActiveTool(toolType);
    }
  }

  handleClearFilter() {
    this.sendClearFilter();
  }

  handleDataChange(data) {
    const { updateWorkspaceData } = this.props;

    // Only save the data that is serializable/we want to persist to the workspace
    const { closed, filterSets, links } = data;
    updateWorkspaceData({ closed, filterSets, links });
  }

  handleGoldenLayoutChange(goldenLayout) {
    this.goldenLayout = goldenLayout;
  }

  handleLayoutConfigChange(layoutConfig) {
    const { updateWorkspaceData } = this.props;
    updateWorkspaceData({ layoutConfig });
  }

  handleWidgetMenuClick() {
    this.setState(({ isPanelsMenuShown }) => ({
      isPanelsMenuShown: !isPanelsMenuShown,
    }));
  }

  handleWidgetSelect(widget, dragEvent) {
    this.setState({ isPanelsMenuShown: false });

    log.debug('handleWidgetSelect', widget, dragEvent);

    this.openWidget(widget, dragEvent);
  }

  handleWidgetsMenuClose() {
    this.setState({ isPanelsMenuShown: false });
  }

  handleAutoFillClick() {
    const { widgets } = this.state;

    log.debug('handleAutoFillClick', widgets);

    const sortedWidgets = widgets.sort((a, b) => a.name.localeCompare(b.name));
    for (let i = 0; i < sortedWidgets.length; i += 1) {
      this.openWidget(sortedWidgets[i]);
    }
  }

  handleExportLayoutClick() {
    log.info('handleExportLayoutClick');

    this.setState({ isPanelsMenuShown: false });

    try {
      const { workspace } = this.props;
      const { data } = workspace;
      const exportedConfig = UserLayoutUtils.exportLayout(data);

      log.info('handleExportLayoutClick exportedConfig', exportedConfig);

      const blob = new Blob([JSON.stringify(exportedConfig)], {
        mimeType: 'application/json',
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

  handleImportLayoutClick() {
    log.info('handleImportLayoutClick');

    this.setState({ isPanelsMenuShown: false });

    // Reset the file list on the import element, otherwise user won't be prompted again
    this.importElement.current.value = '';
    this.importElement.current.click();
  }

  handleResetLayoutClick() {
    log.info('handleResetLayoutClick');

    this.setState({ isPanelsMenuShown: false });

    this.resetLayout();
  }

  handleImportLayoutFiles(event) {
    event.stopPropagation();
    event.preventDefault();

    this.importLayoutFile(event.target.files[0]);
  }

  /**
   * Import the provided file and set it in the workspace data (which should then load it in the dashboard)
   * @param {File} file JSON file to import
   */
  async importLayoutFile(file) {
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
  async resetLayout() {
    const { layoutStorage } = this.props;
    const {
      filterSets,
      layoutConfig,
      links,
    } = await UserLayoutUtils.getDefaultLayout(layoutStorage);

    const { updateDashboardData, updateWorkspaceData } = this.props;
    updateWorkspaceData({ layoutConfig });
    updateDashboardData(DEFAULT_DASHBOARD_ID, {
      filterSets,
      links,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  handlePaste(event) {
    let element = event.target.parentElement;

    while (element != null) {
      if (element.classList.contains('monaco-editor')) {
        return;
      }
      element = element.parentElement;
    }

    const clipboardData = event.clipboardData || window.clipboardData;
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
   * @param {string} pluginName The name of the plugin to load
   * @returns {JSX.Element} An element from the plugin
   */
  handleLoadTablePlugin(pluginName) {
    const { plugins } = this.props;

    // First check if we have any plugin modules loaded that match the TablePlugin.
    const pluginModule = plugins.get(pluginName);
    if (pluginModule?.TablePlugin) {
      return pluginModule.TablePlugin;
    }

    return PluginUtils.loadComponentPlugin(pluginName);
  }

  hydrateDefault(props, id) {
    const { session } = this.props;
    const { metadata } = props;
    if (metadata?.type && (metadata?.id || metadata?.name)) {
      // Looks like a widget, hydrate it as such
      const widget = metadata.id
        ? {
            type: metadata.type,
            id: metadata.id,
          }
        : { type: metadata.type, name: metadata.name };
      return {
        fetch: () => session.getObject(widget),
        localDashboardId: id,
        ...props,
      };
    }
    return DashboardUtils.hydrate(props, id);
  }

  hydrateGrid(props, id) {
    return this.hydrateTable(props, id, dh.VariableType.TABLE);
  }

  hydratePandas(props, id) {
    return this.hydrateTable(props, id, dh.VariableType.PANDAS);
  }

  hydrateTable(props, id, type = dh.VariableType.TABLE) {
    const { session } = this.props;
    return {
      ...props,
      getDownloadWorker: DownloadServiceWorkerUtils.getServiceWorker,
      loadPlugin: this.handleLoadTablePlugin,
      localDashboardId: id,
      makeModel: () => createGridModel(session, props.metadata, type),
    };
  }

  hydrateChart(props, id) {
    const { session } = this.props;
    return {
      ...props,
      localDashboardId: id,
      makeModel: () => {
        const { metadata, panelState } = props;
        return createChartModel(session, metadata, panelState);
      },
    };
  }

  /**
   * Open a widget up, using a drag event if specified.
   * @param {VariableDefinition} widget The widget to open
   * @param {DragEvent} dragEvent The mouse drag event that trigger it, undefined if it was not triggered by a drag
   */
  openWidget(widget, dragEvent) {
    const { session } = this.props;
    this.emitLayoutEvent(PanelEvent.OPEN, {
      dragEvent,
      fetch: () => session.getObject(widget),
      widget,
    });
  }

  getDashboardPlugins = memoize(plugins =>
    [...plugins.entries()]
      .filter(([, { DashboardPlugin }]) => DashboardPlugin)
      .map(([name, { DashboardPlugin }]) => <DashboardPlugin key={name} />)
  );

  render() {
    const { activeTool, plugins, user, workspace } = this.props;
    const { data: workspaceData = {} } = workspace;
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
          layoutConfig={layoutConfig}
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
          <ConsolePlugin hydrateConsole={AppMainContainer.hydrateConsole} />
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

AppMainContainer.propTypes = {
  activeTool: PropTypes.string.isRequired,
  dashboardData: PropTypes.shape({}).isRequired,
  layoutStorage: PropTypes.shape({}).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({ notebookPath: PropTypes.string }),
  }).isRequired,
  session: APIPropTypes.IdeSession.isRequired,
  sessionConfig: PropTypes.shape({
    type: PropTypes.string,
    id: PropTypes.string,
  }).isRequired,
  setActiveTool: PropTypes.func.isRequired,
  updateDashboardData: PropTypes.func.isRequired,
  updateWorkspaceData: PropTypes.func.isRequired,
  user: UIPropTypes.User.isRequired,
  workspace: PropTypes.shape({
    data: PropTypes.shape({
      data: PropTypes.shape({}),
      filterSets: PropTypes.arrayOf(PropTypes.shape({})),
      layoutConfig: PropTypes.arrayOf(PropTypes.shape({})),
      settings: PropTypes.shape({}),
      links: PropTypes.arrayOf(PropTypes.shape({})),
    }),
  }).isRequired,
  plugins: PropTypes.instanceOf(Map).isRequired,
};

const mapStateToProps = state => ({
  activeTool: getActiveTool(state),
  dashboardData: getDashboardData(state, DEFAULT_DASHBOARD_ID),
  layoutStorage: getLayoutStorage(state),
  plugins: getPlugins(state),
  session: getDashboardSessionWrapper(state, DEFAULT_DASHBOARD_ID).session,
  sessionConfig: getDashboardSessionWrapper(state, DEFAULT_DASHBOARD_ID).config,
  user: getUser(state),
  workspace: getWorkspace(state),
});

export default connect(mapStateToProps, {
  setActiveTool: setActiveToolAction,
  updateDashboardData: updateDashboardDataAction,
  updateWorkspaceData: updateWorkspaceDataAction,
})(withRouter(AppMainContainer));
