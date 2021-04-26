import React, { useMemo } from 'react';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsChevronRight } from '@deephaven/icons';
import './MenuItem.scss';

import UISwitch from '../UISwitch';

export type MenuItemDef = {
  title: string;
  subtitle?: string;
  icon?: IconProp;
};

export type SwitchMenuItemDef = MenuItemDef & {
  isOn: boolean;
  onChange: (isOn: boolean) => void;
};

function isSwitchMenuItemType(item: MenuItemDef): item is SwitchMenuItemDef {
  return (item as SwitchMenuItemDef).isOn !== undefined;
}

export type MenuItemProps = {
  item: MenuItemDef;
  onSelect?: () => void;
};

/**
 * @param props.item The menu item to set. Set a SwitchMenuItemDef to show a switch.
 * @param props.onSelect Called when the menu item is selected
 */
export const MenuItem = ({
  item,
  onSelect = () => undefined,
}: MenuItemProps): JSX.Element => {
  const { icon, subtitle, title } = item;
  const handleSelect = useMemo(() => {
    if (isSwitchMenuItemType(item)) {
      return () => {
        item.onChange(!item.isOn);
      };
    }
    return onSelect;
  }, [item, onSelect]);
  return (
    <div
      className="btn btn-navigation-menu-item"
      onClick={handleSelect}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          handleSelect();
        }
      }}
      tabIndex={0}
      role="menuitem"
    >
      {icon && (
        <div className="icon">
          <FontAwesomeIcon icon={icon} />
        </div>
      )}
      <div className="title">{title}</div>
      {subtitle && <div className="shortcut">{subtitle}</div>}
      <div className="accessory">
        {(isSwitchMenuItemType(item) && (
          <UISwitch
            on={item.isOn}
            onClick={event => {
              event.stopPropagation();
              handleSelect();
            }}
          />
        )) || <FontAwesomeIcon icon={vsChevronRight} />}
      </div>
    </div>
  );
};

export default MenuItem;
