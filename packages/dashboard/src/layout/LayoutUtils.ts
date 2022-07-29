import deepEqual from 'deep-equal';
import shortid from 'shortid';
import isMatch from 'lodash.ismatch';
import { DragEvent } from 'react';
import Log from '@deephaven/log';
import GoldenLayout, {
  ComponentConfig,
  Config,
  Container,
  ContentItem,
  ItemConfig,
  ItemConfigType,
  ReactComponentConfig,
  Tab,
} from '@deephaven/golden-layout';
import { assertNotNull } from '@deephaven/utils';
import GoldenLayoutThemeExport from './GoldenLayoutThemeExport';
import { DashboardLayoutConfig } from '../DashboardLayout';
import { PanelComponent, PanelConfig } from '../DashboardPlugin';

const log = Log.module('LayoutUtils');

type LayoutConfig = { id?: string; component?: string };

export type StackItemConfig = ItemConfig & {
  activeItemIndex?: number;
};

export function isReactComponentConfig(
  config: ItemConfigType
): config is ReactComponentConfig {
  const reactConfig = config as ReactComponentConfig;
  return (
    reactConfig.type === 'react-component' &&
    reactConfig.component !== undefined
  );
}

function isComponentConfig(config: ItemConfigType): config is ComponentConfig {
  return (config as ComponentConfig).componentName !== undefined;
}

function isHTMLElement(element: Element): element is HTMLElement {
  return (element as HTMLElement).focus !== undefined;
}

function assertReactComponentConfig(
  config: ItemConfigType
): asserts config is ReactComponentConfig {
  if (!isReactComponentConfig(config)) {
    throw new Error('config is not react component config');
  }
}

function isStackItemConfig(config: ItemConfigType): config is StackItemConfig {
  return config.type === 'stack';
}
class LayoutUtils {
  static DEFAULT_FOCUS_SELECTOR = 'input, select, textarea, button';

  static activateTab(root: ContentItem, config: Partial<ItemConfigType>): void {
    const stack = LayoutUtils.getStackForRoot(root, config, false);
    if (!stack) {
      log.error('Could not find stack for config', config);
      return;
    }
    // Find the tab with the specified table and activate it
    const contentItem = LayoutUtils.getContentItemInStack(stack, config);
    if (contentItem) {
      stack.setActiveContentItem(contentItem);
    }
  }

  /**
   * Is the tab with the given config active
   * @param root A GoldenLayout content item with the tab
   * @param config Tab config to match
   * @returns True if the tab is active
   */
  static isActiveTab(root: ContentItem, config: Config): boolean {
    const stack = LayoutUtils.getStackForRoot(root, config, false);
    if (!stack) {
      log.error('Could not find stack for config', config);
      return false;
    }
    // Find the item with the specified config and compare with active item
    const contentItem = LayoutUtils.getContentItemInStack(stack, config);
    const activeItem = stack.getActiveContentItem();
    return activeItem === contentItem;
  }

  /**
   * Adds a stack to the root layout specified. Adds to the first row/column with only one item
   * @param parent A GoldenLayout content item to add the stack to
   * @returns The newly created stack.
   */
  static addStack(parent: ContentItem, columnPreferred = true): ContentItem {
    const type = columnPreferred ? 'column' : 'row';
    if (parent.isRoot) {
      if (!parent.contentItems || parent.contentItems.length === 0) {
        parent.addChild({ type });
      }

      const child = parent.contentItems[0];
      const isCorrectType = columnPreferred ? child.isColumn : child.isRow;
      if (!isCorrectType) {
        parent.removeChild(child, true);
        parent.addChild({ type });

        // The addChild may cause the element that has focus to be removed from the DOM, which changes focus to the body
        // Try and maintain the focus as best we can. The unfocused element may still send a blur/focus event so that needs to be handled correctly.
        const maintainFocusElement = document.activeElement;
        parent.contentItems[0].addChild(child);
        if (
          maintainFocusElement &&
          (maintainFocusElement as HTMLElement).focus
        ) {
          (maintainFocusElement as HTMLElement).focus();
        }
      }

      return this.addStack(parent.contentItems[0], columnPreferred);
    }

    if (parent.contentItems.length < 2) {
      parent.addChild({ type: 'stack' });
      return parent.contentItems[parent.contentItems.length - 1];
    }
    let newParent = parent.contentItems[parent.contentItems.length - 1];
    const isCorrectType = !columnPreferred
      ? newParent.isColumn
      : newParent.isRow;
    if (!isCorrectType) {
      parent.addChild({ type: !columnPreferred ? 'column' : 'row' });
      parent.removeChild(newParent, true);
      parent.contentItems[parent.contentItems.length - 1].addChild(newParent);
      newParent = parent.contentItems[parent.contentItems.length - 1];
    }

    return this.addStack(newParent, !columnPreferred);
  }

