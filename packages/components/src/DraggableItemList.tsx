import React, { PureComponent } from 'react';
import classNames from 'classnames';
import memoize from 'memoizee';
import { Draggable, Droppable, DraggableChildrenFn } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsGripper } from '@deephaven/icons';
import { RangeUtils, Range } from '@deephaven/utils';
import ItemList, {
  RenderItemProps,
  DefaultListItem,
  ItemListProps,
} from './ItemList';
import { Tooltip } from './popper';
import './DraggableItemList.scss';

export type DraggableRenderItemProps<T> = RenderItemProps<T> & {
  isClone?: boolean;
  selectedCount?: number;
};

type DraggableRenderItemFn<T> = (
  props: DraggableRenderItemProps<T>
) => React.ReactNode;

type DraggableItemListProps<T> = Omit<
  ItemListProps<T>,
  'overscanCount' | 'focusSelector' | 'isDragSelect'
> & {
  className: string;
  draggingItemClassName: string;
  isDropDisabled: boolean;
  // Whether to allow dragging items from this list
  isDragDisabled: boolean;

  renderItem: DraggableRenderItemFn<T>;
  style: React.CSSProperties;

  // The prefix to add to all draggable item IDs
  draggablePrefix: string;
  // The ID to give the droppable list
  droppableId: string;

  'data-testid'?: string;
};

type DraggableItemListState = {
  selectedCount: number;
};

/**
 * Show a draggable item list. It _must_ be used within a `DragDropContext`.
 * This implementation uses react-beautiful-dnd for handling dragging and dropping of items.
 * We use ItemList to handle selection for multi drag and drop (not built in to react-beautiful-dnd).
 * One caveat with the use of react-beautiful-dnd is that it doesn't allow a drag to be initiated while
 * using a modifier key: https://github.com/atlassian/react-beautiful-dnd/issues/1678
 */
class DraggableItemList<T> extends PureComponent<
  DraggableItemListProps<T>,
  DraggableItemListState
