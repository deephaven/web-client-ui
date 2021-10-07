import { Component, ComponentType } from 'react';
import { ConnectedComponent } from 'react-redux';
import GoldenLayout, { ReactComponentConfig } from '@deephaven/golden-layout';
import Log from '@deephaven/log';
import PanelEvent from './PanelEvent';
import LayoutUtils from './layout/LayoutUtils';

const log = Log.module('PanelManager');

export type HydrateFunction = (
  name: string,
  props: Record<string, unknown>
) => Record<string, unknown>;

export type DehydrateFunction = (
  name: string,
  config: ReactComponentConfig
) => ReactComponentConfig;

export type ClosedPanel = ReactComponentConfig;

export type ClosedPanels = ClosedPanel[];

export type OpenedPanel = Component<{ glContainer: GoldenLayout.Container }>;

export type OpenedPanelMap = Map<string, OpenedPanel>;

export type PanelsUpdateData = {
  closed: ClosedPanels;
  openedMap: OpenedPanelMap;
};

export type PanelsUpdateCallback = (panelUpdateData: PanelsUpdateData) => void;

/**
 * Class to keep track of which panels are open, have been closed, and also events to close panels.
 */
class PanelManager {
  static MAX_CLOSED_PANEL_COUNT = 100;

  layout: GoldenLayout;

  hydrateComponent: HydrateFunction;

  dehydrateComponent: DehydrateFunction;

  onPanelsUpdated: PanelsUpdateCallback;

  closed: ClosedPanels;

  openedMap: OpenedPanelMap;

  /**
   * @param layout The GoldenLayout object to attach to
   * @param hydrateComponent Function to hydrate a panel from a dehydrated state
   * @param dehydrateComponent Function to dehydrate a panel
   * @param openedMap Map of opened panels
   * @param closed Array of closed panels in a dehydrated state
   * @param onPanelsUpdated Triggered when the panels are updated
   */
  constructor(
    layout: GoldenLayout,
    hydrateComponent: HydrateFunction = (name, props) => props,
    dehydrateComponent: DehydrateFunction = (name, config) => config,
    openedMap: OpenedPanelMap = new Map(),
    closed: ClosedPanel[] = [],
    onPanelsUpdated: PanelsUpdateCallback = () => undefined
  ) {
    this.handleFocus = this.handleFocus.bind(this);
    this.handleMount = this.handleMount.bind(this);
    // Panel can be unmounted on error but still keep the tab until it's closed
    // Use PanelEvent.MOUNT/UNMOUNT to track open (active) panels
    // and PanelEvent.CLOSED for cleanup (delete links, add panel to closed panels list, etc)
    this.handleUnmount = this.handleUnmount.bind(this);
    this.handleReopen = this.handleReopen.bind(this);
    this.handleDeleted = this.handleDeleted.bind(this);
    this.handleClosed = this.handleClosed.bind(this);
    this.handleControlClose = this.handleControlClose.bind(this);

    this.layout = layout;
    this.hydrateComponent = hydrateComponent;
    this.dehydrateComponent = dehydrateComponent;
    this.onPanelsUpdated = onPanelsUpdated;

    // Store the opened and closed panels
    this.openedMap = new Map(openedMap);

    // Closed panels are stored in their dehydrated state
    this.closed = [...closed];

    this.startListening();
  }

  startListening(): void {
    const { eventHub } = this.layout;
    eventHub.on(PanelEvent.FOCUS, this.handleFocus);
    eventHub.on(PanelEvent.MOUNT, this.handleMount);
    eventHub.on(PanelEvent.UNMOUNT, this.handleUnmount);
    eventHub.on(PanelEvent.REOPEN, this.handleReopen);
    eventHub.on(PanelEvent.DELETE, this.handleDeleted);
    eventHub.on(PanelEvent.CLOSED, this.handleClosed);
    eventHub.on(PanelEvent.CLOSE, this.handleControlClose);
  }

  stopListening(): void {
    const { eventHub } = this.layout;
    eventHub.off(PanelEvent.FOCUS, this.handleFocus);
    eventHub.off(PanelEvent.MOUNT, this.handleMount);
    eventHub.off(PanelEvent.UNMOUNT, this.handleUnmount);
    eventHub.off(PanelEvent.REOPEN, this.handleReopen);
    eventHub.off(PanelEvent.DELETE, this.handleDeleted);
    eventHub.off(PanelEvent.CLOSED, this.handleClosed);
    eventHub.off(PanelEvent.CLOSE, this.handleControlClose);
  }

  getClosedPanelConfigsOfType(typeString: string): ClosedPanels {
    return this.closed.filter(panel => panel.component === typeString);
  }

  getOpenedPanels(): OpenedPanel[] {
    return Array.from(this.openedMap.values());
  }

  getOpenedPanelConfigs(): GoldenLayout.ReactComponentConfig[] {
    return this.getOpenedPanels().map(panel => {
      const { glContainer } = panel.props;
      return LayoutUtils.getComponentConfigFromContainer(glContainer);
    });
  }

  getOpenedPanelConfigsOfType(
    typeString: string
  ): GoldenLayout.ReactComponentConfig[] {
    return this.getOpenedPanelConfigs().filter(
      config => config != null && config.component === typeString
    );
  }

