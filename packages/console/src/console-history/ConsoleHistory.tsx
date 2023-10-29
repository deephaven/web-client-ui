/**
 * Console display for use in the Iris environment.
 */
import { type ReactElement } from 'react';
import type { VariableDefinition } from '@deephaven/jsapi-types';
import ConsoleHistoryItem from './ConsoleHistoryItem';

import './ConsoleHistory.scss';
import { ConsoleHistoryActionItem } from './ConsoleHistoryTypes';

interface ConsoleHistoryProps {
  items: ConsoleHistoryActionItem[];
  language: string;
  openObject: (object: VariableDefinition) => void;
  disabled?: boolean;
  supportsType: (type: string) => boolean;
  iconForType: (type: string) => ReactElement;
}

function itemKey(i: number, item: ConsoleHistoryActionItem): string {
  return `${i}.${item.command}.${item.result && item.result.message}.${
    item.result && item.result.error
  }`;
}

function ConsoleHistory(props: ConsoleHistoryProps): ReactElement {
  const {
    disabled = false,
    items,
    language,
    openObject,
    supportsType,
    iconForType,
  } = props;
  const historyElements = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const historyElement = (
      <ConsoleHistoryItem
        key={itemKey(i, item)}
        disabled={disabled}
        item={item}
        openObject={openObject}
        language={language}
        supportsType={supportsType}
        iconForType={iconForType}
      />
    );
    historyElements.push(historyElement);
  }

  return (
    <div className="container-fluid console-history">{historyElements}</div>
  );
}

export default ConsoleHistory;
