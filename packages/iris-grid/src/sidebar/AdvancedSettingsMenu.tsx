import React from 'react';
import { Menu, SwitchMenuItemDef } from '@deephaven/components';
import AdvancedSettingsType from './AdvancedSettingsType';

export type AdvancedSettingsMenuCallback = (
  key: AdvancedSettingsType,
  isOn: boolean
) => void;

export type AdvancedSettingsMenuProps = {
  items: Map<AdvancedSettingsType, boolean>;
  onChange?: AdvancedSettingsMenuCallback;
};

function AdvancedSettingsMenu({
  items,
  onChange = () => undefined,
}: AdvancedSettingsMenuProps): JSX.Element {
  return (
    <Menu
      items={Array.from(items.entries()).map(
        ([key, isOn]): SwitchMenuItemDef => ({
          title: AdvancedSettingsMenu.getAdvancedSettingsTitleForKey(key),
          isOn,
          onChange: (value: boolean) => onChange(key, value),
        })
      )}
    />
  );
}

AdvancedSettingsMenu.getAdvancedSettingsTitleForKey = (
  key: AdvancedSettingsType
): string => {
  switch (key) {
    case AdvancedSettingsType.FILTER_CONTROL_CHANGE_CLEARS_ALL_FILTERS:
      return 'Clear current table filters before applying new filters from a control';
    case AdvancedSettingsType.LINK_CHANGE_CLEARS_ALL_FILTERS:
      return 'Clear current table filters before applying new filters from an incoming link filter';
  }
};

export default AdvancedSettingsMenu;
