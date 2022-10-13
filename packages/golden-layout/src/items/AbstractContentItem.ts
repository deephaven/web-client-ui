import { animFrame, BubblingEvent, EventEmitter } from '../utils';
import { ConfigurationError } from '../errors';
import { itemDefaultConfig } from '../config';
import type { ItemConfig, ItemConfigType } from '../config';
import type LayoutManager from '../LayoutManager';
import type Tab from '../controls/Tab';
import type Stack from './Stack';
import type Component from './Component';
import type Root from './Root';

export function isStack(item: AbstractContentItem): item is Stack {
  return item.isStack;
}

export function isComponent(item: AbstractContentItem): item is Component {
  return item.isComponent;
}

export function isRoot(item: AbstractContentItem): item is Root {
  return item.isRoot;
}

export type ItemArea<C = AbstractContentItem> = {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  surface: number;
  side: 'left' | 'right' | 'top' | 'bottom' | '';
  contentItem: C;
};

type AbstractItemConfig =
  | ItemConfig
  | {
      type: ItemConfig['type'];
      content: ItemConfigType[];
    };

/**
 * This is the baseclass that all content items inherit from.
 * Most methods provide a subset of what the sub-classes do.
 *
 * It also provides a number of functions for tree traversal
 *
 * @param {lm.LayoutManager} layoutManager
 * @param {item node configuration} config
 * @param {lm.item} parent
 *
 * @event stateChanged
 * @event beforeItemDestroyed
 * @event itemDestroyed
 * @event itemCreated
 * @event componentCreated
 * @event rowCreated
 * @event columnCreated
 * @event stackCreated
 *
 * @constructor
 */
export default abstract class AbstractContentItem extends EventEmitter {
  config: ItemConfig;
  type: string;
  contentItems: AbstractContentItem[];
  parent: AbstractContentItem | null;
  layoutManager: LayoutManager;
  element: JQuery<HTMLElement>;
  childElementContainer?: JQuery<HTMLElement>;
  componentName?: string;

  isInitialised = false;
  isMaximised = false;
  isRoot = false;
  isRow = false;
  isColumn = false;
  isStack = false;
  isComponent = false;

  tab?: Tab;

  private _pendingEventPropagations: Record<string, boolean>;
  private _throttledEvents: string[];

  constructor(
    layoutManager: LayoutManager,
    config: AbstractItemConfig,
    parent: AbstractContentItem | null,
    element: JQuery<HTMLElement>
  ) {
    super();
    this.element = element;

    // Some GL things expect this config to not change
    this.config = this._extendItemNode(config);
    this.type = config.type;
    this.contentItems = [];
    this.parent = parent;

    this.layoutManager = layoutManager;
    this._pendingEventPropagations = {};
    this._throttledEvents = ['stateChanged'];

    this.on(EventEmitter.ALL_EVENT, this._propagateEvent, this);

    if (config.content) {
      this._createContentItems(config);
    }
  }

  /**
   * Set the size of the component and its children, called recursively
   *
   * @abstract
   */
  abstract setSize(width?: number, height?: number): void;

  /**
   * Calls a method recursively downwards on the tree
   *
   * @param functionName the name of the function to be called
   * @param functionArguments optional arguments that are passed to every function
   * @param bottomUp Call methods from bottom to top, defaults to false
   * @param skipSelf Don't invoke the method on the class that calls it, defaults to false
   */
  callDownwards<N extends 'setSize' | '_$destroy' | '_$init' | '_$show'>(
    functionName: N,
    functionArguments = [] as Parameters<AbstractContentItem[N]>,
    bottomUp = false,
    skipSelf = false
  ) {
    if (bottomUp !== true && skipSelf !== true) {
      this[functionName].apply(this, functionArguments);
    }
    for (let i = 0; i < this.contentItems.length; i++) {
      this.contentItems[i].callDownwards(
        functionName,
        functionArguments,
        bottomUp
      );
    }
    if (bottomUp === true && skipSelf !== true) {
      this[functionName].apply(this, functionArguments);
    }
  }

