import React, { PureComponent } from 'react';
import memoize from 'memoizee';
import {
  FixedSizeList as List,
  ListOnItemsRenderedProps,
  ListOnScrollProps,
} from 'react-window';
import AutoSizer, { Size } from 'react-virtualized-auto-sizer';
import Log from '@deephaven/log';
import { RangeUtils, Range } from '@deephaven/utils';
import ItemListItem from './ItemListItem';
import { ContextActionUtils } from './context-actions';
import './ItemList.scss';

const log = Log.module('ItemList');

export interface DefaultListItem {
  value?: string;
  displayValue?: string;
}

export type RenderItemProps<T> = {
  item: T;
  itemIndex: number;
  isFocused: boolean;
  isSelected: boolean;
  style: React.CSSProperties;
};

export type RenderItemFn<T> = (props: RenderItemProps<T>) => React.ReactNode;

export type ItemListProps<T> = {
  // Total item count
  itemCount: number;
  rowHeight: number;
  // Offset of the top item in the items array
  offset: number;
  // Item object format expected by the default renderItem function
  // Can be anything as long as it's supported by the renderItem
  // Default renderItem will look for a `displayValue` property, fallback
  // to the `value` property, or stringify the object if neither are defined
  items: T[];
  // Whether to allow dragging to change the selection after clicking
  isDragSelect: boolean;
  // Whether to allow multiple selections in this item list
  isMultiSelect: boolean;
  // Set to true if you want the list to scroll when new items are added and it's already at the bottom
  isStickyBottom: boolean;
  // Fired when an item gets focused
  onFocusChange(index: number | null): void;
  // Fired when an item is clicked. With multiple selection, fired on double click.
  onSelect(index: number): void;
  onSelectionChange(ranges: Range[]): void;
  onViewportChange(topRow: number, bottomRow: number): void;
  overscanCount: number;
  selectedRanges: Range[];
  disableSelect: boolean;
  renderItem: RenderItemFn<T>;
  focusSelector: string;
};

type ItemListState = {
  focusIndex: number | null;
  mouseDownIndex: number | null;
  selectedRanges: Range[];
  overscanStartIndex: number;
  height: number | null;
  isDragging: boolean;
  isStuckToBottom: boolean;
  scrollOffset: number | null;
};

/**
 * Show items in a long scrollable list.
 * Can be navigated via keyboard or mouse.
 */
class ItemList<T> extends PureComponent<ItemListProps<T>, ItemListState> {
  static CACHE_SIZE = 1000;

  static DEFAULT_ROW_HEIGHT = 20;

  // By drawing an additional 10 items on each side, tab/keyboard navigation works better (as the next element exists)
  static DEFAULT_OVERSCAN = 10;

  static defaultProps = {
    offset: 0,
    items: [],
    rowHeight: ItemList.DEFAULT_ROW_HEIGHT,

    isDragSelect: true,

    isMultiSelect: false,

    isStickyBottom: false,

    disableSelect: false,

    onFocusChange(): void {
      // no-op
    },
    onSelect(): void {
      // no-op
    },
    onSelectionChange(): void {
      // no-op
    },
    onViewportChange(): void {
      // no-op
    },

    overscanCount: ItemList.DEFAULT_OVERSCAN,

    renderItem: ItemList.renderItem,
    selectedRanges: [],

    focusSelector: '.item-list-item',
  };

  static renderItem<P extends DefaultListItem>({
    item,
  }: RenderItemProps<P>): JSX.Element {
    return (
      <div className="item-list-item-content">
        {item && (item.displayValue || item.value || `${item}`)}
      </div>
    );
  }

