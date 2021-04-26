import React from 'react';
import MenuItem, { MenuItemDef } from './MenuItem';
import './Menu.scss';

export type MenuSelectCallback = (itemIndex: number) => void;

export type MenuProps = {
  items: MenuItemDef[];
  onSelect?: MenuSelectCallback;
};

export const Menu = ({
  items,
  onSelect = () => undefined,
}: MenuProps): JSX.Element => (
  <div className="navigation-menu-view">
    <ul className="navigation-menu-list">
      {items.map((item, itemIndex) => (
        <li key={item.title}>
          <MenuItem
            item={item}
            onSelect={() => {
              onSelect(itemIndex);
            }}
          />
        </li>
      ))}
    </ul>
  </div>
);

export default Menu;
