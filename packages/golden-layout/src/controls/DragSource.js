import $ from 'jquery';
import utils from '../utils/index.js';
import DragProxy from './DragProxy.js';

/**
 * Allows for any DOM item to create a component on drag
 * start tobe dragged into the Layout
 *
 * @param {jQuery element} element
 * @param {Object} itemConfig the configuration for the contentItem that will be created
 * @param {LayoutManager} layoutManager
 *
 * @constructor
 */
const DragSource = function (element, itemConfig, layoutManager) {
  this._element = element;
  this._itemConfig = itemConfig;
  this._layoutManager = layoutManager;
  this._dragListener = null;

  this._createDragListener();
};

utils.copy(DragSource.prototype, {
  /**
   * Called initially and after every drag
   *
   * @returns {void}
   */
  _createDragListener: function () {
    this._dragListener = new utils.DragListener(this._element, true);
    this._dragListener.on('dragStart', this._onDragStart, this);
    this._dragListener.on('dragStop', this._createDragListener, this);
  },

  /**
   * Callback for the DragListener's dragStart event
   *
   * @param   {int} x the x position of the mouse on dragStart
   * @param   {int} y the x position of the mouse on dragStart
   *
   * @returns {void}
   */
  _onDragStart: function (x, y) {
    var itemConfig = this._itemConfig;
    if (utils.isFunction(itemConfig)) {
      itemConfig = itemConfig();
    }
    var contentItem = this._layoutManager._$normalizeContentItem(
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

    this._layoutManager.transitionIndicator.transitionElements(
      this._element,
      dragProxy.element
    );
  },
});

export default DragSource;
