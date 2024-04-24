import React, { ChangeEvent, ReactNode, useCallback, useState } from 'react';
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
  ListViewProps,
  RadioGroup,
  RadioItem,
} from '@deephaven/components';
import { vsAccount, vsPerson } from '@deephaven/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { generateNormalizedItems, sampleSectionIdAndClasses } from './utils';

// Generate enough items to require scrolling
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
  direction?: 'row' | 'column';
  children: ReactNode;
}

function LabeledFlexContainer({
  label,
  direction = 'column',
  children,
  ...styleProps
}: LabeledProps) {
  return (
    <Flex
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...styleProps}
      direction={direction}
      gap={10}
      minHeight={0}
      minWidth={0}
    >
      <Text>{label}</Text>
      {children}
    </Flex>
  );
}

export function ListViews(): JSX.Element {
  const [selectedKeys, setSelectedKeys] = useState<'all' | Iterable<ItemKey>>(
    []
  );

  const [density, setDensity] = useState<ListViewProps['density']>('compact');

  const onDensityChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setDensity(event.currentTarget.value as ListViewProps['density']);
    },
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
        <LabeledFlexContainer
          direction="row"
          label="Density"
          gridColumn="span 3"
        >
          <RadioGroup value={density} onChange={onDensityChange}>
            <RadioItem value="compact">Compact</RadioItem>
            <RadioItem value="regular">Regular</RadioItem>
            <RadioItem value="spacious">Spacious</RadioItem>
          </RadioGroup>
        </LabeledFlexContainer>

        <LabeledFlexContainer label="Single Child" gridColumn="span 3">
          <ListView
            density={density}
            aria-label="Single Child"
            selectionMode="multiple"
          >
            <Item textValue="Aaa">Aaa</Item>
          </ListView>
        </LabeledFlexContainer>

        <LabeledFlexContainer label="Icons" gridColumn="span 2">
          <ListView
            aria-label="Icon"
            density={density}
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
        </LabeledFlexContainer>

        <LabeledFlexContainer label="Mixed Children Types">
          <ListView
            aria-label="Mixed Children Types"
            density={density}
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
        </LabeledFlexContainer>

        <Flex gridColumn="span 3" gap={14}>
          <Checkbox
            checked={showIcons}
            onChange={e => setShowIcons(e.currentTarget.checked)}
          >
            Show Ions
          </Checkbox>
        </Flex>

        <LabeledFlexContainer label="Controlled">
          <ListViewNormalized
            aria-label="Controlled"
            density={density}
            normalizedItems={itemsWithIcons}
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            showItemIcons={showIcons}
            onChange={onChange}
          />
        </LabeledFlexContainer>
      </Grid>
    </div>
  );
}

export default ListViews;
