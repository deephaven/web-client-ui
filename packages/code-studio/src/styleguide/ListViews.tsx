import React, { useCallback, useState } from 'react';
import {
  Grid,
  Icon,
  Item,
  ListView,
  ListViewNormalized,
  ItemKey,
  Text,
} from '@deephaven/components';
import { vsAccount, vsPerson } from '@deephaven/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { generateNormalizedItems, sampleSectionIdAndClasses } from './utils';

// Generate enough items to require scrolling
const itemsSimple = [...generateNormalizedItems(52)];

function AccountIllustration(): JSX.Element {
  return (
    // Images in ListView items require a slot of 'image' or 'illustration' to
    // be set in order to be positioned correctly:
    // https://github.com/adobe/react-spectrum/blob/784737effd44b9d5e2b1316e690da44555eafd7e/packages/%40react-spectrum/list/src/ListViewItem.tsx#L266-L267
    <Icon slot="illustration">
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

      <Grid columnGap={14} height="size-6000">
        <Text>Single Child</Text>
        <ListView
          density="compact"
          gridRow="2"
          aria-label="Single Child"
          selectionMode="multiple"
        >
          <Item textValue="Aaa">Aaa</Item>
        </ListView>

        <label>Icons</label>
        <ListView
          gridRow="2"
          aria-label="Icon"
          density="compact"
          selectionMode="multiple"
        >
          <Item textValue="Item with icon A">
            <AccountIllustration />
            <Text>Item with icon A</Text>
          </Item>
          <Item textValue="Item with icon B">
            <AccountIllustration />
            <Text>Item with icon B</Text>
          </Item>
          <Item textValue="Item with icon C">
            <AccountIllustration />
            <Text>Item with icon C</Text>
          </Item>
          <Item textValue="Item with icon D">
            <AccountIllustration />
            <Text>Item with icon D with overflowing content</Text>
          </Item>
        </ListView>

        <label>Mixed Children Types</label>
        <ListView
          gridRow="2"
          aria-label="Mixed Children Types"
          density="compact"
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
          <Item textValue="Item Aaa">Item Aaa</Item>
          <Item textValue="Item Bbb">Item Bbb</Item>
          <Item textValue="Complex Ccc">
            <Icon slot="image">
              <FontAwesomeIcon icon={vsPerson} />
            </Icon>
            <Text>Complex Ccc with text that should be truncated</Text>
          </Item>
        </ListView>

        <label>Controlled</label>
        <ListViewNormalized
          normalizedItems={itemsSimple}
          gridRow="2"
          aria-label="Controlled"
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onChange={onChange}
        />
      </Grid>
    </div>
  );
}

export default ListViews;
