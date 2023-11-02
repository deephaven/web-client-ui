import React, { useState, useEffect } from 'react';
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
import './ShortcutItem.scss';

type ShortcutItemProps = {
  shortcut: Shortcut;
  displayText: string;
  categoryName: string;
  onChange: (shortcut: Shortcut) => void;
};

export default function ShortcutItem({
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
  useEffect(
    function resolveConflictOnPropChange() {
      setDisplayText(propsDisplayText);
      setKeyState(shortcut.getKeyState());
    },
    [propsDisplayText, shortcut]
  );

  // Updates displayText when keyState is changed
  useEffect(
    function onNewKeybind() {
      setDisplayText(Shortcut.getDisplayText(keyState));
      if (shortcut.matchesKeyState(keyState)) {
        setIsPending(false);
      }
    },
    [keyState, shortcut]
  );

  // Sets error state based on isPending
  useEffect(
    function setErrors() {
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
    },
    [isPending, keyState, categoryName, shortcut]
  );

  // Updates pending key state and sets input display text
  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
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
  function handleInputKeyUp(e: React.KeyboardEvent<HTMLInputElement>): void {
    e.stopPropagation();
    e.preventDefault();

    if (!shortcut.matchesKeyState(keyState)) {
      setIsPending(true);
    }
  }

  function handleInputFocus(): void {
    ContextActionUtils.disableAllActions();
  }

  function handleInputBlur(): void {
    ContextActionUtils.enableAllActions();
  }

  function handleConfirm(): void {
    shortcut.setKeyState(keyState);
    setIsPending(false);
    onChange(shortcut);
  }

  function handleUndo(): void {
    const originalKeyState = shortcut.getKeyState();
    setKeyState(originalKeyState);
    setIsPending(false);
  }

  function handleResetToDefaultClick(): void {
    setIsPending(true);
    setKeyState(shortcut.getDefaultKeyState());
  }

  return (
    <>
      <div className="shortcut-item-container">
        <label className="shortcut-item-name">
          {shortcut.name}
          {shortcut.tooltip !== undefined && (
            <Tooltip>{shortcut.tooltip}</Tooltip>
          )}
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
