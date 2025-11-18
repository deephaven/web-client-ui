import React, { forwardRef, memo, useCallback } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsGripper } from '@deephaven/icons';
import { Tooltip } from '@deephaven/components';
import { type FlattenedIrisGridTreeItem } from './sortable-tree/utilities';

type SearchItemProps = {
  value: string;
  item: FlattenedIrisGridTreeItem;
  onClick: (
    item: FlattenedIrisGridTreeItem,
    event: React.MouseEvent<HTMLElement>
  ) => void;
  onKeyDown: (
    item: FlattenedIrisGridTreeItem,
    event: React.KeyboardEvent<HTMLElement>
  ) => void;
  handleProps?: Record<string, unknown>;
};

const SearchItem = forwardRef<HTMLDivElement, SearchItemProps>(
  function SearchItem(props, ref) {
    const { value, item, onClick, onKeyDown, handleProps } = props;

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLElement>) => {
        onClick(item, event);
      },
      [onClick, item]
    );

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLElement>) => {
        onKeyDown(item, event);
      },
      [onKeyDown, item]
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
