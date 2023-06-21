import $ from 'jquery';
import React from 'react';
import lm from './base';
import { defaultConfig } from './config';
import type {
  ItemConfig,
  Config,
  ComponentConfig,
  ItemConfigType,
  ReactComponentConfig,
} from './config';
import type { ItemContainer } from './container';
import {
  BrowserPopout,
  DragSource,
  DragSourceFromEvent,
  DropTargetIndicator,
} from './controls';
import { ConfigurationError } from './errors';
import {
  AbstractContentItem,
  ItemArea,
  isStack,
  Component,
  Root,
  RowOrColumn,
  Stack,
} from './items';
import {
  minifyConfig,
  unminifyConfig,
  EventEmitter,
  EventHub,
  ReactComponentHandler,
  getQueryStringParam,
  getUniqueId,
  stripTags,
} from './utils';

export type ComponentConstructor<
  C extends ComponentConfig | ReactComponentConfig = ComponentConfig
> = {
  new (container: ItemContainer<C>, state: unknown): unknown;
};

export type DragSourceEvent = JQuery.TriggeredEvent;

// function testFunc(dragEvent?: DragSourceEvent): void {
//   console.log('testFunc', dragEvent);
// }

// let myDragEvent: DragEvent | undefined;
// testFunc(14);

/**
 * The main class that will be exposed as GoldenLayout.
 *
 * @param config
 * @param container Can be a jQuery selector string or a Dom element. Defaults to body
 */
export class LayoutManager extends EventEmitter {
  /**
   * Hook that allows to access private classes
   */
  static __lm = lm;

  /**
   * Takes a GoldenLayout configuration object and
   * replaces its keys and values recursively with
   * one letter codes
   *
   * @param config A GoldenLayout config object
   * @returns minified config
   */
  static minifyConfig(config: Config): Record<string, unknown> {
    return minifyConfig(config);
  }

  /**
   * Takes a configuration Object that was previously minified
   * using minifyConfig and returns its original version
   *
   * @param minifiedConfig
   * @returns the original configuration
   */
  static unminifyConfig(config: Record<string, unknown>): Config {
    return unminifyConfig(config);
  }

  isInitialised = false;
  private _isFullPage = false;
  private _resizeTimeoutId: number | undefined;

  private _components: {
    [name: string]:
      | ComponentConstructor
      | ComponentConstructor<ReactComponentConfig>
      | React.Component
      | React.ForwardRefExoticComponent<any>;
  } = { 'lm-react-component': ReactComponentHandler };

  private _fallbackComponent?:
    | ComponentConstructor
    | React.ForwardRefExoticComponent<any>;
  private _itemAreas: ItemArea[] = [];
  private _maximisedItem: AbstractContentItem | null = null;
  private _maximisePlaceholder = $('<div class="lm_maximise_place"></div>');
  private _creationTimeoutPassed = false;
  private _subWindowsCreated = false;
  private _dragSources: DragSource[] = [];
  private _updatingColumnsResponsive = false;
  private _firstLoad = true;
  private _reactChildMap = new Map<string, React.ReactNode>();
  private _reactChildren: React.ReactNode = null;

  width: number | null = null;
  height: number | null = null;
  root!: Root; // This will be created after init is called.
  openPopouts: BrowserPopout[] = [];
  selectedItem: AbstractContentItem | null = null;
  isSubWindow = false;
  eventHub = new EventHub(this);
  config: Config;
  container: JQuery<HTMLElement>;
  private _originalContainer: JQuery<HTMLElement> | HTMLElement | undefined;
  dropTargetIndicator: DropTargetIndicator | null = null;
  tabDropPlaceholder = $('<div class="lm_drop_tab_placeholder"></div>');

  private _typeToItem: {
    [type: string]: new (...args: any[]) => AbstractContentItem;
  };

  constructor(
    config: Config,
    container: JQuery<HTMLElement> | HTMLElement | undefined
  ) {
    super();

    this._onResize = this._onResize.bind(this);
    this._onUnload = this._onUnload.bind(this);
    this._windowBlur = this._windowBlur.bind(this);
    this._windowFocus = this._windowFocus.bind(this);

    this.config = this._createConfig(config);
    this._originalContainer = container;
    this.container = this._getContainer();

    if (this.isSubWindow) {
      $('body').css('visibility', 'hidden');
    }

    this._typeToItem = {
      column: RowOrColumn.bind(this, true),
      row: RowOrColumn.bind(this, false),
      stack: Stack,
      component: Component,
    };
  }

