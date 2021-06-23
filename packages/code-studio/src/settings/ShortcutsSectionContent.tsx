import React, { useState } from 'react';
import classNames from 'classnames';
import { Shortcut, Tooltip, ShortcutRegistry } from '@deephaven/components';
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
    <div key={category.name} className="mt-3 font-weight-bolder">
      {category.name}
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

    if (!Shortcut.isValidKeyState(keyState)) {
      if (keyState.keyValue) {
        setError('Shortcut must contain a modifier key');
      } else {
        setError('Shortcut must contain a non-modifier key');
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
    shortcut.setKeyState(keyState);
    setError('');
  }

  return (
    <>
      <div className="shortcut-item-container">
        <label>
          {shortcut.name}
          {shortcut.tooltip && <Tooltip>{shortcut.tooltip}</Tooltip>}
        </label>
        <input
          className={classNames('form-control', {
            'is-invalid': error,
          })}
          onKeyDown={handleInputKeyDown}
          onKeyUp={handleInputKeyUp}
          disabled={!shortcut.isEditable}
          value={displayText}
          readOnly
        />
      </div>
      {error && <div className="shortcut-item-conflicts">{error}</div>}
    </>
  );
}
