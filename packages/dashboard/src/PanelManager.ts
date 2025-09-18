import { type ComponentType } from 'react';
import type GoldenLayout from '@deephaven/golden-layout';
import type {
  Container,
  ContentItem,
  ItemConfig,
  ReactComponentConfig,
} from '@deephaven/golden-layout';
import Log from '@deephaven/log';
import PanelEvent from './PanelEvent';
import {
  listenForCycleToNextStack,
  listenForCycleToPreviousStack,
  listenForCycleToNextTab,
  listenForCycleToPreviousTab,
} from './NavigationEvent';
import LayoutUtils, { isReactComponentConfig } from './layout/LayoutUtils';
import {
  type DehydratedDashboardPanelProps,
  type DehydratedPanelConfig,
  type DehydratedPanelProps,
  isWrappedComponent,
  type PanelComponent,
  type PanelComponentType,
  type PanelProps,
} from './DashboardPlugin';

const log = Log.module('PanelManager');

enum CycleDirection {
  Next,
  Previous,
}

export type PanelHydraterFunction = (
  name: string,
  props: DehydratedPanelProps
) => DehydratedDashboardPanelProps;

export type PanelDehydraterFunction = (
  name: string,
  config: ReactComponentConfig
) => DehydratedPanelConfig;

export type ClosedPanel = ReactComponentConfig & {
  /**
   * The stack the component is in.
   */
  parentStackId?: string | string[];
};

export type ClosedPanels = ClosedPanel[];