  /**
   * Gets the first stack which contains a contentItem with the given config values
   * @param item Golden layout content item to search for the stack
   * @param  config The item properties to match
   */
  static getStackForConfig(
    item: ContentItem,
    config: Partial<ItemConfigType> = {},
    allowEmptyStack = false
  ): ContentItem | null {
    if (allowEmptyStack && item.isStack && item.contentItems.length === 0) {
      return item;
    }

    if (!item.contentItems) {
      return null;
    }

    for (let i = 0; i < item.contentItems.length; i += 1) {
      const contentItem = item.contentItems[i];
      if (contentItem.isComponent && contentItem.config) {
        if (isMatch(contentItem.config, config)) {
          return item;
        }
      }

      const stack = this.getStackForConfig(
        contentItem,
        config,
        allowEmptyStack
      );
      if (stack) {
        return stack;
      }
    }

    return null;
  }

  /**
   * Gets a stack matching the specified config
   * @param root The root GoldenLayout element
   * @param config The item config type to match, eg. { component: 'IrisGridPanel', title: 'Table Name' }
   * @param createIfNecessary Whether to create the stack if it does not exist.
   * @param matchComponentType If the config doesn't match exactly, just find another one of the same component type
   * @param allowEmptyStack If no configs match, search for an empty stack that can be used
   */
  static getStackForRoot(
    root: ContentItem,
    config: Partial<ReactComponentConfig>,
    createIfNecessary = true,
    matchComponentType = true,
    allowEmptyStack = true
  ): ContentItem | null {
    let stack = this.getStackForConfig(root, config);
    if (!stack && matchComponentType) {
      stack = this.getStackForConfig(
        root,
        { component: config.component },
        allowEmptyStack
      );
    }

    if (!stack && createIfNecessary) {
      stack = this.addStack(root);
    }

    return stack;
  }

  /**
   * Gets a stack matching one of the specified types, creates new stack if necessary
   * @param root The GoldenLayout root to find or create the stack in
   * @param types The array of component types to match
   * @param createIfNecessary Whether to create the stack if it does not exist
   * @param matchComponentType If the config doesn't match exactly, just find another one of the same component type
   * @param allowEmptyStack If no configs match, search for an empty stack that can be used
   */
  static getStackForComponentTypes(
    root: ContentItem,
    types: string[],
    createIfNecessary = true,
    matchComponentType = true,
    allowEmptyStack = true
  ): ContentItem | null {
    for (let i = 0; i < types.length; i += 1) {
      const component = types[i];
      const isLastType = i === types.length - 1;
      const stack = LayoutUtils.getStackForRoot(
        root,
        { component },
        createIfNecessary && isLastType,
        matchComponentType,
        allowEmptyStack
      );
      if (stack) {
        return stack;
      }
    }
    return null;
  }

  /**
   * Gets first content item with the specified config in stack.
   * @param stack The stack to search for the item
   * @param config The item config type to match, eg. { component: 'IrisGridPanel', title: 'Table Name' }
   * @returns Returns the found content item, null if not found.
   */
  static getContentItemInStack(
    stack: ContentItem | null,
    config: Partial<ItemConfigType>
  ): ContentItem | null {
    if (!stack) {
      return null;
    }
    for (let i = 0; i < stack.contentItems.length; i += 1) {
      const contentItem = stack.contentItems[i];
      if (contentItem.isComponent && contentItem.config) {
        if (isMatch(contentItem.config, config)) {
          return contentItem;
        }
      }
    }
    return null;
  }