  constructor(props: ItemListProps<T>) {
    super(props);

    this.handleItemBlur = this.handleItemBlur.bind(this);
    this.handleItemFocus = this.handleItemFocus.bind(this);
    this.handleItemDoubleClick = this.handleItemDoubleClick.bind(this);
    this.handleItemMouseDown = this.handleItemMouseDown.bind(this);
    this.handleItemMouseMove = this.handleItemMouseMove.bind(this);
    this.handleItemMouseUp = this.handleItemMouseUp.bind(this);
    this.handleItemsRendered = this.handleItemsRendered.bind(this);
    this.handleWindowMouseUp = this.handleWindowMouseUp.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.renderInnerElement = this.renderInnerElement.bind(this);

    this.list = React.createRef();
    this.listContainer = React.createRef();

    const { isStickyBottom, selectedRanges } = props;

    this.state = {
      focusIndex: null,
      mouseDownIndex: null,
      selectedRanges,
      overscanStartIndex: 0,
      height: null,
      isDragging: false,
      isStuckToBottom: isStickyBottom,
      scrollOffset: null,
    };
  }

  componentDidMount(): void {
    const { isStickyBottom } = this.props;
    if (isStickyBottom && !this.isListAtBottom()) {
      this.scrollToBottom();
    }
  }

  componentDidUpdate(
    prevProps: ItemListProps<T>,
    prevState: ItemListState
  ): void {
    const { selectedRanges: propSelectedRanges } = this.props;
    const {
      focusIndex,
      isStuckToBottom,
      scrollOffset,
      height,
      selectedRanges,
    } = this.state;
    if (isStuckToBottom && !this.isListAtBottom()) {
      this.scrollToBottom();
    }

    if (
      scrollOffset !== prevState.scrollOffset ||
      height !== prevState.height
    ) {
      this.sendViewportUpdate();
    }

    if (
      propSelectedRanges !== prevProps.selectedRanges &&
      propSelectedRanges !== selectedRanges
    ) {
      this.setSelectedRanges(propSelectedRanges);
    } else if (selectedRanges !== prevState.selectedRanges) {
      const { onSelectionChange } = this.props;
      onSelectionChange(selectedRanges);
    }

    if (focusIndex !== prevState.focusIndex) {
      const { onFocusChange } = this.props;
      onFocusChange(focusIndex);
    }
  }

  componentWillUnmount(): void {
    window.removeEventListener('mouseup', this.handleWindowMouseUp);
  }

  list: React.RefObject<List>;

  listContainer: React.RefObject<HTMLDivElement>;

  getItemSelected = memoize(
    (index: number, selectedRanges: Range[]) =>
      RangeUtils.isSelected(selectedRanges, index),
    { max: ItemList.CACHE_SIZE }
  );

  getCachedItem = memoize(
    (
      itemIndex: number,
      key: number,
      item: T,
      isFocused: boolean,
      isSelected: boolean,
      renderItem: RenderItemFn<T>,
      style: React.CSSProperties,
      disableSelect: boolean
    ) => {
      const content = renderItem({
        item,
        itemIndex,
        isFocused,
        isSelected,
        style,
      });

      return (
        <ItemListItem
          onDoubleClick={this.handleItemDoubleClick}
          onMouseDown={this.handleItemMouseDown}
          onFocus={this.handleItemFocus}
          onBlur={this.handleItemBlur}
          disableSelect={disableSelect}
          onMouseMove={this.handleItemMouseMove}
          onMouseUp={this.handleItemMouseUp}
          isFocused={isFocused}
          isSelected={isSelected}
          itemIndex={itemIndex}
          style={style}
          key={key}
        >
          {content}
        </ItemListItem>
      );
    },
    { max: ItemList.CACHE_SIZE }
  );

  getOuterElement = memoize((onKeyDown: React.KeyboardEventHandler) => {
    const component = React.forwardRef<HTMLDivElement>((props, ref) => (
      // We need to add the tabIndex to make sure it is focusable, otherwise we can't get key events
      <div
        ref={ref}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        role="presentation"
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      />
    ));
    component.displayName = 'ItemListOuterElement';
    return component;
  });

  getInnerElement = memoize(() => {
    const component = React.forwardRef<HTMLDivElement>((props, ref) => (
      <div
        className="item-list-inner-element"
        ref={ref}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      />
    ));
    component.displayName = 'ItemListInnerElement';
    return component;
  });

