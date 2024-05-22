import React, { ReactNode, useCallback, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { BoxAlignmentStyleProps, StyleProps } from '@react-types/shared';
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
  Radio,
  useSpectrumThemeProvider,
  ListActionGroup,
} from '@deephaven/components';
import { vsAccount, vsEdit, vsPerson, vsTrash } from '@deephaven/icons';
import { LIST_VIEW_ROW_HEIGHTS } from '@deephaven/utils';
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

interface LabeledProps extends BoxAlignmentStyleProps, StyleProps {
  label: string;
  direction?: 'row' | 'column';
  children: ReactNode;
}

const LABELED_FLEX_CONTAINER_HEIGHTS = {
  gap: 10,
  label: {
    medium: 21,
    large: 25.5,
  },
};

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
      gap={LABELED_FLEX_CONTAINER_HEIGHTS.gap}
    >
      <Text>{label}</Text>
      {children}
    </Flex>
  );
}

export function ListViews(): JSX.Element {
  const { scale } = useSpectrumThemeProvider();
  const [selectedKeys, setSelectedKeys] = useState<'all' | Iterable<ItemKey>>(
    []
  );

  const [density, setDensity] = useState<ListViewProps['density']>('compact');

  // Calculate the height of the single child example
  const singleChildExampleHeight =
    LABELED_FLEX_CONTAINER_HEIGHTS.label[scale] +
    LABELED_FLEX_CONTAINER_HEIGHTS.gap +
    2 + // listview border
    LIST_VIEW_ROW_HEIGHTS[density ?? 'compact'][scale];

  const onDensityChange = useCallback((value: string) => {
    setDensity(value as ListViewProps['density']);
  }, []);

  const [showIcons, setShowIcons] = useState(true);
  const [lastActionKey, setLastActionKey] = useState<ItemKey>('');
  const [lastActionItemKey, setLastActionItemKey] = useState<ItemKey>('');

  const onAction = useCallback((actionKey: ItemKey, itemKey: ItemKey): void => {
    setLastActionKey(actionKey);
    setLastActionItemKey(itemKey);
  }, []);

  const onChange = useCallback((keys: 'all' | Iterable<ItemKey>): void => {
    setSelectedKeys(keys);
  }, []);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div {...sampleSectionIdAndClasses('list-views')}>
      <h2 className="ui-title">List View</h2>

      <Grid
        gap={14}
        height="size-6000"
        columns="1fr 1fr 1fr"
        rows={`auto minmax(${singleChildExampleHeight}px, auto) 1fr auto 1fr`}
      >
        <LabeledFlexContainer
          alignItems="center"
          direction="row"
          label="Density"
          gridColumn="span 3"
        >
          <RadioGroup
            aria-label="Density"
            orientation="horizontal"
            value={density}
            onChange={onDensityChange}
          >
            <Radio value="compact">Compact</Radio>
            <Radio value="regular">Regular</Radio>
            <Radio value="spacious">Spacious</Radio>
          </RadioGroup>
        </LabeledFlexContainer>

        <LabeledFlexContainer
          label="Single Child"
          gridColumn="span 3"
          height="100%"
        >
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

        <LabeledFlexContainer label="Controlled" gridColumn="span 2">
          <ListViewNormalized
            aria-label="Controlled"
            density={density}
            normalizedItems={itemsWithIcons}
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            showItemIcons={showIcons}
            onChange={onChange}
            actions={
              <ListActionGroup
                overflowMode="collapse"
                buttonLabelBehavior="collapse"
                maxWidth={80}
                onAction={onAction}
              >
                <Item key="Edit">
                  <Icon>
                    <FontAwesomeIcon icon={vsEdit} />
                  </Icon>
                  <Text>Edit</Text>
                </Item>
                <Item key="Delete">
                  <Icon>
                    <FontAwesomeIcon icon={vsTrash} />
                  </Icon>
                  <Text>Delete</Text>
                </Item>
              </ListActionGroup>
            }
          />
          {lastActionKey} {lastActionItemKey}
        </LabeledFlexContainer>
      </Grid>
    </div>
  );
}

export default ListViews;
