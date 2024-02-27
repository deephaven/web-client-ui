import React from 'react';
import { Picker } from '@deephaven/components';
import { vsPerson } from '@deephaven/icons';
import { Flex, Icon, Item, Text } from '@adobe/react-spectrum';
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
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <div {...sampleSectionIdAndClasses('pickers')}>
      <h2 className="ui-title">Pickers</h2>

      <Flex gap={14}>
        <Picker label="Single Child" tooltip={{ placement: 'bottom-end' }}>
          <Item>Aaa</Item>
        </Picker>

        <Picker label="Mixed Children Types" tooltip>
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
            <PersonIcon />
            <Text>Complex Ccc</Text>
          </Item>
        </Picker>
      </Flex>
    </div>
  );
}

export default Pickers;
