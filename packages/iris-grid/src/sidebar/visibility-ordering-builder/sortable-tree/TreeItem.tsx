/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useMemo } from 'react';
import classNames from 'classnames';
import type { FlattenedItem } from './types';
import './TreeItem.scss';

export interface Props<T> {
  childCount?: number;
  clone?: boolean;
  depth: number;
  disableInteraction?: boolean;
  ghost?: boolean;
  handleProps?: unknown;
  value: string;
  item: FlattenedItem<T>;
  dragRef?: React.Ref<HTMLDivElement> | null;
  wrapperRef?: React.Ref<HTMLLIElement> | null;
  renderItem(props: {
    ref: React.Ref<HTMLDivElement> | null;
    clone: boolean;
    childCount?: number;
    value: string;
    item: FlattenedItem<T>;
    handleProps: unknown;
  }): JSX.Element;
}

export type TreeItemRenderFn<T> = (props: {
  ref: React.Ref<HTMLDivElement> | null;
  clone: boolean;
  childCount?: number;
  value: string;
  item: FlattenedItem<T>;
  handleProps: unknown;
}) => JSX.Element;

export function TreeItem<T>(props: Props<T>) {
  const {
    clone = false,
    depth,
    disableInteraction = false,
    ghost = false,
    handleProps,
    value,
    dragRef = null,
    wrapperRef = null,
    renderItem,
    item,
    childCount,
  } = props;

  const depthMarkers = useMemo(() => {
    const DepthMarker = <span className="depth-line" />;
    return Array(depth).fill(DepthMarker);
  }, [depth]);

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
      ref={wrapperRef}
    >
      {!clone && depthMarkers}
      {renderItem(renderItemProps)}
    </li>
  );
}

TreeItem.displayName = 'TreeItem';
