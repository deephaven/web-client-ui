/**
 * Console display for use in the Iris environment.
 */
import React, { PureComponent, ReactElement } from 'react';
import { Button } from '@deephaven/components';
import Log from '@deephaven/log';
import type { VariableDefinition } from '@deephaven/jsapi-types';
import classNames from 'classnames';
import { Code } from '../common';
import ConsoleHistoryItemResult from './ConsoleHistoryItemResult';
import ConsoleHistoryResultInProgress from './ConsoleHistoryResultInProgress';
import ConsoleHistoryResultErrorMessage from './ConsoleHistoryResultErrorMessage';
import './ConsoleHistoryItem.scss';
import { ConsoleHistoryActionItem } from './ConsoleHistoryTypes';

const log = Log.module('ConsoleHistoryItem');

interface ConsoleHistoryItemProps {
  item: ConsoleHistoryActionItem;
  language: string;
  openObject: (object: VariableDefinition) => void;
  disabled?: boolean;
  // TODO: #1573 Remove this eslint disable
  // eslint-disable-next-line react/no-unused-prop-types
  supportsType: (type: string) => boolean;
  iconForType: (type: string) => ReactElement;
}

class ConsoleHistoryItem extends PureComponent<
  ConsoleHistoryItemProps,
  Record<string, never>
> {
  static defaultProps = {
    disabled: false,
  };

  constructor(props: ConsoleHistoryItemProps) {
    super(props);

    this.handleCancelClick = this.handleCancelClick.bind(this);
    this.handleObjectClick = this.handleObjectClick.bind(this);
  }

  handleObjectClick(object: VariableDefinition): void {
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

  render(): ReactElement {
    const { disabled, item, language, iconForType } = this.props;
    const { disabledObjects, result } = item;
    const hasCommand = item.command != null && item.command !== '';

    let commandElement = null;
    if (hasCommand) {
      commandElement = (
        <div className="console-history-item-command">
          <div className="console-history-gutter">&gt;</div>
          <div className="console-history-content">
            <Code language={language}>{item.command}</Code>
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