  /**
   * Removes dynamic props from components in the given config so this config could be serialized
   * @param config Config objec
   * @returns Dehydrated config
   */
  static dehydrateLayoutConfig(
    config: ItemConfigType[],
    dehydrateComponent: (
      componentName: string,
      config: ItemConfigType
    ) => PanelConfig
  ): (PanelConfig | ItemConfig)[] {
    if (!config || !config.length) {
      return [];
    }
    const dehydratedConfig: (PanelConfig | ItemConfig)[] = [];

    for (let i = 0; i < config.length; i += 1) {
      const itemConfig = config[i];
      const { component, content } = itemConfig as ReactComponentConfig;
      if (component) {
        const dehydratedComponent = dehydrateComponent(component, itemConfig);
        if (dehydratedComponent) {
          dehydratedConfig.push(dehydratedComponent);
        } else {
          log.debug2(
            `dehydrateLayoutConfig: skipping unmapped component "${component}"`
          );
        }
      } else if (content) {
        const layoutItemConfig = {
          ...itemConfig,
          content: LayoutUtils.dehydrateLayoutConfig(
            content,
            dehydrateComponent
          ),
        };
        dehydratedConfig.push(layoutItemConfig);
      } else {
        dehydratedConfig.push(itemConfig);
      }
    }
    return dehydratedConfig;
  }

  static getTabPoint(glContainer: Container): [number, number] {
    const { tab } = glContainer;
    if (tab == null) {
      throw new Error(`Cannot get tab for panel container ${glContainer}`);
    }
    const tabRect = tab.element[0].getBoundingClientRect();

    return [tabRect.left + tabRect.width * 0.5, tabRect.bottom - 8];
  }

  /**
   * Drop minor changes in Layout Configuration for deep comparison
   * @param config Layout Configuration
   *
   * minor changes:
   * 1. sorts in grid
   * 2. quick filters in grid
   * 3. active item
   *
   * item id is also removed
   */
  static dropLayoutMinorChange(config: DashboardLayoutConfig): void {
    for (let i = 0; i < config.length; i += 1) {
      const itemConfig = config[i];
      const { content } = itemConfig;
      if (content !== undefined) {
        if (isStackItemConfig(itemConfig)) {
          delete itemConfig.activeItemIndex;
        }
        LayoutUtils.dropLayoutMinorChange(content);
      } else if (
        isReactComponentConfig(itemConfig) &&
        itemConfig.component === 'IrisGridPanel'
      ) {
        if (itemConfig.props.panelState) {
          delete itemConfig.id;
          itemConfig.props.panelState.irisGridState.sorts = [];
          itemConfig.props.panelState.irisGridState.quickFilters = [];
        }
      }
    }
  }

  /**
   * Compare two layouts to see if they are equivalent
   * @param layout1 A Golden Layout config object
   * @param layout2 Another Golden layout config object
   * @param major When true, will ignore "minor" property differences (eg. sorts)
   */
  static isEqual(
    layout1: DashboardLayoutConfig,
    layout2: DashboardLayoutConfig,
    major = false
  ): boolean {
    if (major) {
      const layout1Clone = LayoutUtils.cloneLayout(layout1);
      const layout2Clone = LayoutUtils.cloneLayout(layout2);
      LayoutUtils.dropLayoutMinorChange(layout1Clone);
      LayoutUtils.dropLayoutMinorChange(layout2Clone);
      return deepEqual(layout1Clone, layout2Clone);
    }
    return deepEqual(layout1, layout2);
  }

  static cloneLayout(layout: DashboardLayoutConfig): DashboardLayoutConfig {
    return JSON.parse(JSON.stringify(layout));
  }

