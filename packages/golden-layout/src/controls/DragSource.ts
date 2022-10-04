import $ from 'jquery';
import type { ItemConfigType } from '../config/ItemConfig.js';
import type LayoutManager from '../LayoutManager.js';
import DragListener from '../utils/DragListener.js';
import DragProxy from './DragProxy.js';

/**
 * Allows for any DOM item to create a component on drag
 * start tobe dragged into the Layout
 *
 * @param element
 * @param itemConfig the configuration for the contentItem that will be created
 * @param layoutManager
 */
export default class DragSource {
  _element: HTMLElement;
  _itemConfig: ItemConfigType | (() => ItemConfigType);
  _layoutManager: LayoutManager;
  _dragListener: DragListener;

  constructor(
    element: HTMLElement,
    itemConfig: ItemConfigType | (() => ItemConfigType),
    layoutManager: LayoutManager
  ) {
    this._element = element;
    this._itemConfig = itemConfig;
    this._layoutManager = layoutManager;

    this._dragListener = this._createDragListener(); // This assignment makes TS happy that this is assigned in the constructor and not undefined
  }

  /**
   * Called initially and after every drag
   */
  _createDragListener() {
    this._dragListener = new DragListener(this._element, true);
    this._dragListener.on('dragStart', this._onDragStart, this);
    this._dragListener.on('dragStop', this._createDragListener, this);
    return this._dragListener;
  }

  /**
   * Callback for the DragListener's dragStart event
   *
   * @param x the x position of the mouse on dragStart
   * @param y the x position of the mouse on dragStart
   */
  _onDragStart(x: number, y: number) {
    let itemConfig = this._itemConfig;
    if (typeof itemConfig === 'function') {
      itemConfig = itemConfig();
    }
    const contentItem = this._layoutManager._$normalizeContentItem(
        $.extend(true, {}, itemConfig)
      ),
      dragProxy = new DragProxy(
        x,
        y,
        this._dragListener,
        this._layoutManager,
        contentItem,
        null
      );

    this._layoutManager.transitionIndicator?.transitionElements(
      this._element,
      dragProxy.element[0]
    );
  }
}