export type OpenedPanelMap = Map<string | string[], PanelComponent>;

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

  hydrateComponent: PanelHydraterFunction;

  dehydrateComponent: PanelDehydraterFunction;

  onPanelsUpdated: PanelsUpdateCallback;

  closed: ClosedPanels;

  openedMap: OpenedPanelMap;

  navigationEventListenerRemovers: (() => void)[];

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
    hydrateComponent: PanelHydraterFunction = (name, props) =>
      props as DehydratedDashboardPanelProps,
    dehydrateComponent: PanelDehydraterFunction = (name, config) =>
      config as DehydratedPanelConfig,
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
    this.handleReopenLast = this.handleReopenLast.bind(this);
    this.handleCycleToNextStack = this.handleCycleToNextStack.bind(this);
    this.handleCycleToPreviousStack =
      this.handleCycleToPreviousStack.bind(this);
    this.handleCycleToNextTab = this.handleCycleToNextTab.bind(this);
    this.handleCycleToPreviousTab = this.handleCycleToPreviousTab.bind(this);
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

    // Store the navigation event listener removers
    this.navigationEventListenerRemovers = [];

    this.startListening();
  }

  startListening(): void {
    const { eventHub } = this.layout;
    eventHub.on(PanelEvent.FOCUS, this.handleFocus);
    eventHub.on(PanelEvent.MOUNT, this.handleMount);
    eventHub.on(PanelEvent.UNMOUNT, this.handleUnmount);
    eventHub.on(PanelEvent.REOPEN, this.handleReopen);
    eventHub.on(PanelEvent.REOPEN_LAST, this.handleReopenLast);
    eventHub.on(PanelEvent.DELETE, this.handleDeleted);
    eventHub.on(PanelEvent.CLOSED, this.handleClosed);
    eventHub.on(PanelEvent.CLOSE, this.handleControlClose);
    // PanelEvent.OPEN should be listened to by plugins to open a panel

    this.navigationEventListenerRemovers.push(
      listenForCycleToNextStack(eventHub, this.handleCycleToNextStack)
    );
    this.navigationEventListenerRemovers.push(
      listenForCycleToPreviousStack(eventHub, this.handleCycleToPreviousStack)
    );
    this.navigationEventListenerRemovers.push(
      listenForCycleToNextTab(eventHub, this.handleCycleToNextTab)
    );
    this.navigationEventListenerRemovers.push(
      listenForCycleToPreviousTab(eventHub, this.handleCycleToPreviousTab)
    );
  }

  stopListening(): void {
    const { eventHub } = this.layout;
    eventHub.off(PanelEvent.FOCUS, this.handleFocus);
    eventHub.off(PanelEvent.MOUNT, this.handleMount);
    eventHub.off(PanelEvent.UNMOUNT, this.handleUnmount);
    eventHub.off(PanelEvent.REOPEN, this.handleReopen);
    eventHub.off(PanelEvent.REOPEN_LAST, this.handleReopenLast);
    eventHub.off(PanelEvent.DELETE, this.handleDeleted);
    eventHub.off(PanelEvent.CLOSED, this.handleClosed);
    eventHub.off(PanelEvent.CLOSE, this.handleControlClose);

    this.navigationEventListenerRemovers.forEach(remover => remover());
    this.navigationEventListenerRemovers = [];
  }

  getClosedPanelConfigsOfType(typeString: string): ClosedPanels {
    return this.closed.filter(panel => panel.component === typeString);
  }

  getOpenedPanels(): PanelComponent[] {
    return Array.from(this.openedMap.values());
  }

  getOpenedPanelConfigs(): (ItemConfig | null)[] {
    return this.getOpenedPanels().map(panel => {
      const { glContainer } = panel.props;
      return LayoutUtils.getComponentConfigFromContainer(glContainer);
    });
  }

  getOpenedPanelConfigsOfType(typeString: string): ReactComponentConfig[] {
    return this.getOpenedPanelConfigs().filter(
      config =>
        config != null &&
        isReactComponentConfig(config) &&
        config.component === typeString
    ) as ReactComponentConfig[];
  }

  getOpenedPanelById(panelId: string | string[]): PanelComponent | undefined {
    return this.openedMap.get(panelId);
  }

  getContainerByPanelId(panelId: string | string[]): ContentItem | null {
    const stack = LayoutUtils.getStackForConfig(this.layout.root, {
      id: panelId,
    });
    return (
      (stack && LayoutUtils.getContentItemInStack(stack, { id: panelId })) ??
      null
    );
  }

  getLastUsedPanel<T extends PanelComponent = PanelComponent>(
    matcher: (panel: PanelComponent) => boolean
  ): T | undefined {
    const opened = this.getOpenedPanels();
    for (let i = opened.length - 1; i >= 0; i -= 1) {
      const panel = opened[i];
      if (matcher == null || matcher(panel)) {
        return panel as T;
      }
    }

    return undefined;
  }

  getLastUsedPanelOfType<
    P extends PanelProps = PanelProps,
    C extends ComponentType<P> = ComponentType<P>,
  >(type: PanelComponentType<P, C>): PanelComponent<P> | undefined {
    return this.getLastUsedPanelOfTypes([type]);
  }

  getLastUsedPanelOfTypes<
    P extends PanelProps = PanelProps,
    C extends ComponentType<P> = ComponentType<P>,
  >(types: PanelComponentType<P, C>[]): PanelComponent<P> | undefined {
    return this.getLastUsedPanel(panel =>
      types.some(
        type =>
          (isWrappedComponent(type) &&
            panel instanceof type.WrappedComponent) ||
          (!isWrappedComponent(type) && panel instanceof type)
      )
    );
  }

  updatePanel(panel: PanelComponent): void {
    const panelId = LayoutUtils.getIdFromPanel(panel);
    if (panelId == null) {
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

  removePanel(panel: PanelComponent): void {
    const panelId = LayoutUtils.getIdFromPanel(panel);
    if (panelId == null) {
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
        (closedConfig.id != null &&
          panelConfig.id != null &&
          closedConfig.id === panelConfig.id)
    );
    if (index >= 0) {
      this.closed.splice(index, 1);
    }
  }

  handleFocus(panel: PanelComponent): void {
    log.debug2('Focus: ', panel);
    this.updatePanel(panel);
  }

  handleMount(panel: PanelComponent): void {
    log.debug2('Mount: ', panel);
    this.updatePanel(panel);
    this.sendUpdate();
  }

  handleUnmount(panel: PanelComponent): void {
    log.debug2('Unmount: ', panel);
    this.removePanel(panel);
    this.sendUpdate();
  }

  cycleStack(direction: CycleDirection): void {
    const allStacks = LayoutUtils.getAllStackContainers(this.layout);
    if (allStacks.length <= 1) {
      return;
    }

    const focusedIndex = LayoutUtils.getFocusedStackIndex(allStacks);

    // If no stack is focused, activate the first stack's content item
    if (focusedIndex === -1) {
      const targetStack = allStacks[0];
      const activeContentIndex = targetStack.config.activeItemIndex;
      const activeContentItem =
        activeContentIndex != null
          ? targetStack.contentItems[activeContentIndex]
          : targetStack.contentItems[0];

      targetStack.setActiveContentItem(activeContentItem, true);
      return;
    }

    const targetIndex =
      direction === CycleDirection.Next
        ? (focusedIndex + 1) % allStacks.length
        : (focusedIndex - 1 + allStacks.length) % allStacks.length;
    const targetStack = allStacks[targetIndex];

    const activeContentIndex = targetStack.config.activeItemIndex;
    const activeContentItem =
      activeContentIndex != null
        ? targetStack.contentItems[activeContentIndex]
        : targetStack.contentItems[0];

    targetStack.setActiveContentItem(activeContentItem, true);
  }

  handleCycleToNextStack(): void {
    this.cycleStack(CycleDirection.Next);
  }

  handleCycleToPreviousStack(): void {
    this.cycleStack(CycleDirection.Previous);
  }

  cycleTab(direction: CycleDirection): void {
    const focusedStack = LayoutUtils.getFocusedStack(this.layout);
    if (focusedStack === undefined) {
      return;
    }
    const { contentItems } = focusedStack;

    if (contentItems.length <= 1) {
      return;
    }

    const activeItemIndex = focusedStack.config.activeItemIndex ?? 0;
    const targetIndex =
      direction === CycleDirection.Next
        ? (activeItemIndex + 1) % contentItems.length
        : (activeItemIndex - 1 + contentItems.length) % contentItems.length;

    const targetContentItem = contentItems[targetIndex];
    focusedStack.setActiveContentItem(targetContentItem, true);
  }

  handleCycleToNextTab(): void {
    this.cycleTab(CycleDirection.Next);
  }

  handleCycleToPreviousTab(): void {
    this.cycleTab(CycleDirection.Previous);
  }

  /**
   *
   * @param panelConfig The config to hydrate and load
   * @param replaceConfig The config to place
   */
  handleReopen(
    panelConfig: ClosedPanel,
    replaceConfig?: Partial<ItemConfig>
  ): void {
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
    const stack =
      panelConfig.parentStackId === undefined
        ? undefined
        : LayoutUtils.getStackById(root, panelConfig.parentStackId);
    LayoutUtils.openComponent({
      root,
      config,
      replaceConfig,
      stack: stack ?? undefined,
    });
  }

  /**
   *
   * @param glContainer Only reopen panels that were closed from the stack of this container, if defined
   */
  handleReopenLast(glContainer?: Container): void {
    if (this.closed.length === 0) return;
    if (glContainer === undefined) {
      this.handleReopen(this.closed[this.closed.length - 1]);
      return;
    }

    const stackId = LayoutUtils.getStackForConfig(
      this.layout.root,
      glContainer.getConfig()
    )?.config.id;
    for (let i = this.closed.length - 1; i >= 0; i -= 1) {
      const panelConfig = this.closed[i];
      if (panelConfig.parentStackId === stackId) {
        this.handleReopen(panelConfig);
        return;
      }
    }
  }

  handleDeleted(panelConfig: ClosedPanel): void {
    log.debug2('Deleted:', panelConfig);

    this.removeClosedPanelConfig(panelConfig);

    this.sendUpdate();
  }

  handleClosed(panelId: string, glContainer: Container): void {
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

  addClosedPanel(glContainer: Container): void {
    const config = LayoutUtils.getComponentConfigFromContainer(glContainer);
    if (config && isReactComponentConfig(config)) {
      const dehydratedConfig = this.dehydrateComponent(
        config.component,
        config
      );
      if (dehydratedConfig != null) {
        (dehydratedConfig as ClosedPanel).parentStackId =
          glContainer.tab?.header.parent.config.id;
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
