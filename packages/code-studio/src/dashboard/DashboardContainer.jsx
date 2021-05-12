import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect, Provider, ReactReduxContext } from 'react-redux';
import throttle from 'lodash.throttle';
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
import GoldenLayout from 'golden-layout';
import '../layout/golden-layout';
import { PanelManager } from './panels';
import { LayoutEventHandler } from './event-handlers';
import LayoutUtils from '../layout/LayoutUtils';
import Linker from './linker/Linker';
import './DashboardContainer.scss';
import { UIPropTypes } from '../include/prop-types';
import PanelErrorBoundary from './panels/PanelErrorBoundary';

const log = Log.module('DashboardContainer');
const RESIZE_THROTTLE = 100;

export class DashboardContainer extends Component {
  constructor(props) {
    super(props);

    this.handleLayoutStateChanged = this.handleLayoutStateChanged.bind(this);
    this.handlePanelsChanged = this.handlePanelsChanged.bind(this);
    this.handleResize = throttle(this.handleResize.bind(this), RESIZE_THROTTLE);
    this.hydrateComponent = this.hydrateComponent.bind(this);
    this.dehydrateComponent = this.dehydrateComponent.bind(this);

    this.eventHandlers = [];
    this.isInitialised = false;
    this.layoutElement = React.createRef();
    this.panelManager = null;

    this.state = {
      dashboardIsEmpty: true,
      layout: null,
      panelManager: null,
    };
  }

  componentDidMount() {
    this.init();
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

  init() {
    this.initData();
    const layout = this.initLayout();
    this.initEventHandlers(layout);
    this.initPlugins(layout);
    this.isInitialised = true;
  }

  initData() {
    const { data, id, setDashboardLinks } = this.props;
    const { links = [] } = data;
    setDashboardLinks(id, [...links]);
  }

  initLayout() {
    const { layoutConfig, data, onGoldenLayoutChange, plugins } = this.props;
    const { layoutSettings = {} } = data;
    this.setState({
      dashboardIsEmpty: layoutConfig.length === 0,
    });
    const content = LayoutUtils.hydrateLayoutConfig(
      layoutConfig,
      this.hydrateComponent
    );
    const config = {
      ...LayoutUtils.makeDefaultLayout(),
      ...layoutSettings,
      content,
    };

    log.debug('InitLayout', content);

    const layout = new GoldenLayout(config, this.layoutElement.current);
    for (let i = 0; i < plugins.length; i += 1) {
      const { panels } = plugins[i] ?? [];
      for (let j = 0; j < panels.length; j += 1) {
        this.registerComponent(layout, panels[j].name, panels[j].definition);
      }
    }

    // Need to initialize the panelmanager to listen for events before actually initializing the layout
    // Other we may miss some mount events from a panel on a dashboard reload
    this.initPanelManager(layout);

    layout.init();

    window.addEventListener('resize', this.handleResize);

    this.setState({ layout });

    onGoldenLayoutChange(layout);

    return layout;
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
    const panelManager = new PanelManager(
      layout,
      this.hydrateComponent,
      this.dehydrateComponent,
      new Map(),
      data.closed ?? [],
      this.handlePanelsChanged
    );

    this.panelManager = panelManager;
    this.setState({ panelManager });
  }

  initEventHandlers(layout) {
    const { id, plugins } = this.props;
    const { panelManager } = this;

    const config = { id, layout, panelManager };

    for (let i = 0; i < plugins.length; i += 1) {
      plugins[i].initialize?.(config);
    }

    const layoutEventHandler = new LayoutEventHandler(
      layout,
      this.dehydrateComponent,
      this.handleLayoutStateChanged
    );

    this.eventHandlers = [layoutEventHandler];
  }

  initPlugins(layout) {
    const { id, plugins } = this.props;
    const { panelManager } = this;

    const config = { id, layout, panelManager };

    for (let i = 0; i < plugins.length; i += 1) {
      plugins[i].initialize?.(config);
    }
  }

  deinit(updateState = true) {
    this.deinitPlugins();
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

  deinitPlugins() {
    const { id, plugins } = this.props;
    const { layout } = this.state;
    const { panelManager } = this;

    const config = { id, layout, panelManager };

    for (let i = 0; i < plugins.length; i += 1) {
      plugins[i].deinitialize?.(config);
    }
  }

  hydrateComponent(name, initialProps) {
    const { plugins } = this.props;
    return plugins.reduce(
      (props, plugin) => plugin.hydrateComponent(name, props),
      initialProps
    );
  }

  dehydrateComponent(name, initialConfig) {
    const { plugins } = this.props;
    return plugins.reduce(
      (config, plugin) =>
        config ? plugin.dehydrateComponent(name, config) : config,
      initialConfig
    );
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

    onLayoutConfigChange(newLayoutConfig);
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
  plugins: PropTypes.arrayOf(
    PropTypes.shape({
      panels: PropTypes.arrayOf(
        PropTypes.shape({ name: PropTypes.string, definition: PropTypes.any })
      ),
      hydrateComponent: PropTypes.func,
      dehydrateComponent: PropTypes.func,
      initialize: PropTypes.func,
      deinitialize: PropTypes.func,
    })
  ),
};

DashboardContainer.defaultProps = {
  emptyDashboard: null,
  id: 'Default',
  onDataChange: () => {},
  onLayoutConfigChange: () => {},
  onGoldenLayoutChange: () => {},
  plugins: [],
};

DashboardContainer.contextType = ReactReduxContext;

const mapStateToProps = state => ({
  activeTool: getActiveTool(state),
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