  /**
   * Adds dynamic props to components in the given config so this config could be used to initialize a layout
   * @param config Dehydrated config object
   * @param hydrateComponent Function to hydrate the component
   * @returns Hydrated config
   */
  static hydrateLayoutConfig(
    config: (PanelConfig | ItemConfig)[],
    hydrateComponent: (
      componentName: string,
      config: PanelConfig | ItemConfig
    ) => ReactComponentConfig
  ): DashboardLayoutConfig {
    if (!config || !config.length) {
      return [];
    }
    const hydratedConfig = [];

    for (let i = 0; i < config.length; i += 1) {
      const itemConfig = config[i];
      if (isReactComponentConfig(itemConfig)) {
        const { component, props = {} } = itemConfig;
        hydratedConfig.push({
          ...itemConfig,
          id: itemConfig?.id ?? shortid(),
          props: hydrateComponent(component, props),
        });
      } else if (itemConfig.content !== undefined) {
        const contentConfig = LayoutUtils.hydrateLayoutConfig(
          itemConfig.content,
          hydrateComponent
        );
        if (
          isStackItemConfig(itemConfig) &&
          itemConfig.activeItemIndex != null &&
          itemConfig.activeItemIndex >= contentConfig.length
        ) {
          log.warn(
            'Fixing bad activeItemIndex!',
            itemConfig.activeItemIndex,
            itemConfig
          );
          itemConfig.activeItemIndex = 0;
        }
        hydratedConfig.push({
          ...itemConfig,
          content: contentConfig,
        });
      } else {
        hydratedConfig.push(itemConfig);
      }
    }

    return hydratedConfig;
  }

  /**
   * Opens a component. It will try and open the component in an existing stack of the same component.
   * If `replaceExisting` is true and there is a component found with the same `config.id`, it will replace that component with this one.
   * If `allowStack` is true and there is a component of the same type found, it will open in that stack (potentially covering up a panel).
   * @param root The GoldenLayout root to open the component in
   * @param config The component config definition to open
   * @param replaceExisting Whether it should replace the existing one matching component type and id, or open a new one
   * @param replaceConfig The component config to replace
   * @param createNewStack True to force opening in a new stack, false to try and open in a stack with the same type of component.
   * @param focusElement The element to focus on
   * @param dragEvent Whether component is being created with a drag, mouse event is initial position for drag proxy
   */
  static openComponent({
    root,
    config: configParam,
    replaceExisting = true,
    replaceConfig = undefined,
    createNewStack = false,
    focusElement = undefined,
    dragEvent = undefined,
  }: {
    root?: ContentItem;
    config?: ReactComponentConfig;
    replaceExisting?: boolean;
    replaceConfig?: Partial<ItemConfigType>;
    createNewStack?: boolean;
    focusElement?: string;
    dragEvent?: DragEvent;
  } = {}): void {
    // attempt to retain focus after dom manipulation, which can break focus
    const maintainFocusElement = document.activeElement;
    const config = { ...configParam } as ReactComponentConfig;

    if (!config.id) {
      config.id = shortid.generate();
    }

    if (dragEvent) {
      root?.layoutManager.createDragSourceFromEvent(config, dragEvent);
      return;
    }

    const searchConfig = replaceConfig || {
      id: config.id,
      component: config.component,
    };
    assertNotNull(root);
    const stack = createNewStack
      ? LayoutUtils.addStack(root)
      : LayoutUtils.getStackForRoot(root, searchConfig);

    assertNotNull(stack);
    const oldContentItem = LayoutUtils.getContentItemInStack(
      stack,
      searchConfig
    );

    if (focusElement) {
      // We need to listen for when the stack is created
      const onComponentCreated = (event: {
        origin: { element: Element[] };
      }) => {
        log.debug('Component created, focusing element', focusElement);

        stack.off('componentCreated', onComponentCreated);

        const { element } = event.origin;

        // Need to wait until the component actually renders.
        requestAnimationFrame(() => {
          LayoutUtils.focusElement(element[0], focusElement);
        });
      };
      stack.on('componentCreated', onComponentCreated);
    }
    if (replaceExisting && oldContentItem) {
      const index = stack.contentItems.indexOf(oldContentItem);

      // Using remove/add here instead of replaceChild because I was getting errors with replaceChild... should be the same.
      // Add first so that the stack doesn't get screwed up
      stack.addChild(config, index + 1);
      stack.removeChild(oldContentItem);

      stack.setActiveContentItem(stack.contentItems[index]);
    } else {
      stack.addChild(config);
    }

    if (
      !focusElement &&
      maintainFocusElement &&
      isHTMLElement(maintainFocusElement)
    ) {
      maintainFocusElement.focus();
    }
  }

