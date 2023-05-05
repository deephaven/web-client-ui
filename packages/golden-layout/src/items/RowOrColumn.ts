import $ from 'jquery';
import AbstractContentItem from './AbstractContentItem';
import { animFrame } from '../utils';
import { Splitter } from '../controls';
import type LayoutManager from '../LayoutManager';
import type { ItemConfig, ItemConfigType } from '../config';

export default class RowOrColumn extends AbstractContentItem {
  isRow: boolean;
  isColumn: boolean;
  childElementContainer: JQuery<HTMLElement>;
  parent: AbstractContentItem;

  private _splitter: Splitter[] = [];
  private _splitterSize: number;
  private _splitterGrabSize: number;
  private _isColumn: boolean;
  private _dimension: 'height' | 'width';
  private _splitterPosition: number | null = null;
  private _splitterMinPosition: number | null = null;
  private _splitterMaxPosition: number | null = null;

  constructor(
    isColumn: boolean,
    layoutManager: LayoutManager,
    config: ItemConfigType,
    parent: AbstractContentItem
  ) {
    super(
      layoutManager,
      config,
      parent,
      $('<div class="lm_item lm_' + (isColumn ? 'column' : 'row') + '"></div>')
    );
    this.parent = parent;

    this.isRow = !isColumn;
    this.isColumn = isColumn;

    this.childElementContainer = this.element;
    this._splitterSize = layoutManager.config.dimensions.borderWidth;
    this._splitterGrabSize = layoutManager.config.dimensions.borderGrabWidth;
    this._isColumn = isColumn;
    this._dimension = isColumn ? 'height' : 'width';
    this._splitterPosition = null;
    this._splitterMinPosition = null;
    this._splitterMaxPosition = null;
  }

  /**
   * Add a new contentItem to the Row or Column
   *
   * @param contentItem
   * @param index The position of the new item within the Row or Column.
   *              If no index is provided the item will be added to the end
   * @param _$suspendResize If true the items won't be resized. This will leave the item in
   *                           an inconsistent state and is only intended to be used if multiple
   *                           children need to be added in one go and resize is called afterwards
   */
  addChild(
    contentItem: AbstractContentItem | { type: ItemConfig['type'] },
    index?: number,
    _$suspendResize?: boolean
  ) {
    var newItemSize, itemSize, i, splitterElement;

    contentItem = this.layoutManager._$normalizeContentItem(contentItem, this);

    if (index === undefined) {
      index = this.contentItems.length;
    }

    if (this.contentItems.length > 0) {
      splitterElement = this._createSplitter(Math.max(0, index - 1)).element;

      if (index > 0) {
        this.contentItems[index - 1].element.after(splitterElement);
        splitterElement.after(contentItem.element);
      } else {
        this.contentItems[0].element.before(splitterElement);
        splitterElement.before(contentItem.element);
      }
    } else {
      this.childElementContainer.append(contentItem.element);
    }

    AbstractContentItem.prototype.addChild.call(this, contentItem, index);

    newItemSize = (1 / this.contentItems.length) * 100;

    if (_$suspendResize === true) {
      this.emitBubblingEvent('stateChanged');
      return;
    }

    for (i = 0; i < this.contentItems.length; i++) {
      if (this.contentItems[i] === contentItem) {
        contentItem.config[this._dimension] = newItemSize;
      } else {
        itemSize =
          ((this.contentItems[i].config[this._dimension] ?? 0) *
            (100 - newItemSize)) /
          100;
        this.contentItems[i].config[this._dimension] = itemSize;
      }
    }

    this.callDownwards('setSize');
    this.emitBubblingEvent('stateChanged');
  }

  /**
   * Removes a child of this element
   *
   * @param contentItem
   * @param keepChild   If true the child will be removed, but not destroyed
   */
  removeChild(contentItem: AbstractContentItem, keepChild: boolean) {
    var removedItemSize = contentItem.config[this._dimension] ?? 0,
      index = this.contentItems.indexOf(contentItem),
      splitterIndex = Math.max(index - 1, 0),
      i,
      childItem;

    if (index === -1) {
      throw new Error(
        "Can't remove child. ContentItem is not child of this Row or Column"
      );
    }

    /**
     * Remove the splitter before the item or after if the item happens
     * to be the first in the row/column
     */
    if (this._splitter[splitterIndex]) {
      this._splitter[splitterIndex]._$destroy();
      this._splitter.splice(splitterIndex, 1);
    }

    /**
     * Allocate the space that the removed item occupied to the remaining items
     */
    for (i = 0; i < this.contentItems.length; i++) {
      if (this.contentItems[i] !== contentItem) {
        this.contentItems[i].config[this._dimension] =
          (this.contentItems[i].config[this._dimension] ?? 0) +
          removedItemSize / (this.contentItems.length - 1);
      }
    }

    AbstractContentItem.prototype.removeChild.call(
      this,
      contentItem,
      keepChild
    );

    if (this.contentItems.length === 1 && this.config.isClosable === true) {
      childItem = this.contentItems[0];
      this.contentItems = [];
      this.parent.replaceChild(this, childItem, true);
    } else {
      this.callDownwards('setSize');
      this.emitBubblingEvent('stateChanged');
    }
  }

