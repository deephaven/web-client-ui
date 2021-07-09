import React, { PureComponent } from 'react';
import memoize from 'memoizee';
import Log from '@deephaven/log';
import { RangeUtils, Range } from '@deephaven/utils';
import { ContextActionUtils } from './context-actions';
import ItemListItem from './ItemListItem';
import './SingleClickItemList.scss';

export type SingleClickRenderItemBase = {
  itemName: string;
};

export type SingleClickRenderItemProps<T extends SingleClickRenderItemBase> = {
  item: T;
  itemIndex: number;
  isKeyboardSelected: boolean;
  isSelected: boolean;
  isDragInProgress: boolean;
  isDragged: boolean;
  isDropTargetValid: boolean;
  dragOverItem: T;
};

type SingleClickRenterItemFn<T extends SingleClickRenderItemBase> = (
  props: SingleClickRenderItemProps<T>
) => React.ReactNode;

type SingleClickItemListProps<T extends SingleClickRenderItemBase> = {
  // Total item count
  itemCount: number;
  rowHeight: number;

  // Offset of the top item in the items array
  offset: number;
  // Item object format expected by the default renderItem function
  // Can be anything as long as it's supported by the renderItem
  items: T[];

  isDraggable: boolean;

  // Whether to allow multiple selections in this item list
  isMultiSelect: boolean;

  // Set to true if you want the list to scroll when new items are added and it's already at the bottom
  isStickyBottom: boolean;

  onDrop(ranges: Range[], index: number): void;

  // Fired when an item gets selected via keyboard
  onKeyboardSelect(): void;

  // Fired when an item is clicked. With multiple selection, fired on double click.
  onSelect(index: number): void;
  onSelectionChange(
    selectedRanges: Range[],
    keyboardIndex: number | null
  ): void;
  onViewportChange(topRow: number, bottomRow: number): void;

  disableSelect: boolean;

  renderItem: SingleClickRenterItemFn<T>;
  validateDropTarget(draggedRanges: Range[], targetIndex: number): boolean;
};

type SingleClickItemListState = {
  keyboardIndex: number | null;
  selectedRanges: Range[];
  draggedRanges: Range[];
  dragOverIndex: number | null;
  shiftRange: Range | null;
  topRow: number | null;
  bottomRow: number | null;
  isStuckToBottom: boolean;
  isDropTargetValid: boolean;
};

const log = Log.module('SingleClickItemList');

/**
 * Show items in a long scrollable list.
 * Can be navigated via keyboard or mouse.
 */
export class SingleClickItemList<
  T extends SingleClickRenderItemBase
