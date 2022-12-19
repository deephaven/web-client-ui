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
  UniqueIdentifier,
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
  removeItem,
  removeChildrenOf,
  setProperty,
} from './utilities';
import type { FlattenedItem, SensorContext, TreeItem } from './types';
import { sortableTreeKeyboardCoordinates } from './keyboardCoordinates';
import { SortableTreeItem } from './SortableTreeItem';
import type { Props as SortableTreeItemProps } from './SortableTreeItem';
import styles from './TreeItem.module.scss';

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

class KeyboardWithInteraction extends KeyboardSensor {
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

function isInteractiveElement(element: Element | null) {
  const interactiveElements = [
    'button',
    'input',
    'textarea',
    'select',
    'option',
  ];
  if (
    element?.tagName != null &&
    interactiveElements.includes(element.tagName.toLowerCase())
  ) {
    return true;
  }

  return false;
}

const measuring = {
  droppable: {
    strategy: MeasuringStrategy.Always,
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
  collapsible?: boolean;
  defaultItems?: TreeItem<T>[];
  indentationWidth?: number;
  indicator?: boolean;
  removable?: boolean;
  onChange?(from: FlattenedItem<T>, to: FlattenedItem<T>): void;
  onRemove?(item: FlattenedItem<T>): void;
  renderItem(
    props: Required<Omit<SortableTreeItemProps, 'renderItem'>> & {
      item: TreeItem<T>;
    }
  ): React.ReactNode;
}

export function SortableTree<T = undefined>({
  collapsible = false,
  defaultItems = [] as TreeItem<T>[],
  indicator = false,
  indentationWidth = 30,
  removable = false,
  onChange,
  onRemove,
  renderItem,
}: Props<T>): JSX.Element {
  const [items, setItems] = useState(() => defaultItems);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);

  useEffect(() => {
    setItems(defaultItems);
  }, [defaultItems]);

  const flattenedItems = useMemo(() => {
    const flattenedTree = flattenTree(items);
    const collapsedItems = flattenedTree.reduce<UniqueIdentifier[]>(
      (acc, { children, collapsed, id }) =>
        collapsed && children.length ? [...acc, id] : acc,
      []
    );

    return removeChildrenOf(
      flattenedTree,
      activeId != null ? [activeId, ...collapsedItems] : collapsedItems
    );
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
  const [coordinateGetter] = useState(() =>
    sortableTreeKeyboardCoordinates(sensorContext, indicator, indentationWidth)
  );
  const sensors = useSensors(
    useSensor(PointerWithInteraction, {
      activationConstraint: {
        distance: 5,
      },
    })
    // useSensor(KeyboardSensor, {
    //   coordinateGetter,
    // })
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
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
        <div className={classNames(activeId != null && styles.MarchingAnts)}>
          {flattenedItems.map(item => {
            const { id, children, collapsed, depth } = item;
            return (
              <SortableTreeItem
                key={id}
                id={id}
                value={id}
                depth={id === activeId && projected ? projected.depth : depth}
                indentationWidth={indentationWidth}
                indicator={indicator}
                collapsed={Boolean(collapsed && children.length)}
                onCollapse={
                  collapsible && children.length
                    ? () => handleCollapse(id)
                    : undefined
                }
                onRemove={
                  removable && onRemove ? () => handleRemove(id) : undefined
                }
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
          >
            {activeId && activeItem ? (
              <SortableTreeItem
                id={activeId}
                depth={activeItem.depth}
                clone
                childCount={getChildCount(items, activeId) + 1}
                value={activeId.toString()}
                indentationWidth={indentationWidth}
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
    setActiveId(newActiveId);
    setOverId(newActiveId);

    document.body.style.setProperty('cursor', 'grabbing');
  }

  function handleDragMove({ delta }: DragMoveEvent) {
    setOffsetLeft(delta.x);
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverId(over?.id ?? null);
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

  function handleCollapse(id: UniqueIdentifier) {
    setItems(oldItems =>
      setProperty(oldItems, id, 'collapsed', value => !value)
    );
  }
}

const adjustTranslate: Modifier = ({ transform }) => {
  return {
    ...transform,
    y: transform.y - 25,
  };
};
