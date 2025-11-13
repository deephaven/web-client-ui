import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  type KeyboardSensorOptions,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragMoveEvent,
  type DragEndEvent,
  MeasuringStrategy,
  DragOverlay,
  type DropAnimation,
  defaultDropAnimation,
  type Modifier,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flattenTree, getChildCount, getProjection } from './utilities';
import type {
  FlattenedItem,
  SensorContext,
  TreeItem as TreeItemType,
} from './types';
import { sortableTreeKeyboardCoordinates } from './keyboardCoordinates';
import PointerSensorWithInteraction from './PointerSensorWithInteraction';
import { TreeItem, type TreeItemRenderFn } from './TreeItem';

const MEASURING = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

const CONSTRAINT = {
  activationConstraint: {
    distance: 5,
  },
};

// Disabling pointer events allows us to use scroll wheel while dragging
const DRAG_OVERLAY_STYLE = { pointerEvents: 'none' } as const;

const dropAnimationConfig: DropAnimation = {
  keyframes({ transform }) {
    return [
      { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
      { opacity: 0, transform: CSS.Transform.toString(transform.final) },
    ];
  },
  easing: 'ease-out',
  sideEffects({ active }) {
    active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: defaultDropAnimation.duration,
      easing: defaultDropAnimation.easing,
    });
  },
};

/**
 * This adjusts the transform to move to the cursor if it gets shifted due to multi-select.
 * With multi-select, the selected items (except dragged) are removed on drag.
 * This can cause the overlay item to disconnect from the cursor in some cases.
 * E.g. select first 3 items, start dragging from 3rd item.
 * Without this modifier, the drag overlay will be shifted 60px up from the cursor after the items are removed.
 *
 * This assumes all items are the same height as the dragged item
 * @param args Modifier args from dnd-kit
 * @returns Transform so that the dragged item stays on the cursor
 */
function adjustToCursor(args: Parameters<Modifier>[0]): {
  y: number;
  x: number;
  scaleX: number;
  scaleY: number;
} {
  if (
    adjustToCursor.offsetY == null &&
    args.activeNodeRect &&
    args.activatorEvent instanceof PointerEvent
  ) {
    adjustToCursor.offsetY =
      Math.floor(
        (args.activatorEvent.clientY - args.activeNodeRect.top) /
          args.activeNodeRect.height
      ) * args.activeNodeRect.height;
  }

  if (!args.activeNodeRect) {
    adjustToCursor.offsetY = null;
  }

  return {
    ...args.transform,
    y: args.transform.y + (adjustToCursor.offsetY ?? 0),
  };
}

// Used to track the offset for adjustToCursor
// Once drag starts, set this. Once it ends, null this
// Kind of hacky to store it as a property on the function,
// but avoids a singleton state or needing hooks to maintain this.
// The logic came from the dnd-kit example.
adjustToCursor.offsetY = null as number | null;

// From https://github.com/clauderic/dnd-kit/pull/334
const fixCursorSnapOffset: CollisionDetection = args => {
  // Bail out if keyboard activated
  if (!args.pointerCoordinates) {
    return closestCenter(args);
  }
  const { x, y } = args.pointerCoordinates;
  const { width, height } = args.collisionRect;
  const updated = {
    ...args,
    // The collision rectangle is broken when using adjustToCursor. Reset
    // the collision rectangle based on pointer location and overlay size.
    collisionRect: {
      width,
      height,
      bottom: y + height / 2,
      left: x - width / 2,
      right: x + width / 2,
      top: y - height / 2,
    },
  };
  return closestCenter(updated);
};

type Props<T> = React.PropsWithChildren<{
  items: TreeItemType<T>[];
  indentationWidth?: number;
  onDragStart?: (id: string, event: DragStartEvent) => void;
  onDragEnd?: (from: FlattenedItem<T>, to: FlattenedItem<T>) => void;
  renderItem: TreeItemRenderFn<T>;
}>;

export default function SortableTreeDndContext<T>({
  items,
  indentationWidth = 30,
  onDragStart,
  onDragEnd,
  children,
  renderItem,
}: Props<T>): JSX.Element {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  const flattenedItems = useMemo(() => {
    const flattenedTree = flattenTree(items);

    if (activeId != null) {
      return flattenedTree.filter(
        ({ id, selected }) => id === activeId || !selected
      );
    }

    return flattenedTree;
  }, [activeId, items]);

  const activeItem =
    activeId != null ? flattenedItems.find(({ id }) => id === activeId) : null;

  const sensorContext: SensorContext = useRef({
    items: flattenedItems,
    offset: offsetLeft,
  });
  const keyboardOptions = useMemo(
    () =>
      ({
        coordinateGetter: sortableTreeKeyboardCoordinates(
          sensorContext,
          indentationWidth
        ),
        keyboardCodes: {
          // Default is space and enter for start/end,
          // but enter is used to select items from the search list
          start: ['Space'],
          cancel: ['Escape'],
          end: ['Space'],
        },
      }) satisfies KeyboardSensorOptions,
    [indentationWidth]
  );

  const sensors = useSensors(
    useSensor(PointerSensorWithInteraction, CONSTRAINT),
    useSensor(KeyboardSensor, keyboardOptions)
  );

  const sortedIds = useMemo(
    () => flattenedItems.map(({ id }) => id),
    [flattenedItems]
  );

  useEffect(() => {
    sensorContext.current = {
      items: flattenedItems,
      offset: offsetLeft,
    };
  }, [flattenedItems, offsetLeft]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const {
        active: { id: newActiveId },
      } = event;
      setActiveId(newActiveId as string);
      onDragStart?.(newActiveId as string, event);

      document.body.style.setProperty('cursor', 'grabbing');
    },
    [onDragStart]
  );

  const handleDragMove = useCallback(({ delta }: DragMoveEvent) => {
    setOffsetLeft(delta.x);
  }, []);

  const resetState = useCallback(() => {
    setActiveId(null);
    setOffsetLeft(0);

    document.body.style.setProperty('cursor', '');
  }, []);

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      const projected =
        active.id != null && over?.id != null
          ? getProjection(
              flattenedItems,
              active.id as string,
              over.id as string,
              (active.rect.current.translated?.left ?? 0) -
                (active.rect.current.initial?.left ?? 0),
              indentationWidth
            )
          : null;
      if (projected && over) {
        const { depth, parentId } = projected;

        const clonedItems: FlattenedItem<T>[] = JSON.parse(
          JSON.stringify(flattenedItems)
        );
        const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
        const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);
        const activeTreeItem = clonedItems[activeIndex];

        clonedItems[activeIndex] = { ...activeTreeItem, depth, parentId };

        onDragEnd?.(activeTreeItem, {
          ...clonedItems[overIndex],
          parentId: projected.parentId,
        });
      }
      resetState();
    },
    [flattenedItems, indentationWidth, onDragEnd, resetState]
  );

  const handleDragCancel = useCallback(() => {
    resetState();
  }, [resetState]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={fixCursorSnapOffset}
      measuring={MEASURING}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
        {children}
        {createPortal(
          <DragOverlay
            dropAnimation={dropAnimationConfig}
            modifiers={[adjustToCursor]}
            className="visibility-ordering-list"
            style={DRAG_OVERLAY_STYLE}
          >
            {activeId != null && activeItem ? (
              <TreeItem
                depth={activeItem.depth}
                clone
                childCount={getChildCount(items, activeId) + 1}
                value={activeId.toString()}
                renderItem={renderItem}
                item={activeItem}
              />
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </SortableContext>
    </DndContext>
  );
}