  /**
   * Register a component with the layout manager. If a configuration node
   * of type component is reached it will look up componentName and create the
   * associated component
   *
   *  {
   *		type: "component",
   *		componentName: "EquityNewsFeed",
   *		componentState: { "feedTopic": "us-bluechips" }
   *  }
   *
   * @param name
   * @param constructor
   * @returns cleanup function to deregister component
   */
  registerComponent(
    name: string,
    constructor:
      | ComponentConstructor
      | React.Component
      | React.ForwardRefExoticComponent<any>
  ) {
    if (
      typeof constructor !== 'function' &&
      (constructor == null ||
        constructor.render == null ||
        typeof constructor.render !== 'function')
    ) {
      throw new Error('Please register a constructor function');
    }

    if (this._components[name] !== undefined) {
      throw new Error('Component ' + name + ' is already registered');
    }

    this._components[name] = constructor;

    const cleanup = () => {
      if (this._components[name] === undefined) {
        throw new Error('Component ' + name + ' is not registered');
      }

      delete this._components[name];
    };

    return cleanup;
  }

  /**
   * Set a fallback component to be rendered in place of unregistered components
   * @param constructor
   */
  setFallbackComponent(
    constructor: ComponentConstructor | React.ForwardRefExoticComponent<any>
  ) {
    this._fallbackComponent = constructor;
  }

  /**
   * Creates a layout configuration object based on the the current state
   * @param root
   * @returns GoldenLayout configuration
   */
  toConfig(root?: AbstractContentItem) {
    if (this.isInitialised === false) {
      throw new Error("Can't create config, layout not yet initialised");
    }

    if (root && !(root instanceof AbstractContentItem)) {
      throw new Error('Root must be a ContentItem');
    }

    /*
     * settings & labels
     */
    const config: Config = {
      settings: { ...this.config.settings },
      dimensions: { ...this.config.dimensions },
      labels: { ...this.config.labels },
      content: [],
    };

    /*
     * Content
     */
    const next = function (
      configNode: ComponentConfig & { [key: string]: unknown },
      item: AbstractContentItem & {
        config: Record<string, unknown>;
      }
    ) {
      for (let key in item.config) {
        if (key !== 'content') {
          configNode[key] = item.config[key];
        }
      }

      if (configNode.componentName === 'lm-react-component') {
        // We change the type in `createContentItem`, so change it back here
        configNode.type = 'react-component';
      }

      if (item.contentItems.length) {
        configNode.content = [];

        for (let i = 0; i < item.contentItems.length; i++) {
          configNode.content[i] = {} as ItemConfigType;
          next(
            configNode.content[i] as ComponentConfig & Record<string, unknown>,
            item.contentItems[i] as AbstractContentItem & {
              config: Record<string, unknown>;
            }
          );
        }
      }
    };

    if (root) {
      next(
        (config as unknown) as ComponentConfig & Record<string, unknown>,
        { contentItems: [root] } as AbstractContentItem & {
          config: Record<string, unknown>;
        }
      );
    } else {
      next(
        (config as unknown) as ComponentConfig & Record<string, unknown>,
        (this.root as unknown) as AbstractContentItem & {
          config: Record<string, unknown>;
        }
      );
    }

    /*
     * Retrieve config for subwindows
     */
    this._$reconcilePopoutWindows();
    config.openPopouts = [];
    for (let i = 0; i < this.openPopouts.length; i++) {
      config.openPopouts.push(this.openPopouts[i].toConfig());
    }

    /*
     * Add maximised item
     */
    config.maximisedItemId = this._maximisedItem ? '__glMaximised' : undefined;
    return config;
  }

  /**
   * Returns a previously registered component
   * @param name The name used
   */
  getComponent(name: string) {
    return this._components[name];
  }

  /**
   * Returns a fallback component to render in place of unregistered components
   *
   * @public
   *
   * @returns {Function}
   */
  getFallbackComponent() {
    return this._fallbackComponent;
  }