  /**
   * Removes a child node (and its children) from the tree
   *
   * @param contentItem
   */
  removeChild(contentItem: AbstractContentItem, keepChild = false) {
    /*
     * Get the position of the item that's to be removed within all content items this node contains
     */
    const index = this.contentItems.indexOf(contentItem);

    /*
     * Make sure the content item to be removed is actually a child of this item
     */
    if (index === -1) {
      throw new Error("Can't remove child item. Unknown content item");
    }

    /**
     * Call ._$destroy on the content item. This also calls ._$destroy on all its children
     */
    if (keepChild !== true) {
      this.contentItems[index]._$destroy();
    }

    /**
     * Remove the content item from this nodes array of children
     */
    this.contentItems.splice(index, 1);

    /**
     * Remove the item from the configuration
     */
    this.config.content?.splice(index, 1);

    /**
     * If this node still contains other content items, adjust their size
     */
    if (this.contentItems.length > 0) {
      this.callDownwards('setSize');

      /**
       * If this was the last content item, remove this node as well
       */
    } else if (this.type !== 'root' && this.config.isClosable) {
      this.parent?.removeChild(this);
    }
  }

  /**
   * Sets up the tree structure for the newly added child
   * The responsibility for the actual DOM manipulations lies
   * with the concrete item
   *
   * @param contentItem
   * @param index If omitted item will be appended
   */
  addChild(
    contentItem:
      | AbstractContentItem
      | ItemConfigType
      | { type: ItemConfig['type'] },
    index?: number
  ) {
    contentItem = this.layoutManager._$normalizeContentItem(contentItem, this);
    if (index === undefined) {
      index = this.contentItems.length;
    }

    this.contentItems.splice(index, 0, contentItem);

    if (this.config.content === undefined) {
      this.config.content = [];
    }

    this.config.content.splice(index, 0, contentItem.config);
    contentItem.parent = this;

    if (
      contentItem.parent.isInitialised === true &&
      contentItem.isInitialised === false
    ) {
      contentItem._$init();
    }
  }

  /**
   * Replaces oldChild with newChild. This used to use jQuery.replaceWith... which for
   * some reason removes all event listeners, so isn't really an option.
   *
   * @param oldChild
   * @param newChild
   */
  replaceChild(
    oldChild: AbstractContentItem,
    newChild: AbstractContentItem,
    _$destroyOldChild = false
  ) {
    newChild = this.layoutManager._$normalizeContentItem(newChild);

    const index = this.contentItems.indexOf(oldChild);
    const parentNode = oldChild.element[0].parentNode;

    if (index === -1) {
      throw new Error("Can't replace child. oldChild is not child of this");
    }

    parentNode?.replaceChild(newChild.element[0], oldChild.element[0]);

    /*
     * Optionally destroy the old content item
     */
    if (_$destroyOldChild === true) {
      oldChild.parent = null;
      oldChild._$destroy();
    }

    /*
     * Wire the new contentItem into the tree
     */
    this.contentItems[index] = newChild;
    newChild.parent = this;

    /*
     * Update tab reference
     */
    if (isStack(this)) {
      this.header.tabs[index].contentItem = newChild;
    }

    //TODO This doesn't update the config... refactor to leave item nodes untouched after creation
    if (
      newChild.parent.isInitialised === true &&
      newChild.isInitialised === false
    ) {
      newChild._$init();
    }

    this.callDownwards('setSize');
  }

  /**
   * Convenience method.
   * Shorthand for this.parent.removeChild( this )
   */
  remove() {
    this.parent?.removeChild(this);
  }

  /**
   * Removes the component from the layout and creates a new
   * browser window with the component and its children inside
   */
  popout() {
    var browserPopout = this.layoutManager.createPopout(this);
    this.emitBubblingEvent('stateChanged');
    return browserPopout;
  }

  /**
   * Maximises the Item or minimises it if it is already maximised
   */
  toggleMaximise(e?: Event) {
    e && e.preventDefault();
    if (this.isMaximised === true) {
      this.layoutManager._$minimiseItem(this);
    } else {
      this.layoutManager._$maximiseItem(this);
    }

    this.isMaximised = !this.isMaximised;
    this.emitBubblingEvent('stateChanged');
  }

  /**
   * Selects the item if it is not already selected
   */
  select() {
    if (this.layoutManager.selectedItem !== this) {
      this.layoutManager.selectItem(this, true);
      this.element.addClass('lm_selected');
    }
  }

