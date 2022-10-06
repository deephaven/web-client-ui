import $ from 'jquery';
import {
  ReactComponentConfig,
  isGLComponentConfig,
  ComponentConfig,
} from '../config/index.js';
import type Tab from '../controls/Tab.js';
import type { AbstractContentItem, Component } from '../items/index.js';
import type LayoutManager from '../LayoutManager.js';
import EventEmitter from '../utils/EventEmitter.js';

export default class ItemContainer<
  C extends ComponentConfig | ReactComponentConfig = ComponentConfig
> extends EventEmitter {
  width?: number;
  height?: number;

  title?: string;

  parent: Component;

  layoutManager: LayoutManager;

  tab?: Tab;

  // This type is to make TS happy and allow ReactComponentConfig passed to container generic
  _config: C & { componentState: Record<string, unknown> };

  isHidden = false;

  _element = $(
    [
      '<div class="lm_item_container">',
      '<div class="lm_content" tabindex="-1"></div>',
      '</div>',
    ].join('')
  );

  _contentElement: JQuery<HTMLElement>;

  constructor(config: C, parent: Component, layoutManager: LayoutManager) {
    super();

    this.title = isGLComponentConfig(config) ? config.componentName : '';
    this.parent = parent;
    this.layoutManager = layoutManager;

    this._config = config as C & { componentState: Record<string, unknown> };

    this._contentElement = this._element.find('.lm_content');
  }

  /**
   * Get the inner DOM element the container's content
   * is intended to live in
   */
  getElement() {
    return this._contentElement;
  }

  /**
   * Hide the container. Notifies the containers content first
   * and then hides the DOM node. If the container is already hidden
   * this should have no effect
   */
  hide() {
    this.emit('hide');
    this.isHidden = true;
    this._element.hide();
  }

  /**
   * Shows a previously hidden container. Notifies the
   * containers content first and then shows the DOM element.
   * If the container is already visible this has no effect.
   */
  show() {
    this.emit('show');
    this.isHidden = false;
    this._element.show();
    // call shown only if the container has a valid size
    if (this.height != 0 || this.width != 0) {
      this.emit('shown');
    }
  }

  /**
   * Set the size from within the container. Traverses up
   * the item tree until it finds a row or column element
   * and resizes its items accordingly.
   *
   * If this container isn't a descendant of a row or column
   * it returns false
   * @todo  Rework!!!
   * @param width The new width in pixel
   * @param height The new height in pixel
   *
   * @returns resizeSuccesful
   */
  setSize(width: number, height: number) {
    let rowOrColumn: AbstractContentItem | null = this.parent;
    let rowOrColumnChild: AbstractContentItem | null = null;

    while (rowOrColumn && !rowOrColumn.isColumn && !rowOrColumn.isRow) {
      rowOrColumnChild = rowOrColumn;
      rowOrColumn = rowOrColumn.parent;

      /**
       * No row or column has been found
       */
      if (rowOrColumn?.isRoot) {
        return false;
      }
    }

    if (!rowOrColumn || !rowOrColumnChild) {
      return false;
    }

    const direction = rowOrColumn.isColumn ? 'height' : 'width';
    const newSize = direction === 'height' ? height : width;

    const totalPixel =
      (this[direction] ?? 0) *
      (1 / ((rowOrColumnChild.config[direction] ?? 0) / 100));
    const percentage = (newSize / totalPixel) * 100;
    const delta =
      ((rowOrColumnChild.config[direction] ?? 0) - percentage) /
      (rowOrColumn.contentItems.length - 1);

    for (let i = 0; i < rowOrColumn.contentItems.length; i++) {
      if (rowOrColumn.contentItems[i] === rowOrColumnChild) {
        rowOrColumn.contentItems[i].config[direction] = percentage;
      } else {
        rowOrColumn.contentItems[i].config[direction] =
          (rowOrColumn.contentItems[i].config[direction] ?? 0) + delta;
      }
    }

    rowOrColumn.callDownwards('setSize');

    return true;
  }

  /**
   * Closes the container if it is closable. Can be called by
   * both the component within at as well as the contentItem containing
   * it. Emits a close event before the container itself is closed.
   */
  close() {
    if (this._config.isClosable) {
      this.emit('close');
      this.parent.close();
    }
  }

  /**
   * Returns the current state object
   *
   * @returns state
   */
  getState() {
    return this._config.componentState;
  }

  /**
   * Merges the provided state into the current one
   *
   * @param state
   */
  extendState(state: string) {
    this.setState($.extend(true, this.getState(), state));
  }

  /**
   * Notifies the layout manager of a stateupdate
   *
   * @param state
   */
  setState(state: Record<string, unknown>) {
    this._config.componentState = state;
    this.parent.emitBubblingEvent('stateChanged');
  }

  /**
   * Set's the components title
   *
   * @param title
   */
  setTitle(title: string) {
    this.parent.setTitle(title);
  }

  /**
   * Set's the containers size. Called by the container's component.
   * To set the size programmatically from within the container please
   * use the public setSize method
   *
   * @param width  in px
   * @param height in px
   */
  _$setSize(width = 0, height = 0) {
    if (width !== this.width || height !== this.height) {
      this.width = width;
      this.height = height;
      var cl = this._contentElement[0];
      var hdelta = cl.offsetWidth - cl.clientWidth;
      var vdelta = cl.offsetHeight - cl.clientHeight;
      this._contentElement
        .width(this.width - hdelta)
        .height(this.height - vdelta);
      this.emit('resize');
    }
  }
}