  /**
   * Creates the actual layout. Must be called after all initial components
   * are registered. Recurses through the configuration and sets up
   * the item tree.
   *
   * If called before the document is ready it adds itself as a listener
   * to the document.ready event
   */
  init() {
    /**
     * Create the popout windows straight away. If popouts are blocked
     * an error is thrown on the same 'thread' rather than a timeout and can
     * be caught. This also prevents any further initilisation from taking place.
     */
    if (this._subWindowsCreated === false) {
      this._createSubWindows();
      this._subWindowsCreated = true;
    }

    /**
     * If the document isn't ready yet, wait for it.
     */
    if (document.readyState === 'loading' || document.body === null) {
      $(document).ready(this.init.bind(this));
      return;
    }

    /**
     * If this is a subwindow, wait a few milliseconds for the original
     * page's js calls to be executed, then replace the bodies content
     * with GoldenLayout
     */
    if (this.isSubWindow === true && this._creationTimeoutPassed === false) {
      setTimeout(this.init.bind(this), 7);
      this._creationTimeoutPassed = true;
      return;
    }

    if (this.isSubWindow === true) {
      this._adjustToWindowMode();
    }

    this._setContainer();
    this.dropTargetIndicator = new DropTargetIndicator();
    this.updateSize();
    this._create(this.config);
    this._bindEvents();
    this.isInitialised = true;
    this._adjustColumnsResponsive();
    this.emit('initialised');
  }

  /**
   * Adds a react child to the layout manager
   * @param id Unique panel id
   * @param element The React element
   */
  addReactChild(id: string, element: React.ReactNode) {
    this._reactChildMap.set(id, element);
    this._reactChildren = [...this._reactChildMap.values()];
    this.emit('reactChildrenChanged');
  }

  /**
   * Removes a react child from the layout manager
   * Only removes if the elements for the panelId has not been replaced by a different element
   * @param id Unique panel id
   * @param element The React element
   */
  removeReactChild(id: string, element: React.ReactNode) {
    const mapElem = this._reactChildMap.get(id);
    if (mapElem === element) {
      // If an element was replaced it may be destroyed after the other is created
      // In that case, the new element would be removed
      // Make sure the element being removed is the current element associated with its id
      this._reactChildMap.delete(id);
      this._reactChildren = [...this._reactChildMap.values()];
      this.emit('reactChildrenChanged');
    }
  }

  /**
   * Gets the react children in the layout
   *
   * Used in @deephaven/dashboard to mount the react elements
   * inside the app's React tree
   *
   * @returns The react children to mount for this layout manager
   */
  getReactChildren() {
    return this._reactChildren;
  }

  /**
   * Updates the layout managers size
   * @param width width in pixels
   * @param height height in pixels
   */
  updateSize(width?: number, height?: number) {
    this.width = width ?? this.container.width() ?? 0;
    this.height = height ?? this.container.height() ?? 0;

    if (this.isInitialised === true) {
      this.root.callDownwards('setSize', [this.width, this.height]);

      if (this._maximisedItem) {
        this._maximisedItem.element.width(this.container.width() ?? 0);
        this._maximisedItem.element.height(this.container.height() ?? 0);
        this._maximisedItem.callDownwards('setSize');
      }

      this._adjustColumnsResponsive();
    }
  }

  /**
   * Destroys the LayoutManager instance itself as well as every ContentItem
   * within it. After this is called nothing should be left of the LayoutManager.
   */
  destroy() {
    if (this.isInitialised === false || !this.root) {
      return;
    }
    this._onUnload();
    $(window).off('resize', this._onResize);
    $(window).off('unload beforeunload', this._onUnload);
    $(window).off('blur.lm').off('focus.lm');
    this.root.callDownwards('_$destroy', [], true);
    this.root.contentItems = [];
    this.tabDropPlaceholder.remove();
    this.dropTargetIndicator?.destroy();
    this.eventHub.destroy();

    this._dragSources.forEach(function (dragSource) {
      dragSource._dragListener.destroy();
    });
    this._dragSources = [];
  }

