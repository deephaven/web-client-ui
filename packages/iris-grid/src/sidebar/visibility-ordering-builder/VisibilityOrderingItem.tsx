/* eslint-disable react/prop-types */
import React, { forwardRef, useCallback } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dhEye, dhEyeSlash, vsGripper } from '@deephaven/icons';
import { Button, Tooltip } from '@deephaven/components';
import VisibilityOrderingGroup from './VisibilityOrderingGroup';
import { IrisGridTreeItem } from './sortable-tree/utilities';
import type ColumnHeaderGroup from '../../ColumnHeaderGroup';

type VisibilityOrderingItemProps = {
  value: string;
  clone: boolean;
  childCount?: number;
  item: IrisGridTreeItem;
  onVisibilityChange(modelIndexes: number[], isVisible: boolean): void;
  onClick(name: string, event: React.MouseEvent): void;
  onGroupDelete(group: ColumnHeaderGroup): void;
  onGroupColorChange(group: ColumnHeaderGroup, color: string | undefined): void;
  onGroupNameChange(group: ColumnHeaderGroup, name: string): void;
  validateGroupName(name: string): boolean;
  handleProps: unknown;
};

const VisibilityOrderingItem = forwardRef<
  HTMLDivElement,
  VisibilityOrderingItemProps
>(function VisibilityOrderingItem(props, ref) {
  const {
    value,
    clone,
    childCount = 0,
    item,
    onVisibilityChange,
    onClick,
    onGroupDelete,
    onGroupColorChange,
    onGroupNameChange,
    validateGroupName,
    handleProps,
  } = props;
  const { group, modelIndex, isVisible } = item.data;

  const handleVisibilityChange = useCallback(() => {
    onVisibilityChange([modelIndex].flat(), !isVisible);
  }, [onVisibilityChange, modelIndex, isVisible]);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      onClick(value, event);
    },
    [onClick, value]
  );

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={ref}
      className={classNames('tree-item', item.data.selected && 'isSelected')}
      onClick={handleClick}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...handleProps}
    >
      <Button
        kind="ghost"
        className="px-1"
        onClick={handleVisibilityChange}
        icon={isVisible ? dhEye : dhEyeSlash}
        tooltip="Toggle visibility"
      />
      <span className={classNames('column-name', group && 'column-group')}>
        {group ? (
          <VisibilityOrderingGroup
            group={group}
            onDelete={onGroupDelete}
            onColorChange={onGroupColorChange}
            onNameChange={onGroupNameChange}
            validateName={validateGroupName}
            isNew={group.name.startsWith(':newGroup')}
          />
        ) : (
          value
        )}
      </span>
      <div>
        {clone && childCount > 1 && (
          <span className="item-count">{childCount}</span>
        )}
        <Tooltip>Drag to re-order</Tooltip>
        <FontAwesomeIcon icon={vsGripper} />
      </div>
    </div>
  );
});

export default VisibilityOrderingItem;
