import $ from 'jquery';
import type { AbstractContentItem, ItemArea, Stack } from '../items';
import type LayoutManager from '../LayoutManager';
import type { DragListener } from '../utils';
import { stripTags, EventEmitter } from '../utils';

/**
 * This class creates a temporary container
 * for the component whilst it is being dragged
 * and handles drag events
 *
 * @param x The initial x position
 * @param y The initial y position
 * @param dragListener
 * @param layoutManager
 * @param contentItem
 * @param originalParent
 */
export default class DragProxy extends EventEmitter {
  private static _template =
    '<div class="lm_dragProxy">' +
    '<div class="lm_header">' +
    '<ul class="lm_tabs">' +
    '<li class="lm_tab lm_active"><i class="lm_left"></i>' +
    '<span class="lm_title"></span>' +
    '<i class="lm_right"></i></li>' +
    '</ul>' +
    '</div>' +
    '<div class="lm_content"></div>' +
    '</div>';

  private _dragListener: DragListener;
  private _layoutManager: LayoutManager;
  private _contentItem: AbstractContentItem;
  private _originalParent: Stack | null;

  private _area: ItemArea | null = null;
  private _lastValidArea: ItemArea | null = null;

  private _minX: number;
  private _maxX: number;
  private _minY: number;
  private _maxY: number;
  private _width: number;
  private _height: number;
  private _sided?: boolean;

  element: JQuery<HTMLElement>;
  childElementContainer: JQuery<HTMLElement>;
  private _proxyTab: JQuery<HTMLElement>;

  constructor(
    x: number,
    y: number,
    dragListener: DragListener,
    layoutManager: LayoutManager,
    contentItem: AbstractContentItem,
    originalParent: Stack | null
  ) {
    super();

    this._dragListener = dragListener;
    this._layoutManager = layoutManager;
    this._contentItem = contentItem;
    this._originalParent = originalParent;

    this._dragListener.on('drag', this._onDrag, this);
    this._dragListener.on('dragStop', this._onDrop, this);

    // set the inserted drag placeholder to be the size of the tab removed, before its removed
    if (this._contentItem.tab && this._contentItem.tab.element) {
      this._layoutManager.tabDropPlaceholder.width(
        this._contentItem.tab.element.outerWidth(true) ?? 0
      );
      this._layoutManager.tabDropPlaceholder.height(
        this._contentItem.tab.element.outerHeight(true) ?? 0
      );
    }

    this.element = $(DragProxy._template);
    if (originalParent && originalParent._side) {
      this._sided = originalParent._sided;
      this.element.addClass('lm_' + originalParent._side);
      if (['right', 'bottom'].indexOf(originalParent._side.toString()) >= 0)
        this.element.find('.lm_content').after(this.element.find('.lm_header'));
    }
    this.element.css({ left: x, top: y });
    this._proxyTab = this.element.find('.lm_tab');
    this._proxyTab.attr(
      'title',
      stripTags(this._contentItem.config.title ?? '')
    );
    this.element.find('.lm_title').html(this._contentItem.config.title ?? '');
    this.childElementContainer = this.element.find('.lm_content');
    this.childElementContainer.append(contentItem.element);

    this._updateTree();
    this._layoutManager._$calculateItemAreas();

    $(document.body).append(this.element);

    // Need to set dimensions after adding the element, or `Component.setSize()` will not pass the `.is('visible')` test and won't update
    this._setDimensions();

    // there's no content tab to use yet, use the proxy tab size for placeholder sizing, after it's created
    if (!this._contentItem.tab && this._proxyTab.length) {
      this._layoutManager.tabDropPlaceholder.width(
        this._proxyTab.outerWidth(true) ?? 0
      );
      this._layoutManager.tabDropPlaceholder.height(
        this._proxyTab.outerHeight(true) ?? 0
      );
    }

    var offset = this._layoutManager.container.offset();

    this._minX = offset?.left ?? 0;
    this._minY = offset?.top ?? 0;
    this._maxX = (this._layoutManager.container.width() ?? 0) + this._minX;
    this._maxY = (this._layoutManager.container.height() ?? 0) + this._minY;
    this._width = this.element.width() ?? 0;
    this._height = this.element.height() ?? 0;

    this._setDropPosition(x, y);

    this._layoutManager.emit('itemPickedUp', this._contentItem);
  }

