import React, { ReactNode, useCallback, useState } from 'react';
import type { StyleProps } from '@react-types/shared';
import {
  Grid,
  Icon,
  Item,
  ListView,
  ListViewNormalized,
  ItemKey,
  Text,
  Flex,
  Checkbox,
} from '@deephaven/components';
import { vsAccount, vsPerson } from '@deephaven/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { generateNormalizedItems, sampleSectionIdAndClasses } from './utils';

// Generate enough items to require scrolling
const itemsSimple = [...generateNormalizedItems(52)];
const itemsWithIcons = [...generateNormalizedItems(52, { icons: true })];

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

interface LabeledProps extends StyleProps {
  label: string;
  children: ReactNode;
}

function LabeledFlexColumn({ label, children, ...styleProps }: LabeledProps) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Flex {...styleProps} direction="column" minHeight={0} minWidth={0}>
      <Text>{label}</Text>
      {children}
    </Flex>
  );
}

export function ListViews(): JSX.Element {
  const [selectedKeys, setSelectedKeys] = useState<'all' | Iterable<ItemKey>>(
    []
  );

  const [showIcons, setShowIcons] = useState(true);

  const onChange = useCallback((keys: 'all' | Iterable<ItemKey>): void => {
    setSelectedKeys(keys);
  }, []);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div {...sampleSectionIdAndClasses('list-views')}>
      <h2 className="ui-title">List View</h2>

      <Grid gap={14} height="size-6000" columns="1fr 1fr 1fr">
        <LabeledFlexColumn label="Single Child" gridColumn="span 3">
          <ListView
            density="compact"
            aria-label="Single Child"
            selectionMode="multiple"
          >
            <Item textValue="Aaa">Aaa</Item>
          </ListView>
        </LabeledFlexColumn>

        <LabeledFlexColumn label="Icons" gridColumn="span 2">
          <ListView
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
            <Item textValue="Item with icon E">
              <AccountIllustration />
              <Text>Item with icon E</Text>
            </Item>
          </ListView>
        </LabeledFlexColumn>

        <LabeledFlexColumn label="Mixed Children Types">
          <ListView
            aria-label="Mixed Children Types"
            density="compact"
            maxWidth="size-2400"
            selectionMode="multiple"
            defaultSelectedKeys={['999', 444]}
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
            <Item textValue="Item with Description">
              <Text>Item with Description</Text>
              <Text slot="description">Description</Text>
            </Item>
            <Item textValue="Complex Ccc">
              <Icon slot="image">
                <FontAwesomeIcon icon={vsPerson} />
              </Icon>
              <Text>Complex Ccc with text that should be truncated</Text>
            </Item>
            <Item textValue="Complex Ccc with Description">
              <Icon slot="image">
                <FontAwesomeIcon icon={vsPerson} />
              </Icon>
              <Text>Complex Ccc with text that should be truncated</Text>
              <Text slot="description">Description</Text>
            </Item>
          </ListView>
        </LabeledFlexColumn>

        <Flex gridColumn="span 3" gap={14}>
          <Checkbox
            checked={showIcons}
            onChange={e => setShowIcons(e.currentTarget.checked)}
          >
            Show Ions
          </Checkbox>
        </Flex>

        <LabeledFlexColumn label="Controlled">
          <ListViewNormalized
            aria-label="Controlled"
            normalizedItems={itemsSimple}
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            showItemIcons={showIcons}
            onChange={onChange}
          />
        </LabeledFlexColumn>

        <LabeledFlexColumn label="Controlled (with icons)">
          <ListViewNormalized
            aria-label="Controlled (with icons)"
            normalizedItems={itemsWithIcons}
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            showItemIcons={showIcons}
            onChange={onChange}
          />
        </LabeledFlexColumn>
      </Grid>
    </div>
  );
}

export default ListViews;