  /**
   * Replaces a child of this Row or Column with another contentItem
   *
   * @param oldChild
   * @param newChild
   */
  replaceChild(oldChild: AbstractContentItem, newChild: AbstractContentItem) {
    var size = oldChild.config[this._dimension];
    super.replaceChild(oldChild, newChild);
    newChild.config[this._dimension] = size;
    this.callDownwards('setSize');
    this.emitBubblingEvent('stateChanged');
  }

  /**
   * Called whenever the dimensions of this item or one of its parents change
   */
  setSize() {
    if (this.contentItems.length > 0) {
      this._calculateRelativeSizes();
      this._setAbsoluteSizes();
    }
    this.emitBubblingEvent('stateChanged');
    this.emit('resize');
  }

  /**
   * Invoked recursively by the layout manager. AbstractContentItem.init appends
   * the contentItem's DOM elements to the container, RowOrColumn init adds splitters
   * in between them
   */
  _$init() {
    if (this.isInitialised === true) return;

    var i;

    AbstractContentItem.prototype._$init.call(this);

    for (i = 0; i < this.contentItems.length - 1; i++) {
      this.contentItems[i].element.after(this._createSplitter(i).element);
    }
  }

  /**
   * Turns the relative sizes calculated by _calculateRelativeSizes into
   * absolute pixel values and applies them to the children's DOM elements
   *
   * Assigns additional pixels to counteract Math.floor
   */
  _setAbsoluteSizes() {
    var i,
      sizeData = this._calculateAbsoluteSizes();

    for (i = 0; i < this.contentItems.length; i++) {
      if (sizeData.additionalPixel - i > 0) {
        sizeData.itemSizes[i]++;
      }

      if (this._isColumn) {
        this.contentItems[i].element.width(sizeData.totalWidth);
        this.contentItems[i].element.height(sizeData.itemSizes[i]);
      } else {
        this.contentItems[i].element.width(sizeData.itemSizes[i]);
        this.contentItems[i].element.height(sizeData.totalHeight);
      }
    }
  }

  /**
   * Calculates the absolute sizes of all of the children of this Item.
   * @returns {object} - Set with absolute sizes and additional pixels.
   */
  _calculateAbsoluteSizes() {
    const totalSplitterSize =
      (this.contentItems.length - 1) * this._splitterSize;
    let totalWidth = this.element.width() ?? 0;
    let totalHeight = this.element.height() ?? 0;
    let totalAssigned = 0;
    const itemSizes: number[] = [];

    if (this._isColumn) {
      totalHeight -= totalSplitterSize;
    } else {
      totalWidth -= totalSplitterSize;
    }

    for (let i = 0; i < this.contentItems.length; i++) {
      const itemSize = this._isColumn
        ? Math.floor(
            totalHeight * ((this.contentItems[i].config.height ?? 0) / 100)
          )
        : Math.floor(
            totalWidth * ((this.contentItems[i].config.width ?? 0) / 100)
          );

      totalAssigned += itemSize;
      itemSizes.push(itemSize);
    }

    const additionalPixel = Math.floor(
      (this._isColumn ? totalHeight : totalWidth) - totalAssigned
    );

    return {
      itemSizes,
      additionalPixel,
      totalWidth,
      totalHeight,
    };
  }