  /**
   * Opens a component in an given stack.
   * If `replaceExisting` is true and there is a component found with the same `config.id`, it will replace that component with this one
   * @param stack The GoldenLayout stack to open the component in
   * @param config The component config definition to open
   * @param replaceExisting Whether it should replace the existing one matching component type and id, or open a new one
   */
  static openComponentInStack(
    stack: ContentItem | null,
    config: ItemConfigType,
    replaceExisting = true
  ): void {
    const maintainFocusElement = document.activeElement; // attempt to retain focus after dom manipulation, which can break focus

    const searchConfig = { id: config.id };

    const oldContentItem = LayoutUtils.getContentItemInStack(
      stack,
      searchConfig
    );

    if (replaceExisting && oldContentItem && stack) {
      const index = stack?.contentItems.indexOf(oldContentItem);

      // Using remove/add here instead of replaceChild because I was getting errors with replaceChild... should be the same.
      // Add first so that the stack doesn't get screwed up
      stack.addChild(config, index + 1);
      stack.removeChild(oldContentItem);

      stack.setActiveContentItem(stack.contentItems[index]);
    } else {
      stack?.addChild(config);
    }

    if (maintainFocusElement && isHTMLElement(maintainFocusElement)) {
      maintainFocusElement.focus();
    }
  }

  /**
   * Close the specified component and remove it from the stack it's currently in
   * @param root The GoldenLayout root to search and close the component in
   * @param config The GoldenLayout component config definition to close, eg. { component: 'IrisGridPanel', id: 'table-t' }
   */
  static closeComponent(root: ContentItem, config: LayoutConfig): void {
    const stack = LayoutUtils.getStackForRoot(
      root,
      config,
      false,
      false,
      false
    );

    if (!stack) {
      log.warn('Cannot find stack for component, ignoring close', config);
      return;
    }

    // Find the tab with the specified config and remove it
    // Same component was used to get the stack above, so getContentItemInStack shouldn't return null
    const oldContentItem = LayoutUtils.getContentItemInStack(stack, config);
    const maintainFocusElement = document.activeElement; // attempt to retain focus after dom manipulation, which can break focus
    if (oldContentItem) {
      if (oldContentItem.isComponent) {
        // container property exists on a contentItem if contentItem is a component,
        // however, this is not included in the types for a contentitem, thus the casting
        ((oldContentItem as unknown) as {
          container: { close: () => void };
        }).container.close();
      } else {
        stack.removeChild(oldContentItem);
      }
    }
    // if focused element is still in dom restore focus, note it could have been in the removed panel so check first
    if (
      maintainFocusElement &&
      document.contains(maintainFocusElement) &&
      isHTMLElement(maintainFocusElement)
    ) {
      maintainFocusElement.focus();
    }
  }

  static renameComponent(
    root: ContentItem,
    config: Partial<ItemConfigType>,
    newTitle: string
  ): void {
    const stack = LayoutUtils.getStackForRoot(root, config, false);
    if (!stack) {
      log.error('Could not find stack for config', config);
      return;
    }
    // Find the tab with the specified config and rename it
    const contentItem = LayoutUtils.getContentItemInStack(stack, config);
    if (contentItem) {
      contentItem.setTitle(newTitle);
    }
  }

  /**
   * Create a component clone based on the given config
   * @param root The GoldenLayout root to clone the component in
   * @param config The config to clone
   * @returns Clone config
   */
  static cloneComponent(
    root: ContentItem,
    config: ReactComponentConfig
  ): ReactComponentConfig | null {
    const stack = LayoutUtils.getStackForRoot(root, config, false);
    if (!stack) {
      log.error('Could not find stack for config', config);
      return null;
    }
    const { props = {} } = config;
    const panelState = LayoutUtils.getPanelComponentState(config);
    const cloneConfig = {
      type: 'react-component',
      component: config.component,
      props: {
        ...props,
        panelState,
      },
      title: `${config.title} Copy`,
      id: shortid.generate(),
    };
    LayoutUtils.openComponentInStack(stack, cloneConfig);
    return cloneConfig;
  }

  /**
   * Get panel component state for the given config
   * @param config Panel config
   * @returns Panel state
   */
  static getPanelComponentState(config: ItemConfigType): unknown {
    if (isComponentConfig(config)) {
      return config.componentState?.panelState;
    }
    if (isReactComponentConfig(config)) {
      return config.props?.panelState;
    }
    return null;
  }

