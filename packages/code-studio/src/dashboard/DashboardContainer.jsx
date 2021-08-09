import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect, Provider, ReactReduxContext } from 'react-redux';
import throttle from 'lodash.throttle';
import { ChartModelFactory } from '@deephaven/chart';
import { IrisGridModelFactory, IrisGridUtils } from '@deephaven/iris-grid';
import { PropTypes as APIPropTypes } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import {
  getActiveTool,
  setActiveTool as setActiveToolAction,
  setDashboardColumns as setDashboardColumnsAction,
  setDashboardInputFilters as setDashboardInputFiltersAction,
  setDashboardIsolatedLinkerPanelId as setDashboardIsolatedLinkerPanelIdAction,
  setDashboardClosedPanels as setDashboardClosedPanelsAction,
  setDashboardOpenedPanelMap as setDashboardOpenedPanelMapAction,
  setDashboardPanelTableMap as setDashboardPanelTableMapAction,
  setDashboardColumnSelectionValidator as setDashboardColumnSelectionValidatorAction,
  setDashboardConsoleCreatorSettings as setDashboardConsoleCreatorSettingsAction,
  setDashboardLinks as setDashboardLinksAction,
} from '@deephaven/redux';
import GoldenLayout from '@deephaven/golden-layout';
import '../layout/golden-layout';
import {
  ChartPanel,
  CommandHistoryPanel,
  ConsolePanel,
  DropdownFilterPanel,
  InputFilterPanel,
  IrisGridPanel,
  LogPanel,
  MarkdownPanel,
  NotebookPanel,
  PandasPanel,
  PanelManager,
} from './panels';
import MarkdownUtils from '../controls/markdown/MarkdownUtils';
import {
  ChartEventHandler,
  ConsoleEventHandler,
  ControlEventHandler,
  InputFilterEventHandler,
  IrisGridEventHandler,
  LayoutEventHandler,
  NotebookEventHandler,
  PandasEventHandler,
} from './event-handlers';
import LayoutUtils from '../layout/LayoutUtils';
import Linker from './linker/Linker';
import './DashboardContainer.scss';
import { UIPropTypes } from '../include/prop-types';
import PanelErrorBoundary from './panels/PanelErrorBoundary';
import FileExplorerPanel from './panels/FileExplorerPanel';
import { getSession } from '../redux';

const log = Log.module('DashboardContainer');
const RESIZE_THROTTLE = 100;

export class DashboardContainer extends Component {
  static dehydratePanelConfig(config) {
    const { props, componentState } = config;
    const { metadata } = props;
    let { panelState = null } = props;
    if (componentState) {
      ({ panelState } = componentState);
    }
    const newProps = {};
    if (metadata) {
      newProps.metadata = metadata;
    }
    if (panelState) {
      newProps.panelState = panelState;
    }

    return {
      ...config,
      componentState: null,
      props: newProps,
      type: 'react-component',
    };
  }

  constructor(props) {
    super(props);

    this.handleLayoutStateChanged = this.handleLayoutStateChanged.bind(this);
    this.handleInputFiltersChanged = this.handleInputFiltersChanged.bind(this);
    this.handleConsoleSettingsChanged = this.handleConsoleSettingsChanged.bind(
      this
    );
    this.handlePanelsChanged = this.handlePanelsChanged.bind(this);
    this.handleResize = throttle(this.handleResize.bind(this), RESIZE_THROTTLE);

    this.eventHandlers = [];
    this.isInitialised = false;
    this.layoutElement = React.createRef();
    this.panelManager = null;

    this.state = {
      dashboardIsEmpty: true,
      layout: null,
      layoutConfig: null,
      panelManager: null,
    };
  }

  componentDidMount() {
    this.init();
  }

  componentDidUpdate(prevProps) {
    const { layoutConfig } = this.props;
    const { layoutConfig: currentLayoutConfig } = this.state;
    if (
      prevProps.layoutConfig !== layoutConfig &&
      layoutConfig !== currentLayoutConfig
    ) {
      this.reloadLayoutConfig();
    }
  }