  /**
   * Recursively creates new item tree structures based on a provided
   * ItemConfiguration object
   *
   * @public
   * @param config ItemConfig
   * @param parent The item the newly created item should be a child of
   *
   * @returns Created item
   */
  createContentItem(
    config: Partial<ComponentConfig> & { type: ItemConfig['type'] },
    parent?: AbstractContentItem
  ) {
    var typeErrorMsg, contentItem;

    if (typeof config.type !== 'string') {
      throw new ConfigurationError("Missing parameter 'type'", config);
    }

    if (config.type === 'react-component') {
      config.type = 'component';
      config.componentName = 'lm-react-component';
    }

    if (!this._typeToItem[config.type]) {
      typeErrorMsg =
        "Unknown type '" +
        config.type +
        "'. " +
        'Valid types are ' +
        Object.keys(this._typeToItem).join(',');

      throw new ConfigurationError(typeErrorMsg);
    }

    /**
     * We add an additional stack around every component that's not within a stack anyways.
     */
    if (
      // If this is a component
      config.type === 'component' &&
      // and it's not already within a stack
      !(parent instanceof Stack) &&
      // and we have a parent
      !!parent &&
      // and it's not the topmost item in a new window
      !(this.isSubWindow === true && parent instanceof Root)
    ) {
      config = {
        type: 'stack',
        width: config.width,
        height: config.height,
        content: [config],
      };
    }

    contentItem = new this._typeToItem[config.type](this, config, parent);
    return contentItem;
  }

  /**
	 * Creates a popout window with the specified content and dimensions
	 *
	 * @param configOrContentItem
	 * @param dimensions A map with width, height, left and top
	 * @param parentId the id of the element this item will be appended to
	 *                             when popIn is called
	 * @param indexInParent The position of this item within its parent element

	 * @returns Created popout
	 */
  createPopout(
    configOrContentItem:
      | ItemConfigType
      | AbstractContentItem
      | ItemConfigType[],
    dimensions?: { width: number; height: number; left: number; top: number },
    parentId?: string,
    indexInParent?: number
  ): BrowserPopout | undefined {
    let config = configOrContentItem;
    let configArray: ItemConfigType[] = [];
    const isItem = configOrContentItem instanceof AbstractContentItem;
    const self = this;

    if (isItem) {
      configArray = this.toConfig(configOrContentItem).content;
      parentId = getUniqueId();

      /**
       * If the item is the only component within a stack or for some
       * other reason the only child of its parent the parent will be destroyed
       * when the child is removed.
       *
       * In order to support this we move up the tree until we find something
       * that will remain after the item is being popped out
       */
      let parent = configOrContentItem.parent;
      let child = configOrContentItem;
      while (parent?.contentItems.length === 1 && !parent.isRoot) {
        child = parent;
        parent = parent.parent;
      }

      parent?.addId(parentId);
      if (indexInParent == undefined || Number.isNaN(indexInParent)) {
        indexInParent = parent?.contentItems.indexOf(child);
      }
    } else {
      if (!(configOrContentItem instanceof Array)) {
        configArray = [configOrContentItem];
      } else {
        configArray = configOrContentItem;
      }
    }

    if (!dimensions && isItem) {
      const windowLeft = window.screenX || window.screenLeft;
      const windowTop = window.screenY || window.screenTop;
      const offset = configOrContentItem.element.offset() ?? {
        left: 0,
        top: 0,
      };

      dimensions = {
        left: windowLeft + offset.left,
        top: windowTop + offset.top,
        width: configOrContentItem.element.width() ?? 0,
        height: configOrContentItem.element.height() ?? 0,
      };
    }

    if (!dimensions && !isItem) {
      dimensions = {
        left: window.screenX || window.screenLeft + 20,
        top: window.screenY || window.screenTop + 20,
        width: 500,
        height: 309,
      };
    }

    if (isItem) {
      configOrContentItem.remove();
    }

    if (!dimensions || !parentId || indexInParent === undefined) {
      return;
    }

    const browserPopout = new BrowserPopout(
      configArray,
      dimensions,
      parentId,
      indexInParent,
      this
    );

    browserPopout.on('initialised', function () {
      self.emit('windowOpened', browserPopout);
    });

    browserPopout.on('closed', function () {
      self._$reconcilePopoutWindows();
    });

    this.openPopouts.push(browserPopout);

    return browserPopout;
  }

