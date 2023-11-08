import React, { useState, useMemo, useCallback } from 'react';
import { connect } from 'react-redux';
import { Shortcut, ShortcutRegistry } from '@deephaven/components';
import {
  getShortcutOverrides,
  RootState,
  updateSettings as updateSettingsAction,
  WorkspaceSettings,
} from '@deephaven/redux';
import ShortcutItem from './ShortcutItem';

type ShortcutSectionContentProps = {
  shortcutOverrides: WorkspaceSettings['shortcutOverrides'];
  updateSettings: typeof updateSettingsAction;
};

function ShortcutSectionContent({
  shortcutOverrides = {},
  updateSettings,
}: ShortcutSectionContentProps): JSX.Element {
  const saveShortcutOverrides = useCallback(
    (modifiedShortcuts: Shortcut[]) => {
      const isMac = Shortcut.isMacPlatform;

      // This ensures mac and windows objects both exist
      const newOverrides: Required<typeof shortcutOverrides> = {
        mac: { ...shortcutOverrides.mac },
        windows: { ...shortcutOverrides.windows },
      };
      const platformOverrides = isMac ? newOverrides.mac : newOverrides.windows;

      modifiedShortcuts.forEach(shortcut => {
        if (shortcut.isDefault()) {
          // No need to save overrides that are the default value
          delete platformOverrides[shortcut.id];
        } else {
          platformOverrides[shortcut.id] = shortcut.getKeyState();
        }
      });

      updateSettings({
        shortcutOverrides: newOverrides,
      });
    },
    [updateSettings, shortcutOverrides]
  );

  let categories = Array.from(
    ShortcutRegistry.shortcutsByCategory.entries()
  ).map(([name, shortcuts]) => ({
    name,
    shortcuts,
  }));

  // Move global category to the end
  const globalCategoryIndex = categories.findIndex(
    category => category.name.toUpperCase() === 'GLOBAL'
  );
  const globalCategory = categories.splice(globalCategoryIndex, 1);
  categories = categories.concat(globalCategory);

  return (
    <>
      <div className="app-settings-menu-description">
        Customize shortcuts below. To prevent unexpected results, avoid
        conflicting shortcuts with the browser or IDE editor.
      </div>
      {categories.map(category => (
        <ShortcutCategory
          key={category.name}
          name={category.name}
          shortcuts={category.shortcuts}
          saveShortcutOverrides={saveShortcutOverrides}
        />
      ))}
    </>
  );
}

type ShortcutCategoryProps = {
  name: string;
  shortcuts: Shortcut[];
  saveShortcutOverrides: (shortcuts: Shortcut[]) => void;
};

function ShortcutCategory({
  name,
  shortcuts: propsShortcuts,
  saveShortcutOverrides,
}: ShortcutCategoryProps): JSX.Element {
  function formatCategoryName(categoryName: string): string {
    return categoryName
      .split('_')
      .map(word => `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`)
      .join(' ');
  }

  // Used to trigger a re-render when a shortcut is changed
  // Since shortcuts are singletons, React doesn't detect changes for a re-render as easily
  const [shortcuts, setShortcuts] = useState(propsShortcuts);

  function handleShortcutChange(shortcut: Shortcut): void {
    const conflictingShortcuts = shortcuts.filter(
      s =>
        s !== shortcut &&
        !s.isNull() &&
        s.matchesKeyState(shortcut.getKeyState())
    );

    // Set conflicting shortcuts to null
    conflictingShortcuts.forEach(conflict => conflict.setToNull());

    const modifiedShoftcuts = [shortcut, ...conflictingShortcuts];

    saveShortcutOverrides(modifiedShoftcuts);
    setShortcuts(s => [...s]);
  }

  const displayTexts = useMemo(
    () => shortcuts.map(s => s.getDisplayText()),
    [shortcuts]
  );

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

const mapStateToProps = (
  state: RootState
): Pick<ShortcutSectionContentProps, 'shortcutOverrides'> => ({
  shortcutOverrides: getShortcutOverrides(state),
});

const mapDispatchToProps = { updateSettings: updateSettingsAction };

const ConnectedShortcutSectionContent = connect(
  mapStateToProps,
  mapDispatchToProps
)(ShortcutSectionContent);

export default ConnectedShortcutSectionContent;
