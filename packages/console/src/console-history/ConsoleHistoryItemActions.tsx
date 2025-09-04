/**
 * Console display for use in the Iris environment.
 */
import React, { memo, type ReactElement, useMemo } from 'react';
import { Button, CopyButton, ContextualHelp } from '@deephaven/components';
import './ConsoleHistoryItem.scss';
import { vsDebugRerun } from '@deephaven/icons';
import { type ConsoleHistoryActionItem } from './ConsoleHistoryTypes';
import ConsoleHistoryItemTooltip from './ConsoleHistoryItemTooltip';
import classNames from 'classnames';

interface ConsoleHistoryItemProps {
  item: ConsoleHistoryActionItem;
  onCommandSubmit: (command: string) => void;
  handleTooltipVisible: (isVisible: boolean) => void;
}

/**
 * Get the action bar class for a console history item.
 * @param lineCount The number of lines in the console history item.
 * @returns The action bar class name or null if not applicable.
 */
const getActionBarClass = (item: ConsoleHistoryActionItem): string | null => {
  const lineCount = item.command ? item.command.split('\n').length : 0;
  if (lineCount > 2) {
    return null;
  }
  let slot = '1';
  if (lineCount === 2) {
    slot = '2';
  }
  return `console-history-actions-${slot}`;
};

const ConsoleHistoryItemActions = memo(
  (props: ConsoleHistoryItemProps): ReactElement => {
    const { item, onCommandSubmit, handleTooltipVisible } = props;

    const actionBarClass = useMemo(() => getActionBarClass(item), [item]);

    return (
      <div className={classNames('console-history-actions', actionBarClass)}>
        <CopyButton copy={item.command ?? ''} kind="inline" />
        <Button
          icon={vsDebugRerun}
          kind="inline"
          onClick={() => onCommandSubmit(item.command ?? '')}
          tooltip="Rerun"
        >
          {null}
        </Button>
        <ContextualHelp
          variant="info"
          onOpenChange={handleTooltipVisible}
          UNSAFE_className="console-history-item-contextual-help"
        >
          <ConsoleHistoryItemTooltip item={item} />
        </ContextualHelp>
      </div>
    );
  }
);

export default ConsoleHistoryItemActions;