  getItemData = memoize((items: T[], selectedRanges: Range[]) => ({
    items,
    selectedRanges,
  }));

  focus(): void {
    this.listContainer.current?.focus();
  }

  getElement(itemIndex: number): Element | null {
    if (this.listContainer.current == null) {
      return null;
    }

    const { focusSelector } = this.props;
    const { overscanStartIndex } = this.state;
    const elements = this.listContainer.current.querySelectorAll(focusSelector);
    const elementIndex = itemIndex - overscanStartIndex;
    return elements[elementIndex];
  }

  focusItem(itemIndex: number): void {
    const { disableSelect } = this.props;
    if (disableSelect) return;
    const element = this.getElement(itemIndex);
    if (element instanceof HTMLElement) {
      element.focus();
    }
  }

  scrollToItem(itemIndex: number): void {
    const element = this.getElement(itemIndex);
    if (element != null) {
      element.scrollIntoView({ block: 'center' });
    }
  }

  handleItemDoubleClick(itemIndex: number): void {
    const { isMultiSelect, onSelect } = this.props;

    if (isMultiSelect) {
      this.setState(
        ({ selectedRanges }) => ({
          selectedRanges: RangeUtils.selectRange(selectedRanges, [
            itemIndex,
            itemIndex,
          ]),
        }),
        () => {
          onSelect(itemIndex);
        }
      );
    }
  }

  handleItemMouseDown(index: number, e: React.MouseEvent): void {
    const { selectedRanges } = this.state;

    if (
      e.target instanceof HTMLElement &&
      ['button', 'select', 'input', 'textarea'].indexOf(
        e.target.tagName.toLowerCase()
      ) !== -1
    ) {
      // allow these elements to do their own behaviours
      return;
    }

    if (e.button === 2 && selectedRanges.length === 0) {
      // allow right click to act as a selection if selection is empty
      this.focusItem(index);
      this.selectItem(index);
      return;
    }

    if (e.button != null && e.button !== 0) {
      return;
    }

    this.setState({ mouseDownIndex: index });

    window.addEventListener('mouseup', this.handleWindowMouseUp);

    // Leave selection until mouse up, to allow for dragging behaviour
  }

  handleItemBlur(itemIndex: number, e: React.FocusEvent): void {
    log.debug2('item blur', itemIndex, e.currentTarget, e.relatedTarget);
    if (
      !e.relatedTarget ||
      (this.listContainer.current &&
        e.relatedTarget instanceof HTMLElement &&
        !this.listContainer.current.contains(e.relatedTarget))
    ) {
      // Next focused element is outside of the ItemList
      this.setState({ focusIndex: null });
    }
  }

  handleItemFocus(itemIndex: number, e: React.FocusEvent): void {
    log.debug2('item focus', itemIndex, e.target);
    this.setState(state => {
      const { focusIndex } = state;
      if (focusIndex !== itemIndex) {
        return { focusIndex: itemIndex };
      }
      return null;
    });
  }

  handleItemMouseMove(itemIndex: number, e: React.MouseEvent): void {
    const { isDragSelect, isMultiSelect, disableSelect } = this.props;
    const { mouseDownIndex, selectedRanges } = this.state;

    if (mouseDownIndex == null || disableSelect) return;

    this.setState({ isDragging: true });

    if (isDragSelect || mouseDownIndex === itemIndex) {
      this.focusItem(itemIndex);

      if (isMultiSelect) {
        if (
          !isDragSelect &&
          !this.getItemSelected(itemIndex, selectedRanges) &&
          !ContextActionUtils.isModifierKeyDown(e)
        ) {
          // If there's already a selection and they select outside of that range while dragging without a modifier key, start a new selection with just the new item
          this.deselectAll();
        }
        this.selectRange([
          Math.min(mouseDownIndex, itemIndex),
          Math.max(mouseDownIndex, itemIndex),
        ]);
      } else {
        this.toggleSelect(
          itemIndex,
          e.shiftKey,
          ContextActionUtils.isModifierKeyDown(e)
        );
      }
    }
  }