  /**
   * Callback on every mouseMove event during a drag. Determines if the drag is
   * still within the valid drag area and calls the layoutManager to highlight the
   * current drop area
   *
   * @param offsetX The difference from the original x position in px
   * @param offsetY The difference from the original y position in px
   * @param event
   */
  _onDrag(offsetX: number, offsetY: number, event: JQuery.TriggeredEvent) {
    const x = event.pageX ?? 0;
    const y = event.pageY ?? 0;
    const isWithinContainer =
      x > this._minX && x < this._maxX && y > this._minY && y < this._maxY;

    if (
      !isWithinContainer &&
      this._layoutManager.config.settings.constrainDragToContainer === true
    ) {
      return;
    }

    this._setDropPosition(x, y);
  }

  /**
   * Sets the target position, highlighting the appropriate area
   *
   * @param x The x position in px
   * @param y The y position in px
   */
  _setDropPosition(x: number, y: number) {
    this.element.css({ left: x, top: y });
    this._area = this._layoutManager._$getArea(x, y);

    if (this._area !== null) {
      this._lastValidArea = this._area;
      this._area.contentItem._$highlightDropZone(x, y, this._area);
    }
  }

  /**
   * Callback when the drag has finished. Determines the drop area
   * and adds the child to it
   */
  _onDrop() {
    this._layoutManager.dropTargetIndicator?.hide();

    /*
     * Valid drop area found
     */
    if (this._area !== null) {
      this._area.contentItem._$onDrop(this._contentItem, this._area);

      /**
       * No valid drop area available at present, but one has been found before.
       * Use it
       */
    } else if (this._lastValidArea !== null) {
      this._lastValidArea.contentItem._$onDrop(
        this._contentItem,
        this._lastValidArea
      );

      /**
       * No valid drop area found during the duration of the drag. Return
       * content item to its original position if a original parent is provided.
       * (Which is not the case if the drag had been initiated by createDragSource)
       */
    } else if (this._originalParent) {
      this._originalParent.addChild(this._contentItem);

      /**
       * The drag didn't ultimately end up with adding the content item to
       * any container. In order to ensure clean up happens, destroy the
       * content item.
       */
    } else {
      this._contentItem._$destroy();
    }

    this._dragListener.off('drag', this._onDrag, this);
    this._dragListener.off('dragStop', this._onDrop, this);

    this.element.remove();

    this._layoutManager.emit('itemDropped', this._contentItem);
  }

  /**
   * Removes the item from its original position within the tree
   */
  _updateTree() {
    /**
     * parent is null if the drag had been initiated by a external drag source
     */
    if (this._contentItem.parent) {
      this._contentItem.parent.removeChild(this._contentItem, true);
    }

    this._contentItem._$setParent(null);
  }

  /**
   * Updates the DragProxy's dimensions
   */
  _setDimensions() {
    const dimensions = this._layoutManager.config.dimensions;
    let width = dimensions.dragProxyWidth;
    let height = dimensions.dragProxyHeight;

    this.element.width(width);
    this.element.height(height);
    width -= this._sided ? dimensions.headerHeight : 0;
    height -= !this._sided ? dimensions.headerHeight : 0;
    this.childElementContainer.width(width);
    this.childElementContainer.height(height);
    this._contentItem.element.width(width);
    this._contentItem.element.height(height);
    this._contentItem.callDownwards('_$show');
    this._contentItem.callDownwards('setSize');
  }
}
