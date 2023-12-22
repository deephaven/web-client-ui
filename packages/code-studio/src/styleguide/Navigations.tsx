/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { vsFile, dhTruck, vsListUnordered } from '@deephaven/icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  Menu,
  NavTabList,
  Page,
  Stack,
  type NavTabItem,
} from '@deephaven/components';
import { pseudoRandomWithSeed, sampleSectionIdAndClasses } from './utils';

function NavTabListExample({
  count = 5,
  activeKey: activeKeyProp = '',
}: {
  count?: number;
  activeKey?: string;
}) {
  const [activeKey, setActiveKey] = useState(activeKeyProp);
  const [tabs, setTabs] = useState(() => {
    const tabItems: NavTabItem[] = [];
    for (let i = 0; i < count; i += 1) {
      tabItems.push({ key: `${i}`, title: `Tab ${i}`, isClosable: i > 0 });
    }
    return tabItems;
  });

  const handleReorder = useCallback((from: number, to: number) => {
    setTabs(t => {
      const newTabs = [...t];
      const [removed] = newTabs.splice(from, 1);
      newTabs.splice(to, 0, removed);
      return newTabs;
    });
  }, []);

  const handleSelect = useCallback((key: string) => {
    setActiveKey(key);
  }, []);

  const handleClose = useCallback((key: string) => {
    setTabs(t => t.filter(tab => tab.key !== key));
  }, []);

  const makeContextActions = useCallback(
    (tab: NavTabItem) => [
      {
        title: 'Select Tab to the Left',
        group: 10,
        order: 10,
        disabled: tabs[0].key === tab.key,
        action: () => {
          const index = tabs.findIndex(t => t.key === tab.key);
          if (index > 0) {
            setActiveKey(tabs[index - 1].key);
          }
        },
      },
      {
        title: 'Select Tab to the Right',
        group: 30,
        order: 10,
        disabled: tabs[tabs.length - 1].key === tab.key,
        action: () => {
          const index = tabs.findIndex(t => t.key === tab.key);
          if (index < tabs.length - 1) {
            setActiveKey(tabs[index + 1].key);
          }
        },
      },
    ],
    [tabs]
  );

  return (
    <NavTabList
      tabs={tabs}
      activeKey={activeKey}
      onSelect={handleSelect}
      onReorder={handleReorder}
      onClose={handleClose}
      makeContextActions={makeContextActions}
    />
  );
}

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

// Create a seeded random number generator
const random = pseudoRandomWithSeed(25);

function getRandomCount(min = 1, max = 5): number {
  const r = Number(random.next().value);
  return Math.floor(r * max) + min;
}

type MenuItem = {
  type: MENU_ITEM_TYPE;
  id: number;
};

type StackItem = {
  title: string;
  items?: MenuItem[];
};

function makeMenuItem(
  type: MENU_ITEM_TYPE,
  id = getNewId()
): {
  id: number;
  type: MENU_ITEM_TYPE;
} {
  return { id, type };
}

function makeMenuItems(
  submenuCount: number = getRandomCount(),
  pageCount: number = getRandomCount(),
  switchCount: number = getRandomCount()
): MenuItem[] {
  const items: MenuItem[] = [];

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

function titleForMenuItem({ type, id }: MenuItem): string {
  switch (type) {
    case MENU_ITEM_TYPE.SUBMENU:
      return `Submenu ${id}`;
    case MENU_ITEM_TYPE.PAGE:
      return `Page ${id}`;
    case MENU_ITEM_TYPE.SWITCH:
      return `Switch ${id}`;
  }
}

function iconForMenuItem({ type }: MenuItem): IconProp {
  switch (type) {
    case MENU_ITEM_TYPE.SUBMENU:
      return vsListUnordered;
    case MENU_ITEM_TYPE.PAGE:
      return vsFile;
    case MENU_ITEM_TYPE.SWITCH:
      return dhTruck;
  }
}

function Navigations(): JSX.Element {
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

  useEffect(function setMenu() {
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
            <Page onBack={pop} onClose={popAll} title={title} key={title}>
              <div>Page content!</div>
            </Page>
          );
        }

        let content = null;
        if (items != null) {
          const navMenuItems = items.map(item => {
            const itemTitle = titleForMenuItem(item);
            const icon = iconForMenuItem(item);
            let isOn;
            let onChange;
            if (item.type === MENU_ITEM_TYPE.SWITCH) {
              isOn = valueMap.get(item.id) ?? false;
              onChange = () => {
                handleSelect(item.id);
              };
            }
            return { title: itemTitle, icon, isOn, onChange };
          });
          content = <Menu onSelect={handleSelect} items={navMenuItems} />;
        } else {
          content = <div>Page content</div>;
        }

        return (
          <Page
            onBack={i > 0 ? pop : undefined}
            onClose={i > 0 ? popAll : undefined}
            title={title}
            key={title}
          >
            {content}
          </Page>
        );
      }),
    [stackItems, valueMap, handleSelect, pop, popAll]
  );

  return (
    <div {...sampleSectionIdAndClasses('navigations')}>
      <h2 className="ui-title">Navigations</h2>
      <div style={{ marginBottom: '1rem' }}>
        <NavTabListExample count={100} activeKey="15" />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <NavTabListExample />
      </div>
      <div className="navigations">
        <Stack>{stack}</Stack>
      </div>
    </div>
  );
}

export default Navigations;