  /**
   * Calculates the relative sizes of all children of this Item. The logic
   * is as follows:
   *
   * - Add up the total size of all items that have a configured size
   *
   * - If the total == 100 (check for floating point errors)
   *        Excellent, job done
   *
   * - If the total is > 100,
   *        set the size of items without set dimensions to 1/3 and add this to the total
   *        set the size off all items so that the total is hundred relative to their original size
   *
   * - If the total is < 100
   *        If there are items without set dimensions, distribute the remainder to 100 evenly between them
   *        If there are no items without set dimensions, increase all items sizes relative to
   *        their original size so that they add up to 100
   */
  _calculateRelativeSizes() {
    let total = 0;
    const itemsWithoutSetDimension: AbstractContentItem[] = [];
    const dimension = this._isColumn ? 'height' : 'width';

    for (let i = 0; i < this.contentItems.length; i++) {
      if (this.contentItems[i].config[dimension] !== undefined) {
        total += this.contentItems[i].config[dimension] ?? 0;
      } else {
        itemsWithoutSetDimension.push(this.contentItems[i]);
      }
    }

    /**
     * Everything adds up to hundred, all good :-)
     */
    if (Math.round(total) === 100) {
      this._respectMinItemWidth();
      return;
    }

    /**
     * Allocate the remaining size to the items without a set dimension
     */
    if (Math.round(total) < 100 && itemsWithoutSetDimension.length > 0) {
      for (let i = 0; i < itemsWithoutSetDimension.length; i++) {
        itemsWithoutSetDimension[i].config[dimension] =
          (100 - total) / itemsWithoutSetDimension.length;
      }
      this._respectMinItemWidth();
      return;
    }

    /**
     * If the total is > 100, but there are also items without a set dimension left, assing 50
     * as their dimension and add it to the total
     *
     * This will be reset in the next step
     */
    if (Math.round(total) > 100) {
      for (let i = 0; i < itemsWithoutSetDimension.length; i++) {
        itemsWithoutSetDimension[i].config[dimension] = 50;
        total += 50;
      }
    }

    /**
     * Set every items size relative to 100 relative to its size to total
     */
    for (let i = 0; i < this.contentItems.length; i++) {
      this.contentItems[i].config[dimension] =
        ((this.contentItems[i].config[dimension] ?? 0) / total) * 100;
    }

    this._respectMinItemWidth();
  }

  /**
   * Adjusts the column widths to respect the dimensions minItemWidth if set.
   */
  _respectMinItemWidth() {
    const minItemWidth = this.layoutManager.config.dimensions
      ? this.layoutManager.config.dimensions.minItemWidth ?? 0
      : 0;
    const entriesOverMin = [];
    let totalOverMin = 0;
    let totalUnderMin = 0;
    let remainingWidth = 0;
    const allEntries = [];
    let entry;

    if (this._isColumn || !minItemWidth || this.contentItems.length <= 1) {
      return;
    }

    const sizeData = this._calculateAbsoluteSizes();

    /**
     * Figure out how much we are under the min item size total and how much room we have to use.
     */
    for (let i = 0; i < this.contentItems.length; i++) {
      const contentItem = this.contentItems[i];
      const itemSize = sizeData.itemSizes[i];

      if (itemSize < minItemWidth) {
        totalUnderMin += minItemWidth - itemSize;
        entry = { width: minItemWidth };
      } else {
        totalOverMin += itemSize - minItemWidth;
        entry = { width: itemSize };
        entriesOverMin.push(entry);
      }

      allEntries.push(entry);
    }

    /**
     * If there is nothing under min, or there is not enough over to make up the difference, do nothing.
     */
    if (totalUnderMin === 0 || totalUnderMin > totalOverMin) {
      return;
    }

    /**
     * Evenly reduce all columns that are over the min item width to make up the difference.
     */
    const reducePercent = totalUnderMin / totalOverMin;
    remainingWidth = totalUnderMin;
    for (let i = 0; i < entriesOverMin.length; i++) {
      entry = entriesOverMin[i];
      const reducedWidth = Math.round(
        (entry.width - minItemWidth) * reducePercent
      );
      remainingWidth -= reducedWidth;
      entry.width -= reducedWidth;
    }

    /**
     * Take anything remaining from the last item.
     */
    if (remainingWidth !== 0) {
      allEntries[allEntries.length - 1].width -= remainingWidth;
    }

    /**
     * Set every items size relative to 100 relative to its size to total
     */
    for (let i = 0; i < this.contentItems.length; i++) {
      this.contentItems[i].config.width =
        (allEntries[i].width / sizeData.totalWidth) * 100;
    }
  }

  /**
   * Instantiates a new lm.controls.Splitter, binds events to it and adds
   * it to the array of splitters at the position specified as the index argument
   *
   * What it doesn't do though is append the splitter to the DOM
   *
   * @param index The position of the splitter
   * @returns The created splitter
   */
  _createSplitter(index: number): Splitter {
    var splitter;
    splitter = new Splitter(
      this._isColumn,
      this._splitterSize,
      this._splitterGrabSize
    );
    splitter.on('drag', this._onSplitterDrag.bind(this, splitter), this);
    splitter.on(
      'dragStop',
      this._onSplitterDragStop.bind(this, splitter),
      this
    );
    splitter.on(
      'dragStart',
      this._onSplitterDragStart.bind(this, splitter),
      this
    );
    this._splitter.splice(index, 0, splitter);
    return splitter;
  }

