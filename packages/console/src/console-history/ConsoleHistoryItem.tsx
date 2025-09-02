/**
 * Console display for use in the Iris environment.
 */
import React, { PureComponent, type ReactElement } from 'react';
import { Button } from '@deephaven/components';
import Log from '@deephaven/log';
import type { dh } from '@deephaven/jsapi-types';
import classNames from 'classnames';
import { Code } from '../common';
import ConsoleHistoryItemResult from './ConsoleHistoryItemResult';
import ConsoleHistoryResultInProgress from './ConsoleHistoryResultInProgress';
import ConsoleHistoryResultErrorMessage from './ConsoleHistoryResultErrorMessage';
import './ConsoleHistoryItem.scss';
import { type ConsoleHistoryActionItem } from './ConsoleHistoryTypes';
import ConsoleHistoryItemActions from './ConsoleHistoryItemActions';

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
  onCommandSubmit: (command: string) => void;
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

  consoleHistoryItemClasses(): string {
    const { isTooltipVisible, isHovered } = this.state;
    const classes = ['console-history-item-command'];
    // console history items should stay highlighted if the tooltip is opened
    if (isTooltipVisible || isHovered) {
      classes.push('console-history-item-command-hovered');
    }
    return classes.join(' ');
  }

  render(): ReactElement {
    const {
      disabled,
      item,
      language,
      iconForType,
      onCommandSubmit,
      firstItem,
      lastItem,
    } = this.props;
    const { disabledObjects, result } = item;
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
            <ConsoleHistoryItemActions
              item={item}
              onCommandSubmit={onCommandSubmit}
              handleTooltipVisible={(isVisible: boolean) =>
                this.setState({ isTooltipVisible: isVisible })
              }
              firstItem={firstItem}
              lastItem={lastItem}
            />
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