  handleItemMouseUp(index: number, e: React.MouseEvent): void {
    const { isMultiSelect, onSelect } = this.props;
    const { mouseDownIndex, isDragging } = this.state;

    if (
      e.target instanceof HTMLElement &&
      ['button', 'select', 'input', 'textarea'].indexOf(
        e.target.tagName.toLowerCase()
      ) !== -1
    ) {
      return;
    }

    if (mouseDownIndex === index && !isDragging) {
      this.focusItem(index);
      this.toggleSelect(
        index,
        e.shiftKey,
        ContextActionUtils.isModifierKeyDown(e)
      );
      if (!isMultiSelect) {
        onSelect(index);
      }
    }

    this.setState({ mouseDownIndex: null, isDragging: false });
  }

  handleItemsRendered({ overscanStartIndex }: ListOnItemsRenderedProps): void {
    this.setState({ overscanStartIndex });
  }

  handleResize({ height }: Size): void {
    this.setState({ height });
  }

  handleMouseLeave(): void {
    this.setState({ mouseDownIndex: null });
  }

  handleWindowMouseUp(): void {
    this.setState({ mouseDownIndex: null, isDragging: false });
    window.removeEventListener('mouseup', this.handleWindowMouseUp);
  }

  handleKeyDown(e: React.KeyboardEvent): void {
    const { isMultiSelect, itemCount, onSelect } = this.props;
    const { focusIndex: oldFocus } = this.state;
    let newFocus = oldFocus;

    if (e.key === 'Enter' || e.key === ' ') {
      if (!isMultiSelect && newFocus != null) {
        this.setState({ selectedRanges: [[newFocus, newFocus]] }, () => {
          if (newFocus != null) {
            onSelect(newFocus);
          }
        });
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      if (newFocus != null && newFocus >= 0) {
        newFocus = Math.max(0, newFocus - 1);
      } else {
        newFocus = itemCount - 1;
      }
    } else if (e.key === 'ArrowDown') {
      if (newFocus != null && newFocus >= 0) {
        newFocus = Math.min(newFocus + 1, itemCount - 1);
      } else {
        newFocus = 0;
      }
    } else {
      return;
    }

    if (oldFocus !== newFocus) {
      e.stopPropagation();
      e.preventDefault();

      this.focusItem(newFocus);

      const { selectedRanges } = this.state;
      if (e.shiftKey && selectedRanges.length > 0) {
        const lastRange = selectedRanges[selectedRanges.length - 1];
        this.selectRange([
          Math.min(newFocus, lastRange[0]),
          Math.max(newFocus, lastRange[1]),
        ]);
      } else {
        this.deselectAll();
        if (newFocus !== null) {
          this.selectItem(newFocus);
        } else {
          this.listContainer.current?.focus();
        }
      }

      this.scrollIntoView(newFocus);
    }
  }

  handleScroll({
    scrollUpdateWasRequested,
    scrollOffset,
  }: ListOnScrollProps): void {
    this.setState(state => {
      if (scrollUpdateWasRequested) {
        // The scroll was caused by scrollTo() or scrollToItem()
        // Don't re-calc isStuckToBottom
        return { scrollOffset } as ItemListState;
      }

      const { isStickyBottom } = this.props;
      const { height } = state;

      const isStuckToBottom =
        isStickyBottom && this.isListAtBottom({ scrollOffset, height });
      return { isStuckToBottom, scrollOffset } as ItemListState;
    });
  }

  scrollToBottom(): void {
    const { itemCount } = this.props;
    if (this.list.current) {
      this.list.current.scrollToItem(itemCount);
    }
  }

  scrollIntoView(itemIndex: number): void {
    if (this.list.current) {
      this.list.current.scrollToItem(itemIndex);
    }
  }

  /**
   * @param index The index to toggle selection for
   * @param isShiftDown True if the shift modifier key is down
   * @param isModifierDown True if the meta modifier key is down
   * @param isDeselectable True if item should be deselected if already selected
   */
  toggleSelect(
    index: number,
    isShiftDown: boolean,
    isModifierDown: boolean,
    isDeselectable = true
  ): void {
    const { isMultiSelect } = this.props;
    const { selectedRanges } = this.state;

    if (isMultiSelect && isShiftDown && selectedRanges.length > 0) {
      const lastRange = selectedRanges[selectedRanges.length - 1];
      this.selectRange([
        Math.min(lastRange[0], index),
        Math.max(index, lastRange[1]),
      ]);
    } else if (
      isMultiSelect &&
      selectedRanges.length === 1 &&
      selectedRanges[0][0] === index &&
      selectedRanges[0][1] === index
    ) {
      if (isDeselectable) {
        this.deselectItem(index);
      }
    } else if (isMultiSelect && isModifierDown) {
      if (this.getItemSelected(index, selectedRanges)) {
        if (isDeselectable) {
          this.deselectItem(index);
        }
      } else {
        this.selectItem(index);
      }
    } else {
      this.deselectAll();
      this.selectItem(index);
    }
  }

  deselectAll(): void {
    const { itemCount } = this.props;
    this.deselectRange([0, itemCount]);
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

  selectItem(index: number): void {
    const { disableSelect } = this.props;
    if (disableSelect) return;

    this.selectRange([index, index]);
  }

  selectRange(range: Range): void {
    RangeUtils.validateRange(range);

    this.setState(({ selectedRanges }) => ({
      selectedRanges: RangeUtils.selectRange(selectedRanges, range),
    }));
  }

  setSelectedRanges(selectedRanges: Range[]): void {
    this.setState({ selectedRanges });
  }

  sendViewportUpdate(): void {
    const { scrollOffset, height } = this.state;
    if (scrollOffset != null && height != null) {
      const { onViewportChange, rowHeight } = this.props;
      const topRow = Math.floor(scrollOffset / rowHeight);
      const bottomRow = topRow + Math.ceil(height / rowHeight);
      onViewportChange(topRow, bottomRow);
    }
  }

  isListAtBottom(
    {
      scrollOffset,
      height,
    }: Pick<ItemListState, 'scrollOffset' | 'height'> = this.state
  ): boolean {
    if (height == null || scrollOffset == null) {
      return false;
    }

    const { itemCount, rowHeight } = this.props;
    return scrollOffset + height >= itemCount * rowHeight;
  }

  renderInnerElement({
    index: itemIndex,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }): React.ReactElement | null {
    const { items, offset, renderItem, disableSelect } = this.props;
    const { focusIndex, selectedRanges } = this.state;
    if (itemIndex < offset || itemIndex >= offset + items.length) {
      return null;
    }

    const item = items[itemIndex - offset];
    return this.getCachedItem(
      itemIndex,
      itemIndex,
      item,
      itemIndex === focusIndex && !disableSelect,
      this.getItemSelected(itemIndex, selectedRanges),
      renderItem,
      style,
      disableSelect
    );
  }

  render(): JSX.Element {
    const { items, itemCount, overscanCount, rowHeight } = this.props;
    const { selectedRanges } = this.state;
    return (
      <AutoSizer className="item-list-auto-sizer" onResize={this.handleResize}>
        {({ width, height }) => (
          <List
            className="item-list-scroll-pane"
            height={height}
            width={width}
            itemCount={itemCount}
            itemSize={rowHeight}
            // This prop isn't actually used by us, it is passed to the render function by react-window
            // Used here to force a re-render of the List component.
            // Otherwise it doesn't know to call the render again when selection changes
            itemData={this.getItemData(items, selectedRanges)}
            onScroll={this.handleScroll}
            onItemsRendered={this.handleItemsRendered}
            ref={this.list}
            outerElementType={this.getOuterElement(this.handleKeyDown)}
            outerRef={this.listContainer}
            innerElementType={this.getInnerElement()}
            overscanCount={overscanCount}
          >
            {this.renderInnerElement}
          </List>
        )}
      </AutoSizer>
    );
  }
}

export default ItemList;