  componentWillUnmount() {
    if (this.isInitialised) {
      this.deinit(false);
    }
    const {
      id,
      setDashboardClosedPanels,
      setDashboardOpenedPanelMap,
      setDashboardColumnSelectionValidator,
      setDashboardConsoleCreatorSettings,
      setDashboardColumns,
      setDashboardLinks,
      setDashboardPanelTableMap,
      setDashboardInputFilters,
      setDashboardIsolatedLinkerPanelId,
    } = this.props;
    setDashboardColumns(id, null);
    setDashboardInputFilters(id, null);
    setDashboardClosedPanels(id, null);
    setDashboardOpenedPanelMap(id, null);
    setDashboardPanelTableMap(id, null);
    setDashboardColumnSelectionValidator(id, null);
    setDashboardConsoleCreatorSettings(id, null);
    setDashboardLinks(id, null);
    setDashboardIsolatedLinkerPanelId(id, null);
  }

  makeHydrateComponentPropsMap() {
    const { id: localDashboardId } = this.props;

    return {
      ChartPanel: props => ({
        ...props,
        localDashboardId,
        makeModel: async () => {
          const { session } = this.props;
          const { metadata, panelState } = props;
          if (panelState) {
            if (panelState.tableSettings) {
              metadata.tableSettings = panelState.tableSettings;
            }
            if (panelState.settings) {
              metadata.settings = {
                ...(metadata.settings ?? {}),
                ...panelState.settings,
              };
            }
          }

          const { settings, table: tableName, tableSettings } = metadata;

          const table = await session.getTable(tableName);

          IrisGridUtils.applyTableSettings(table, tableSettings);

          return ChartModelFactory.makeModelFromSettings(settings, table);
        },
      }),
      ConsolePanel: props => ({
        metadata: {},
        ...props,
        localDashboardId,
      }),
      CommandHistoryPanel: props => ({
        metadata: {},
        ...props,
        localDashboardId,
      }),
      DropdownFilterPanel: props => ({
        ...props,
        localDashboardId,
      }),
      FileExplorerPanel: props => ({
        ...props,
      }),
      InputFilterPanel: props => ({
        ...props,
        localDashboardId,
      }),
      IrisGridPanel: props => ({
        ...props,
        localDashboardId,
        makeModel: async () => {
          const { session } = this.props;
          const { table: tableName } = props.metadata;
          const table = await session.getTable(tableName);
          return IrisGridModelFactory.makeModel(table, false);
        },
      }),
      LogPanel: props => ({
        ...props,
      }),
      MarkdownPanel: props => ({
        ...props,
        localDashboardId,
      }),
      NotebookPanel: props => ({
        ...props,
      }),
      PandasPanel: props => ({
        ...props,
        localDashboardId,
      }),
    };
  }

  makeComponentTemplateMap(panelManager) {
    return {
      DropdownFilterPanel: config => this.makeComponentTemplate(config),
      InputFilterPanel: config => this.makeComponentTemplate(config),
      MarkdownPanel: config => this.makeMarkdownTemplate(config, panelManager),
    };
  }

  makeComponentTemplate(config) {
    // Just a default that populates the localDashboardId prop properly
    const { id } = this.props;
    return {
      ...config,
      props: {
        ...config.props,
        localDashboardId: id,
      },
    };
  }

  makeMarkdownTemplate(config, panelManager) {
    const openedMarkdowns = panelManager.getOpenedPanelConfigsOfType(
      ControlEventHandler.MARKDOWN_COMPONENT
    );
    const closedMarkdowns = panelManager.getClosedPanelConfigsOfType(
      ControlEventHandler.MARKDOWN_COMPONENT
    );
    const usedTitles = openedMarkdowns.map(markdown => markdown.title);
    const title = MarkdownUtils.getNewMarkdownTitle(usedTitles);
    const content =
      closedMarkdowns.length > 0 ? null : MarkdownUtils.DEFAULT_CONTENT;
    return this.makeComponentTemplate({
      ...config,
      props: {
        ...config.props,
        panelState: { content },
      },
      title,
    });
  }

  async init() {
    this.initData();
    const layout = this.initLayout();
    this.initEventHandlers(layout);
    this.isInitialised = true;
  }

  initData() {
    const { data, id, setDashboardLinks } = this.props;
    const { links = [] } = data;
    setDashboardLinks(id, [...links]);
  }