  /**
   * De-selects the item if it is selected
   */
  deselect() {
    if (this.layoutManager.selectedItem === this) {
      this.layoutManager.selectedItem = null;
      this.element.removeClass('lm_selected');
    }
  }

  /**
   * Set this component's title
   * @param title
   */
  setTitle(title: string) {
    this.config.title = title;
    this.emit('titleChanged', title);
    this.emitBubblingEvent('stateChanged');
  }

  /**
   * Checks whether a provided id is present
   * @param id
   * @returns isPresent
   */
  hasId(id: string) {
    if (!this.config.id) {
      return false;
    } else if (typeof this.config.id === 'string') {
      return this.config.id === id;
    } else if (this.config.id instanceof Array) {
      return this.config.id.indexOf(id) !== -1;
    }
  }

  /**
   * Adds an id. Adds it as a string if the component doesn't
   * have an id yet or creates/uses an array
   * @param id
   */
  addId(id: string) {
    if (this.hasId(id)) {
      return;
    }

    if (!this.config.id) {
      this.config.id = id;
    } else if (typeof this.config.id === 'string') {
      this.config.id = [this.config.id, id];
    } else if (this.config.id instanceof Array) {
      this.config.id.push(id);
    }
  }

  /**
   * Removes an existing id. Throws an error
   * if the id is not present
   * @param id
   */
  removeId(id: string) {
    if (!this.hasId(id)) {
      throw new Error('Id not found');
    }

    if (typeof this.config.id === 'string') {
      delete this.config.id;
    } else if (this.config.id instanceof Array) {
      var index = this.config.id.indexOf(id);
      this.config.id.splice(index, 1);
    }
  }

  /****************************************
   * SELECTOR
   ****************************************/
  getItemsByFilter(filter: (item: AbstractContentItem) => boolean) {
    const result: AbstractContentItem[] = [];
    const next = function (contentItem: AbstractContentItem) {
      for (let i = 0; i < contentItem.contentItems.length; i++) {
        if (filter(contentItem.contentItems[i]) === true) {
          result.push(contentItem.contentItems[i]);
        }

        next(contentItem.contentItems[i]);
      }
    };

    next(this);
    return result;
  }

  getItemsById(id: string) {
    return this.getItemsByFilter(function (item) {
      if (item.config.id instanceof Array) {
        return item.config.id.indexOf(id) !== -1;
      } else {
        return item.config.id === id;
      }
    });
  }

  getItemsByType(type: string) {
    return this._$getItemsByProperty('type', type);
  }

  getComponentsByName(componentName: string) {
    const components = this._$getItemsByProperty(
      'componentName',
      componentName
    ) as Component[];
    const instances: unknown[] = [];

    for (let i = 0; i < components.length; i++) {
      instances.push(components[i].instance);
    }

    return instances;
  }

  /****************************************
   * PACKAGE PRIVATE
   ****************************************/
  _$getItemsByProperty(key: keyof AbstractContentItem, value: string) {
    return this.getItemsByFilter(function (item) {
      return item[key] === value;
    });
  }

  _$setParent(parent: AbstractContentItem | null) {
    this.parent = parent;
  }

  _$highlightDropZone(x: number, y: number, area: ItemArea) {
    this.layoutManager.dropTargetIndicator?.highlightArea(area);
  }

  _$onDrop(contentItem: AbstractContentItem, area: ItemArea) {
    this.addChild(contentItem);
  }

  _$hide() {
    this._callOnActiveComponents('hide');
    this.element.hide();
    this.layoutManager.updateSize();
  }

  _$show() {
    this._callOnActiveComponents('show');
    this.element.show();
    this.layoutManager.updateSize();
  }

  _callOnActiveComponents(methodName: 'hide' | 'show') {
    const stacks = (this.getItemsByType('stack') as unknown) as Stack[];
    let activeContentItem: AbstractContentItem | null = null;

    for (let i = 0; i < stacks.length; i++) {
      activeContentItem = stacks[i].getActiveContentItem();

      if (activeContentItem && isComponent(activeContentItem)) {
        activeContentItem.container[methodName]();
      }
    }
  }

  /**
   * Destroys this item ands its children
   */
  _$destroy() {
    this.emitBubblingEvent('beforeItemDestroyed');
    this.callDownwards('_$destroy', [], true, true);
    this.element.remove();
    this.emitBubblingEvent('itemDestroyed');
  }

