/* eslint-disable import/prefer-default-export */
import React, { type CSSProperties, useCallback, useMemo } from 'react';
import { type AnimateLayoutChanges, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TreeItem, type TreeItemProps } from './TreeItem';

interface SortableTreeItemProps<T> extends Omit<TreeItemProps<T>, 'style'> {
  id: string;
  top?: number;
  /**
   * Used by @tanstack/virtual to measure the size of the item if it changes.
   * Group items may change size when the name is being edited.
   * @param element The HTMLElement to measure
   */
  measureElement?: (element: HTMLElement | null) => void;
}

const animateLayoutChanges: AnimateLayoutChanges = ({
  isSorting,
  wasDragging,
}) => !(isSorting || wasDragging);

export function SortableTreeItem<T>({
  id,
  depth,
  top,
  measureElement,
  ...props
}: SortableTreeItemProps<T>): JSX.Element {
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

  const wrapperRef = useCallback(
    (node: HTMLElement | null) => {
      setDroppableNodeRef(node);
      measureElement?.(node);
    },
    [setDroppableNodeRef, measureElement]
  );

  return (
    <TreeItem
      dragRef={setDraggableNodeRef}
      wrapperRef={wrapperRef}
      depth={depth}
      ghost={isDragging}
      disableInteraction={isSorting}
      handleProps={handleProps}
      style={style}
      top={top}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
}
