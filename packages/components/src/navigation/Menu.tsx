import React from 'react';
import MenuItem, { MenuItemDef } from './MenuItem';
import './Menu.scss';

export type MenuSelectCallback = (itemIndex: number) => void;

export type MenuProps = {
  items: readonly MenuItemDef[];
  onSelect?: MenuSelectCallback;
  'data-testid'?: string;
};

export function Menu({
  items,
  onSelect = () => undefined,
  'data-testid': dataTestId,
}: MenuProps): JSX.Element {
  return (
    <div className="navigation-menu-view" data-testid={dataTestId}>
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
}

export default Menu;
