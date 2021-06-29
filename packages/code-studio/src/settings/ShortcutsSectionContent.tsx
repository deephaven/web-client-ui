import React, { useState, useEffect, useMemo } from 'react';
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
    <ShortcutCategory
      key={category.name}
      name={category.name}
      shortcuts={category.shortcuts}
    />
  ));
}

type ShortcutCategoryProps = {
  name: string;
  shortcuts: Shortcut[];
};

function ShortcutCategory({
  name,
  shortcuts: propsShortcuts,
}: ShortcutCategoryProps): JSX.Element {
  const [shortcuts, setShortcuts] = useState(propsShortcuts);

  // Used to trigger a re-render when a shortcut is changed
  // Since shortcuts are singletons, React doesn't detect changes for a re-render as easily
  function handleShortcutChange() {
    setShortcuts(s => [...s]);
  }

  const displayTexts = useMemo(() => shortcuts.map(s => s.getDisplayText()), [
    shortcuts,
  ]);

  return (
    <div className="mt-3">
      <div className="font-weight-bold">{name}</div>
      {shortcuts.map((shortcut, i) => (
        <ShortcutItem
          key={shortcut.id}
          shortcut={shortcut}
          displayText={displayTexts[i]}
          onChange={handleShortcutChange}
        />
      ))}
    </div>
  );
}

type ShortcutItemProps = {
  shortcut: Shortcut;
  displayText: string;
  onChange(): void;
};

function ShortcutItem({
  shortcut,
  displayText: propsDisplayText,
  onChange,
}: ShortcutItemProps): JSX.Element {
  const [displayText, setDisplayText] = useState(propsDisplayText);
  const [keyState, setKeyState] = useState<KeyState>(shortcut.getKeyState());
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState('');

  // Updates the displayText state if the props change
  useEffect(() => {
    setDisplayText(propsDisplayText);
  }, [propsDisplayText]);

  // Updates pending key state and sets input display text
  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    e.stopPropagation();
    e.preventDefault();

    if (shortcut.isEditable && !e.repeat) {
      const newKeyState = Shortcut.getKeyStateFromEvent(e);
      setKeyState(newKeyState);
      setDisplayText(Shortcut.getDisplayText(newKeyState));
    }
  }

  // Set this shortcut to changing state, check key state validity and set errors
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
    const conflicts = ShortcutRegistry.getConflictingShortcuts(keyState).filter(
      s => s !== shortcut
    );
    if (conflicts.length) {
      conflicts.forEach(conflict => conflict.setToNull());
      setError('');
    }
    shortcut.setKeyState(keyState);
    setIsChanging(false);
    onChange();
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
