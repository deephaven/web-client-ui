/* eslint no-console: "off" */
import React, { Component } from 'react';
import {
  DragDropContext,
  DragStart,
  DragUpdate,
  DropResult,
} from 'react-beautiful-dnd';
import memoize from 'memoizee';
import { DragUtils, DraggableItemList, Range } from '@deephaven/components';
import DraggableListInput from './DraggableListInput';

const DRAG_LIST_TITLES = ['Draggable Only', 'Drag and Drop', 'Droppable Only'];
const DRAG_LIST_PROPS = [
  { isDropDisabled: true },
  {},
  { isDragDisabled: true },
];

const makeItems = (prefix = 'Item', count = 1000) => {
  const items = [];
  for (let i = 0; i < count; i += 1) {
    items.push(`${prefix}-${i}`);
  }
  return items;
};

interface DraggableLists {
  animationFrame: number | null;
}

interface DraggableListsState {
  items: Array<unknown[]>;
  lists: Array<React.RefObject<DraggableListInput>>;
  selectedRanges: Array<Range[]>;
}

class DraggableLists extends Component<
  Record<string, never>,
  DraggableListsState
> {
  static handleDragStart(e: DragStart): void {
    console.log('handleDragStart', e);
  }

  static handleDragUpdate(e: DragUpdate): void {
    console.log('handleDragUpdate', e);
  }

  constructor(props: Record<string, never>) {
    super(props);

    this.handleDragEnd = this.handleDragEnd.bind(this);

    this.animationFrame = null;

    const items = [];
    const selectedRanges = [];
    const lists = [];
    for (let i = 0; i < DRAG_LIST_TITLES.length; i += 1) {
      items[i] = makeItems(DRAG_LIST_TITLES[i]);
      selectedRanges[i] = [];
      lists[i] = React.createRef() as React.RefObject<DraggableListInput>;
    }

    this.state = {
      items,
      lists,
      selectedRanges,
    };
  }

  componentWillUnmount(): void {
    if (this.animationFrame != null) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  handleDragEnd(
    e: DropResult
  ): { items: unknown[][]; selectedRanges: Range[][] } | undefined {
    console.log('handleDragEnd', e);

    const { source, destination } = e;
    if (source == null || destination == null) {
      return;
    }
    const sourceListIndex = DraggableItemList.getDraggableIndex(
      source.droppableId
    );
    const destinationListIndex = DraggableItemList.getDraggableIndex(
      destination.droppableId
    );
    const isSameList = sourceListIndex === destinationListIndex;
    let destinationIndex = destination.index;
    if (isSameList && source.index < destination.index) {
      // react-beautiful-dnd adjusts the index when dragging within a list already, however that only supports single selection
      // We need to change it back to the index we actually want it to drop at before adjusting for the removed source index, as
      // we adjust the index based on all the selected ranges, not just the source.index.
      destinationIndex += 1;
    }
    let insertIndex = destinationIndex;
    this.setState(
      ({ items, selectedRanges }) => {
        const sourceList = [...items[sourceListIndex]];
        const destinationList = isSameList
          ? sourceList
          : [...items[destinationListIndex]];

        const draggedItems = DragUtils.reorder(
          sourceList,
          selectedRanges[sourceListIndex],
          destinationList,
          destinationIndex
        );

        const newItems = [...items];
        newItems[sourceListIndex] = sourceList;
        newItems[destinationListIndex] = destinationList;

        // Select the newly dropped items
        insertIndex = isSameList
          ? DragUtils.adjustDestinationIndex(
              destinationIndex,
              selectedRanges[destinationListIndex]
            )
          : destinationIndex;
        const newSelectedRanges = [...selectedRanges];
        newSelectedRanges[sourceListIndex] = [];
        newSelectedRanges[destinationListIndex] = [
          [insertIndex, insertIndex + draggedItems.length - 1],
        ];
        return { items: newItems, selectedRanges: newSelectedRanges };
      },
      () => {
        if (this.animationFrame != null) {
          cancelAnimationFrame(this.animationFrame);
        }
        this.animationFrame = requestAnimationFrame(() => {
          this.animationFrame = null;

          const { lists } = this.state;
          lists[destinationListIndex]?.current?.focusItem(insertIndex);
        });
      }
    );
  }

  handleSelectionChange(listIndex: number, listSelectedRanges: Range[]): void {
    this.setState(({ selectedRanges }) => {
      const newSelectedRanges = [...selectedRanges];
      newSelectedRanges[listIndex] = listSelectedRanges;
      return { selectedRanges: newSelectedRanges };
    });
  }

  getSelectionChangeHandler = memoize((listIndex: number) =>
    this.handleSelectionChange.bind(this, listIndex)
  );

  getDraggableList = memoize(
    (
      items: unknown[],
      selectedRanges: Range[],
      ref: React.RefObject<DraggableListInput>,
      listIndex: number
    ) => (
      <DraggableListInput
        items={items}
        droppableId={DraggableItemList.getDraggableId('drop-list', listIndex)}
        draggablePrefix={DraggableItemList.getDraggableId(
          'draggable-item',
          listIndex
        )}
        onSelectionChange={this.getSelectionChangeHandler(listIndex)}
        isMultiSelect
        ref={ref}
        selectedRanges={selectedRanges}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...DRAG_LIST_PROPS[listIndex]}
      />
    )
  );

  render(): React.ReactElement {
    const { items, lists, selectedRanges } = this.state;
    return (
      <div className="style-guide-inputs">
        <h2 className="ui-title">Drag and Drop Lists</h2>
        <div className="row">
          <DragDropContext
            onDragStart={DraggableLists.handleDragStart}
            onDragUpdate={DraggableLists.handleDragUpdate}
            onDragEnd={this.handleDragEnd}
          >
            {DRAG_LIST_TITLES.map((title, i) => (
              <div className="col" key={title}>
                <div className="form-group">
                  <h5>{title} List</h5>
                  <div style={{ height: '300px' }}>
                    {this.getDraggableList(
                      items[i],
                      selectedRanges[i],
                      lists[i],
                      i
                    )}
                  </div>
                </div>
              </div>
            ))}
          </DragDropContext>
        </div>
      </div>
    );
  }
}

export default DraggableLists;
