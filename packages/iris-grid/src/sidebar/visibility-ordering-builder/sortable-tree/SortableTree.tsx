import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import {
  DragOverlay,
  useDndContext,
  type DropAnimation,
  type Modifier,
  defaultDropAnimation,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { flattenTree, getProjection, getChildCount } from './utilities';
import { SortableTreeItem } from './SortableTreeItem';
import { TreeItem, type TreeItemRenderFn } from './TreeItem';
import type { TreeItem as TreeItemType } from './types';

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

// Used to track the offset for adjustToCursor
// Once drag starts, set this. Once it ends, null this
let offsetY: number | null = null;

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
    offsetY == null &&
    args.activeNodeRect &&
    args.activatorEvent instanceof PointerEvent
  ) {
    offsetY =
      Math.floor(
        (args.activatorEvent.clientY - args.activeNodeRect.top) /
          args.activeNodeRect.height
      ) * args.activeNodeRect.height;
  }

  if (!args.activeNodeRect) {
    offsetY = null;
  }

  return { ...args.transform, y: args.transform.y + (offsetY ?? 0) };
}

interface Props<T> {
  items: TreeItemType<T>[];
  indentationWidth?: number;
  renderItem: TreeItemRenderFn<T>;
  isDraggable?: boolean;
}

export default function SortableTree<T>({
  items,
  indentationWidth = 30,
  renderItem,
  isDraggable = true,
}: Props<T>): JSX.Element {
  const dndContext = useDndContext();
  const activeId = (dndContext.active?.id as string) ?? null;
  const overId = (dndContext.over?.id as string) ?? null;
  const offsetLeft = dndContext.active
    ? (dndContext.active.rect.current.translated?.left ?? 0) -
      (dndContext.active.rect.current.initial?.left ?? 0)
    : 0;

  const flattenedItems = useMemo(() => {
    const flattenedTree = flattenTree(items);

    if (activeId != null) {
      return flattenedTree.filter(
        ({ id, selected }) => id === activeId || !selected
      );
    }

    return flattenedTree;
  }, [activeId, items]);

  const context = useDndContext();
  const contextRef = useRef(context);

  useEffect(
    function updateContextRef() {
      contextRef.current = context;
    },
    [context]
  );

  // Without this, animations are funky when using the move/sort buttons
  // dnd-kit only remeasures on drag/drop by default
  // The context object changes while dragging (items don't)
  // Using the context ref allows this to trigger properly on only items changes
  useEffect(
    function remeasureContainers() {
      contextRef.current.measureDroppableContainers(items.map(({ id }) => id));
    },
    [items]
  );

  const projected =
    isDraggable && activeId != null && overId != null
      ? getProjection(
          flattenedItems,
          activeId,
          overId,
          offsetLeft,
          indentationWidth
        )
      : null;

  const activeItem =
    activeId != null ? flattenedItems.find(({ id }) => id === activeId) : null;

  return (
    <>
      <div
        className={classNames(
          'tree-container',
          activeId != null && 'marching-ants'
        )}
      >
        {flattenedItems.map(item => {
          const { id, depth } = item;
          return isDraggable ? (
            <SortableTreeItem
              key={id}
              id={id}
              value={id}
              depth={id === activeId && projected ? projected.depth : depth}
              item={item}
              renderItem={renderItem}
            />
          ) : (
            <TreeItem
              key={id}
              value={id}
              depth={depth}
              item={item}
              renderItem={renderItem}
            />
          );
        })}
      </div>
      {createPortal(
        <DragOverlay
          dropAnimation={dropAnimationConfig}
          modifiers={[adjustToCursor]}
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
    </>
  );
}
