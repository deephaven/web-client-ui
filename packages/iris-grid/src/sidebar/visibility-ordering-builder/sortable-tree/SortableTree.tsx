/* eslint-disable max-classes-per-file */
/* eslint-disable import/prefer-default-export */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverlay,
  DragMoveEvent,
  DragEndEvent,
  DragOverEvent,
  MeasuringStrategy,
  DropAnimation,
  Modifier,
  defaultDropAnimation,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  buildTree,
  flattenTree,
  getProjection,
  getChildCount,
  removeChildrenOf,
} from './utilities';
import type { FlattenedItem, SensorContext, TreeItem } from './types';
import { sortableTreeKeyboardCoordinates } from './keyboardCoordinates';
import { SortableTreeItem } from './SortableTreeItem';

/**
 * An extended "PointerSensor" that prevent some
 * interactive html element(button, input, textarea, select, option...) from dragging
 */
class PointerWithInteraction extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent: event }: PointerEvent) => {
        if (
          !event.isPrimary ||
          event.button !== 0 ||
          isInteractiveElement(event.target as Element)
        ) {
          return false;
        }

        return true;
      },
    },
  ];
}

const INTERACTIVE_ELEMENTS = [
  'button',
  'input',
  'textarea',
  'select',
  'option',
];

function isInteractiveElement(element: Element | null) {
  if (
    element?.tagName != null &&
    INTERACTIVE_ELEMENTS.includes(element.tagName.toLowerCase())
  ) {
    return true;
  }

  return false;
}

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

const dropAnimationConfig: DropAnimation = {
  keyframes({ transform }) {
    return [
      { opacity: 1, transform: CSS.Transform.toString(transform.initial) },
      {
        opacity: 0,
        transform: CSS.Transform.toString({
          ...transform.final,
          x: transform.final.x + 5,
          y: transform.final.y + 5,
        }),
      },
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

interface Props<T> {
  defaultItems: TreeItem<T>[];
  indentationWidth?: number;
  indicator?: boolean;
  onChange?(from: FlattenedItem<T>, to: FlattenedItem<T>): void;
  renderItem(props: {
    clone: boolean;
    childCount?: number;
    value: string;
    item: FlattenedItem<T>;
  }): JSX.Element;
}

export function SortableTree<T>({
  defaultItems,
  indicator = false,
  indentationWidth = 30,
  onChange,
  renderItem,
}: Props<T>): JSX.Element {
  const [items, setItems] = useState(() => defaultItems);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  useEffect(() => {
    setItems(defaultItems);
  }, [defaultItems]);

  const flattenedItems = useMemo(() => {
    const flattenedTree = flattenTree(items);

    return removeChildrenOf(flattenedTree, [activeId ?? '']);
  }, [activeId, items]);
  const projected =
    activeId != null && overId != null
      ? getProjection(
          flattenedItems,
          activeId,
          overId,
          offsetLeft,
          indentationWidth
        )
      : null;
  const sensorContext: SensorContext = useRef({
    items: flattenedItems,
    offset: offsetLeft,
  });
  const keyboardOptions = useMemo(
    () => ({
      coordinateGetter: sortableTreeKeyboardCoordinates(
        sensorContext,
        indicator,
        indentationWidth
      ),
    }),
    [indentationWidth, indicator]
  );

  const sensors = useSensors(
    useSensor(PointerWithInteraction, CONSTRAINT),
    useSensor(KeyboardSensor, keyboardOptions)
  );

  const sortedIds = useMemo(() => flattenedItems.map(({ id }) => id), [
    flattenedItems,
  ]);
  const activeItem =
    activeId != null ? flattenedItems.find(({ id }) => id === activeId) : null;

  useEffect(() => {
    sensorContext.current = {
      items: flattenedItems,
      offset: offsetLeft,
    };
  }, [flattenedItems, offsetLeft]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={MEASURING}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
        <div
          className={classNames(
            'tree-container',
            activeId != null && 'marching-ants'
          )}
        >
          {flattenedItems.map(item => {
            const { id, depth } = item;
            return (
              <SortableTreeItem
                key={id}
                id={id}
                value={id}
                depth={id === activeId && projected ? projected.depth : depth}
                item={item}
                renderItem={renderItem}
              />
            );
          })}
        </div>
        {createPortal(
          <DragOverlay
            dropAnimation={dropAnimationConfig}
            modifiers={indicator ? [adjustTranslate] : undefined}
            className="visibility-ordering-list"
          >
            {activeId != null && activeItem ? (
              <SortableTreeItem
                id={activeId}
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

  function handleDragStart({ active: { id: newActiveId } }: DragStartEvent) {
    setActiveId(newActiveId as string);
    setOverId(newActiveId as string);

    document.body.style.setProperty('cursor', 'grabbing');
  }

  function handleDragMove({ delta }: DragMoveEvent) {
    setOffsetLeft(delta.x);
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverId((over?.id as string) ?? null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    resetState();

    if (projected && over) {
      const { depth, parentId } = projected;

      const clonedItems: FlattenedItem<T>[] = JSON.parse(
        JSON.stringify(flattenTree(items))
      );
      const overIndex = clonedItems.findIndex(({ id }) => id === over.id);
      const activeIndex = clonedItems.findIndex(({ id }) => id === active.id);
      const activeTreeItem = clonedItems[activeIndex];

      clonedItems[activeIndex] = { ...activeTreeItem, depth, parentId };

      onChange?.(activeTreeItem, {
        ...clonedItems[overIndex],
        parentId: projected.parentId,
      });
      const sortedItems = arrayMove(clonedItems, activeIndex, overIndex);
      const newItems = buildTree(sortedItems);

      setItems(newItems);
    }
  }

  function handleDragCancel() {
    resetState();
  }

  function resetState() {
    setOverId(null);
    setActiveId(null);
    setOffsetLeft(0);

    document.body.style.setProperty('cursor', '');
  }
}

const adjustTranslate: Modifier = ({ transform }) => ({
  ...transform,
  y: transform.y - 25,
});