  initLayout() {
    const { layoutConfig, data, onGoldenLayoutChange } = this.props;
    const { layoutSettings = {} } = data;
    this.setState({
      dashboardIsEmpty: layoutConfig.length === 0,
    });
    const hydrateComponentPropsMap = this.makeHydrateComponentPropsMap();
    const content = LayoutUtils.hydrateLayoutConfig(
      layoutConfig,
      hydrateComponentPropsMap
    );
    const config = {
      ...LayoutUtils.makeDefaultLayout(),
      ...layoutSettings,
      content,
    };

    log.debug('layout LayoutConfig', layoutConfig);
    log.debug('layout InitLayout', content);

    const layout = new GoldenLayout(config, this.layoutElement.current);

    this.registerComponent(layout, 'ChartPanel', ChartPanel);
    this.registerComponent(layout, ConsolePanel.COMPONENT, ConsolePanel);
    this.registerComponent(
      layout,
      CommandHistoryPanel.COMPONENT,
      CommandHistoryPanel
    );
    this.registerComponent(
      layout,
      DropdownFilterPanel.COMPONENT,
      DropdownFilterPanel
    );
    this.registerComponent(
      layout,
      FileExplorerPanel.COMPONENT,
      FileExplorerPanel
    );
    this.registerComponent(layout, 'InputFilterPanel', InputFilterPanel);
    this.registerComponent(layout, 'IrisGridPanel', IrisGridPanel);
    this.registerComponent(layout, LogPanel.COMPONENT, LogPanel);
    this.registerComponent(layout, NotebookPanel.COMPONENT, NotebookPanel);
    this.registerComponent(layout, 'PandasPanel', PandasPanel);
    this.registerComponent(layout, 'MarkdownPanel', MarkdownPanel);

    // Need to initialize the panelmanager to listen for events before actually initializing the layout
    // Other we may miss some mount events from a panel on a dashboard reload
    this.initPanelManager(layout);

    layout.init();

    window.addEventListener('resize', this.handleResize);

    this.setState({ layout });

    onGoldenLayoutChange(layout);

    return layout;
  }

  reloadLayoutConfig() {
    const { layoutConfig } = this.props;
    const { layout } = this.state;

    const hydrateComponentPropsMap = this.makeHydrateComponentPropsMap();
    const content = LayoutUtils.hydrateLayoutConfig(
      layoutConfig,
      hydrateComponentPropsMap
    );

    if (content.length !== 1) {
      log.error('Unexpected content when reloading layout config', content);
      return;
    }

    // Remove the old layout before add the new one
    while (layout.root.contentItems.length > 0) {
      layout.root.contentItems[0].remove();
    }

    layout.root.addChild(content[0]);
  }

  registerComponent(layout, name, ComponentType) {
    const { store } = this.context;

    function renderComponent(props, ref) {
      // Props supplied by GoldenLayout
      // eslint-disable-next-line react/prop-types
      const { glContainer, glEventHub } = props;
      return (
        <Provider store={store}>
          <PanelErrorBoundary glContainer={glContainer} glEventHub={glEventHub}>
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <ComponentType {...props} ref={ref} />
          </PanelErrorBoundary>
        </Provider>
      );
    }

    const wrappedComponent = React.forwardRef(renderComponent);

    layout.registerComponent(name, wrappedComponent);
  }

  initPanelManager(layout) {
    const { data } = this.props;
    const hydrateComponentPropsMap = this.makeHydrateComponentPropsMap();
    const dehydrateClosedComponentConfigMap = {
      // If we want panel manager to save other types of closed panels, update dehydrater here
      MarkdownPanel: config => {
        const { title, componentState, props } = config;
        let { panelState = null } = props;
        if (componentState) {
          ({ panelState } = componentState);
        }
        if (
          !title ||
          !panelState ||
          !panelState.content ||
          panelState.content.length === 0 ||
          panelState.content === MarkdownUtils.DEFAULT_CONTENT
        ) {
          // We don't want to save it if there's no content
          return null;
        }
        return DashboardContainer.dehydratePanelConfig(config);
      },
    };
    const panelManager = new PanelManager(
      layout,
      hydrateComponentPropsMap,
      dehydrateClosedComponentConfigMap,
      new Map(),
      data.closed ?? [],
      this.handlePanelsChanged
    );

    this.panelManager = panelManager;
    this.setState({ panelManager });
  }