  static makeDefaultLayout(): Config {
    return {
      dimensions: {
        headerHeight: GoldenLayoutThemeExport.tabHeight,
        borderWidth: GoldenLayoutThemeExport.dragBorderWidth,
        borderGrabWidth: 10,
      },
      settings: {
        showPopoutIcon: false,
        showCloseIcon: false,
        constrainDragToContainer: false,
      },
    } as Config;
  }

  /**
   * Gets a containers root node
   * @param container The Golden Layout container to get the root for
   */
  static getRootFromContainer(container: Container): ContentItem {
    return container.layoutManager.root;
  }

  /**
   * Gets the config for the panel component given a glContainer
   * @param container The Golden Layout container to get the config for
   */
  static getComponentConfigFromContainer(
    container?: Container
  ): ItemConfigType | null {
    if (container) {
      if (container.tab && container.tab.contentItem) {
        return container.tab.contentItem.config;
      }

      // If the container hasn't populated the tab yet, just get the config directly from the container
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore private api usage
      // eslint-disable-next-line no-underscore-dangle
      return container._config;
    }

    return null;
  }

  static getTitleFromContainer(
    container: Container
  ): string | null | undefined {
    if (container && container.tab && container.tab.contentItem) {
      return container.tab.contentItem.config.title;
    }
    return null;
  }

  static getTitleFromTab(tab: Tab): string | null | undefined {
    if (tab && tab.contentItem) {
      return tab.contentItem.config.title;
    }
    return null;
  }

  /**
   * Retrieve the panel ID for the provided golden layout container
   * @param glContainer The container to get the panel ID for
   * @returns Panel ID
   */
  static getIdFromContainer(
    glContainer: Container
  ): string | string[] | null | undefined {
    const config = LayoutUtils.getComponentConfigFromContainer(glContainer);
    if (config) {
      return config.id;
    }
    return null;
  }

  /**
   * Retrieve the ID of the panel provided
   * @param panel The panel to get the ID for
   * @returns Panel ID
   */
  static getIdFromPanel(
    panel: PanelComponent
  ): string | string[] | null | undefined {
    const { glContainer } = panel.props;
    return LayoutUtils.getIdFromContainer(glContainer);
  }

  /**
   * Get component name from the panel instance
   * @param panel Panel to get component name for
   * @returns Component name or null if unable to retrieve name
   */
  static getComponentNameFromPanel(panel: {
    props: { glContainer: GoldenLayout.Container };
  }): string | null {
    const { glContainer } = panel.props;
    const config = LayoutUtils.getComponentConfigFromContainer(glContainer);
    if (config) {
      assertReactComponentConfig(config);
      return config.component;
    }
    return null;
  }

  /**
   * Get component name for wrapped and un-wrapped components
   * @param component Component to get name for
   * @returns Component name
   * @throws If displayName for the component is not defined
   */
  static getComponentName(component: {
    displayName?: string;
    WrappedComponent?: { displayName?: string };
  }): string {
    const name =
      component.WrappedComponent?.displayName ?? component.displayName;
    if (name == null) {
      throw new Error(`Component displayName not defined ${component}`);
    }
    return name;
  }

  /**
   * Put focus on the first "input" element (input, button, select, textarea) within an element
   * If element is null or input element not found, does nothing
   * @param element The element to put focus in.
   * @param selector The first element matching this selector will be focused.
   * @returns The element that was focused, null if not focused
   */
  static focusElement(
    element: Element,
    selector = LayoutUtils.DEFAULT_FOCUS_SELECTOR
  ): Element | null {
    if (element == null) {
      return null;
    }
    const focusElement = element.querySelector(selector);
    if (focusElement == null) {
      return null;
    }

    if (isHTMLElement(focusElement)) {
      focusElement.focus();
    }
    return focusElement;
  }

  /**
   * Get a promise that initializes when layout is initialized
   * @param layout The layout to await initialization on
   * @returns Promise that resolves when layout is initialized
   */
  static onInitialized(layout: GoldenLayout): Promise<void> {
    return new Promise(resolve => {
      if (layout.isInitialised) {
        resolve();
        return;
      }
      const onInit = () => {
        layout.off('initialised', onInit);
        resolve();
      };
      layout.on('initialised', onInit);
    });
  }
}

export default LayoutUtils;
