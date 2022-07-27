import React, { useRef, useCallback, ReactElement } from 'react';
import classNames from 'classnames';
import { Tooltip } from '@deephaven/components';

import './CommandHistoryItem.scss';
import CommandHistoryItemTooltip from './CommandHistoryItemTooltip';
import CommandHistoryStorage, {
  CommandHistoryStorageItem,
} from './CommandHistoryStorage';

interface CommandHistoryItemProps {
  item: CommandHistoryStorageItem;
  language?: string;
  isSelected?: boolean;
  commandHistoryStorage: CommandHistoryStorage;
}

const MAX_TRUNCATE_LENGTH = 512;

const CommandHistoryItem = (props: CommandHistoryItemProps): ReactElement => {
  const { item, language, isSelected, commandHistoryStorage } = props;
  const previewText = item.name.substring(0, MAX_TRUNCATE_LENGTH);
  const tooltip = useRef<Tooltip>(null);
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
          commandHistoryStorage={commandHistoryStorage}
        />
      </Tooltip>
    </div>
  );
};

CommandHistoryItem.defaultProps = {
  isSelected: false,
};

export default CommandHistoryItem;