  initEventHandlers(layout) {
    const { id } = this.props;
    const { panelManager } = this;

    const dehydrateComponentConfigMap = {
      ChartPanel: DashboardContainer.dehydratePanelConfig,
      ConsolePanel: DashboardContainer.dehydratePanelConfig,
      CommandHistoryPanel: DashboardContainer.dehydratePanelConfig,
      DropdownFilterPanel: DashboardContainer.dehydratePanelConfig,
      FileExplorerPanel: DashboardContainer.dehydratePanelConfig,
      IrisGridPanel: DashboardContainer.dehydratePanelConfig,
      InputFilterPanel: DashboardContainer.dehydratePanelConfig,
      LogPanel: DashboardContainer.dehydratePanelConfig,
      MarkdownPanel: DashboardContainer.dehydratePanelConfig,
      NotebookPanel: DashboardContainer.dehydratePanelConfig,
      PandasPanel: DashboardContainer.dehydratePanelConfig,
    };

    const componentTemplateMap = this.makeComponentTemplateMap(panelManager);

    const gridEventHandler = new IrisGridEventHandler(layout, id);
    const layoutEventHandler = new LayoutEventHandler(
      layout,
      dehydrateComponentConfigMap,
      this.handleLayoutStateChanged
    );
    const chartEventHandler = new ChartEventHandler(layout, id);
    const controlEventHandler = new ControlEventHandler(
      layout,
      componentTemplateMap
    );
    const inputFilterEventHandler = new InputFilterEventHandler(
      layout,
      this.handleInputFiltersChanged
    );
    const consoleEventHandler = new ConsoleEventHandler(
      layout,
      panelManager,
      this.handleConsoleSettingsChanged
    );
    const notebookEventHandler = new NotebookEventHandler(layout, panelManager);
    const pandasEventHandler = new PandasEventHandler(layout, id);

    this.eventHandlers = [
      consoleEventHandler,
      gridEventHandler,
      layoutEventHandler,
      notebookEventHandler,
      chartEventHandler,
      controlEventHandler,
      inputFilterEventHandler,
      pandasEventHandler,
    ];
  }

  deinit(updateState = true) {
    this.deinitEventHandlers();
    this.deinitLayout(updateState);
    this.isInitialised = false;
  }

  deinitLayout(updateState = true) {
    const { onGoldenLayoutChange } = this.props;
    const { layout } = this.state;
    window.removeEventListener('resize', this.handleResize);
    this.handleResize.cancel();
    layout.destroy();
    this.deinitPanelManager(updateState);
    onGoldenLayoutChange(null);
    if (updateState) {
      this.setState({ layout: null });
    }
  }

  deinitPanelManager(updateState = true) {
    this.panelManager.stopListening();
    this.panelManager = null;

    if (updateState) {
      this.setState({ panelManager: null });
    }
  }

  deinitEventHandlers() {
    for (let i = 0; i < this.eventHandlers.length; i += 1) {
      const handler = this.eventHandlers[i];
      handler.stopListening();
    }
  }

  handleResize() {
    const { layout } = this.state;
    if (layout && layout.isInitialised) {
      layout.updateSize();
    }
    const { dashboardIsEmpty } = this.state;
    if (dashboardIsEmpty) {
      this.forceUpdate();
    }
  }

  handleLayoutStateChanged(newLayoutConfig) {
    const { onLayoutConfigChange, layoutConfig } = this.props;
    const isEqual = LayoutUtils.isEqual(layoutConfig, newLayoutConfig);

    log.debug(
      'handleLayoutStateChange',
      layoutConfig,
      newLayoutConfig,
      'layouts are identical? ',
      isEqual
    );

    if (isEqual) {
      return;
    }

    const { dashboardIsEmpty } = this.state;
    if (newLayoutConfig.length === 0 && !dashboardIsEmpty) {
      this.setState({ dashboardIsEmpty: true });
    } else if (newLayoutConfig !== 0 && dashboardIsEmpty) {
      this.setState({ dashboardIsEmpty: false });
    }

    this.setState({ layoutConfig: newLayoutConfig });

    onLayoutConfigChange(newLayoutConfig);
  }

