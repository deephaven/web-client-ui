import $ from 'jquery';
import type { ItemConfigType } from '../config/ItemConfig.js';
import type LayoutManager from '../LayoutManager.js';
import DragListener from '../utils/DragListener.js';
import utils from '../utils/index.js';
import DragProxy from './DragProxy.js';

/**
 * Creates a drag item given a starting mouseevent
 * that can then be dragged into the Layout
 *
 * @param {Object} itemConfig the configuration for the contentItem that will be created
 * @param {LayoutManager} layoutManager
 * @param {MouseEvent} event used to get the starting position
 */
export default class DragSourceFromEvent {
  private _element? = window; // we need something to listen for mousemoves against
  private _itemConfig?: ItemConfigType | (() => ItemConfigType);
  private _layoutManager?: LayoutManager;
  private _dragListener?: DragListener;

  constructor(
    itemConfig: ItemConfigType | (() => ItemConfigType),
    layoutManager: LayoutManager,
    event: MouseEvent
  ) {
    this._itemConfig = itemConfig;
    this._layoutManager = layoutManager;

    this._createDragListener(event);
  }

  /**
   * Called initially and after every drag
   */
  _createDragListener(event: MouseEvent) {
    if (this._dragListener) {
      this._dragListener.destroy();
    }

    if (!this._element) {
      return;
    }

    this._dragListener = new DragListener(this._element, true);
    this._dragListener.on('dragStart', this._onDragStart, this);
    this._dragListener.on('dragStop', this._destroy, this);

    // manaully pass in an event as mousedow, that already happened to start the dragListener
    this._dragListener.onMouseDown(event);
    this._dragListener._startDrag();
  }

  _destroy() {
    this._dragListener = undefined;
    this._element = undefined;
    this._itemConfig = undefined;
    this._layoutManager = undefined;
  }

  /**
   * Callback for the DragListener's dragStart event
   *
   * @param x the x position of the mouse on dragStart
   * @param y the x position of the mouse on dragStart
   */
  _onDragStart(x: number, y: number) {
    if (!this._dragListener || !this._layoutManager) {
      return;
    }

    var itemConfig = this._itemConfig;
    if (typeof itemConfig === 'function') {
      itemConfig = itemConfig();
    }
    var contentItem = this._layoutManager._$normalizeContentItem(
      $.extend(true, {}, itemConfig)
    );
    new DragProxy(
      x,
      y,
      this._dragListener,
      this._layoutManager,
      contentItem,
      null
    );
  }
}
