import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import memoize from 'memoizee';
import Log from '@deephaven/log';
import { RangeUtils } from '@deephaven/utils';
import { ContextActionUtils } from './context-actions';
import ItemListItem from './ItemListItem';
import './SingleClickItemList.scss';

const log = Log.module('SingleClickItemList');

/**
 * Show items in a long scrollable list.
 * Can be navigated via keyboard or mouse.
 */
class SingleClickItemList extends PureComponent {
  static CACHE_SIZE = 1000;

  static DEFAULT_ROW_HEIGHT = 20;

  static DRAG_PLACEHOLDER_OFFSET_X = 20;

  constructor(props) {
    super(props);

    this.handleItemBlur = this.handleItemBlur.bind(this);
    this.handleItemFocus = this.handleItemFocus.bind(this);
    this.handleItemClick = this.handleItemClick.bind(this);
    this.handleItemDragStart = this.handleItemDragStart.bind(this);
    this.handleItemDragOver = this.handleItemDragOver.bind(this);
    this.handleItemDragEnd = this.handleItemDragEnd.bind(this);
    this.handleItemDrop = this.handleItemDrop.bind(this);
    this.handleItemMouseDown = this.handleItemMouseDown.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleScroll = this.handleScroll.bind(this);

    this.list = null;
    this.dragPlaceholder = null;

    const { isStickyBottom } = props;

    this.state = {
      keyboardIndex: null,
      selectedRanges: [],
      draggedRanges: [],
      dragOverIndex: null,
      shiftRange: null,
      topRow: null,
      bottomRow: null,
      isStuckToBottom: isStickyBottom,
      isDropTargetValid: false,
    };
  }

  componentDidMount() {
    const { isStickyBottom } = this.props;
    if (
      isStickyBottom &&
      this.list &&
      this.list.scrollHeight > this.list.clientHeight
    ) {
      this.scrollToBottom();
    } else {
      this.updateViewport();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      isStuckToBottom,
      keyboardIndex,
      topRow,
      bottomRow,
      selectedRanges,
    } = this.state;

    if (isStuckToBottom && !this.isListAtBottom()) {
      this.scrollToBottom();
    }

    if (topRow !== prevState.topRow || bottomRow !== prevState.bottomRow) {
      this.sendViewportUpdate();
    }

    if (
      selectedRanges !== prevState.selectedRanges ||
      keyboardIndex !== prevState.keyboardIndex
    ) {
      const { onSelectionChange } = this.props;
      onSelectionChange(selectedRanges, keyboardIndex);
    }

    this.updateViewport();
  }

  setKeyboardIndex(keyboardIndex) {
    this.setState({ keyboardIndex });
  }

  setShiftRange(shiftRange) {
    this.setState({ shiftRange });
  }

  getItemSelected = memoize(
    (index, selectedRanges) => RangeUtils.isSelected(selectedRanges, index),
    { max: SingleClickItemList.CACHE_SIZE }
  );

  getCachedItem = memoize(
    (
      itemIndex,
      key,
      item,
      rowHeight,
      isKeyboardSelected,
      isSelected,
      isDragInProgress,
      isDragged,
      isDropTargetValid,
      dragOverItem,
      renderItem
    ) => {
      const style = { height: rowHeight };
      const { isDraggable, onKeyboardSelect, disableSelect } = this.props;
      const content = renderItem({
        item,
        itemIndex,
        isKeyboardSelected,
        isSelected,
        isDragInProgress,
        isDragged,
        isDropTargetValid,
        dragOverItem,
      });

      return (
        <ItemListItem
          onClick={this.handleItemClick}
          onDragStart={this.handleItemDragStart}
          onDragOver={this.handleItemDragOver}
          onDragEnd={this.handleItemDragEnd}
          onDrop={this.handleItemDrop}
          onMouseDown={this.handleItemMouseDown}
          onFocus={this.handleItemFocus}
          onBlur={this.handleItemBlur}
          onKeyboardSelect={onKeyboardSelect}
          disableSelect={disableSelect}
          isDraggable={isDraggable}
          isKeyboardSelected={isKeyboardSelected}
          isSelected={isSelected}
          itemIndex={itemIndex}
          style={style}
          key={key}
        >
          {content}
        </ItemListItem>
      );
    },
    { max: SingleClickItemList.CACHE_SIZE }
  );