  getOpenedPanelById(panelId: string): OpenedPanel | undefined {
    return this.openedMap.get(panelId);
  }

  getContainerByPanelId(panelId: string): GoldenLayout.Container {
    const stack = LayoutUtils.getStackForConfig(this.layout.root, {
      id: panelId,
    });
    return (
      (stack && LayoutUtils.getContentItemInStack(stack, { id: panelId })) ??
      null
    );
  }

  getLastUsedPanel(
    matcher: (panel: OpenedPanel) => boolean
  ): OpenedPanel | undefined {
    const opened = this.getOpenedPanels();
    for (let i = opened.length - 1; i >= 0; i -= 1) {
      const panel = opened[i];
      if (matcher == null || matcher(panel)) {
        return panel;
      }
    }

    return undefined;
  }

  getLastUsedPanelOfType(
    type: ConnectedComponent<ComponentType, Record<string, unknown>>
  ): OpenedPanel | undefined {
    return this.getLastUsedPanel(
      panel =>
        panel instanceof type ||
        (type.WrappedComponent && panel instanceof type.WrappedComponent)
    );
  }

  updatePanel(panel: OpenedPanel): void {
    const panelId = LayoutUtils.getIdFromPanel(panel);
    if (!panelId) {
      log.error('updatePanel Panel did not have an ID', panel);
      return;
    }
    log.debug2(`Updating panel ID ${panelId} in open panels map`);
    // Delete the entry before it's set to maintain correct ordering in the open panels map.
    // The last updated (focused) panel should be the last inserted.
    // Deleting the entry from the map directly instead of calling this.removePanel to skip the checks.
    this.openedMap.delete(panelId);
    this.openedMap.set(panelId, panel);
  }

  removePanel(panel: OpenedPanel): void {
    const panelId = LayoutUtils.getIdFromPanel(panel);
    if (!panelId) {
      log.error('removePanel Panel did not have an ID', panel);
      return;
    }
    if (!this.openedMap.has(panelId)) {
      log.error(`Missing panel ID ${panelId} in open panels map`);
      return;
    }
    if (this.openedMap.get(panelId) !== panel) {
      // We mount a new panel before un-mounting the existing one
      // when replacing existing panels in openComponent/openComponentInStack.
      // Skip map delete if the panelId entry already refers to the new panel.
      log.debug(
        `Panel argument doesn't match the open panels map entry for ${panelId}, removePanel ignored`
      );
      return;
    }
    log.debug2(`Removing panel ID ${panelId} from open panels map`);
    this.openedMap.delete(panelId);
  }

  removeClosedPanelConfig(panelConfig: ClosedPanel): void {
    const index = this.closed.findIndex(
      closedConfig =>
        closedConfig === panelConfig ||
        (closedConfig.id &&
          panelConfig.id &&
          closedConfig.id === panelConfig.id)
    );
    if (index >= 0) {
      this.closed.splice(index, 1);
    }
  }

  handleFocus(panel: OpenedPanel): void {
    log.debug2('Focus: ', panel);
    this.updatePanel(panel);
  }

  handleMount(panel: OpenedPanel): void {
    log.debug2('Mount: ', panel);
    this.updatePanel(panel);
    this.sendUpdate();
  }

  handleUnmount(panel: OpenedPanel): void {
    log.debug2('Unmount: ', panel);
    this.removePanel(panel);
    this.sendUpdate();
  }

  /**
   *
   * @param {Object} panelConfig The config to hydrate and load
   * @param {Object} replaceConfig The config to place
   */
  handleReopen(panelConfig: ClosedPanel, replaceConfig = null): void {
    log.debug2('Reopen:', panelConfig, replaceConfig);

    this.removeClosedPanelConfig(panelConfig);
    // Don't need to send an update yet, it will get sent when component is mounted

    // Rehydrate the panel before adding it back
    const { component } = panelConfig;
    let { props } = panelConfig;
    props = this.hydrateComponent(component, props);

    const config = {
      ...panelConfig,
      props,
    };

    const { root } = this.layout;
    LayoutUtils.openComponent({ root, config, replaceConfig });
  }

  handleDeleted(panelConfig: ClosedPanel): void {
    log.debug2('Deleted:', panelConfig);

    this.removeClosedPanelConfig(panelConfig);

    this.sendUpdate();
  }

  handleClosed(panelId: string, glContainer: GoldenLayout.Container): void {
    // Panel component should be already unmounted at this point
    // so the emitted event sends the container object instead of the panel.
    log.debug2('Closed: ', panelId);
    this.addClosedPanel(glContainer);
    this.sendUpdate();
  }

  handleControlClose(id: string): void {
    const config = { id };
    const { root } = this.layout;
    LayoutUtils.closeComponent(root, config);
  }

  addClosedPanel(glContainer: GoldenLayout.Container): void {
    const config = LayoutUtils.getComponentConfigFromContainer(glContainer);
    if (config) {
      const dehydratedConfig = this.dehydrateComponent(
        config.component,
        config
      );
      if (dehydratedConfig) {
        this.closed.push(dehydratedConfig);
      }
    }
  }

  sendUpdate(): void {
    const { closed, openedMap } = this;
    this.onPanelsUpdated({
      closed: [...closed],
      openedMap: new Map(openedMap),
    });
  }
}

export default PanelManager;