  /**
   * Attaches DragListener to any given DOM element
   * and turns it into a way of creating new ContentItems
   * by 'dragging' the DOM element into the layout
   *
   * @param element
   * @param itemConfig for the new item to be created, or a function which will provide it
   */
  createDragSource(
    element: JQuery<HTMLElement>,
    itemConfig: ComponentConfig | (() => ComponentConfig)
  ) {
    this.config.settings.constrainDragToContainer = false;
    var dragSource = new DragSource(element, itemConfig, this);
    this._dragSources.push(dragSource);

    return dragSource;
  }

  /**
   * Create a new item in a dragging state, given a starting mouse event to act as the initial position
   *
   * @param itemConfig for the new item to be created, or a function which will provide it
   * @param event used as the starting position for the dragProxy
   */
  createDragSourceFromEvent(
    itemConfig: ItemConfig | (() => ItemConfig),
    event: DragSourceEvent
  ) {
    this.config.settings.constrainDragToContainer = false;
    return new DragSourceFromEvent(itemConfig, this, event);
  }

  /**
   * Programmatically selects an item. This deselects
   * the currently selected item, selects the specified item
   * and emits a selectionChanged event
   *
   * @param item
   * @param _$silent Wheather to notify the item of its selection
   */
  selectItem(item: AbstractContentItem, _$silent?: boolean) {
    if (this.config.settings.selectionEnabled !== true) {
      throw new Error(
        'Please set selectionEnabled to true to use this feature'
      );
    }

    if (item === this.selectedItem) {
      return;
    }

    if (this.selectedItem !== null) {
      this.selectedItem.deselect();
    }

    if (item && _$silent !== true) {
      item.select();
    }

    this.selectedItem = item;

    this.emit('selectionChanged', item);
  }

  /*************************
   * PACKAGE PRIVATE
   *************************/
  _$maximiseItem(contentItem: AbstractContentItem) {
    if (this._maximisedItem !== null) {
      this._$minimiseItem(this._maximisedItem);
    }
    this._maximisedItem = contentItem;
    this._maximisedItem.addId('__glMaximised');
    contentItem.element.addClass('lm_maximised');
    contentItem.element.after(this._maximisePlaceholder);
    this.root.element.prepend(contentItem.element);
    contentItem.element.width(this.container.width() ?? 0);
    contentItem.element.height(this.container.height() ?? 0);
    contentItem.callDownwards('setSize');
    this._maximisedItem.emit('maximised');
    this.emit('stateChanged');
  }

  _$minimiseItem(contentItem: AbstractContentItem) {
    contentItem.element.removeClass('lm_maximised');
    contentItem.removeId('__glMaximised');
    this._maximisePlaceholder.after(contentItem.element);
    this._maximisePlaceholder.remove();
    contentItem.parent?.callDownwards('setSize');
    this._maximisedItem = null;
    contentItem.emit('minimised');
    this.emit('stateChanged');
  }

  /**
   * This method is used to get around sandboxed iframe restrictions.
   * If 'allow-top-navigation' is not specified in the iframe's 'sandbox' attribute
   * (as is the case with codepens) the parent window is forbidden from calling certain
   * methods on the child, such as window.close() or setting document.location.href.
   *
   * This prevented GoldenLayout popouts from popping in in codepens. The fix is to call
   * _$closeWindow on the child window's gl instance which (after a timeout to disconnect
   * the invoking method from the close call) closes itself.
   */
  _$closeWindow() {
    window.setTimeout(function () {
      window.close();
    }, 1);
  }

  _$getArea(x: number, y: number) {
    let smallestSurface = Infinity;
    let mathingArea: ItemArea | null = null;

    for (let i = 0; i < this._itemAreas.length; i++) {
      const area = this._itemAreas[i];

      if (
        x > area.x1 &&
        x < area.x2 &&
        y > area.y1 &&
        y < area.y2 &&
        smallestSurface > area.surface
      ) {
        smallestSurface = area.surface;
        mathingArea = area;
      }
    }

    return mathingArea;
  }

