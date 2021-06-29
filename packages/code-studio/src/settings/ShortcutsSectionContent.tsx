import React, { useState, useEffect, useMemo } from 'react';
import classNames from 'classnames';
import {
  Shortcut,
  Tooltip,
  ShortcutRegistry,
  ContextActionUtils,
  Button,
  KEY,
} from '@deephaven/components';
import type { KeyState } from '@deephaven/components';
import { vsRefresh } from '@deephaven/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './ShortcutsSectionContent.scss';

export default function ShortcutSectionContent(): JSX.Element {
  let categories = Array.from(
    ShortcutRegistry.shortcutsByCategory.entries()
  ).map(([name, shortcuts]) => ({
    name,
    shortcuts,
  }));

  const globalCategoryIndex = categories.findIndex(
    category => category.name.toUpperCase() === 'GLOBAL'
  );
  const globalCategory = categories.splice(globalCategoryIndex, 1);
  categories = categories.concat(globalCategory);

  return (
    <>
      <div className="app-settings-menu-description">
        Customize shortcuts below. Assigning shortcuts that conflict with the
        browser or IDE shortcuts may cause unintended behavior
      </div>
      {categories.map(category => (
        <ShortcutCategory
          key={category.name}
          name={category.name}
          shortcuts={category.shortcuts}
        />
      ))}
    </>
  );
}

type ShortcutCategoryProps = {
  name: string;
  shortcuts: Shortcut[];
};

function ShortcutCategory({
  name,
  shortcuts: propsShortcuts,
}: ShortcutCategoryProps): JSX.Element {
  function formatCategoryName(categoryName: string): string {
    return categoryName
      .split('_')
      .map(word => `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`)
      .join(' ');
  }

  const [shortcuts, setShortcuts] = useState(propsShortcuts);

  // Used to trigger a re-render when a shortcut is changed
  // Since shortcuts are singletons, React doesn't detect changes for a re-render as easily
  function handleShortcutChange(shortcut: Shortcut) {
    shortcuts
      .filter(
        s =>
          s !== shortcut &&
          !s.isNull() &&
          s.matchesKeyState(shortcut.getKeyState())
      )
      .forEach(conflict => conflict.setToNull());
    setShortcuts(s => [...s]);
  }

  const displayTexts = useMemo(() => shortcuts.map(s => s.getDisplayText()), [
    shortcuts,
  ]);

  return (
    <div className="mt-3">
      <div className="font-weight-bold">{formatCategoryName(name)}</div>
      {shortcuts.map((shortcut, i) => (
        <ShortcutItem
          key={shortcut.id}
          shortcut={shortcut}
          displayText={displayTexts[i]}
          categoryName={name}
          onChange={handleShortcutChange}
        />
      ))}
    </div>
  );
}

type ShortcutItemProps = {
  shortcut: Shortcut;
  displayText: string;
  categoryName: string;
  onChange(shortcut: Shortcut): void;
};

function ShortcutItem({
  shortcut,
  displayText: propsDisplayText,
  categoryName,
  onChange,
}: ShortcutItemProps): JSX.Element {
  const [displayText, setDisplayText] = useState(propsDisplayText);
  const [keyState, setKeyState] = useState<KeyState>(shortcut.getKeyState());
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');

  // If propsDisplayText changes, the shortcut was altered from a conflict state by the parent component
  useEffect(() => {
    setDisplayText(propsDisplayText);
    setKeyState(shortcut.getKeyState());
  }, [propsDisplayText, shortcut]);

  // Updates displayText when keyState is changed
  useEffect(() => {
    setDisplayText(Shortcut.getDisplayText(keyState));
    if (shortcut.matchesKeyState(keyState)) {
      setIsPending(false);
    }
  }, [keyState, shortcut]);

  // Sets error state based on isPending
  useEffect(() => {
    if (isPending) {
      if (!Shortcut.isValidKeyState(keyState)) {
        if (Shortcut.isAllowedKey(keyState.keyValue)) {
          setError('Must contain a modifier key');
        } else {
          setError('Must contain an allowed action key');
        }
        return;
      }

      const conflictNames = ShortcutRegistry.getConflictingShortcuts(keyState)
        .filter(
          conflict =>
            conflict.id.startsWith(categoryName) && conflict !== shortcut
        )
        .map(conflict => conflict.name);

      if (conflictNames.length) {
        setError(`Conflicts with ${conflictNames.join(', ')}`);
        return;
      }

      setError('');
    } else {
      setError('');
    }
  }, [isPending, keyState, categoryName, shortcut]);

  // Updates pending key state and sets input display text
  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    e.stopPropagation();
    e.preventDefault();

    if (shortcut.isEditable && !e.repeat) {
      const newKeyState = Shortcut.getKeyStateFromEvent(e);
      const backspaceKeyState = Shortcut.createKeyState([KEY.BACKSPACE]);

      // Backspace clears the shortcut
      if (Shortcut.doKeyStatesMatch(newKeyState, backspaceKeyState)) {
        setKeyState(Shortcut.NULL_KEY_STATE);
      } else {
        setKeyState(newKeyState);
      }
    }
  }

  // Set this shortcut to changing state, check key state validity and set errors
  function handleInputKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
    e.stopPropagation();
    e.preventDefault();

    if (!shortcut.matchesKeyState(keyState)) {
      setIsPending(true);
    }
  }

  function handleInputFocus() {
    ContextActionUtils.disableAllActions();
  }

  function handleInputBlur() {
    ContextActionUtils.enableAllActions();
  }

  function handleConfirm() {
    shortcut.setKeyState(keyState);
    setIsPending(false);
    onChange(shortcut);
  }

  function handleUndo() {
    const originalKeyState = shortcut.getKeyState();
    setKeyState(originalKeyState);
    setIsPending(false);
  }

  function handleResetToDefaultClick() {
    setIsPending(true);
    setKeyState(shortcut.getDefaultKeyState());
  }

  return (
    <>
      <div className="shortcut-item-container">
        <label className="shortcut-item-name">
          {shortcut.name}
          {shortcut.tooltip && <Tooltip>{shortcut.tooltip}</Tooltip>}
        </label>
        <div className="shortcut-item-input-container">
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
          {!Shortcut.doKeyStatesMatch(
            keyState,
            shortcut.getDefaultKeyState()
          ) &&
            !error && (
              <Button
                className="reset-to-default-button"
                kind="ghost"
                icon={
                  <FontAwesomeIcon
                    icon={vsRefresh}
                    transform={{ rotate: 90, flipX: true }}
                  />
                }
                tooltip="Reset to default"
                onClick={handleResetToDefaultClick}
              />
            )}
        </div>
      </div>
      {isPending && (
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
