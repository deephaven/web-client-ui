import $ from 'jquery';
import AbstractContentItem from './AbstractContentItem';
import { animFrame } from '../utils';
import { IntersectionSplitter, Splitter } from '../controls';
import type LayoutManager from '../LayoutManager';
import type { ColumnItemConfig, ItemConfig, RowItemConfig } from '../config';

/**
 * A single 2D intersection handle. `parentSplitterIndex` is the "bar" splitter
 * owned by this RowOrColumn; `stemOwner`/`stemSplitterIndex` identify the
 * perpendicular "stem" splitter that crosses it, which may live arbitrarily
 * deep in this item's subtree. `junctionAtNearEdge` records which end of the
 * stem meets the bar.
 */
type IntersectionRecord = {
  splitter: IntersectionSplitter;
  key: string;
  parentSplitterIndex: number;
  stemOwner: RowOrColumn;
  stemSplitterIndex: number;
  junctionAtNearEdge: boolean;
};

export default class RowOrColumn extends AbstractContentItem {
  isRow: boolean;
  isColumn: boolean;
  childElementContainer: JQuery<HTMLElement>;
  parent: AbstractContentItem | null;

  private _splitter: Splitter[] = [];
  private _intersectionSplitter: IntersectionRecord[] = [];
  private _splitterSize: number;
  private _splitterGrabSize: number;
  private _isColumn: boolean;
  private _dimension: 'height' | 'width';
  private _splitterPosition: number | null = null;
  private _splitterMinPosition: number | null = null;
  private _splitterMaxPosition: number | null = null;
  private _isIntersectionDragging = false;