  getCachedItems = memoize(
    (
      items,
      rowHeight,
      offset,
      keyboardIndex,
      selectedRanges,
      draggedRanges,
      dragOverIndex,
      isDropTargetValid,
      renderItem
    ) => {
      const itemElements = [];
      const dragOverItem = dragOverIndex != null ? items[dragOverIndex] : null;
      const isDragInProgress = draggedRanges.length > 0;
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        const itemIndex = i + offset;
        const key = itemIndex;
        const isKeyboardSelected = itemIndex === keyboardIndex;
        const isSelected = this.getItemSelected(itemIndex, selectedRanges);
        const isDragged = this.getItemSelected(itemIndex, draggedRanges);
        const element = this.getCachedItem(
          itemIndex,
          key,
          item,
          rowHeight,
          isKeyboardSelected,
          isSelected,
          isDragInProgress,
          isDragged,
          isDropTargetValid,
          dragOverItem,
          renderItem
        );
        itemElements.push(element);
      }
      return itemElements;
    },
    { max: 1 }
  );

  getDragPlaceholder(draggedRanges) {
    const count = draggedRanges.reduce(
      (acc, next) => acc + next[1] - next[0] + 1,
      0
    );
    if (count === 0) {
      return null;
    }
    if (count === 1) {
      const index = draggedRanges[0][0];
      const { items } = this.props;
      return items[index].itemName;
    }
    return `${count} items`;
  }

  isDropTargetValid = memoize((validateDropTarget, draggedRanges, index) =>
    typeof validateDropTarget === 'function'
      ? validateDropTarget(draggedRanges, index)
      : false
  );

  focus() {
    if (this.list != null) {
      this.list.focus();
    }
  }

  handleItemClick(index, e) {
    // This happens after handleItemMouseDown, so shouldn't contain overlapping functionality
    const { isMultiSelect, onSelect } = this.props;
    const { selectedRanges, keyboardIndex: oldFocus, shiftRange } = this.state;

    log.debug(
      'handleItemClick',
      index,
      oldFocus,
      isMultiSelect,
      e.shiftKey,
      ContextActionUtils.isModifierKeyDown(e)
    );

    if (isMultiSelect && e.shiftKey) {
      const range = [Math.min(oldFocus, index), Math.max(oldFocus, index)];
      if (shiftRange != null) {
        this.deselectRange(shiftRange);
      }
      this.setShiftRange(range);
      this.selectRange(range);
    } else if (isMultiSelect && ContextActionUtils.isModifierKeyDown(e)) {
      this.setShiftRange(null);
      this.setKeyboardIndex(index);
      if (this.getItemSelected(index, selectedRanges)) {
        this.deselectItem(index);
      } else {
        this.selectItem(index);
      }
    } else {
      this.deselectAll();
      this.setShiftRange(null);
      this.setKeyboardIndex(index);
      this.selectItem(index);
      onSelect(index);
    }
  }

  handleItemDragStart(index, e) {
    const { selectedRanges } = this.state;
    log.debug('handleItemDragStart', index, selectedRanges);
    let draggedRanges = null;
    if (this.getItemSelected(index, selectedRanges)) {
      // Dragging selected ranges
      draggedRanges = [...selectedRanges];
    } else {
      draggedRanges = [[index, index]];
    }
    this.setState({
      draggedRanges,
    });

    const dragPlaceholder = document.createElement('div');
    dragPlaceholder.innerHTML = `<div class="dnd-placeholder-content">${this.getDragPlaceholder(
      draggedRanges
    )}</div>`;
    dragPlaceholder.className = 'single-click-item-list-dnd-placeholder';
    document.body.appendChild(dragPlaceholder);
    e.dataTransfer.setDragImage(dragPlaceholder, 0, 0);
    this.dragPlaceholder = dragPlaceholder;
  }

  handleItemDragOver(index) {
    this.setState(({ dragOverIndex, draggedRanges }) => {
      if (index === dragOverIndex) {
        return null;
      }
      const { validateDropTarget } = this.props;
      const isDropTargetValid = this.isDropTargetValid(
        validateDropTarget,
        draggedRanges,
        index
      );
      log.debug('handleItemDragOver', index);
      return {
        dragOverIndex: index,
        isDropTargetValid,
      };
    });
  }

  handleItemDragEnd(index) {
    document.body.removeChild(this.dragPlaceholder);
    log.debug('handleItemDragEnd', index);
    // Drag end is triggered after drop
    // Also drop isn't triggered if drag end is outside of the list
    this.setState({
      draggedRanges: [],
      dragOverIndex: null,
    });
  }

  handleItemDrop(index) {
    const { draggedRanges } = this.state;
    log.debug('handleItemDrop', index, draggedRanges);
    const { onDrop } = this.props;
    onDrop(draggedRanges, index);
  }

  handleItemMouseDown(index, e) {
    const { selectedRanges } = this.state;
    log.debug('handleItemMouseDown', index, e.button);
    if (e.button === 2) {
      this.setKeyboardIndex(index);
      this.setShiftRange(null);
      if (!this.getItemSelected(index, selectedRanges)) {
        this.deselectAll();
        this.selectItem(index);
      }
    }
  }

  handleItemBlur(itemIndex, { currentTarget, relatedTarget }) {
    log.debug2('item blur', itemIndex, currentTarget, relatedTarget);
    if (
      !relatedTarget ||
      (!this.list?.contains(relatedTarget) &&
        !relatedTarget.classList?.contains('context-menu-container'))
    ) {
      // Next focused element is outside of the SingleClickItemList
      this.setKeyboardIndex(null);
    }
  }

  handleItemFocus(itemIndex, e) {
    log.debug2('item focus', itemIndex, e.target);
    this.setState(state => {
      const { keyboardIndex } = state;
      if (keyboardIndex !== itemIndex) {
        return { keyboardIndex: itemIndex };
      }
      return null;
    });
  }

  handleKeyDown(e) {
    const { itemCount, isMultiSelect, onSelect } = this.props;
    const { keyboardIndex: oldFocus } = this.state;
    let newFocus = oldFocus;

    log.debug('handleKeyDown', e.key);

    if (e.key === ' ') {
      this.deselectAll();
      this.setShiftRange(null);
      onSelect(oldFocus);
      return;
    }

    if (e.key === 'Escape') {
      this.resetSelection();
      return;
    }

    if (e.key === 'ArrowUp') {
      if (newFocus == null) {
        newFocus = itemCount - 1;
      } else if (newFocus > 0) {
        newFocus -= 1;
      }
    } else if (e.key === 'ArrowDown') {
      if (newFocus == null) {
        newFocus = 0;
      } else if (newFocus < itemCount - 1) {
        newFocus += 1;
      }
    }

    if (oldFocus !== newFocus) {
      e.stopPropagation();
      e.preventDefault();

      this.setKeyboardIndex(newFocus);

      if (isMultiSelect && e.shiftKey) {
        this.toggleItem(newFocus);
      }

      this.scrollIntoView(newFocus);
    }
  }

  handleScroll() {
    this.updateStickyBottom();
    this.updateViewport();
  }

  scrollToBottom() {
    window.requestAnimationFrame(() => {
      if (this.list) {
        this.list.scrollTop = this.list.scrollHeight;
      }
    });
  }

  scrollIntoView(itemIndex) {
    const { itemCount, rowHeight } = this.props;
    const { clientHeight, scrollTop } = this.list;

    const itemTop = itemIndex * rowHeight;
    const itemBottom = itemTop + rowHeight;

    let newTop = scrollTop;

    if (itemTop < scrollTop) {
      newTop = itemIndex * rowHeight;
    } else if (scrollTop + clientHeight - rowHeight < itemBottom) {
      const listBottom = scrollTop + clientHeight;
      const deltaBottom = itemBottom - listBottom;
      newTop = scrollTop + deltaBottom + rowHeight;
    }

    newTop = Math.min(
      newTop,
      Math.max(itemCount * rowHeight - clientHeight, scrollTop)
    );

    if (newTop !== scrollTop) {
      window.requestAnimationFrame(() => {
        if (this.list) {
          this.list.scrollTop = newTop;
        }
      });
    }
  }

  resetSelection() {
    this.deselectAll();
    this.setShiftRange(null);
    this.setKeyboardIndex(null);
  }

  deselectAll() {
    this.setState({ selectedRanges: [] });
  }

  deselectItem(index) {
    this.deselectRange([index, index]);
  }

  deselectRange(range) {
    RangeUtils.validateRange(range);

    this.setState(({ selectedRanges }) => ({
      selectedRanges: RangeUtils.deselectRange(selectedRanges, range),
    }));
  }

  toggleItem(index) {
    this.setState(({ selectedRanges }) => {
      if (this.getItemSelected(index, selectedRanges)) {
        return {
          selectedRanges: RangeUtils.deselectRange(selectedRanges, [
            index,
            index,
          ]),
        };
      }
      return {
        selectedRanges: RangeUtils.selectRange(selectedRanges, [index, index]),
      };
    });
  }

  selectItem(index) {
    this.selectRange([index, index]);
  }

  selectRange(range) {
    RangeUtils.validateRange(range);

    this.setState(({ selectedRanges }) => ({
      selectedRanges: RangeUtils.selectRange(selectedRanges, range),
    }));
  }

  sendViewportUpdate() {
    const { topRow, bottomRow } = this.state;
    if (topRow != null && bottomRow != null) {
      const { onViewportChange } = this.props;
      onViewportChange(topRow, bottomRow);
    }
  }

  isListAtBottom() {
    return (
      this.list.scrollTop >= this.list.scrollHeight - this.list.offsetHeight
    );
  }

  updateStickyBottom() {
    const { isStickyBottom } = this.props;

    const isStuckToBottom = isStickyBottom && this.isListAtBottom();

    this.setState({ isStuckToBottom });
  }

  updateViewport() {
    if (this.list.clientHeight === 0) {
      return;
    }

    const { rowHeight } = this.props;
    const top = this.list.scrollTop;
    const bottom = top + this.list.clientHeight;

    const topRow = Math.floor(top / rowHeight);
    const bottomRow = Math.ceil(bottom / rowHeight);

    this.setState({ topRow, bottomRow });
  }

  render() {
    const { items, itemCount, offset, rowHeight, renderItem } = this.props;
    const {
      isDropTargetValid,
      keyboardIndex,
      selectedRanges,
      draggedRanges,
      dragOverIndex,
    } = this.state;
    const itemElements = this.getCachedItems(
      items,
      rowHeight,
      offset,
      keyboardIndex,
      selectedRanges,
      draggedRanges,
      dragOverIndex,
      isDropTargetValid,
      renderItem
    );

    return (
      <div
        className="single-click-item-list-scroll-pane h-100 w-100"
        onScroll={this.handleScroll}
        onKeyDown={this.handleKeyDown}
        role="presentation"
        ref={list => {
          this.list = list;
        }}
        tabIndex="-1"
      >
        <div
          className="single-click-item-list"
          style={{ height: itemCount * rowHeight }}
        >
          <div
            className="single-click-item-list-content"
            style={{
              position: 'absolute',
              height: items.length * rowHeight,
              top: offset * rowHeight,
              left: 0,
            }}
          >
            {itemElements}
          </div>
        </div>
      </div>
    );
  }
}

