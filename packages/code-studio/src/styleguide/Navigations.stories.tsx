/* eslint no-console: "off" */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { vsFile, dhTruck, vsListUnordered } from '@deephaven/icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  Stack as StackComponent,
  MenuItem as MenuItemComponent,
  MenuItemProps,
  Menu as MenuComponent,
  MenuProps,
  Page as PageComponent,
  PageProps,
} from '@deephaven/components';

export default {
  title: 'Navigations',
};

type Template<T> = (args: T) => JSX.Element;
type BindedTemplate<T> = Template<T> & {
  args?: T;
};

const PageTemplate = (args: PageProps) => (
  <div style={{ height: '300px' }}>
    <PageComponent title={args.title}>{args.children}</PageComponent>
  </div>
);

export const Page: BindedTemplate<PageProps> = PageTemplate.bind({});
Page.args = {
  title: 'Title',
  children: <div>Content</div>,
};

const menuItems = [
  {
    title: 'Switch Item',
    subtitle: 'Subtitle',
    icon: dhTruck,
    isOn: false,
  },
  {
    title: 'Normal item',
    subtitle: 'Another subtitle',
    icon: vsFile,
  },
];

const MenuItemTemplate = (args: MenuItemProps) => (
  <MenuItemComponent item={args.item} onSelect={args.onSelect} />
);
export const MenuItem: BindedTemplate<MenuItemProps> = MenuItemTemplate.bind(
  {}
);
MenuItem.args = {
  item: menuItems[0],
  onSelect: () => undefined,
};

const MenuTemplate = (args: MenuProps) => (
  <div style={{ height: '300px' }}>
    <MenuComponent onSelect={args.onSelect} items={args.items} />
  </div>
);

export const Menu: BindedTemplate<MenuProps> = MenuTemplate.bind({});
Menu.args = {
  items: menuItems,
  onSelect: () => undefined,
};

enum MENU_ITEM_TYPE {
  SUBMENU = 'SUBMENU',
  PAGE = 'PAGE',
  SWITCH = 'SWITCH',
}

let nextId = 0;
function getNewId(): number {
  const newId = nextId;
  nextId += 1;
  return newId;
}

function getRandomCount(min = 1, max = 5): number {
  return Math.floor(Math.random() * max) + min;
}

type MenuItemType = {
  type: MENU_ITEM_TYPE;
  id: number;
};

type StackItem = {
  title: string;
  items?: MenuItemType[];
};

function makeMenuItem(type: MENU_ITEM_TYPE, id: number = getNewId()) {
  return { id, type };
}

function makeMenuItems(
  submenuCount: number = getRandomCount(),
  pageCount: number = getRandomCount(),
  switchCount: number = getRandomCount()
): MenuItemType[] {
  const items: MenuItemType[] = [];

  for (let i = 0; i < submenuCount; i += 1) {
    items.push(makeMenuItem(MENU_ITEM_TYPE.SUBMENU));
  }

  for (let i = 0; i < pageCount; i += 1) {
    items.push(makeMenuItem(MENU_ITEM_TYPE.PAGE));
  }

  for (let i = 0; i < switchCount; i += 1) {
    items.push(makeMenuItem(MENU_ITEM_TYPE.SWITCH));
  }

  return items;
}

function titleForMenuItem({ type, id }: MenuItemType): string {
  switch (type) {
    case MENU_ITEM_TYPE.SUBMENU:
      return `Submenu ${id}`;
    case MENU_ITEM_TYPE.PAGE:
      return `Page ${id}`;
    case MENU_ITEM_TYPE.SWITCH:
      return `Switch ${id}`;
  }
}

function iconForMenuItem({ type }: MenuItemType): IconProp {
  switch (type) {
    case MENU_ITEM_TYPE.SUBMENU:
      return vsListUnordered;
    case MENU_ITEM_TYPE.PAGE:
      return vsFile;
    case MENU_ITEM_TYPE.SWITCH:
      return dhTruck;
  }
}

const Navigations = () => {
  // The menu items on each part of the stack
  const [stackItems, setStackItems] = useState([] as StackItem[]);

  // Values that are set on the switched, mapped from ID to value
  const [valueMap, setValueMap] = useState(new Map<number, boolean>());

  const push = useCallback(
    (menuItem: StackItem) => {
      setStackItems([...stackItems, menuItem]);
    },
    [stackItems, setStackItems]
  );

  const pop = useCallback(() => {
    const newStackItems = [...stackItems];
    newStackItems.pop();
    setStackItems(newStackItems);
  }, [stackItems, setStackItems]);

  const popAll = useCallback(() => {
    const newStackItems = [stackItems[0]];
    setStackItems(newStackItems);
  }, [stackItems, setStackItems]);

  const toggleValue = useCallback(
    (valueIndex: number) => {
      const value = valueMap.get(valueIndex) ?? false;
      const newValueMap = new Map(valueMap);
      newValueMap.set(valueIndex, !value);
      setValueMap(newValueMap);
    },
    [valueMap, setValueMap]
  );

  const handleSelect = useCallback(
    (itemIndex: number) => {
      const stackItem = stackItems[stackItems.length - 1];
      const { items } = stackItem;

      if (!items) {
        throw new Error(
          'Navigation handleSelect triggered without items to select'
        );
      }
      const item = items[itemIndex];
      switch (item.type) {
        case MENU_ITEM_TYPE.PAGE:
          push({ title: titleForMenuItem(item) });
          break;
        case MENU_ITEM_TYPE.SUBMENU:
          push({ title: titleForMenuItem(item), items: makeMenuItems() });
          break;
        case MENU_ITEM_TYPE.SWITCH:
          toggleValue(item.id);
          break;
      }
    },
    [stackItems, toggleValue, push]
  );

  useEffect(() => {
    setStackItems([
      {
        title: 'Navigation Menu',
        items: makeMenuItems(),
      },
    ]);
  }, []);

  const stack = useMemo(
    () =>
      stackItems.map(({ items, title }, i) => {
        if (!items) {
          return (
            <PageComponent
              onBack={pop}
              onClose={popAll}
              title={title}
              key={title}
            >
              <div>Page content!</div>
            </PageComponent>
          );
        }

        let content = null;
        if (items) {
          const navMenuItems = items.map(item => {
            const itemTitle = titleForMenuItem(item);
            const icon = iconForMenuItem(item);
            let isOn;
            let onChange;
            if (item.type === MENU_ITEM_TYPE.SWITCH) {
              isOn = valueMap.get(item.id) ?? false;
              onChange = () => toggleValue(item.id);
            }
            return { title: itemTitle, icon, isOn, onChange };
          });
          content = (
            <MenuComponent onSelect={handleSelect} items={navMenuItems} />
          );
        } else {
          content = <div>Page content</div>;
        }

        return (
          <PageComponent
            onBack={i > 0 ? pop : undefined}
            onClose={i > 0 ? popAll : undefined}
            title={title}
            key={title}
          >
            {content}
          </PageComponent>
        );
      }),
    [stackItems, valueMap, handleSelect, pop, popAll, toggleValue]
  );

  return (
    <div className="navigations">
      <StackComponent>{stack}</StackComponent>
    </div>
  );
};

const NavigationsTemplate = () => <Navigations />;
export const NavigationViews = NavigationsTemplate.bind({});