  constructor(
    isColumn: true,
    layoutManager: LayoutManager,
    config: ColumnItemConfig,
    parent: AbstractContentItem | null
  );
  constructor(
    isColumn: false,
    layoutManager: LayoutManager,
    config: RowItemConfig,
    parent: AbstractContentItem | null
  );
  constructor(
    isColumn: boolean,
    layoutManager: LayoutManager,
    config: ColumnItemConfig | RowItemConfig,
    parent: AbstractContentItem | null
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
    contentItem: AbstractContentItem | ItemConfig,
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
      this.parent?.replaceChild(this, childItem, true);
    } else {
      this.callDownwards('setSize');
      this.emitBubblingEvent('stateChanged');
    }
  }

  /**
   * Replaces a child of this Row or Column with another contentItem
   *
   * @param oldChild The old child to replace
   * @param newChild The new child to take the old child's place
   * @param destroyOldChild If the old child should be destroyed or not
   */
  replaceChild(
    oldChild: AbstractContentItem,
    newChild: AbstractContentItem,
    destroyOldChild = false
  ) {
    var size = oldChild.config[this._dimension];
    newChild.config[this._dimension] = size;
    super.replaceChild(oldChild, newChild, destroyOldChild);
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
      this._scheduleIntersectionRefresh();
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

    // Initialise children eagerly so their splitters exist before we attach
    // intersection handles to them. _$init is idempotent so the outer
    // callDownwards('_$init') traversal will skip them as no-ops.
    for (i = 0; i < this.contentItems.length; i++) {
      if (this.contentItems[i].isInitialised !== true) {
        this.contentItems[i]._$init();
      }
    }

    this._refreshIntersectionSplitters();
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
      const size = this.contentItems[i].config[dimension];
      if (size != null) {
        total += size;
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
    const minSize =
      this.layoutManager.config.dimensions[
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
    this._applySplitterDragStop(splitter);

    this._scheduleSetSize();
  }

  /**
   * Applies drag-stop updates for one splitter without scheduling layout.
   */
  private _applySplitterDragStop(splitter: Splitter) {
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
  }

  /**
   * Schedules a full descendant size update on the next animation frame.
   */
  private _scheduleSetSize() {
    animFrame(
      this.callDownwards.bind(this, 'setSize', undefined, undefined, undefined)
    );
    // setSize only propagates downwards, so it repositions intersection handles
    // owned by this item and its descendants. A handle that sits at a crossing
    // is owned by the parent RowOrColumn (it depends on a child splitter's
    // position), so ancestors must be refreshed too or their handles drift out
    // of sync with the lines after a drag.
    this._scheduleAncestorIntersectionRefresh();
  }

  /**
   * Schedule intersection handle refresh after layout and browser positioning settle.
   */
  private _scheduleIntersectionRefresh() {
    animFrame(() => {
      animFrame(this._refreshIntersectionSplitters.bind(this));
    });
  }

  /**
   * Schedule an intersection handle refresh on every RowOrColumn ancestor so
   * crossing handles stay aligned after a drag that only resized descendants.
   */
  private _scheduleAncestorIntersectionRefresh() {
    let ancestor = this.parent;
    while (ancestor != null) {
      if (ancestor instanceof RowOrColumn) {
        ancestor._scheduleIntersectionRefresh();
      }
      ancestor = ancestor.parent;
    }
  }

  // ============================================================================
  // Intersection Splitter Methods - Support for 2D grid resizing
  // ============================================================================

  /**
   * Create intersection splitters at the crossing points between this
   * RowOrColumn's splitters and the splitters of any perpendicular child.
   *
   * Each handle is appended into this RowOrColumn's container and positioned
   * with JS (via `_positionIntersectionSplitter`) during refresh so it stays
   * aligned as the layout changes. Handles are keyed by their splitter indices
   * so existing ones are reused rather than recreated.
   */
  private _createIntersectionSplitters(): Set<string> {
    this.childElementContainer.css('position', 'relative');

    const ensuredKeys = new Set<string>();

    for (
      let parentSplitterIndex = 0;
      parentSplitterIndex < this._splitter.length;
      parentSplitterIndex++
    ) {
      const beforeItem = this.contentItems[parentSplitterIndex];
      const afterItem = this.contentItems[parentSplitterIndex + 1];

      const stems: {
        stemOwner: RowOrColumn;
        stemSplitterIndex: number;
        junctionAtNearEdge: boolean;
        path: string;
      }[] = [];

      // A splitter "bar" is crossed by perpendicular splitter lines reaching its
      // shared edge from either side. Those lines can be nested arbitrarily deep
      // (e.g. a row inside a column inside the adjacent row), so walk each
      // adjacent subtree down to the touching edge. The before item meets the
      // bar at its far edge, the after item at its near edge.
      this._collectEdgeStemSplitters(beforeItem, false, 'b', stems);
      this._collectEdgeStemSplitters(afterItem, true, 'a', stems);

      for (let i = 0; i < stems.length; i++) {
        const stem = stems[i];
        const key = parentSplitterIndex + ':' + stem.path;
        ensuredKeys.add(key);
        this._ensureIntersectionSplitter(
          key,
          parentSplitterIndex,
          stem.stemOwner,
          stem.stemSplitterIndex,
          stem.junctionAtNearEdge
        );
      }
    }

    return ensuredKeys;
  }

  /**
   * Collect every perpendicular splitter line within `item`'s subtree that
   * reaches the shared edge with one of this row/column's splitter bars, so a
   * crossing handle can be created for it. Lines can be nested arbitrarily deep,
   * so descend until the edge is no longer shared.
   *
   * @param nearEdge true when the bar sits at the start of `item` along the bar
   * main axis (junction at the near end), false when at the end.
   */
  private _collectEdgeStemSplitters(
    item: AbstractContentItem | undefined,
    nearEdge: boolean,
    path: string,
    out: {
      stemOwner: RowOrColumn;
      stemSplitterIndex: number;
      junctionAtNearEdge: boolean;
      path: string;
    }[]
  ) {
    if (!(item instanceof RowOrColumn)) {
      return;
    }

    if (item._isColumn !== this._isColumn) {
      // Perpendicular to the bar: every splitter here crosses it, and every
      // child spans the full cross extent so all share the edge - recurse into
      // each to pick up deeper crossings.
      for (let i = 0; i < item._splitter.length; i++) {
        out.push({
          stemOwner: item,
          stemSplitterIndex: i,
          junctionAtNearEdge: nearEdge,
          path: path + ':' + i,
        });
      }
      for (let i = 0; i < item.contentItems.length; i++) {
        this._collectEdgeStemSplitters(
          item.contentItems[i],
          nearEdge,
          path + '.' + i,
          out
        );
      }
    } else {
      // Parallel to the bar: only the child at the shared edge can reach it.
      const edgeIndex = nearEdge ? 0 : item.contentItems.length - 1;
      this._collectEdgeStemSplitters(
        item.contentItems[edgeIndex],
        nearEdge,
        path + '.' + edgeIndex,
        out
      );
    }
  }

  /**
   * Recreate intersection splitters based on current splitter topology.
   * This keeps handles aligned and present after layout tree mutations.
   */
  private _refreshIntersectionSplitters() {
    const previousCount = this._intersectionSplitter.length;
    const ensuredKeys = this._createIntersectionSplitters();

    // Sweep handles whose crossing no longer exists after a topology change.
    this._intersectionSplitter = this._intersectionSplitter.filter(record => {
      if (ensuredKeys.has(record.key)) {
        return true;
      }
      record.splitter._$destroy();
      return false;
    });

    for (let i = 0; i < this._intersectionSplitter.length; i++) {
      this._positionIntersectionSplitter(this._intersectionSplitter[i]);
    }

    // If handles were added/removed due to topology change, run one more pass
    // on the next frame to settle post-layout positions.
    if (this._intersectionSplitter.length !== previousCount) {
      animFrame(() => {
        for (let i = 0; i < this._intersectionSplitter.length; i++) {
          this._positionIntersectionSplitter(this._intersectionSplitter[i]);
        }
      });
    }
  }

  /**
   * Destroy all previously created intersection splitters.
   */
  private _destroyIntersectionSplitters() {
    for (let i = 0; i < this._intersectionSplitter.length; i++) {
      this._intersectionSplitter[i].splitter._$destroy();
    }
    this._intersectionSplitter = [];
  }

  /**
   * Tear down splitters (including intersection handles and their document-level
   * drag listeners) before delegating to the base destroy logic.
   */
  _$destroy() {
    this._destroyIntersectionSplitters();
    for (let i = 0; i < this._splitter.length; i++) {
      this._splitter[i]._$destroy();
    }
    this._splitter = [];
    AbstractContentItem.prototype._$destroy.call(this);
  }

  /**
   * Create a single intersection splitter anchored in this row/column overlay
   * at the given coordinates.
   */
  private _ensureIntersectionSplitter(
    key: string,
    parentSplitterIndex: number,
    stemOwner: RowOrColumn,
    stemSplitterIndex: number,
    junctionAtNearEdge: boolean
  ) {
    const existing = this._intersectionSplitter.find(item => item.key === key);
    if (existing != null) {
      existing.parentSplitterIndex = parentSplitterIndex;
      existing.stemOwner = stemOwner;
      existing.stemSplitterIndex = stemSplitterIndex;
      existing.junctionAtNearEdge = junctionAtNearEdge;
      return;
    }

    const intersectionSplitter = new IntersectionSplitter(
      this._splitterSize,
      this._splitterGrabSize
    );

    // Handlers close over the record so reuse (which mutates the record in
    // place) keeps them pointed at the current crossing.
    const record: IntersectionRecord = {
      splitter: intersectionSplitter,
      key,
      parentSplitterIndex,
      stemOwner,
      stemSplitterIndex,
      junctionAtNearEdge,
    };

    intersectionSplitter.on('dragStart', () =>
      this._onIntersectionSplitterDragStart(record)
    );
    intersectionSplitter.on('drag', (offsetX: number, offsetY: number) =>
      this._onIntersectionSplitterDrag(record, offsetX, offsetY)
    );
    intersectionSplitter.on('dragStop', () =>
      this._onIntersectionSplitterDragStop(record)
    );

    // Highlight both perpendicular lines while hovering the grab area, mirroring
    // the active line affordance used for 1D splitter drags.
    intersectionSplitter.element.on('mouseenter', () => {
      // Ignore hover state changes during an active 2D drag. Crossing over
      // other handles while dragging should not transfer or pin highlights.
      if (
        this._isIntersectionDragging ||
        $(document.body).hasClass('lm_intersection_dragging')
      ) {
        return;
      }
      this._setIntersectionHighlight(record, true);
    });
    intersectionSplitter.element.on('mouseleave', () => {
      if (
        this._isIntersectionDragging ||
        $(document.body).hasClass('lm_intersection_dragging')
      ) {
        return;
      }
      this._setIntersectionHighlight(record, false);
    });

    intersectionSplitter.element.css({
      position: 'absolute',
      left: 0,
      top: 0,
      transform: 'translate(-50%, -50%)',
      zIndex: 60,
    });

    this.childElementContainer.append(intersectionSplitter.element);
    this._intersectionSplitter.push(record);
  }

  private _positionIntersectionSplitter(record: IntersectionRecord) {
    const position = this._getIntersectionPosition(record);

    if (position == null) {
      return;
    }

    record.splitter.element.css({
      left: position.left,
      top: position.top,
    });
  }

  /**
   * Compute intersection coordinates (the centre of the crossing) relative to
   * this row/column container.
   *
   * Uses `getBoundingClientRect` for the container and both splitter elements
   * rather than jQuery `.position()`. `.position()` is relative to each
   * element's offset parent, which varies with nesting and `position: relative`
   * on intermediate items, so adding those values together mis-places the
   * handle at some crossings. Rect-based deltas are independent of the offset
   * parent chain and always land on the visual crossing.
   */
  private _getIntersectionPosition(
    record: IntersectionRecord
  ): { left: number; top: number } | null {
    const parentSplitter = this._splitter[record.parentSplitterIndex];
    const childSplitter = record.stemOwner?._splitter[record.stemSplitterIndex];

    const container = this.childElementContainer[0];
    const parentEl = parentSplitter?.element[0];
    const childEl = childSplitter?.element[0];

    if (container == null || parentEl == null || childEl == null) {
      return null;
    }

    const containerRect = container.getBoundingClientRect();
    const parentRect = parentEl.getBoundingClientRect();
    const childRect = childEl.getBoundingClientRect();

    const parentCenterX =
      parentRect.left + parentRect.width / 2 - containerRect.left;
    const parentCenterY =
      parentRect.top + parentRect.height / 2 - containerRect.top;
    const childCenterX =
      childRect.left + childRect.width / 2 - containerRect.left;
    const childCenterY =
      childRect.top + childRect.height / 2 - containerRect.top;

    // The parent splitter runs along the cross axis (the "bar") and the child
    // splitter along the main axis (the "stem"); take each line's centre.
    if (this._isColumn) {
      return { left: childCenterX, top: parentCenterY };
    }

    return { left: parentCenterX, top: childCenterY };
  }

  /**
   * Toggle the active-line highlight on both splitters that meet at an
   * intersection. Reuses the standard `.lm_dragging` line style so the 2D
   * affordance is visually identical to the existing 1D drag affordance, and
   * adds `.lm_intersection_line` to lift the lines above pane content so an
   * offset junction renders cleanly instead of being clipped by a neighbour.
   */
  private _setIntersectionHighlight(
    record: IntersectionRecord,
    highlighted: boolean
  ) {
    const parentSplitter = this._splitter[record.parentSplitterIndex];
    const childSplitter = record.stemOwner?._splitter[record.stemSplitterIndex];

    parentSplitter?.element.toggleClass('lm_dragging', highlighted);
    parentSplitter?.element.toggleClass('lm_intersection_line', highlighted);
    childSplitter?.element.toggleClass('lm_dragging', highlighted);
    childSplitter?.element.toggleClass('lm_intersection_line', highlighted);
  }

  /**
   * Invoked when an intersection splitter's DragListener fires dragStart.
   * Calculates movement bounds for both axes (via the existing 1D logic) so the
   * drag stays within valid ranges, and highlights both perpendicular lines.
   */
  private _onIntersectionSplitterDragStart(record: IntersectionRecord) {
    const parentSplitter = this._splitter[record.parentSplitterIndex];
    const childSplitter = record.stemOwner._splitter[record.stemSplitterIndex];

    // Reuse the existing 1D splitter drag logic to compute bounds for each axis.
    this._onSplitterDragStart(parentSplitter);
    record.stemOwner._onSplitterDragStart(childSplitter);

    this._isIntersectionDragging = true;
    this._setIntersectionHighlight(record, true);
    $(document.body).addClass('lm_intersection_dragging');
  }

  /**
   * Invoked when an intersection splitter's DragListener fires drag. Moves both
   * splitter lines by delegating to the existing 1D logic, which clamps each
   * axis to its own valid range. The lines moving form the 2D drag affordance.
   *
   * The stem line spans the full extent of its owner along the parent axis, so
   * when the parent line moves the junction would otherwise detach. The stem is
   * stretched to follow the parent line while its far tip stays anchored.
   *
   * The stretch is applied with a CSS `transform: scale(...)` about the far tip
   * rather than by changing the line's `width`/`height`/`top`/`left`. Splitter
   * lines are real in-flow elements (floated / `position: relative`), so
   * mutating their box size reflows sibling panes and headers (tabs jump,
   * content shifts, gaps appear). A transform is painted without affecting
   * layout, so the affordance stretches cleanly even for deeply nested grids.
   */
  private _onIntersectionSplitterDrag(
    record: IntersectionRecord,
    offsetX: number,
    offsetY: number
  ) {
    const parentSplitter = this._splitter[record.parentSplitterIndex];
    const childSplitter = record.stemOwner._splitter[record.stemSplitterIndex];

    this._onSplitterDrag(parentSplitter, offsetX, offsetY);
    record.stemOwner._onSplitterDrag(childSplitter, offsetX, offsetY);

    // Scale the stem line along the parent axis so its junction tip tracks the
    // parent line while its far tip stays put. `_splitterPosition` is the
    // parent's clamped offset; the stem owner extent gives the line's length.
    const shift = this._splitterPosition ?? 0;
    const fullLength = record.stemOwner.element[this._dimension]() ?? 0;
    const newLength = record.junctionAtNearEdge
      ? fullLength - shift
      : fullLength + shift;
    // Keep the stretched stem visible and non-inverted even when the parent
    // splitter's clamped shift exceeds the stem owner's span.
    const minVisibleLength = Math.max(this._splitterSize, 1);
    const safeLength = Math.max(newLength, minVisibleLength);
    const scale = fullLength > 0 ? safeLength / fullLength : 1;

    // Anchor the far tip: scale about the edge opposite the junction.
    const farEdge = record.junctionAtNearEdge
      ? this._isColumn
        ? 'bottom'
        : 'right'
      : this._isColumn
      ? 'top'
      : 'left';

    childSplitter.element.css({
      'transform-origin': farEdge,
      transform: this._isColumn ? `scaleY(${scale})` : `scaleX(${scale})`,
    });
  }

  /**
   * Invoked when an intersection splitter's DragListener fires dragStop.
   * Applies both axis updates atomically (via the existing 1D logic), clears the
   * highlight unless the pointer is still over the handle, then relayouts once.
   */
  private _onIntersectionSplitterDragStop(record: IntersectionRecord) {
    const parentSplitter = this._splitter[record.parentSplitterIndex];
    const childSplitter = record.stemOwner._splitter[record.stemSplitterIndex];

    this._applySplitterDragStop(parentSplitter);
    record.stemOwner._applySplitterDragStop(childSplitter);

    // Clear the stretch transform applied during drag so the stem line falls
    // back to its CSS full-extent size once the layout is reapplied.
    childSplitter.element.css({ transform: '', 'transform-origin': '' });

    this._isIntersectionDragging = false;
    this._setIntersectionHighlight(record, false);
    $(document.body).removeClass('lm_intersection_dragging');

    this._scheduleSetSize();
  }
}
