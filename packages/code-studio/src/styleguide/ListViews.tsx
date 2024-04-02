import React, { useCallback, useState } from 'react';
import { Grid, Item, ListView, ItemKey, Text } from '@deephaven/components';
import { vsAccount, vsPerson } from '@deephaven/icons';
import { Icon } from '@adobe/react-spectrum';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { sampleSectionIdAndClasses } from './utils';

// Generate enough items to require scrolling
const itemsSimple = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  .split('')
  .map((key, i) => ({
    key,
    item: { key: (i + 1) * 100, content: `${key}${key}${key}` },
  }));

function AccountIcon({
  slot,
}: {
  slot?: 'illustration' | 'image';
}): JSX.Element {
  return (
    // Images in ListView items require a slot of 'image' or 'illustration' to
    // be set in order to be positioned correctly:
    // https://github.com/adobe/react-spectrum/blob/784737effd44b9d5e2b1316e690da44555eafd7e/packages/%40react-spectrum/list/src/ListViewItem.tsx#L266-L267
    <Icon slot={slot}>
      <FontAwesomeIcon icon={vsAccount} />
    </Icon>
  );
}

export function ListViews(): JSX.Element {
  const [selectedKeys, setSelectedKeys] = useState<'all' | Iterable<ItemKey>>(
    []
  );

  const onChange = useCallback((keys: 'all' | Iterable<ItemKey>): void => {
    setSelectedKeys(keys);
  }, []);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div {...sampleSectionIdAndClasses('list-views')}>
      <h2 className="ui-title">List View</h2>

      <Grid columnGap={14} height="size-4600">
        <Text>Single Child</Text>
        <ListView
          gridRow="2"
          aria-label="Single Child"
          selectionMode="multiple"
        >
          <Item>Aaa</Item>
        </ListView>

        <label>Icons</label>
        <ListView gridRow="2" aria-label="Icon" selectionMode="multiple">
          <Item textValue="Item with icon A">
            <AccountIcon slot="image" />
            <Text>Item with icon A</Text>
          </Item>
          <Item textValue="Item with icon B">
            <AccountIcon slot="image" />
            <Text>Item with icon B</Text>
          </Item>
          <Item textValue="Item with icon C">
            <AccountIcon slot="image" />
            <Text>Item with icon C</Text>
          </Item>
          <Item textValue="Item with icon D">
            <AccountIcon slot="image" />
            <Text>Item with icon D with overflowing content</Text>
          </Item>
        </ListView>

        <label>Mixed Children Types</label>
        <ListView
          gridRow="2"
          aria-label="Mixed Children Types"
          maxWidth="size-2400"
          selectionMode="multiple"
          defaultSelectedKeys={[999, 444]}
        >
          {/* eslint-disable react/jsx-curly-brace-presence */}
          {'String 1'}
          {'String 2'}
          {'String 3'}
          {''}
          {'Some really long text that should get truncated'}
          {/* eslint-enable react/jsx-curly-brace-presence */}
          {444}
          {999}
          {true}
          {false}
          <Item>Item Aaa</Item>
          <Item>Item Bbb</Item>
          <Item textValue="Complex Ccc">
            <Icon slot="image">
              <FontAwesomeIcon icon={vsPerson} />
            </Icon>
            <Text>Complex Ccc with text that should be truncated</Text>
          </Item>
        </ListView>

        <label>Controlled</label>
        <ListView
          gridRow="2"
          aria-label="Controlled"
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onChange={onChange}
        >
          {itemsSimple}
        </ListView>
      </Grid>
    </div>
  );
}

export default ListViews;