SingleClickItemList.propTypes = {
  // Total item count
  itemCount: PropTypes.number.isRequired,
  rowHeight: PropTypes.number,

  // Offset of the top item in the items array
  offset: PropTypes.number.isRequired,
  // Item object format expected by the default renderItem function
  // Can be anything as long as it's supported by the renderItem
  items: PropTypes.arrayOf(
    PropTypes.shape({
      itemName: PropTypes.string,
    })
  ),

  isDraggable: PropTypes.bool,

  // Whether to allow multiple selections in this item list
  isMultiSelect: PropTypes.bool,

  // Set to true if you want the list to scroll when new items are added and it's already at the bottom
  isStickyBottom: PropTypes.bool,

  onDrop: PropTypes.func,

  // Fired when an item gets selected via keyboard
  onKeyboardSelect: PropTypes.func,

  // Fired when an item is clicked. With multiple selection, fired on double click.
  onSelect: PropTypes.func,
  onSelectionChange: PropTypes.func,
  onViewportChange: PropTypes.func.isRequired,

  disableSelect: PropTypes.bool,

  renderItem: PropTypes.func,
  validateDropTarget: PropTypes.func,
};

SingleClickItemList.defaultProps = {
  items: [],
  rowHeight: SingleClickItemList.DEFAULT_ROW_HEIGHT,

  isDraggable: false,
  isMultiSelect: false,
  isStickyBottom: false,

  disableSelect: false,

  onKeyboardSelect: () => {},
  onSelect: () => {},
  onSelectionChange: () => {},
  onDrop: () => {},
  renderItem: ({ item }) => item && (item.displayValue || item.value),
  validateDropTarget: null,
};

export default SingleClickItemList;
