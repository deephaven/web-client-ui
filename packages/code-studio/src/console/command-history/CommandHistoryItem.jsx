import React, { useRef, useCallback } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Tooltip } from '@deephaven/components';

import './CommandHistoryItem.scss';
import CommandHistoryItemTooltip from './CommandHistoryItemTooltip';
import { UIPropTypes } from '../../include/prop-types';

const MAX_TRUNCATE_LENGTH = 512;

const CommandHistoryItem = props => {
  const { item, language, isSelected } = props;
  const previewText = item.name.substring(0, MAX_TRUNCATE_LENGTH);
  const tooltip = useRef();
  const handleUpdate = useCallback(() => {
    tooltip.current?.update();
  }, [tooltip]);

  return (
    <div
      className={classNames('command-history-item', {
        selected: isSelected,
      })}
    >
      {previewText}
      <Tooltip
        ref={tooltip}
        interactive
        options={{
          placement: 'left',
          modifiers: {
            preventOverflow: {
              enabled: true,
              boundariesElement: 'viewport',
              order: 825, // modify order so boundary is enforced at end of popper calcs
            },
          },
        }}
        popperClassName="command-history-item-popper"
      >
        <CommandHistoryItemTooltip
          item={item}
          language={language}
          onUpdate={handleUpdate}
        />
      </Tooltip>
    </div>
  );
};

CommandHistoryItem.propTypes = {
  item: UIPropTypes.CommandHistoryItem.isRequired,
  language: PropTypes.string.isRequired,
  isSelected: PropTypes.bool,
};

CommandHistoryItem.defaultProps = {
  isSelected: false,
};

export default CommandHistoryItem;
