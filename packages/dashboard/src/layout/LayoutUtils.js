import deepEqual from 'deep-equal';
import shortid from 'shortid';
import Log from '@deephaven/log';
import GoldenLayoutThemeExport from './GoldenLayoutThemeExport';

const log = Log.module('LayoutUtils');

class LayoutUtils {
  static DEFAULT_FOCUS_SELECTOR = 'input, select, textarea, button';

  static activateTab(root, config) {
    const stack = LayoutUtils.getStackForRoot(root, config, false);
    if (!stack) {
      log.error('Could not find stack for config', config);
      return;
    }
    // Find the tab with the specified table and activate it
    const contentItem = LayoutUtils.getContentItemInStack(stack, config);
    stack.setActiveContentItem(contentItem);
  }

  /**
   * Is the tab with the given config active
   * @param {ContentItem} root A GoldenLayout content item with the tab
   * @param {Object} config Tab config to match
   * @returns {boolean} True if the tab is active
   */
  static isActiveTab(root, config) {
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
   * @param {ContentItem} root A GoldenLayout content item to add the stack to
   * @returns The newly created stack.
   */
  static addStack(parent, columnPreferred = true) {
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

        // TODO: This is changing the fous to the body for some reason. Why???
        parent.contentItems[0].addChild(child);
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
   * @param {ContentItem} item Golden layout content item to search for the stack
   * @param {Config} config The item properties to match
   */
  static getStackForConfig(item, config = {}, allowEmptyStack = false) {
    if (allowEmptyStack && item.isStack && item.contentItems.length === 0) {
      return item;
    }

    if (!item.contentItems) {
      return null;
    }

    for (let i = 0; i < item.contentItems.length; i += 1) {
      const contentItem = item.contentItems[i];
      if (contentItem.isComponent && contentItem.config) {
        let isMatch = true;
        const keys = Object.keys(config);
        for (let k = 0; k < keys.length; k += 1) {
          const key = keys[k];
          if (config[key] !== contentItem.config[key]) {
            isMatch = false;
            break;
          }
        }
        if (isMatch) {
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
   * @param {Config} config The item config type to match, eg. { component: 'IrisGridPanel', title: 'Table Name' }
   * @param {boolean} createIfNecessary Whether to create the stack if it does not exist.
   * @param {boolean} matchComponentType If the config doesn't match exactly, just find another one of the same component type
   * @param {boolean} allowEmptyStack If no configs match, search for an empty stack that can be used
   */
  static getStackForRoot(
    root,
    config,
    createIfNecessary = true,
    matchComponentType = true,
    allowEmptyStack = true
  ) {
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
   * @param {ContentItem} root The GoldenLayout root to find or create the stack in
   * @param {Array[string]} types The array of component types to match
   * @param {boolean} createIfNecessary Whether to create the stack if it does not exist
   * @param {boolean} matchComponentType If the config doesn't match exactly, just find another one of the same component type
   * @param {boolean} allowEmptyStack If no configs match, search for an empty stack that can be used
   */
  static getStackForComponentTypes(
    root,
    types,
    createIfNecessary = true,
    matchComponentType = true,
    allowEmptyStack = true
  ) {
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
   * Gets content item with the specified config in stack.
   * @param {ContentItem} stack The stack to search for the item
   * @param {Config} config The item config type to match, eg. { component: 'IrisGridPanel', title: 'Table Name' }
   * @returns {ContentItem} Returns the found content item, null if not found.
   */
  static getContentItemInStack(stack, config) {
    for (let i = 0; i < stack.contentItems.length; i += 1) {
      const contentItem = stack.contentItems[i];
      if (contentItem.isComponent && contentItem.config) {
        let isMatch = true;
        const keys = Object.keys(config);
        for (let k = 0; k < keys.length; k += 1) {
          const key = keys[k];
          if (config[key] !== contentItem.config[key]) {
            isMatch = false;
            break;
          }
        }
        if (isMatch) {
          return contentItem;
        }
      }
    }
    return null;
  }

  /**
   * Removes dynamic props from components in the given config so this config could be serialized
   * @param {Array} config Config object
   * @param {(name: string, config: PanelConfig) => PanelConfig | null}
   * @returns {Array} Dehydrated config
   */
  static dehydrateLayoutConfig(config, dehydrateComponent) {
    if (!config || !config.length) {
      return [];
    }
    const dehydratedConfig = [];

    for (let i = 0; i < config.length; i += 1) {
      const itemConfig = config[i];
      const { component, content } = itemConfig;
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

  static getTabPoint(glContainer) {
    const { tab } = glContainer;
    if (tab == null) {
      throw new Error('Cannot get tab for panel container', glContainer);
    }
    const tabRect = tab.element[0].getBoundingClientRect();

    return [tabRect.left + tabRect.width * 0.5, tabRect.bottom - 8];
  }

  /**
   * Drop minor changes in Layout Configuration for deep comparison
   * @param {Object} config Layout Configuration
   *
   * minor changes:
   * 1. sorts in grid
   * 2. quick filters in grid
   * 3. active item
   *
   * item id is also removed
   */
  static dropLayoutMinorChange(config) {
    for (let i = 0; i < config.length; i += 1) {
      const itemConfig = config[i];
      const { component, content, activeItemIndex } = itemConfig;
      if (content) {
        if (activeItemIndex || activeItemIndex === 0) {
          delete itemConfig.activeItemIndex;
        }
        LayoutUtils.dropLayoutMinorChange(content);
      } else if (component === 'IrisGridPanel') {
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
   * @param {object} layout1 A Golden Layout config object
   * @param {object} layout2 Another Golden layout config object
   * @param {boolean} major When true, will ignore "minor" property differences (eg. sorts)
   */
  static isEqual(layout1, layout2, major = false) {
    if (major) {
      const layout1Clone = LayoutUtils.cloneLayout(layout1);
      const layout2Clone = LayoutUtils.cloneLayout(layout2);
      LayoutUtils.dropLayoutMinorChange(layout1Clone);
      LayoutUtils.dropLayoutMinorChange(layout2Clone);
      return deepEqual(layout1Clone, layout2Clone);
    }
    return deepEqual(layout1, layout2);
  }

  static cloneLayout(layout) {
    return JSON.parse(JSON.stringify(layout));
  }

  /**
   * Adds dynamic props to components in the given config so this config could be used to initialize a layout
   * @param {GoldenLayout.Config} config Dehydrated config object
   * @param {(name: string, config: PanelProps) => PanelProps} hydrateComponent Function to hydrate the component
   * @returns {Array} Hydrated config
   */
  static hydrateLayoutConfig(config, hydrateComponent) {
    if (!config || !config.length) {
      return [];
    }
    const hydratedConfig = [];

    for (let i = 0; i < config.length; i += 1) {
      const itemConfig = config[i];
      const { component, content, props, type } = itemConfig;
      if (type === 'react-component') {
        hydratedConfig.push({
          ...itemConfig,
          id: itemConfig?.id ?? shortid(),
          props: hydrateComponent(component, props),
        });
      } else if (content) {
        const contentConfig = LayoutUtils.hydrateLayoutConfig(
          content,
          hydrateComponent
        );
        if (
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
   * @param {ContentItem} root The GoldenLayout root to open the component in
   * @param {Config} config The component config definition to open
   * @param {Boolean} replaceExisting Whether it should replace the existing one matching component type and id, or open a new one
   * @param {Config} replaceConfig The component config to replace
   * @param {Boolean} createNewStack True to force opening in a new stack, false to try and open in a stack with the same type of component.
   * @param {String} focusElement The element to focus on
   * @param {MouseEvent} dragEvent Whether component is being created with a drag, mouse event is initial position for drag proxy
   */
  static openComponent({
    root,
    config: configParam,
    replaceExisting = true,
    replaceConfig = null,
    createNewStack = false,
    focusElement = null,
    dragEvent = null,
  } = {}) {
    // attempt to retain focus after dom manipulation, which can break focus
    const maintainFocusElement = document.activeElement;
    const config = { ...configParam };

    if (!config.id) {
      config.id = shortid.generate();
    }

    if (dragEvent) {
      root.layoutManager.createDragSourceFromEvent(config, dragEvent);
      return;
    }

    const searchConfig = replaceConfig || {
      id: config.id,
      component: config.component,
    };
    const stack = createNewStack
      ? LayoutUtils.addStack(root)
      : LayoutUtils.getStackForRoot(root, searchConfig);

    const oldContentItem = LayoutUtils.getContentItemInStack(
      stack,
      searchConfig
    );

    if (focusElement) {
      // We need to listen for when the stack is created
      const onComponentCreated = event => {
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

    if (!focusElement && maintainFocusElement) {
      maintainFocusElement.focus();
    }
  }

  /**
   * Opens a component in an given stack.
   * If `replaceExisting` is true and there is a component found with the same `config.id`, it will replace that component with this one
   * @param {ContentItem} stack The GoldenLayout stack to open the component in
   * @param {Config} config The component config definition to open
   * @param {Boolean} replaceExisting Whether it should replace the existing one matching component type and id, or open a new one
   */
  static openComponentInStack(stack, config, replaceExisting = true) {
    const maintainFocusElement = document.activeElement; // attempt to retain focus after dom manipulation, which can break focus

    const searchConfig = {
      id: config.id,
      component: config.component,
    };

    const oldContentItem = LayoutUtils.getContentItemInStack(
      stack,
      searchConfig
    );

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

    if (maintainFocusElement) maintainFocusElement.focus();
  }

  /**
   * Close the specified component and remove it from the stack it's currently in
   * @param {ContentItem} root The GoldenLayout root to search and close the component in
   * @param {Config} config The GoldenLayout component config definition to close, eg. { component: 'IrisGridPanel', id: 'table-t' }
   */
  static closeComponent(root, config) {
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
    if (oldContentItem.isComponent) {
      oldContentItem.container.close();
    } else {
      stack.removeChild(oldContentItem);
    }
    // if focused element is still in dom restore focus, note it could have been in the removed panel so check first
    if (maintainFocusElement && document.contains(maintainFocusElement)) {
      maintainFocusElement.focus();
    }
  }

  static renameComponent(root, config, newTitle) {
    const stack = LayoutUtils.getStackForRoot(root, config, false);
    if (!stack) {
      log.error('Could not find stack for config', config);
      return;
    }
    // Find the tab with the specified config and rename it
    const contentItem = LayoutUtils.getContentItemInStack(stack, config);
    contentItem.setTitle(newTitle);
  }

  /**
   * Create a component clone based on the given config
   * @param {ContentItem} root The GoldenLayout root to clone the component in
   * @param {Config} config The config to clone
   * @returns {Config} Clone config
   */
  static cloneComponent(root, config) {
    const stack = LayoutUtils.getStackForRoot(root, config, false);
    if (!stack) {
      log.error('Could not find stack for config', config);
      return null;
    }
    let { panelState = null } = config.props;
    const { componentState } = config;
    if (componentState) {
      ({ panelState } = componentState);
    }
    const cloneConfig = {
      type: 'react-component',
      component: config.component,
      props: {
        ...config.props,
        panelState,
      },
      title: `${config.title} Copy`,
      id: shortid.generate(),
    };
    LayoutUtils.openComponentInStack(stack, cloneConfig);
    return cloneConfig;
  }

  static makeDefaultLayout() {
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
    };
  }

  /**
   * Gets a containers root node
   * @param {GlContainer} container The Golden Layout container to get the root for
   */
  static getRootFromContainer(container) {
    return container.layoutManager.root;
  }

  /**
   * Gets the config for the panel component given a glContainer
   * @param {GlContainer} container The Golden Layout container to get the config for
   */
  static getComponentConfigFromContainer(container) {
    if (container) {
      if (container.tab && container.tab.contentItem) {
        return container.tab.contentItem.config;
      }

      // If the container hasn't populated the tab yet, just get the config directly from the container
      // eslint-disable-next-line no-underscore-dangle
      return container._config;
    }

    return null;
  }

  static getTitleFromContainer(container) {
    if (container && container.tab && container.tab.contentItem) {
      return container.tab.contentItem.config.title;
    }
    return null;
  }

  static getTitleFromTab(tab) {
    if (tab && tab.contentItem) {
      return tab.contentItem.config.title;
    }
    return null;
  }

  /**
   * Retrieve the panel ID for the provided golden layout container
   * @param {GlContainer} glContainer The container to get the panel ID for
   * @returns {string|null} Panel ID
   */
  static getIdFromContainer(glContainer) {
    const config = LayoutUtils.getComponentConfigFromContainer(glContainer);
    if (config) {
      return config.id;
    }
    return null;
  }

  /**
   * Retrieve the ID of the panel provided
   * @param {Component} panel The panel to get the ID for
   * @returns {string|null} Panel ID
   */
  static getIdFromPanel(panel) {
    const { glContainer } = panel.props;
    return LayoutUtils.getIdFromContainer(glContainer);
  }

  /**
   * Get component name from the panel instance
   * @param {Component} panel Panel to get component name for
   * @returns {string} Component name or null if unable to retrieve name
   */
  static getComponentNameFromPanel(panel) {
    const { glContainer } = panel.props;
    const config = LayoutUtils.getComponentConfigFromContainer(glContainer);
    return config?.component ?? null;
  }

  /**
   * Get component name for wrapped and un-wrapped components
   * @param {Component} component Component to get name for
   * @returns {string} Component name
   * @throws If displayName for the component is not defined
   */
  static getComponentName(component) {
    const name =
      component.WrappedComponent?.displayName ?? component.displayName;
    if (name == null) {
      throw new Error('Component displayName not defined', component);
    }
    return name;
  }

  /**
   * Put focus on the first "input" element (input, button, select, textarea) within an element
   * If element is null or input element not found, does nothing
   * @param {DOMElement} element The element to put focus in.
   * @param {String} selector The first element matching this selector will be focused.
   * @returns {DOMElement} The element that was focused, null if not focused
   */
  static focusElement(element, selector = LayoutUtils.DEFAULT_FOCUS_SELECTOR) {
    if (element == null) {
      return null;
    }
    const focusElement = element.querySelector(selector);
    if (focusElement == null) {
      return null;
    }

    focusElement.focus();
    return focusElement;
  }

  /**
   * Get a promise that initializes when layout is initialized
   * @param {GoldenLayout} layout The layout to await initialization on
   * @returns Promise that resolves when layout is initialized
   */
  static onInitialized(layout) {
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
