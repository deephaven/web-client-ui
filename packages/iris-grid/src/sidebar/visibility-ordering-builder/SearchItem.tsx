import React, { forwardRef, memo, useCallback } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsGripper } from '@deephaven/icons';
import { Tooltip } from '@deephaven/components';
import { type FlattenedIrisGridTreeItem } from './sortable-tree/utilities';

type SearchItemProps = {
  value: string;
  item: FlattenedIrisGridTreeItem;
  onClick: (name: string, event: React.MouseEvent<HTMLElement>) => void;
  onKeyDown: (name: string, event: React.KeyboardEvent<HTMLElement>) => void;
  handleProps?: Record<string, unknown>;
};

const SearchItem = forwardRef<HTMLDivElement, SearchItemProps>(
  function VisibilityOrderingItem(props, ref) {
    const { value, item, onClick, onKeyDown, handleProps } = props;

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLElement>) => {
        onClick(value, event);
      },
      [onClick, value]
    );

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLElement>) => {
        onKeyDown(value, event);
      },
      [onKeyDown, value]
    );

    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div
        ref={ref}
        className={classNames('tree-item', {
          isSelected: item.selected,
        })}
        onClick={handleClick}
        onKeyDownCapture={handleKeyDown}
        data-index={item.index}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...handleProps}
      >
        <span title={value} className={classNames('column-name')}>
          {value}
        </span>
        <div>
          <Tooltip>Drag to re-order</Tooltip>
          <FontAwesomeIcon icon={vsGripper} />
        </div>
      </div>
    );
  }
);

const MemoizedSearchItem = memo(SearchItem);

export default MemoizedSearchItem;
