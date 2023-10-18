/* eslint-disable react/prop-types */
import React, { forwardRef, useCallback, useRef } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dhEye, dhEyeSlash, vsGripper } from '@deephaven/icons';
import { Button, Tooltip } from '@deephaven/components';
import VisibilityOrderingGroup from './VisibilityOrderingGroup';
import { FlattenedIrisGridTreeItem } from './sortable-tree/utilities';
import type ColumnHeaderGroup from '../../ColumnHeaderGroup';

type VisibilityOrderingItemProps = {
  value: string;
  clone: boolean;
  childCount: number;
  item: FlattenedIrisGridTreeItem;
  onVisibilityChange: (modelIndexes: number[], isVisible: boolean) => void;
  onClick: (name: string, event: React.MouseEvent) => void;
  onGroupDelete: (group: ColumnHeaderGroup) => void;
  onGroupColorChange: (
    group: ColumnHeaderGroup,
    color: string | undefined
  ) => void;
  onGroupNameChange: (group: ColumnHeaderGroup, name: string) => void;
  validateGroupName: (name: string) => string;
  handleProps: Record<string, unknown>;
};

function emptyOnClick(): void {
  // no-op
}

const VisibilityOrderingItem = forwardRef<
  HTMLDivElement,
  VisibilityOrderingItemProps
>(function VisibilityOrderingItem(props, ref) {
  const {
    value,
    clone,
    childCount,
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
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleVisibilityChange = useCallback(
    (e: React.MouseEvent) => {
      if (e.buttons === 1) {
        onVisibilityChange([modelIndex].flat(), !isVisible);
        buttonRef.current?.focus();
      }
    },
    [onVisibilityChange, modelIndex, isVisible]
  );

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
      className={classNames('tree-item', {
        isSelected: item.selected,
        'two-dragged': childCount === 2,
        'multiple-dragged': childCount > 2,
      })}
      onClick={handleClick}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...handleProps}
    >
      <Button
        ref={buttonRef}
        kind="ghost"
        className="px-1"
        // We PropType validate onClick for Button
        onClick={emptyOnClick}
        onMouseDown={handleVisibilityChange}
        onMouseEnter={handleVisibilityChange}
        icon={isVisible ? dhEye : dhEyeSlash}
        tooltip="Toggle visibility"
      />
      <span className={classNames('column-name', group && 'column-group')}>
        {/* Display a normal item if this is the drag overlay clone, even if it's a group */}
        {group && !clone ? (
          <VisibilityOrderingGroup
            group={group}
            onDelete={onGroupDelete}
            onColorChange={onGroupColorChange}
            onNameChange={onGroupNameChange}
            validateName={validateGroupName}
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
