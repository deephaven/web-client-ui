/**
 * Console display for use in the Iris environment.
 */
import React, { PureComponent, useRef, type ReactElement } from 'react';
import {
  ActionGroup,
  Button,
  Item,
  Tooltip,
  Text,
  ContextualHelp,
  Content,
  Heading,
  ActionButton,
  CopyButton,
} from '@deephaven/components';
import Log from '@deephaven/log';
import type { dh } from '@deephaven/jsapi-types';
import classNames from 'classnames';
import { Code } from '../common';
import ConsoleHistoryItemResult from './ConsoleHistoryItemResult';
import ConsoleHistoryResultInProgress from './ConsoleHistoryResultInProgress';
import ConsoleHistoryResultErrorMessage from './ConsoleHistoryResultErrorMessage';
import './ConsoleHistoryItem.scss';
import { type ConsoleHistoryActionItem } from './ConsoleHistoryTypes';
import ConsoleHistoryItemTooltip from './ConsoleHistoryItemTooltip';
import { vsDebugRerun } from '@deephaven/icons';
import { useResizeObserver } from '@deephaven/react-hooks';
const log = Log.module('ConsoleHistoryItem');

interface ConsoleHistoryItemProps {
  item: ConsoleHistoryActionItem;
  language: string;
  openObject: (object: dh.ide.VariableDefinition) => void;
  disabled?: boolean;
  // TODO: #1573 Remove this eslint disable
  // eslint-disable-next-line react/no-unused-prop-types
  supportsType: (type: string) => boolean;
  iconForType: (type: string) => ReactElement;
  handleCommandSubmit: (command: string) => void;
  lastItem?: boolean;
  firstItem?: boolean;
}

interface ConsoleHistoryItemState {
  isHovered: boolean;
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
      isHovered: false,
      isTooltipVisible: false,
    };

    this.handleCancelClick = this.handleCancelClick.bind(this);
    this.handleObjectClick = this.handleObjectClick.bind(this);
    this.actionBarClasses = this.actionBarClasses.bind(this);
    this.consoleHistoryItemClasses = this.consoleHistoryItemClasses.bind(this);
  }

  handleObjectClick(object: dh.ide.VariableDefinition): void {
    log.debug('handleObjectClick', object);

    const { openObject } = this.props;
    openObject(object);
  }

  handleCancelClick(): void {
    const { item } = this.props;
    if (item != null && item.cancelResult) {
      log.debug(`Cancelling command: ${item.command}`);
      item.cancelResult();
    }
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

  consoleHistoryItemClasses(): string {
    const classes = ['console-history-item-command'];
    if (this.state.isTooltipVisible || this.state.isHovered) {
      classes.push('console-history-item-command-hovered');
    }
    return classes.join(' ');
  }

  render(): ReactElement {
    const { disabled, item, language, iconForType } = this.props;
    const { disabledObjects, result, serverStartTime, serverEndTime } = item;
    const hasCommand = item.command != null && item.command !== '';
    let commandElement = null;
    if (hasCommand) {
      commandElement = (
        <div
          className={this.consoleHistoryItemClasses()}
          onMouseOver={() => this.setState({ isHovered: true })}
          onMouseOut={() => this.setState({ isHovered: false })}
        >
          <div className="console-history-gutter">&gt;</div>
          <div className="console-history-content">
            <Code language={language}>{item.command}</Code>
            <div className={this.actionBarClasses(item.command)}>
              <CopyButton copy={item.command ?? ''} kind="inline" />
              <Button
                icon={vsDebugRerun}
                kind="inline"
                onClick={() =>
                  this.props.handleCommandSubmit(item.command ?? '')
                }
                tooltip="Rerun"
              >
                {null}
              </Button>
              <ConsoleHistoryItemTooltip
                item={item}
                onOpenChange={isOpen =>
                  this.setState({ isTooltipVisible: isOpen })
                }
              />
            </div>
          </div>
        </div>
      );
    }

    const resultElements = [];
    let hasButtons = false;

    if (result) {
      const { error, message, changes } = result;

      if (changes) {
        const { created, updated } = changes;
        // TODO: #1573 filter for supported types or change button kind
        // based on if type is supported. Possibly a warn state for widgets
        // that the UI doesn't have anything registered to support.
        [...created, ...updated].forEach(object => {
          hasButtons = true;
          const { title } = object;
          const key = `${title}`;
          const btnDisabled =
            disabled === undefined ||
            disabled ||
            (disabledObjects ?? []).indexOf(key) >= 0;
          const element = (
            <Button
              key={key}
              kind="primary"
              onClick={() => this.handleObjectClick(object)}
              className="btn-console-object"
              disabled={btnDisabled}
              icon={iconForType(object.type)}
            >
              {title}
            </Button>
          );
          resultElements.push(element);
        });
      }

      // If the error has an associated command, we'll actually get a separate ERROR item printed out, so only print an error if there isn't an associated command
      if (error != null && !hasCommand) {
        let errorMessage = `${(error as { message: string }).message ?? error}`;
        if (!errorMessage) {
          errorMessage = error as string;
        }
        const element = (
          <ConsoleHistoryResultErrorMessage
            key="result-error"
            message={errorMessage}
          />
        );
        resultElements.push(element);
      }

      if (message !== undefined && message !== '') {
        const element = (
          <div key="log-message" className="log-message">
            {message}
          </div>
        );
        resultElements.push(element);
      }
    } else {
      hasButtons = true;
      const element = (
        <ConsoleHistoryResultInProgress
          key="in_progress"
          onCancelClick={this.handleCancelClick}
          disabled={disabled}
        />
      );
      resultElements.push(element);
    }

    let resultElement = null;
    if (resultElements.length > 0) {
      resultElement = (
        <ConsoleHistoryItemResult>{resultElements}</ConsoleHistoryItemResult>
      );
    }

    return (
      <div
        className={classNames('console-command-result', {
          'console-result-buttons': hasButtons,
        })}
      >
        {commandElement}
        {resultElement}
      </div>
    );
  }
}

export default ConsoleHistoryItem;
