/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React, { forwardRef, HTMLAttributes } from 'react';
import classNames from 'classnames';
import styles from './TreeItem.module.scss';
import { IrisGridTreeItem } from './utilities';

export interface Props extends Omit<HTMLAttributes<HTMLLIElement>, 'id'> {
  childCount?: number;
  clone: boolean;
  collapsed?: boolean;
  depth: number;
  disableInteraction?: boolean;
  disableSelection?: boolean;
  ghost?: boolean;
  handleProps?: any;
  indicator?: boolean;
  indentationWidth: number;
  value: string;
  item: IrisGridTreeItem;
  onCollapse?(): void;
  onRemove?(): void;
  wrapperRef?(node: HTMLLIElement): void;
  renderItem(props: {
    clone: boolean;
    childCount: number;
    value: string;
    item: IrisGridTreeItem;
  }): React.ReactNode;
}

export const TreeItem = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const {
    childCount = 0,
    clone = false,
    depth,
    disableSelection = false,
    disableInteraction = false,
    ghost = false,
    handleProps,
    indentationWidth,
    indicator = false,
    collapsed,
    onCollapse,
    onRemove,
    style,
    value,
    wrapperRef,
    renderItem,
    item,
    ...rest
  } = props;

  const DepthMarker = <span className={styles.DepthLine} />;
  const depthMarkers = Array(depth).fill(DepthMarker);

  return (
    <li
      key={value}
      className={classNames(
        styles.Wrapper,
        clone && styles.clone,
        ghost && styles.ghost,
        indicator && styles.indicator,
        disableSelection && styles.disableSelection,
        disableInteraction && styles.disableInteraction
      )}
      ref={wrapperRef}
      {...rest}
    >
      {!clone && depthMarkers}
      <div
        ref={ref}
        className={classNames(
          styles.TreeItem,
          item.data.selected && styles.isSelected
        )}
        style={style}
        {...handleProps}
      >
        {renderItem(props)}
      </div>
    </li>
  );
});

TreeItem.displayName = 'TreeItem';
