import React, { useState } from 'react';
import classNames from 'classnames';
import {
  Shortcut,
  Tooltip,
  ShortcutRegistry,
  ContextActionUtils,
  Button,
} from '@deephaven/components';
import type { KeyState } from '@deephaven/components';
import './ShortcutsSectionContent.scss';

export default function ShortcutSectionContent(): JSX.Element[] {
  function formatCategoryName(name: string): string {
    return name
      .split('_')
      .map(word => `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`)
      .join(' ');
  }
  let categories = Array.from(
    ShortcutRegistry.shortcutsByCategory.entries()
  ).map(([name, shortcuts]) => ({
    name: formatCategoryName(name),
    shortcuts,
  }));

  const globalCategoryIndex = categories.findIndex(
    category => category.name.toUpperCase() === 'GLOBAL'
  );
  const globalCategory = categories.splice(globalCategoryIndex, 1);
  categories = categories.concat(globalCategory);

  return categories.map(category => (
    <div key={category.name} className="mt-3">
      <div className="font-weight-bold"> {category.name}</div>
      {category.shortcuts.map(shortcut => (
        <ShortcutItem key={shortcut.id} shortcut={shortcut} />
      ))}
    </div>
  ));
}

type ShortcutItemProps = {
  shortcut: Shortcut;
};

function ShortcutItem({ shortcut }: ShortcutItemProps): JSX.Element {
  const [displayText, setDisplayText] = useState(shortcut.getDisplayText());
  const [keyState, setKeyState] = useState<KeyState>(shortcut.getKeyState());
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState('');

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    e.stopPropagation();
    e.preventDefault();

    if (shortcut.isEditable && !e.repeat) {
      const newKeyState = Shortcut.getKeyStateFromEvent(e);
      setKeyState(newKeyState);
      setDisplayText(Shortcut.getDisplayText(newKeyState));
    }
  }

  function handleInputKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
    e.stopPropagation();
    e.preventDefault();

    setIsChanging(true);

    if (!Shortcut.isValidKeyState(keyState)) {
      if (Shortcut.isAllowedKey(keyState.keyValue)) {
        setError('Must contain a modifier key');
      } else {
        setError('Must contain an allowed action key');
      }
      return;
    }

    const context = shortcut.id.split('.')[0];
    const conflictNames = ShortcutRegistry.getConflictingShortcuts(keyState)
      .filter(s => s.id.startsWith(context) && s.id !== shortcut.id)
      .map(s => s.name);
    if (conflictNames.length) {
      setError(`Conflicts with ${conflictNames.join(', ')}`);
      return;
    }
    setError('');
  }

  function handleInputFocus() {
    ContextActionUtils.disableAllActions();
  }

  function handleInputBlur() {
    ContextActionUtils.enableAllActions();
  }

  function handleConfirm() {
    shortcut.setKeyState(keyState);
    setIsChanging(false);
  }

  function handleUndo() {
    const originalKeyState = shortcut.getKeyState();
    setKeyState(originalKeyState);
    setDisplayText(Shortcut.getDisplayText(originalKeyState));
    setIsChanging(false);
    setError('');
  }

  return (
    <>
      <div className="shortcut-item-container">
        <label className="shortcut-item-name">
          {shortcut.name}
          {shortcut.tooltip && <Tooltip>{shortcut.tooltip}</Tooltip>}
        </label>
        <input
          className={classNames('form-control', {
            'is-invalid': error,
          })}
          onKeyDown={handleInputKeyDown}
          onKeyUp={handleInputKeyUp}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={!shortcut.isEditable}
          value={displayText}
          readOnly
        />
      </div>
      {isChanging && (
        <div
          className={classNames('shortcut-item-message-container', {
            'is-invalid': error,
          })}
        >
          <div className="shortcut-item-message">{error}</div>
          <div className="shortcut-item-message-buttons">
            {Shortcut.isValidKeyState(keyState) && (
              <Button kind="ghost" onClick={handleConfirm}>
                Confirm
              </Button>
            )}
            <Button kind="ghost" onClick={handleUndo}>
              Undo
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
