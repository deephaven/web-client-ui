import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import memoize from 'memoizee';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import Log from '@deephaven/log';
import { RangeUtils } from '@deephaven/utils';
import ItemListItem from './ItemListItem';
import { ContextActionUtils } from './context-actions';
import './ItemList.scss';

const log = Log.module('ItemList');

/**
 * Show items in a long scrollable list.
 * Can be navigated via keyboard or mouse.
 */
class ItemList extends PureComponent {
  static CACHE_SIZE = 1000;

  static DEFAULT_ROW_HEIGHT = 20;

  // By drawing an additional 10 items on each side, tab/keyboard navigation works better (as the next element exists)
  static DEFAULT_OVERSCAN = 10;

  static renderItem({ item }) {
    return (
      <div className="item-list-item-content">
        {item && (item.displayValue || item.value || item)}
      </div>
    );
  }

  constructor(props) {
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
      keyboardIndex: null,
      mouseDownIndex: null,
      selectedRanges,
      overscanStartIndex: null,
      height: null,
      isDragging: false,
      isStuckToBottom: isStickyBottom,
      scrollOffset: null,
    };
  }

  componentDidMount() {
    const { isStickyBottom } = this.props;
    if (isStickyBottom && !this.isListAtBottom()) {
      this.scrollToBottom();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { selectedRanges: propSelectedRanges } = this.props;
    const {
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
  }

  componentWillUnmount() {
    window.removeEventListener('mouseup', this.handleWindowMouseUp);
  }

  setKeyboardIndex(keyboardIndex) {
    this.setState({ keyboardIndex });
  }

  getItemSelected = memoize(
    (index, selectedRanges) => RangeUtils.isSelected(selectedRanges, index),
    { max: ItemList.CACHE_SIZE }
  );

  getCachedItem = memoize(
    (
      itemIndex,
      key,
      item,
      isKeyboardSelected,
      isSelected,
      renderItem,
      style,
      onKeyboardSelect,
      disableSelect
    ) => {
      const content = renderItem({
        item,
        itemIndex,
        isKeyboardSelected,
        isSelected,
        style,
      });

      return (
        <ItemListItem
          onDoubleClick={this.handleItemDoubleClick}
          onMouseDown={this.handleItemMouseDown}
          onFocus={this.handleItemFocus}
          onBlur={this.handleItemBlur}
          onKeyboardSelect={onKeyboardSelect}
          disableSelect={disableSelect}
          onMouseMove={this.handleItemMouseMove}
          onMouseUp={this.handleItemMouseUp}
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
    { max: ItemList.CACHE_SIZE }
  );

  getOuterElement = memoize(onKeyDown => {
    const component = React.forwardRef((props, ref) => (
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
    const component = React.forwardRef((props, ref) => (
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

  getOuterElement = memoize(onKeyDown => {
    const component = React.forwardRef((props, ref) => (
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

  focus() {
    if (this.listContainer.current != null) {
      this.listContainer.current.focus();
    }
  }

  getElement(itemIndex) {
    if (this.listContainer.current == null) {
      return null;
    }

    const { focusSelector } = this.props;
    const { overscanStartIndex } = this.state;
    const elements = this.listContainer.current.querySelectorAll(focusSelector);
    const elementIndex = itemIndex - overscanStartIndex;
    return elements[elementIndex];
  }

  focusItem(itemIndex) {
    const { disableSelect } = this.props;
    if (disableSelect) return;
    const element = this.getElement(itemIndex);
    if (element != null) {
      element.focus();
    }
  }

  scrollToItem(itemIndex) {
    const element = this.getElement(itemIndex);
    if (element != null) {
      element.scrollIntoView({ block: 'center' });
    }
  }

  handleItemDoubleClick(itemIndex) {
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

  handleItemMouseDown(index, e) {
    const { selectedRanges } = this.state;

    if (
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

    this.setState({ keyboardIndex: index, mouseDownIndex: index });

    window.addEventListener('mouseup', this.handleWindowMouseUp);

    // Leave selection until mouse up, to allow for dragging behaviour
  }

  handleItemBlur(itemIndex, e) {
    log.debug2('item blur', itemIndex, e.currentTarget, e.relatedTarget);
    if (
      !e.relatedTarget ||
      (this.listContainer.current &&
        !this.listContainer.current.contains(e.relatedTarget))
    ) {
      // Next focused element is outside of the ItemList
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

  handleItemMouseMove(itemIndex, e) {
    const { isDragSelect, isMultiSelect, disableSelect } = this.props;
    const { mouseDownIndex, selectedRanges } = this.state;

    if (mouseDownIndex == null || disableSelect) return;

    this.setState({ keyboardIndex: itemIndex, isDragging: true });

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

  handleItemMouseUp(index, e) {
    const { isMultiSelect, onSelect } = this.props;
    const { mouseDownIndex, isDragging } = this.state;

    if (
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

  handleItemsRendered({ overscanStartIndex }) {
    this.setState({ overscanStartIndex });
  }

  handleResize({ height }) {
    this.setState({ height });
  }

  handleMouseLeave() {
    this.setState({ mouseDownIndex: null });
  }

  handleWindowMouseUp() {
    this.setState({ mouseDownIndex: null, isDragging: false });
    window.removeEventListener('mouseup', this.handleWindowMouseUp);
  }

  handleKeyDown(e) {
    const { isMultiSelect, itemCount, onSelect } = this.props;
    const { keyboardIndex: oldFocus } = this.state;
    let newFocus = oldFocus;

    if (e.key === 'Enter' || e.key === ' ') {
      if (!isMultiSelect) {
        this.setState({ selectedRanges: [[newFocus, newFocus]] }, () => {
          onSelect(newFocus);
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
    }

    if (oldFocus !== newFocus) {
      e.stopPropagation();
      e.preventDefault();

      this.focusItem(newFocus);

      this.setState({ keyboardIndex: newFocus });

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
          this.listContainer.current.focus();
        }
      }

      this.scrollIntoView(newFocus);
    }
  }

  handleScroll({ scrollUpdateWasRequested, scrollOffset }) {
    this.setState(state => {
      if (scrollUpdateWasRequested) {
        // The scroll was caused by scrollTo() or scrollToItem()
        // Don't re-calc isStuckToBottom
        return { scrollOffset };
      }

      const { isStickyBottom } = this.props;
      const { height } = state;

      const isStuckToBottom =
        isStickyBottom && this.isListAtBottom({ scrollOffset, height });
      return { isStuckToBottom, scrollOffset };
    });
  }

  scrollToBottom() {
    const { itemCount } = this.props;
    if (this.list.current) {
      this.list.current.scrollToItem(itemCount);
    }
  }

  scrollIntoView(itemIndex) {
    if (this.list.current) {
      this.list.current.scrollToItem(itemIndex);
    }
  }

  /**
   * @param {number} index The index to toggle selection for
   * @param {boolean} isShiftDown True if the shift modifier key is down
   * @param {boolean} isModifierDown True if the meta modifier key is down
   * @param {boolean} isDeselectable True if item should be deselected if already selected
   */
  toggleSelect(index, isShiftDown, isModifierDown, isDeselectable = true) {
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

  deselectAll() {
    const { itemCount } = this.props;
    this.deselectRange([0, itemCount]);
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

  selectItem(index) {
    const { disableSelect } = this.props;
    if (disableSelect) return;

    this.selectRange([index, index]);
  }

  selectRange(range) {
    RangeUtils.validateRange(range);

    this.setState(({ selectedRanges }) => ({
      selectedRanges: RangeUtils.selectRange(selectedRanges, range),
    }));
  }

  setSelectedRanges(selectedRanges) {
    this.setState({ selectedRanges });
  }

  sendViewportUpdate() {
    const { scrollOffset, height } = this.state;
    if (scrollOffset != null && height != null) {
      const { onViewportChange, rowHeight } = this.props;
      const topRow = Math.floor(scrollOffset / rowHeight);
      const bottomRow = topRow + Math.ceil(height / rowHeight);
      onViewportChange(topRow, bottomRow);
    }
  }

  isListAtBottom({ scrollOffset, height } = this.state) {
    if (height == null || scrollOffset == null) {
      return false;
    }

    const { itemCount, rowHeight } = this.props;
    return scrollOffset + height >= itemCount * rowHeight;
  }

  renderInnerElement({ index: itemIndex, style }) {
    const {
      items,
      offset,
      renderItem,
      onKeyboardSelect,
      disableSelect,
    } = this.props;
    const { keyboardIndex, selectedRanges } = this.state;
    if (itemIndex < offset || itemIndex >= offset + items.length) {
      return null;
    }

    const item = items[itemIndex - offset];
    return this.getCachedItem(
      itemIndex,
      itemIndex,
      item,
      itemIndex === keyboardIndex && !disableSelect,
      this.getItemSelected(itemIndex, selectedRanges),
      renderItem,
      style,
      onKeyboardSelect,
      disableSelect
    );
  }

  render() {
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
            itemData={items}
            onScroll={this.handleScroll}
            onItemsRendered={this.handleItemsRendered}
            ref={this.list}
            outerElementType={this.getOuterElement(this.handleKeyDown)}
            outerRef={this.listContainer}
            innerElementType={this.getInnerElement()}
            overscanCount={overscanCount}
            // This prop isn't actually used, other than forcing a re-render of the List component.
            // Otherwise it doesn't know to call the render again when selection changes
            selectedRanges={selectedRanges}
          >
            {this.renderInnerElement}
          </List>
        )}
      </AutoSizer>
    );
  }
}

ItemList.propTypes = {
  // Total item count
  itemCount: PropTypes.number.isRequired,
  rowHeight: PropTypes.number,

  // Offset of the top item in the items array
  offset: PropTypes.number,
  // Item object format expected by the default renderItem function
  // Can be anything as long as it's supported by the renderItem
  // Default renderItem will look for a `displayValue` property, fallback
  // to the `value` property, or stringify the object if neither are defined
  items: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.shape({
        value: PropTypes.any,
        displayValue: PropTypes.string,
      }),
      PropTypes.any,
    ])
  ),

  // Whether to allow dragging to change the selection after clicking
  isDragSelect: PropTypes.bool,

  // Whether to allow multiple selections in this item list
  isMultiSelect: PropTypes.bool,

  // Set to true if you want the list to scroll when new items are added and it's already at the bottom
  isStickyBottom: PropTypes.bool,

  // Fired when an item gets selected via keyboard
  onKeyboardSelect: PropTypes.func,

  // Fired when an item is clicked. With multiple selection, fired on double click.
  onSelect: PropTypes.func,
  onSelectionChange: PropTypes.func,
  onViewportChange: PropTypes.func,

  overscanCount: PropTypes.number,

  selectedRanges: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),

  disableSelect: PropTypes.bool,

  renderItem: PropTypes.func,

  focusSelector: PropTypes.string,
};

ItemList.defaultProps = {
  offset: 0,
  items: [],
  rowHeight: ItemList.DEFAULT_ROW_HEIGHT,

  isDragSelect: true,

  isMultiSelect: false,

  isStickyBottom: false,

  disableSelect: false,

  onKeyboardSelect: () => {},
  onSelect: () => {},
  onSelectionChange: () => {},
  onViewportChange: () => {},

  overscanCount: ItemList.DEFAULT_OVERSCAN,

  renderItem: ItemList.renderItem,
  selectedRanges: [],

  focusSelector: '.item-list-item',
};

export default ItemList;
