/**
 * Console display for use in the Iris environment.
 */
import React, { type ReactElement } from 'react';
import { Button, CopyButton, ContextualHelp } from '@deephaven/components';
import './ConsoleHistoryItem.scss';
import { vsDebugRerun } from '@deephaven/icons';
import { type ConsoleHistoryActionItem } from './ConsoleHistoryTypes';
import ConsoleHistoryItemTooltip from './ConsoleHistoryItemTooltip';

interface ConsoleHistoryItemProps {
  item: ConsoleHistoryActionItem;
  handleCommandSubmit: (command: string) => void;
  lastItem?: boolean;
  firstItem?: boolean;
  handleTooltipVisible: (isVisible: boolean) => void;
}

const getActionBarClasses = (
  command: string | undefined = '',
  firstItem = false,
  lastItem = false
): string => {
  const lineCount = command.split('\n').length;
  const classes = ['console-history-actions'];

  if (lineCount === 1) {
    if (firstItem) {
      // first single items are pushed down so that they are visible
      // this should be higher priority than lastItem
      classes.push('console-history-first-single-line');
    } else if (lastItem) {
      // last single items are pushed up to prevent layout shifts
      classes.push('console-history-last-single-line');
    } else {
      classes.push('console-history-single-line');
    }
  } else if (lineCount === 2) {
    classes.push('console-history-two-lines');
  }
  return classes.join(' ');
};

function ConsoleHistoryItem(props: ConsoleHistoryItemProps): ReactElement {
  const {
    item,
    handleCommandSubmit,
    firstItem,
    lastItem,
    handleTooltipVisible,
  } = props;

  const actionBarClasses = getActionBarClasses(
    item.command,
    firstItem ?? false,
    lastItem ?? false
  );

  return (
    <div className={actionBarClasses}>
      <CopyButton copy={item.command ?? ''} kind="inline" />
      <Button
        icon={vsDebugRerun}
        kind="inline"
        onClick={() => handleCommandSubmit(item.command ?? '')}
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

export default ConsoleHistoryItem;