  handleInputFiltersChanged({ columns, filters, tableMap }) {
    const { id } = this.props;
    const {
      setDashboardPanelTableMap,
      setDashboardColumns,
      setDashboardInputFilters,
    } = this.props;
    setDashboardPanelTableMap(id, tableMap);
    setDashboardColumns(id, columns);
    setDashboardInputFilters(id, filters);
  }

  handleConsoleSettingsChanged({ consoleCreatorSettings }) {
    const { setDashboardConsoleCreatorSettings, id } = this.props;
    setDashboardConsoleCreatorSettings(id, consoleCreatorSettings);
  }

  handlePanelsChanged({ closed, openedMap }) {
    const {
      id,
      data,
      onDataChange,
      setDashboardClosedPanels,
      setDashboardOpenedPanelMap,
    } = this.props;

    setDashboardClosedPanels(id, closed);
    setDashboardOpenedPanelMap(id, openedMap);
    onDataChange({
      ...data,
      closed,
    });
  }

  render() {
    const { emptyDashboard, id } = this.props;
    const { dashboardIsEmpty, layout, panelManager } = this.state;
    return (
      <div className="dashboard-container w-100 h-100">
        {dashboardIsEmpty && emptyDashboard}
        <div className="w-100 h-100" ref={this.layoutElement} />
        {panelManager && layout && (
          <>
            <Linker
              layout={layout}
              localDashboardId={id}
              panelManager={panelManager}
            />
          </>
        )}
      </div>
    );
  }
}

DashboardContainer.propTypes = {
  id: PropTypes.string,
  activeTool: PropTypes.string.isRequired,
  layoutConfig: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  data: PropTypes.shape({
    closed: PropTypes.arrayOf(PropTypes.shape({})),
    links: UIPropTypes.Links,
    layoutSettings: PropTypes.shape({}),
  }).isRequired,
  emptyDashboard: PropTypes.node,
  onDataChange: PropTypes.func,
  onLayoutConfigChange: PropTypes.func,
  onGoldenLayoutChange: PropTypes.func,
  session: APIPropTypes.IdeSession.isRequired,
  setActiveTool: PropTypes.func.isRequired,
  setDashboardColumns: PropTypes.func.isRequired,
  setDashboardInputFilters: PropTypes.func.isRequired,
  setDashboardIsolatedLinkerPanelId: PropTypes.func.isRequired,
  setDashboardClosedPanels: PropTypes.func.isRequired,
  setDashboardOpenedPanelMap: PropTypes.func.isRequired,
  setDashboardPanelTableMap: PropTypes.func.isRequired,
  setDashboardColumnSelectionValidator: PropTypes.func.isRequired,
  setDashboardConsoleCreatorSettings: PropTypes.func.isRequired,
  setDashboardLinks: PropTypes.func.isRequired,
};

DashboardContainer.defaultProps = {
  emptyDashboard: null,
  id: 'Default',
  onDataChange: () => {},
  onLayoutConfigChange: () => {},
  onGoldenLayoutChange: () => {},
};

DashboardContainer.contextType = ReactReduxContext;

const mapStateToProps = state => ({
  activeTool: getActiveTool(state),
  session: getSession(state).session,
});

export default connect(mapStateToProps, {
  setActiveTool: setActiveToolAction,
  setDashboardColumns: setDashboardColumnsAction,
  setDashboardInputFilters: setDashboardInputFiltersAction,
  setDashboardIsolatedLinkerPanelId: setDashboardIsolatedLinkerPanelIdAction,
  setDashboardClosedPanels: setDashboardClosedPanelsAction,
  setDashboardOpenedPanelMap: setDashboardOpenedPanelMapAction,
  setDashboardPanelTableMap: setDashboardPanelTableMapAction,
  setDashboardColumnSelectionValidator: setDashboardColumnSelectionValidatorAction,
  setDashboardConsoleCreatorSettings: setDashboardConsoleCreatorSettingsAction,
  setDashboardLinks: setDashboardLinksAction,
})(DashboardContainer);