> extends PureComponent<SingleClickItemListProps<T>, SingleClickItemListState> {
  static CACHE_SIZE = 1000;

  static DEFAULT_ROW_HEIGHT = 20;

  static DRAG_PLACEHOLDER_OFFSET_X = 20;

  static defaultProps = {
    items: [],
    rowHeight: SingleClickItemList.DEFAULT_ROW_HEIGHT,
    isDraggable: false,
    isMultiSelect: false,
    isStickyBottom: false,
    disableSelect: false,
    onKeyboardSelect(): void {
      // no-op
    },
    onSelect(): void {
      // no-op
    },
    onSelectionChange(): void {
      // no-op
    },
    onDrop(): void {
      // no-op
    },
    renderItem: SingleClickItemList.renderItem,
    validateDropTarget: undefined,
  };

  static renderItem<P extends SingleClickRenderItemBase>({
    item,
  }: SingleClickRenderItemProps<P>): React.ReactNode {
    return item.itemName;
  }

  constructor(props: SingleClickItemListProps<T>) {
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

    this.list = React.createRef();
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

  componentDidMount(): void {
    const { isStickyBottom } = this.props;
    if (
      isStickyBottom &&
      this.list.current &&
      this.list.current.scrollHeight > this.list.current.clientHeight
    ) {
      this.scrollToBottom();
    } else {
      this.updateViewport();
    }
  }

  componentDidUpdate(
    prevProps: SingleClickItemListProps<T>,
    prevState: SingleClickItemListState
  ): void {
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

  list: React.RefObject<HTMLDivElement>;

  dragPlaceholder: HTMLDivElement | null;

  setKeyboardIndex(keyboardIndex: number | null): void {
    this.setState({ keyboardIndex });
  }

  setShiftRange(shiftRange: Range | null): void {
    this.setState({ shiftRange });
  }

  getItemSelected = memoize(
    (index: number, selectedRanges: Range[]): boolean =>
      RangeUtils.isSelected(selectedRanges, index),
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

  getDragPlaceholder(draggedRanges: Range[]): string | null {
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

  focus(): void {
    this.list.current?.focus();
  }

  handleItemClick(index: number, e: React.MouseEvent<HTMLDivElement>): void {
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
      const range: Range = [
        Math.min(oldFocus ?? index, index),
        Math.max(oldFocus ?? index, index),
      ];
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

  handleItemDragStart(index: number, e: React.DragEvent<HTMLDivElement>): void {
    const { selectedRanges } = this.state;
    log.debug('handleItemDragStart', index, selectedRanges);
    let draggedRanges: Range[];
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

  handleItemDragOver(index: number): void {
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
      log.debug('handleItemDragOver', index, isDropTargetValid);
      return {
        dragOverIndex: index,
        isDropTargetValid,
      };
    });
  }

  handleItemDragEnd(index: number): void {
    if (this.dragPlaceholder) {
      document.body.removeChild(this.dragPlaceholder);
    }
    log.debug('handleItemDragEnd', index);
    // Drag end is triggered after drop
    // Also drop isn't triggered if drag end is outside of the list
    this.setState({
      draggedRanges: [],
      dragOverIndex: null,
    });
  }

  handleItemDrop(index: number): void {
    const { draggedRanges } = this.state;
    log.debug('handleItemDrop', index, draggedRanges);
    const { onDrop } = this.props;
    onDrop(draggedRanges, index);
  }

  handleItemMouseDown(
    index: number,
    e: React.MouseEvent<HTMLDivElement>
  ): void {
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

  handleItemBlur(
    itemIndex: number,
    { currentTarget, relatedTarget }: React.FocusEvent<HTMLDivElement>
  ): void {
    log.debug2('item blur', itemIndex, currentTarget, relatedTarget);
    if (
      !relatedTarget ||
      (relatedTarget instanceof Element &&
        !this.list.current?.contains(relatedTarget) &&
        !relatedTarget.classList?.contains('context-menu-container'))
    ) {
      // Next focused element is outside of the SingleClickItemList
      this.setKeyboardIndex(null);
    }
  }

  handleItemFocus(
    itemIndex: number,
    e: React.FocusEvent<HTMLDivElement>
  ): void {
    log.debug2('item focus', itemIndex, e.target);
    this.setState(state => {
      const { keyboardIndex } = state;
      if (keyboardIndex !== itemIndex) {
        return { keyboardIndex: itemIndex };
      }
      return null;
    });
  }

  handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    const { itemCount, isMultiSelect, onSelect } = this.props;
    const { keyboardIndex: oldFocus } = this.state;
    let newFocus = oldFocus;

    log.debug('handleKeyDown', e.key);

    if (e.key === ' ') {
      this.deselectAll();
      this.setShiftRange(null);
      onSelect(oldFocus ?? 0);
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
    } else {
      return;
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

  handleScroll(): void {
    this.updateStickyBottom();
    this.updateViewport();
  }

  scrollToBottom(): void {
    window.requestAnimationFrame(() => {
      if (this.list.current) {
        this.list.current.scrollTop = this.list.current.scrollHeight;
      }
    });
  }

  scrollIntoView(itemIndex: number): void {
    if (!this.list.current) {
      return;
    }

    const { itemCount, rowHeight } = this.props;
    const { clientHeight, scrollTop } = this.list.current;

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
        if (this.list.current) {
          this.list.current.scrollTop = newTop;
        }
      });
    }
  }

  resetSelection(): void {
    this.deselectAll();
    this.setShiftRange(null);
    this.setKeyboardIndex(null);
  }

  deselectAll(): void {
    this.setState({ selectedRanges: [] });
  }

  deselectItem(index: number): void {
    this.deselectRange([index, index]);
  }

  deselectRange(range: Range): void {
    RangeUtils.validateRange(range);

    this.setState(({ selectedRanges }) => ({
      selectedRanges: RangeUtils.deselectRange(selectedRanges, range),
    }));
  }

  toggleItem(index: number): void {
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

  selectItem(index: number): void {
    this.selectRange([index, index]);
  }

  selectRange(range: Range): void {
    RangeUtils.validateRange(range);

    this.setState(({ selectedRanges }) => ({
      selectedRanges: RangeUtils.selectRange(selectedRanges, range),
    }));
  }

  sendViewportUpdate(): void {
    const { topRow, bottomRow } = this.state;
    if (topRow != null && bottomRow != null) {
      const { onViewportChange } = this.props;
      onViewportChange(topRow, bottomRow);
    }
  }

  isListAtBottom(): boolean {
    return (
      this.list.current !== null &&
      this.list.current.scrollTop >=
        this.list.current.scrollHeight - this.list.current.offsetHeight
    );
  }

  updateStickyBottom(): void {
    const { isStickyBottom } = this.props;

    const isStuckToBottom = isStickyBottom && this.isListAtBottom();

    this.setState({ isStuckToBottom });
  }

  updateViewport(): void {
    if (!this.list.current || this.list.current.clientHeight === 0) {
      return;
    }

    const { rowHeight } = this.props;
    const top = this.list.current.scrollTop;
    const bottom = top + this.list.current.clientHeight;

    const topRow = Math.floor(top / rowHeight);
    const bottomRow = Math.ceil(bottom / rowHeight);

    this.setState({ topRow, bottomRow });
  }

  render(): JSX.Element {
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
        ref={this.list}
        tabIndex={-1}
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

export default SingleClickItemList;
