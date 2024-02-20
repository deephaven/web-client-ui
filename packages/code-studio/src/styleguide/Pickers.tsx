import React, { useMemo } from 'react';
import { Item, Picker } from '@deephaven/components';
import { vsPerson } from '@deephaven/icons';
import { Flex, Icon, Text } from '@adobe/react-spectrum';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { sampleSectionIdAndClasses } from './utils';

function PersonIcon(): JSX.Element {
  return (
    <Icon>
      <FontAwesomeIcon icon={vsPerson} />
    </Icon>
  );
}

export function Pickers(): JSX.Element {
  const mixedItems = useMemo(
    () => [
      'String 1',
      'String 2',
      'String 3',
      '',
      'Some really long text that should get truncated',
      444,
      999,
      /* eslint-disable react/jsx-key */
      <Item id="a">Item Aaa</Item>,
      <Item id="b">Item Bbb</Item>,
      <Item id="c">
        <PersonIcon />
        <Text>Complex Ccc</Text>
      </Item>,
      /* eslint-enable react/jsx-key */
    ],
    []
  );

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div {...sampleSectionIdAndClasses('pickers')}>
      <h2 className="ui-title">Pickers</h2>

      <Flex gap={14}>
        <Picker label="Mixed Item Types" items={mixedItems} tooltip />

        <Picker label="Single Child" tooltip={{ placement: 'bottom-end' }}>
          <Item id="a">Aaa</Item>
        </Picker>

        <Picker label="Multiple Children" tooltip={false}>
          <Item id="a">Aaa</Item>
          <Item id="b">Bbb</Item>
        </Picker>

        <Picker label="Complex Items">
          <Item id="a">
            <PersonIcon />
            <Text>Person A</Text>
          </Item>
          <Item id="b">
            <PersonIcon />
            <Text>Person B</Text>
          </Item>
        </Picker>
      </Flex>
    </div>
  );
}

export default Pickers;