  /**
   * Creates the drop zones at the edges of the screen
   */
  _$createRootItemAreas() {
    const areaSize = 50;
    const rootArea = { ...this.root._$getArea() };

    const areas = [
      {
        ...rootArea,
        side: 'left' as const,
        x2: rootArea.x1 + areaSize,
      },
      {
        ...rootArea,
        side: 'right' as const,
        x1: rootArea.x2 - areaSize,
      },
      {
        ...rootArea,
        side: 'top' as const,
        y2: rootArea.y1 + areaSize,
      },
      {
        ...rootArea,
        side: 'bottom' as const,
        y1: rootArea.y2 - areaSize,
      },
    ];

    areas.forEach(area => {
      area.surface = (area.x2 - area.x1) * (area.y2 - area.y1);
    });

    this._itemAreas.push(...areas);
  }

  _$calculateItemAreas() {
    const allContentItems = this._getAllContentItems();
    this._itemAreas = [];

    /**
     * If the last item is dragged out, highlight the entire container size to
     * allow to re-drop it. allContentItems[ 0 ] === this.root at this point
     *
     * Don't include root into the possible drop areas though otherwise since it
     * will used for every gap in the layout, e.g. splitters
     */
    if (allContentItems.length === 1) {
      this._itemAreas.push(this.root._$getArea());
      return;
    }
    this._$createRootItemAreas();

    for (let i = 0; i < allContentItems.length; i++) {
      const item = allContentItems[i];
      if (!isStack(item)) {
        continue;
      }

      const area = item._$getArea();

      if (area === null) {
        continue;
      } else if (area instanceof Array) {
        this._itemAreas = this._itemAreas.concat(area);
      } else {
        this._itemAreas.push(area);
        let header = {
          ...area,
          ...area.contentItem._contentAreaDimensions?.header.highlightArea,
        };
        header.surface = (header.x2 - header.x1) * (header.y2 - header.y1);
        this._itemAreas.push(header);
      }
    }
  }

  /**
   * Takes a contentItem or a configuration and optionally a parent
   * item and returns an initialised instance of the contentItem.
   * If the contentItem is a function, it is first called
   *
   * @param contentItemOrConfig
   * @param parent Only necessary when passing in config
   */
  _$normalizeContentItem(
    contentItemOrConfig:
      | { type: ItemConfig['type'] }
      | ItemConfigType
      | AbstractContentItem
      | (() => AbstractContentItem),
    parent?: AbstractContentItem
  ) {
    if (!contentItemOrConfig) {
      throw new Error('No content item defined');
    }

    if (typeof contentItemOrConfig === 'function') {
      contentItemOrConfig = contentItemOrConfig();
    }

    if (contentItemOrConfig instanceof AbstractContentItem) {
      return contentItemOrConfig;
    }

    if ($.isPlainObject(contentItemOrConfig) && contentItemOrConfig.type) {
      var newContentItem = this.createContentItem(contentItemOrConfig, parent);
      newContentItem.callDownwards('_$init');
      return newContentItem;
    } else {
      throw new Error('Invalid contentItem');
    }
  }

  /**
   * Iterates through the array of open popout windows and removes the ones
   * that are effectively closed. This is necessary due to the lack of reliably
   * listening for window.close / unload events in a cross browser compatible fashion.
   */
  _$reconcilePopoutWindows() {
    const openPopouts: BrowserPopout[] = [];

    for (let i = 0; i < this.openPopouts.length; i++) {
      if (this.openPopouts[i].getWindow()?.closed === false) {
        openPopouts.push(this.openPopouts[i]);
      } else {
        this.emit('windowClosed', this.openPopouts[i]);
      }
    }

    if (this.openPopouts.length !== openPopouts.length) {
      this.emit('stateChanged');
      this.openPopouts = openPopouts;
    }
  }

  /***************************
   * PRIVATE
   ***************************/
  /**
   * Returns a flattened array of all content items,
   * regardles of level or type
   * @return Flattened array of content items
   */
  _getAllContentItems() {
    const allContentItems: AbstractContentItem[] = [];

    const addChildren = (contentItem: AbstractContentItem) => {
      allContentItems.push(contentItem);

      if (contentItem.contentItems instanceof Array) {
        for (let i = 0; i < contentItem.contentItems.length; i++) {
          addChildren(contentItem.contentItems[i]);
        }
      }
    };

    addChildren(this.root);

    return allContentItems;
  }