> {
  static DEFAULT_ROW_HEIGHT = 30;

  static defaultProps = {
    className: '',
    draggingItemClassName: '',
    offset: 0,
    items: [],
    rowHeight: DraggableItemList.DEFAULT_ROW_HEIGHT,
    isDeselectOnClick: true,
    isDoubleClickSelect: true,
    isDropDisabled: false,
    isDragDisabled: false,
    isMultiSelect: false,
    isStickyBottom: false,
    disableSelect: false,
    style: null,
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
    renderItem: DraggableItemList.renderItem,
    selectedRanges: [],
    draggablePrefix: 'draggable-item',
    droppableId: 'droppable-item-list',
    'data-testid': undefined,
  };

  static renderHandle(): JSX.Element {
    return (
      <div>
        <Tooltip>Drag to re-order</Tooltip>
        <FontAwesomeIcon icon={vsGripper} />
      </div>
    );
  }

  static renderBadge({ text }: { text?: string }): React.ReactNode {
    return text != null && text.length > 0 ? (
      <span className="number-badge">{text}</span>
    ) : null;
  }

  static renderTextItem({
    text,
    badgeText = '',
    className = '',
  }: {
    text?: string;
    badgeText?: string;
    className: string;
  }): JSX.Element {
    return (
      <div
        className={classNames(
          'item-list-item-content',
          'draggable-item-list-item-content',
          className
        )}
      >
        <span className="title">{text}</span>
        {DraggableItemList.renderBadge({ text: badgeText })}
        {DraggableItemList.renderHandle()}
      </div>
    );
  }

  static renderItem<P extends DefaultListItem>({
    item,
    isClone,
    selectedCount,
  }: DraggableRenderItemProps<P>): JSX.Element {
    const text =
      item != null ? item.displayValue ?? item.value ?? `${item}` : '';
    const badgeText =
      isClone !== undefined && isClone ? `${selectedCount}` : '';
    const className =
      isClone !== undefined && isClone ? 'item-list-item-clone' : '';
    return DraggableItemList.renderTextItem({ text, badgeText, className });
  }

  static getDraggableId(draggablePrefix: string, itemIndex: number): string {
    return `${draggablePrefix}/${itemIndex}`;
  }

  static getDraggableIndex(draggableId: string): number {
    const num = draggableId.split('/').pop();
    return parseInt(num !== undefined ? num : '', 10);
  }

  constructor(props: DraggableItemListProps<T>) {
    super(props);

    this.handleSelectionChange = this.handleSelectionChange.bind(this);

    this.itemList = React.createRef();

    this.state = {
      selectedCount: 0,
    };
  }

  itemList: React.RefObject<ItemList<T>>;

  selectItem(itemIndex: number): void {
    this.itemList.current?.selectItem(itemIndex);
  }

  focusItem(itemIndex: number): void {
    this.itemList.current?.focusItem(itemIndex);
  }

  scrollToItem(itemIndex: number): void {
    this.itemList.current?.scrollToItem(itemIndex);
  }

  getCachedDraggableItem = memoize(
    (
      draggablePrefix: string,
      renderItem: DraggableRenderItemFn<T>,
      item: T,
      itemIndex: number,
      isFocused: boolean,
      isSelected: boolean,
      isDragDisabled: boolean,
      style: React.CSSProperties
    ) => (
      <Draggable
        key={itemIndex}
        draggableId={DraggableItemList.getDraggableId(
          draggablePrefix,
          itemIndex
        )}
        index={itemIndex}
        isDragDisabled={isDragDisabled}
      >
        {provided => (
          <div
            role="menuitem"
            className="draggable-item-list-item"
            ref={provided.innerRef}
            tabIndex={-1}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...provided.draggableProps}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...provided.dragHandleProps}
          >
            {renderItem({
              item,
              itemIndex,
              isFocused,
              isSelected,
              style,
              isClone: false,
            })}
          </div>
        )}
      </Draggable>
    ),
    { max: ItemList.CACHE_SIZE }
  );

  handleSelectionChange(selectedRanges: Range[]): void {
    this.setState({ selectedCount: RangeUtils.count(selectedRanges) });

    const { onSelectionChange } = this.props;
    onSelectionChange(selectedRanges);
  }

  getCachedRenderDraggableItem = memoize(
    (
      draggablePrefix: string,
      isDragDisabled: boolean,
      renderItem: DraggableRenderItemFn<T>
    ) => ({
      item,
      itemIndex,
      isFocused,
      isSelected,
      style,
    }: RenderItemProps<T>) =>
      this.getCachedDraggableItem(
        draggablePrefix,
        renderItem,
        item,
        itemIndex,
        isFocused,
        isSelected,
        isDragDisabled,
        style
      ),
    { max: 1 }
  );

  getCachedRenderClone = memoize(
    (
      draggingItemClassName: string,
      items: readonly T[],
      offset: number,
      renderItem: DraggableRenderItemFn<T>
      // eslint-disable-next-line react/no-unstable-nested-components, react/display-name, react/function-component-definition
    ): DraggableChildrenFn => (provided, snapshot, rubric) => {
      // eslint-disable-next-line react/no-this-in-sfc
      const { selectedCount } = this.state;
      const { draggableProps, dragHandleProps, innerRef } = provided;
      const { index: itemIndex } = rubric.source;
      const item = items[itemIndex - offset];
      return (
        <div
          className={classNames(
            'draggable-item-list-dragging-item-container',
            draggingItemClassName
          )}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...draggableProps}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...dragHandleProps}
          ref={innerRef}
        >
          <div
            className={classNames(
              'draggable-item-list-dragging-item',
              { 'two-dragged': selectedCount === 2 },
              { 'multiple-dragged': selectedCount > 2 }
            )}
          >
            {renderItem({
              item,
              itemIndex,
              isFocused: false,
              isSelected: true,
              style: {},
              isClone: true,
              selectedCount,
            })}
          </div>
        </div>
      );
    },
    { max: 1 }
  );

  render(): JSX.Element {
    const {
      className,
      draggablePrefix,
      draggingItemClassName,
      droppableId,
      isDoubleClickSelect,
      isDragDisabled,
      isDropDisabled,
      isMultiSelect,
      isStickyBottom,
      itemCount,
      items,
      offset,
      onFocusChange,
      onSelect,
      onViewportChange,
      renderItem,
      rowHeight,
      selectedRanges,
      style,
      'data-testid': dataTestId,
    } = this.props;
    return (
      <Droppable
        isDropDisabled={isDropDisabled}
        droppableId={droppableId}
        mode="virtual"
        renderClone={this.getCachedRenderClone(
          draggingItemClassName,
          items,
          offset,
          renderItem
        )}
        data-testid={dataTestId}
      >
        {(provided, snapshot) => (
          <div
            role="menu"
            className={classNames('draggable-item-list', className, {
              'is-drop-disabled': isDropDisabled,
              'is-drag-disabled': isDragDisabled,
              'is-dragging-from-this': snapshot.draggingFromThisWith,
              'is-dragging-over': snapshot.isDraggingOver,
              'is-dropping': snapshot.draggingOverWith,
            })}
            style={style}
            ref={provided.innerRef}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...provided.droppableProps}
          >
            <ItemList
              focusSelector=".draggable-item-list-item"
              isDoubleClickSelect={isDoubleClickSelect}
              isDragSelect={false}
              isMultiSelect={isMultiSelect}
              isStickyBottom={isStickyBottom}
              itemCount={itemCount}
              items={items}
              onFocusChange={onFocusChange}
              onSelect={onSelect}
              onSelectionChange={this.handleSelectionChange}
              onViewportChange={onViewportChange}
              offset={offset}
              ref={this.itemList}
              renderItem={this.getCachedRenderDraggableItem(
                draggablePrefix,
                isDragDisabled,
                renderItem
              )}
              rowHeight={rowHeight}
              selectedRanges={selectedRanges}
            />
          </div>
        )}
      </Droppable>
    );
  }
}

export default DraggableItemList;
