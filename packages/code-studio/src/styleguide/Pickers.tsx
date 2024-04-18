import React, { useCallback, useState } from 'react';
import {
  Flex,
  Item,
  Picker,
  ItemKey,
  Section,
  Text,
  PickerNormalized,
} from '@deephaven/components';
import { vsPerson } from '@deephaven/icons';
import { Icon } from '@adobe/react-spectrum';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getPositionOfSelectedItem } from '@deephaven/react-hooks';
import { PICKER_ITEM_HEIGHTS, PICKER_TOP_OFFSET } from '@deephaven/utils';
import {
  generateItemElements,
  generateNormalizedItems,
  sampleSectionIdAndClasses,
} from './utils';

// Generate enough items to require scrolling
const items = [...generateNormalizedItems(52)];
const itemElementsA = [...generateItemElements(0, 51)];
const itemElementsB = [...generateItemElements(52, 103)];
const itemElementsC = [...generateItemElements(104, 155)];
const itemElementsD = [...generateItemElements(156, 207)];
const itemElementsE = [...generateItemElements(208, 259)];

function PersonIcon(): JSX.Element {
  return (
    <Icon>
      <FontAwesomeIcon icon={vsPerson} />
    </Icon>
  );
}

export function Pickers(): JSX.Element {
  const [selectedKey, setSelectedKey] = useState<ItemKey | null>(null);

  const getInitialScrollPosition = useCallback(
    async () =>
      getPositionOfSelectedItem({
        keyedItems: items,
        itemHeight: PICKER_ITEM_HEIGHTS.noDescription,
        selectedKey,
        topOffset: PICKER_TOP_OFFSET,
      }),
    [selectedKey]
  );

  const onChange = useCallback((key: ItemKey): void => {
    setSelectedKey(key);
  }, []);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div {...sampleSectionIdAndClasses('pickers')}>
      <h2 className="ui-title">Pickers</h2>

      <Flex gap={14}>
        <Picker label="Single Child" tooltip={{ placement: 'bottom-end' }}>
          <Item textValue="Aaa">Aaa</Item>
        </Picker>

        <Picker label="Mixed Children Types" defaultSelectedKey="999" tooltip>
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
            <PersonIcon />
            <Text>Complex Ccc with text that should be truncated</Text>
          </Item>
        </Picker>

        <Picker label="Sections" tooltip>
          {/* eslint-disable react/jsx-curly-brace-presence */}
          {'String 1'}
          {'String 2'}
          {'String 3'}
          <Section title="Section">
            <Item textValue="Item Aaa">Item Aaa</Item>
            <Item textValue="Item Bbb">Item Bbb</Item>
            <Item textValue="Complex Ccc">
              <PersonIcon />
              <Text>Complex Ccc</Text>
            </Item>
          </Section>
          <Section key="Key B">
            <Item textValue="Item Ddd">Item Ddd</Item>
            <Item textValue="Item Eee">Item Eee</Item>
            <Item textValue="Complex Fff">
              <PersonIcon />
              <Text>Complex Fff</Text>
            </Item>
            <Item textValue="Ggg">
              <PersonIcon />
              <Text>Label</Text>
              <Text slot="description">Description</Text>
            </Item>
            <Item textValue="Hhh">
              <PersonIcon />
              <Text>Label that causes overflow</Text>
              <Text slot="description">Description that causes overflow</Text>
            </Item>
          </Section>
          <Section title="Section A">{itemElementsA}</Section>
          <Section title="Section B">{itemElementsB}</Section>
          <Section key="Section C">{itemElementsC}</Section>
          <Section key="Section D">{itemElementsD}</Section>
          <Section title="Section E">{itemElementsE}</Section>
        </Picker>

        <PickerNormalized
          label="Controlled"
          getInitialScrollPosition={getInitialScrollPosition}
          normalizedItems={items}
          selectedKey={selectedKey}
          onChange={onChange}
        />
      </Flex>
    </div>
  );
}

export default Pickers;
