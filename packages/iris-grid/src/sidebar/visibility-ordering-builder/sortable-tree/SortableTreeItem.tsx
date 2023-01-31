/* eslint-disable import/prefer-default-export */
import React, { CSSProperties, useMemo } from 'react';
import { AnimateLayoutChanges, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TreeItem, Props as TreeItemProps } from './TreeItem';

export interface Props<T> extends Omit<TreeItemProps<T>, 'style'> {
  id: string;
}

const animateLayoutChanges: AnimateLayoutChanges = ({
  isSorting,
  wasDragging,
}) => !(isSorting || wasDragging);

export function SortableTreeItem<T>({
  id,
  depth,
  ...props
}: Props<T>): JSX.Element {
  const {
    attributes,
    isDragging,
    isSorting,
    listeners,
    setDraggableNodeRef,
    setDroppableNodeRef,
    transform,
    transition,
  } = useSortable({
    id,
    animateLayoutChanges,
  });

  const transformString = CSS.Translate.toString(transform);

  const style: CSSProperties = useMemo(
    () => ({
      transform: transformString,
      transition,
    }),
    [transformString, transition]
  );

  const handleProps = useMemo(
    () => ({
      ...attributes,
      ...listeners,
      style,
    }),
    [attributes, listeners, style]
  );

  return (
    <TreeItem
      dragRef={setDraggableNodeRef}
      wrapperRef={setDroppableNodeRef}
      depth={depth}
      ghost={isDragging}
      disableInteraction={isSorting}
      handleProps={handleProps}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
}
