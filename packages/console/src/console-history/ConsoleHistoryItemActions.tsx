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
  lastItem?: boolean;
  firstItem?: boolean;
  handleTooltipVisible: (isVisible: boolean) => void;
}

/**
 * Get the action bar class for a console history item.
 * @param lineCount The number of lines in the console history item.
 * @param firstItem Whether this is the first item in the history.
 * @param lastItem Whether this is the last item in the history.
 * @returns The action bar class name or null if not applicable.
 */
const getActionBarClass = (
  lineCount: number,
  firstItem = false,
  lastItem = false
): string | null => {
  if (lineCount > 2) {
    return null;
  }
  const lineCountCapped = Math.min(lineCount, 3);
  let slot = '1';
  if (lineCountCapped === 1) {
    if (firstItem) {
      // first single items are pushed down so that they are visible
      // this should be higher priority than lastItem
      slot = 'first-1';
    } else if (lastItem) {
      // last single items are pushed up to prevent layout shifts
      slot = 'last-1';
    }
  } else if (lineCountCapped === 2) {
    // two lines get centered
    slot = '2';
  }
  return `console-history-actions-${slot}`;
};

const ConsoleHistoryItemActions = memo(
  (props: ConsoleHistoryItemProps): ReactElement => {
    const { item, onCommandSubmit, firstItem, lastItem, handleTooltipVisible } =
      props;

    const lineCount = useMemo(
      () => (item.command ? item.command.split('\n').length : 0),
      [item.command]
    );

    const actionBarClass = getActionBarClass(
      lineCount,
      firstItem ?? false,
      lastItem ?? false
    );

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
