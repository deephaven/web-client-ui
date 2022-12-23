import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import {
  DragOverlay,
  DropAnimation,
  Modifier,
  defaultDropAnimation,
  useDndContext,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { getProjection, getChildCount } from './utilities';
import type { FlattenedItem, SensorContext } from './types';
import { SortableTreeItem } from './SortableTreeItem';

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

const adjustTranslate: Modifier = ({ transform }) => ({
  ...transform,
  y: transform.y - 25,
});

interface Props<T> {
  items: FlattenedItem<T>[];
  indentationWidth?: number;
  indicator?: boolean;
  renderItem(props: {
    clone: boolean;
    childCount?: number;
    value: string;
    item: FlattenedItem<T>;
  }): JSX.Element;
  activeId: string | null;
  overId: string | null;
  offsetLeft: number;
}

export default function SortableTreeInner<T>({
  items,
  renderItem,
  indentationWidth = 30,
  indicator = false,
  activeId,
  overId,
  offsetLeft,
}: Props<T>): JSX.Element {
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
      contextRef.current?.measureDroppableContainers([
        ...contextRef.current.droppableContainers.keys(),
      ]);
    },
    [items]
  );

  const projected =
    activeId != null && overId != null
      ? getProjection(items, activeId, overId, offsetLeft, indentationWidth)
      : null;
  const sensorContext: SensorContext = useRef({
    items,
    offset: offsetLeft,
  });

  const activeItem =
    activeId != null ? items.find(({ id }) => id === activeId) : null;

  useEffect(() => {
    sensorContext.current = {
      items,
      offset: offsetLeft,
    };
  }, [items, offsetLeft]);

  return (
    <>
      <div
        className={classNames(
          'tree-container',
          activeId != null && 'marching-ants'
        )}
      >
        {items.map(item => {
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
    </>
  );
}