  /**
   * Binds to DOM/BOM events on init
   */
  _bindEvents() {
    if (this._isFullPage) {
      $(window).resize(this._onResize);
    }
    $(window)
      .on('unload beforeunload', this._onUnload)
      .on('blur.lm', this._windowBlur)
      .on('focus.lm', this._windowFocus);
  }

  /**
   * Handles setting a class based on window focus, useful for focus indicators
   */
  _windowBlur() {
    this.root.element.addClass('lm_window_blur');
  }

  _windowFocus() {
    this.root.element.removeClass('lm_window_blur');
  }

  /**
   * Debounces resize events
   */
  _onResize() {
    clearTimeout(this._resizeTimeoutId);
    this._resizeTimeoutId = window.setTimeout(this.updateSize.bind(this), 100);
  }

  /**
   * Extends the default config with the user specific settings and applies
   * derivations. Please note that there's a seperate method (AbstractContentItem._extendItemNode)
   * that deals with the extension of item configs
   *
   * @param config
   * @returns config
   */
  _createConfig(config: Config): Config {
    var windowConfigKey = getQueryStringParam('gl-window');

    if (windowConfigKey) {
      this.isSubWindow = true;
      config = JSON.parse(localStorage.getItem(windowConfigKey) || '{}');
      config = unminifyConfig(config);
      localStorage.removeItem(windowConfigKey);
    }

    config = $.extend(true, {}, defaultConfig, config);

    var nextNode = function (node: Record<string, unknown>) {
      for (var key in node) {
        const value = node[key];
        if (key !== 'props' && typeof value === 'object' && value != null) {
          nextNode(value as Record<string, unknown>);
        } else if (key === 'type' && value === 'react-component') {
          node.type = 'component';
          node.componentName = 'lm-react-component';
        }
      }
    };

    nextNode(config);

    if (config.settings?.hasHeaders === false) {
      config.dimensions.headerHeight = 0;
    }

    return config;
  }

  /**
   * This is executed when GoldenLayout detects that it is run
   * within a previously opened popout window.
   */
  _adjustToWindowMode() {
    var popInButton = $(
      '<div class="lm_popin" title="' +
        this.config.labels.popin +
        '">' +
        '<div class="lm_icon"></div>' +
        '<div class="lm_bg"></div>' +
        '</div>'
    );

    popInButton.click(() => {
      this.emit('popIn');
    });

    document.title = stripTags(this.config.content[0].title ?? '');

    $('head').append($('body link, body style, template, .gl_keep'));

    this.container = $('body')
      .html('')
      .css('visibility', 'visible')
      .append(popInButton);

    /*
     * This seems a bit pointless, but actually causes a reflow/re-evaluation getting around
     * slickgrid's "Cannot find stylesheet." bug in chrome
     */
    var x = document.body.offsetHeight; // jshint ignore:line

    /*
     * Expose this instance on the window object
     * to allow the opening window to interact with
     * it
     */
    (window as Window &
      typeof globalThis & { __glInstance: LayoutManager }).__glInstance = this;
  }

  /**
   * Creates Subwindows (if there are any). Throws an error
   * if popouts are blocked.
   */
  _createSubWindows() {
    if (!this.config.openPopouts) {
      return;
    }

    for (let i = 0; i < this.config.openPopouts.length; i++) {
      const popout = this.config.openPopouts[i];

      this.createPopout(
        popout.content,
        popout.dimensions,
        popout.parentId,
        popout.indexInParent
      );
    }
  }

  _getContainer() {
    const container = this._originalContainer
      ? $(this._originalContainer)
      : $('body');

    if (container.length === 0) {
      throw new Error('GoldenLayout container not found');
    }

    if (container.length > 1) {
      throw new Error('GoldenLayout more than one container element specified');
    }

    return container;
  }

  /**
   * Determines what element the layout will be created in
   */
  _setContainer() {
    const container = this._getContainer();

    if (container[0] === document.body) {
      this._isFullPage = true;

      $('html, body').css({
        height: '100%',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      });
    }

    this.container = container;
  }

