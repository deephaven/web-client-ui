import React, { useState, useMemo } from 'react';
import { Shortcut, ShortcutRegistry } from '@deephaven/components';
import ShortcutItem from './ShortcutItem';

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
