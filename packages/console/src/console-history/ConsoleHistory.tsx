/**
 * Console display for use in the Iris environment.
 */
import React, { Component, ReactElement } from 'react';
import { CancelablePromise } from '@deephaven/utils';
import { VariableChanges, VariableDefinition } from '@deephaven/jsapi-shim';
import ConsoleHistoryItem from './ConsoleHistoryItem';

import './ConsoleHistory.scss';

export type ConsoleHistoryError =
  | string
  | {
      message: string;
    }
  | undefined;

export interface ConsoleHistoryActionItem {
  command?: string;
  result?: {
    message?: string;
    error?: unknown;
    changes?: VariableChanges;
  };
  disabledObjects?: string[];
  startTime?: number;
  endTime?: number;
  cancelResult?: () => void;
  wrappedResult?: CancelablePromise<unknown>;
}

interface ConsoleHistoryProps {
  items: ConsoleHistoryActionItem[];
  language: string;
  openObject: (object: VariableDefinition) => void;
  disabled?: boolean;
}

class ConsoleHistory extends Component<
  ConsoleHistoryProps,
  Record<string, never>
> {
  static defaultProps = {
    disabled: false,
  };

  static itemKey(i: number, item: ConsoleHistoryActionItem): string {
    return `${i}.${item.command}.${item.result && item.result.message}.${
      item.result && item.result.error
    }`;
  }

  render(): ReactElement {
    const { disabled, items, language, openObject } = this.props;
    const historyElements = [];
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const historyElement = (
        <ConsoleHistoryItem
          key={ConsoleHistory.itemKey(i, item)}
          disabled={disabled}
          item={item}
          openObject={openObject}
          language={language}
        />
      );
      historyElements.push(historyElement);
    }

    return (
      <div className="container-fluid console-history">{historyElements}</div>
    );
  }
}

export default ConsoleHistory;
