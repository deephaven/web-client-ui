/* eslint-disable react/jsx-props-no-spreading */
import React, { useMemo } from 'react';
import classNames from 'classnames';
import type { FlattenedItem } from './types';
import './TreeItem.scss';

export interface TreeItemProps<T> {
  childCount?: number;
  clone?: boolean;
  depth: number;
  withDepthMarkers?: boolean;
  disableInteraction?: boolean;
  ghost?: boolean;
  handleProps?: Record<string, unknown>;
  value: string;
  item: FlattenedItem<T>;
  dragRef?: React.Ref<HTMLDivElement> | null;
  wrapperRef?: React.Ref<HTMLLIElement> | null;
  renderItem: TreeItemRenderFn<T>;
  /**
   * Styles from dnd-kit to transform the depth lines
   */
  style?: React.CSSProperties;
}

export type TreeItemRenderFnProps<T> = {
  ref: React.Ref<HTMLDivElement> | null;
  clone: boolean;
  childCount?: number;
  value: string;
  item: FlattenedItem<T>;
  handleProps?: Record<string, unknown>;
};

export type TreeItemRenderFn<T> = (
  props: TreeItemRenderFnProps<T>
) => JSX.Element;

export function TreeItem<T>(props: TreeItemProps<T>): JSX.Element {
  const {
    clone = false,
    depth,
    withDepthMarkers = true,
    disableInteraction = false,
    ghost = false,
    handleProps,
    value,
    dragRef = null,
    wrapperRef = null,
    renderItem,
    item,
    childCount,
    style,
  } = props;

  const depthMarkers = useMemo(
    () =>
      withDepthMarkers
        ? Array(depth)
            .fill(0)
            .map((_, i) => (
              <span
                // eslint-disable-next-line react/no-array-index-key
                key={`depth-line-${i}`}
                className="depth-line"
                style={style}
              />
            ))
        : null,
    [depth, style, withDepthMarkers]
  );

  const renderItemProps = useMemo(
    () => ({
      ref: dragRef,
      clone,
      value,
      item,
      childCount,
      handleProps,
    }),
    [dragRef, clone, value, item, childCount, handleProps]
  );

  return (
    <li
      key={value}
      className={classNames('item-wrapper', {
        clone,
        ghost,
        disableInteraction,
      })}
      data-id={item.id}
      ref={wrapperRef}
    >
      {!clone && withDepthMarkers && depthMarkers}
      {renderItem(renderItemProps)}
    </li>
  );
}

TreeItem.displayName = 'TreeItem';