  /**
   * Locates the instance of lm.controls.Splitter in the array of
   * registered splitters and returns a map containing the contentItem
   * before and after the splitters, both of which are affected if the
   * splitter is moved
   *
   * @param splitter
   *
   * @returns A map of contentItems that the splitter affects
   */
  _getItemsForSplitter(splitter: Splitter) {
    const index = this._splitter.indexOf(splitter);

    if (index < 0) {
      throw new Error('Splitter not found in RowOrColumn');
    }

    return {
      before: this.contentItems[index],
      after: this.contentItems[index + 1],
    };
  }

  /**
   * Gets the minimum dimensions for the given item configuration array
   * @param item
   * @private
   */
  _getMinimumDimensions(arr: { minWidth?: number; minHeight?: number }[]) {
    var minWidth = 0,
      minHeight = 0;

    for (var i = 0; i < arr.length; ++i) {
      minWidth = Math.max(arr[i].minWidth ?? 0, minWidth);
      minHeight = Math.max(arr[i].minHeight ?? 0, minHeight);
    }

    return { horizontal: minWidth, vertical: minHeight };
  }

  /**
   * Invoked when a splitter's dragListener fires dragStart. Calculates the splitters
   * movement area once (so that it doesn't need calculating on every mousemove event)
   *
   * @param splitter
   */
  _onSplitterDragStart(splitter: Splitter) {
    const items = this._getItemsForSplitter(splitter);
    const minSize = this.layoutManager.config.dimensions[
      this._isColumn ? 'minItemHeight' : 'minItemWidth'
    ];

    var beforeMinDim = this._getMinimumDimensions(
      items.before.config.content ?? []
    );
    var beforeMinSize = this._isColumn
      ? beforeMinDim.vertical
      : beforeMinDim.horizontal;

    var afterMinDim = this._getMinimumDimensions(
      items.after.config.content ?? []
    );
    var afterMinSize = this._isColumn
      ? afterMinDim.vertical
      : afterMinDim.horizontal;

    this._splitterPosition = 0;
    this._splitterMinPosition =
      -1 *
      ((items.before.element[this._dimension]() ?? 0) -
        (beforeMinSize || minSize));
    this._splitterMaxPosition =
      (items.after.element[this._dimension]() ?? 0) - (afterMinSize || minSize);
  }

  /**
   * Invoked when a splitter's DragListener fires drag. Updates the splitters DOM position,
   * but not the sizes of the elements the splitter controls in order to minimize resize events
   *
   * @param splitter
   * @param offsetX  Relative pixel values to the splitters original position. Can be negative
   * @param offsetY  Relative pixel values to the splitters original position. Can be negative
   */
  _onSplitterDrag(splitter: Splitter, offsetX: number, offsetY: number) {
    const offset = this._isColumn ? offsetY : offsetX;

    if (
      this._splitterMaxPosition == null ||
      this._splitterMinPosition == null
    ) {
      return;
    }

    if (
      offset > this._splitterMinPosition &&
      offset < this._splitterMaxPosition
    ) {
      this._splitterPosition = offset;
      splitter.element.css(this._isColumn ? 'top' : 'left', offset);
    }
  }

  /**
   * Invoked when a splitter's DragListener fires dragStop. Resets the splitters DOM position,
   * and applies the new sizes to the elements before and after the splitter and their children
   * on the next animation frame
   *
   * @param   {lm.controls.Splitter} splitter
   */
  _onSplitterDragStop(splitter: Splitter) {
    const items = this._getItemsForSplitter(splitter);
    const sizeBefore = items.before.element[this._dimension]() ?? 0;
    const sizeAfter = items.after.element[this._dimension]() ?? 0;
    const splitterPositionInRange =
      ((this._splitterPosition ?? 0) + sizeBefore) / (sizeBefore + sizeAfter);
    const totalRelativeSize =
      (items.before.config[this._dimension] ?? 0) +
      (items.after.config[this._dimension] ?? 0);

    items.before.config[this._dimension] =
      splitterPositionInRange * totalRelativeSize;
    items.after.config[this._dimension] =
      (1 - splitterPositionInRange) * totalRelativeSize;

    splitter.element.css({
      top: 0,
      left: 0,
    });

    animFrame(
      this.callDownwards.bind(this, 'setSize', undefined, undefined, undefined)
    );
  }
}
