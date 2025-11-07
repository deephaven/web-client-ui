import { useEffect, useMemo, useRef } from 'react';
import classNames from 'classnames';
import { useDndContext } from '@dnd-kit/core';
import { flattenTree, getProjection } from './utilities';
import { SortableTreeItem } from './SortableTreeItem';
import { TreeItem, type TreeItemRenderFn } from './TreeItem';
import type { TreeItem as TreeItemType } from './types';

interface Props<T> {
  items: TreeItemType<T>[];
  indentationWidth?: number;
  renderItem: TreeItemRenderFn<T>;
  isDraggable?: boolean;
  withDepthMarkers?: boolean;
}

export default function SortableTree<T>({
  items,
  indentationWidth = 30,
  renderItem,
  isDraggable = true,
  withDepthMarkers = true,
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

  return (
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
            withDepthMarkers={withDepthMarkers}
          />
        ) : (
          <TreeItem
            key={id}
            value={id}
            depth={depth}
            item={item}
            renderItem={renderItem}
            withDepthMarkers={withDepthMarkers}
          />
        );
      })}
    </div>
  );
}
