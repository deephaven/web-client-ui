import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragMoveEvent,
  DragEndEvent,
  DragOverEvent,
  MeasuringStrategy,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { flattenTree, getProjection } from './utilities';
import type { FlattenedItem, SensorContext, TreeItem } from './types';
import { sortableTreeKeyboardCoordinates } from './keyboardCoordinates';
import PointerSensorWithInteraction from './PointerSensorWithInteraction';
import SortableTreeInner from './SortableTreeInner';

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

interface Props<T> {
  items: TreeItem<T>[];
  indentationWidth?: number;
  indicator?: boolean;
  onDragStart?: (id: string) => void;
  onDragEnd?: (from: FlattenedItem<T>, to: FlattenedItem<T>) => void;
  renderItem: (props: {
    clone: boolean;
    childCount?: number;
    value: string;
    item: FlattenedItem<T>;
    ref: React.Ref<HTMLDivElement>;
    handleProps?: Record<string, unknown>;
  }) => JSX.Element;
}

export default function SortableTree<T>({
  items,
  indicator = false,
  indentationWidth = 30,
  onDragStart,
  onDragEnd,
  renderItem,
}: Props<T>): JSX.Element {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
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
    ({ active: { id: newActiveId } }: DragStartEvent) => {
      setActiveId(newActiveId as string);
      setOverId(newActiveId as string);
      onDragStart?.(newActiveId as string);

      document.body.style.setProperty('cursor', 'grabbing');
    },
    [onDragStart]
  );

  const handleDragMove = useCallback(({ delta }: DragMoveEvent) => {
    setOffsetLeft(delta.x);
  }, []);

  const handleDragOver = useCallback(({ over }: DragOverEvent) => {
    setOverId((over?.id as string) ?? null);
  }, []);

  const resetState = useCallback(() => {
    setOverId(null);
    setActiveId(null);
    setOffsetLeft(0);

    document.body.style.setProperty('cursor', '');
  }, []);

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
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

        onDragEnd?.(activeTreeItem, {
          ...clonedItems[overIndex],
          parentId: projected.parentId,
        });
      }
    },
    [items, onDragEnd, projected, resetState]
  );

  const handleDragCancel = useCallback(() => {
    resetState();
  }, [resetState]);

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
        <SortableTreeInner
          items={flattenedItems}
          renderItem={renderItem}
          indicator={indicator}
          indentationWidth={indentationWidth}
          activeId={activeId}
          overId={overId}
          offsetLeft={offsetLeft}
        />
      </SortableContext>
    </DndContext>
  );
}