  /**
   * Kicks of the initial, recursive creation chain
   *
   * @param config GoldenLayout Config
   */
  _create(config: Config) {
    var errorMsg;

    if (!(config.content instanceof Array)) {
      if (config.content === undefined) {
        errorMsg = "Missing setting 'content' on top level of configuration";
      } else {
        errorMsg = "Configuration parameter 'content' must be an array";
      }

      throw new ConfigurationError(errorMsg, config);
    }

    if (config.content.length > 1) {
      errorMsg = "Top level content can't contain more then one element.";
      throw new ConfigurationError(errorMsg, config);
    }

    this.root = new Root(this, { content: config.content }, this.container);
    this.root.callDownwards('_$init');

    if (config.maximisedItemId === '__glMaximised') {
      this.root.getItemsById(config.maximisedItemId)[0].toggleMaximise();
    }
  }

  /**
   * Called when the window is closed or the user navigates away
   * from the page
   */
  _onUnload() {
    if (this.config.settings.closePopoutsOnUnload === true) {
      for (var i = 0; i < this.openPopouts.length; i++) {
        this.openPopouts[i].close();
      }
    }
  }

  /**
   * Adjusts the number of columns to be lower to fit the screen and still maintain minItemWidth.
   */
  _adjustColumnsResponsive() {
    // If there is no min width set, or not content items, do nothing.
    if (
      !this._useResponsiveLayout() ||
      this._updatingColumnsResponsive ||
      !this.config.dimensions ||
      !this.config.dimensions.minItemWidth ||
      this.root.contentItems.length === 0 ||
      !this.root.contentItems[0].isRow
    ) {
      this._firstLoad = false;
      return;
    }

    this._firstLoad = false;

    // If there is only one column, do nothing.
    var columnCount = this.root.contentItems[0].contentItems.length;
    if (columnCount <= 1) {
      return;
    }

    // If they all still fit, do nothing.
    var minItemWidth = this.config.dimensions.minItemWidth;
    var totalMinWidth = columnCount * minItemWidth;
    if (this.width == null || totalMinWidth <= this.width) {
      return;
    }

    // Prevent updates while it is already happening.
    this._updatingColumnsResponsive = true;

    // Figure out how many columns to stack, and put them all in the first stack container.
    var finalColumnCount = Math.max(Math.floor(this.width / minItemWidth), 1);
    var stackColumnCount = columnCount - finalColumnCount;

    var rootContentItem = this.root.contentItems[0];
    var firstStackContainer = this._findAllStackContainers()[0];
    for (var i = 0; i < stackColumnCount; i++) {
      // Stack from right.
      var column =
        rootContentItem.contentItems[rootContentItem.contentItems.length - 1];
      this._addChildContentItemsToContainer(firstStackContainer, column);
    }

    this._updatingColumnsResponsive = false;
  }

  /**
   * Determines if responsive layout should be used.
   *
   * @returns True if responsive layout should be used; otherwise false.
   */
  _useResponsiveLayout() {
    return (
      this.config.settings &&
      (this.config.settings.responsiveMode == 'always' ||
        (this.config.settings.responsiveMode == 'onload' && this._firstLoad))
    );
  }

  /**
   * Adds all children of a node to another container recursively.
   * @param container - Container to add child content items to.
   * @param node - Node to search for content items.
   */
  _addChildContentItemsToContainer(
    container: AbstractContentItem,
    node: AbstractContentItem
  ) {
    if (node.type === 'stack') {
      node.contentItems.forEach(function (item) {
        container.addChild(item);
        node.removeChild(item, true);
      });
    } else {
      node.contentItems.forEach(item => {
        this._addChildContentItemsToContainer(container, item);
      });
    }
  }

  /**
   * Finds all the stack containers.
   * @returns The found stack containers.
   */
  _findAllStackContainers() {
    const stackContainers: Stack[] = [];
    this._findAllStackContainersRecursive(stackContainers, this.root);

    return stackContainers;
  }

  /**
   * Finds all the stack containers.
   *
   * @param stackContainers Set of containers to populate.
   * @param node Current node to process.
   */
  _findAllStackContainersRecursive(
    stackContainers: Stack[],
    node: AbstractContentItem
  ) {
    node.contentItems.forEach(item => {
      if (isStack(item)) {
        stackContainers.push(item);
      } else if (!item.isComponent) {
        this._findAllStackContainersRecursive(stackContainers, item);
      }
    });
  }
}

export default LayoutManager;
