/**
 * Console display for use in the Iris environment.
 */
import React, { PureComponent, type ReactElement } from 'react';
import { Button, CopyButton } from '@deephaven/components';
import Log from '@deephaven/log';
import './ConsoleHistoryItem.scss';
import { type ConsoleHistoryActionItem } from './ConsoleHistoryTypes';
import ConsoleHistoryItemTooltip from './ConsoleHistoryItemTooltip';
import { vsDebugRerun } from '@deephaven/icons';
const log = Log.module('ConsoleHistoryItem');

interface ConsoleHistoryItemProps {
  item: ConsoleHistoryActionItem;
  handleCommandSubmit: (command: string) => void;
  lastItem?: boolean;
  firstItem?: boolean;
  handleTooltipVisible: (isVisible: boolean) => void;
}

interface ConsoleHistoryItemState {
  isTooltipVisible: boolean;
}

class ConsoleHistoryItem extends PureComponent<
  ConsoleHistoryItemProps,
  ConsoleHistoryItemState
> {
  static defaultProps = {
    disabled: false,
  };

  constructor(props: ConsoleHistoryItemProps) {
    super(props);

    this.state = {
      isTooltipVisible: false,
    };

    this.actionBarClasses = this.actionBarClasses.bind(this);
  }

  actionBarClasses(command: string | undefined = ''): string {
    const lineCount = command.split('\n').length;
    const classes = ['console-history-actions'];

    if (lineCount === 1) {
      if (this.props.firstItem) {
        // first single items are pushed down so that they are visible
        // this should be higher priority than lastItem
        classes.push('console-history-first-single-line');
      } else if (this.props.lastItem) {
        // last single items are pushed up to prevent layout shifts
        classes.push('console-history-last-single-line');
      } else {
        classes.push('console-history-single-line');
      }
    } else if (lineCount == 2) {
      classes.push('console-history-two-lines');
    }
    return classes.join(' ');
  }

  render(): ReactElement {
    const { item } = this.props;
    return (
      <div className={this.actionBarClasses(item.command)}>
        <CopyButton copy={item.command ?? ''} kind="inline" />
        <Button
          icon={vsDebugRerun}
          kind="inline"
          onClick={() => this.props.handleCommandSubmit(item.command ?? '')}
          tooltip="Rerun"
        >
          {null}
        </Button>
        <ConsoleHistoryItemTooltip
          item={item}
          onOpenChange={this.props.handleTooltipVisible}
        />
      </div>
    );
  }
}

export default ConsoleHistoryItem;