  /**
   * Returns the area the component currently occupies in the format
   *
   * {
   *		x1: int
   *		x2: int
   *		y1: int
   *		y2: int
   *		contentItem: contentItem
   * }
   */
  _$getArea(element?: JQuery<HTMLElement>): ItemArea<this> | null {
    element = element || this.element;

    const offset = element.offset() ?? { left: 0, top: 0 };
    const width = element.width() ?? 0;
    const height = element.height() ?? 0;

    return {
      x1: offset.left,
      y1: offset.top,
      x2: offset.left + width,
      y2: offset.top + height,
      surface: width * height,
      contentItem: this,
      side: '',
    };
  }

  /**
   * The tree of content items is created in two steps: First all content items are instantiated,
   * then init is called recursively from top to bottem. This is the basic init function,
   * it can be used, extended or overwritten by the content items
   *
   * Its behaviour depends on the content item
   */
  _$init() {
    this.setSize();

    for (let i = 0; i < this.contentItems.length; i++) {
      this.childElementContainer?.append(this.contentItems[i].element);
    }

    this.isInitialised = true;
    this.emitBubblingEvent('itemCreated');
    this.emitBubblingEvent(this.type + 'Created');
  }

  /**
   * Emit an event that bubbles up the item tree.
   *
   * @param name The name of the event
   */
  emitBubblingEvent(name: string) {
    var event = new BubblingEvent(name, this);
    this.emit(name, event);
  }

  /**
   * Private method, creates all content items for this node at initialisation time
   * PLEASE NOTE, please see addChild for adding contentItems add runtime
   * @param   {configuration item node} config
   */
  _createContentItems(config: AbstractItemConfig) {
    var oContentItem;

    if (!(config.content instanceof Array)) {
      throw new ConfigurationError('content must be an Array', config);
    }

    for (let i = 0; i < config.content.length; i++) {
      oContentItem = this.layoutManager.createContentItem(
        config.content[i],
        this
      );
      this.contentItems.push(oContentItem);
    }
  }

  /**
   * Extends an item configuration node with default settings
   * @param config
   * @returns extended config
   */
  _extendItemNode(config: AbstractItemConfig) {
    for (let [key, value] of Object.entries(itemDefaultConfig)) {
      // This just appeases TS
      const k = key as keyof AbstractItemConfig;
      if (config[k] === undefined) {
        config[k] = value;
      }
    }

    return config;
  }

  /**
   * Called for every event on the item tree. Decides whether the event is a bubbling
   * event and propagates it to its parent
   *
   * @param name the name of the event
   * @param event
   */
  _propagateEvent(name: string, event: BubblingEvent) {
    if (
      event instanceof BubblingEvent &&
      event.isPropagationStopped === false &&
      this.isInitialised === true
    ) {
      /**
       * In some cases (e.g. if an element is created from a DragSource) it
       * doesn't have a parent and is not below root. If that's the case
       * propagate the bubbling event from the top level of the substree directly
       * to the layoutManager
       */
      if (this.isRoot === false && this.parent) {
        this.parent.emit.apply(this.parent, [name, event]);
      } else {
        this._scheduleEventPropagationToLayoutManager(name, event);
      }
    }
  }

  /**
   * All raw events bubble up to the root element. Some events that
   * are propagated to - and emitted by - the layoutManager however are
   * only string-based, batched and sanitized to make them more usable
   *
   * @param name the name of the event
   */
  _scheduleEventPropagationToLayoutManager(name: string, event: BubblingEvent) {
    if (this._throttledEvents.indexOf(name) === -1) {
      this.layoutManager.emit(name, event.origin);
    } else {
      if (this._pendingEventPropagations[name] !== true) {
        this._pendingEventPropagations[name] = true;
        animFrame(this._propagateEventToLayoutManager.bind(this, name, event));
      }
    }
  }

  /**
   * Callback for events scheduled by _scheduleEventPropagationToLayoutManager
   *
   * @param name the name of the event
   */
  _propagateEventToLayoutManager(name: string, event: BubblingEvent) {
    this._pendingEventPropagations[name] = false;
    this.layoutManager.emit(name, event);
  }
}
