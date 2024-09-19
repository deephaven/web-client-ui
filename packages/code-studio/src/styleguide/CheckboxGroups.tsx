import React from 'react';
import { CheckboxGroup, Flex, Text } from '@deephaven/components';
// eslint-disable-next-line no-restricted-imports
import { Checkbox } from '@adobe/react-spectrum';
import SampleSection from './SampleSection';

export function CheckboxGroups(): JSX.Element {
  return (
    <SampleSection name="checkbox-groups">
      <h2 className="ui-title">Checkbox Groups</h2>
      <Flex gap="size-100" gridColumn="span 3" height="100%">
        <Flex direction="column">
          <Text>Single Child</Text>
          <CheckboxGroup aria-label="Single Child">
            <Checkbox>Aaa</Checkbox>
          </CheckboxGroup>
        </Flex>

        <Flex direction="column">
          <Text>Multiple Children</Text>
          <CheckboxGroup aria-label="Multiple Children">
            <Checkbox>Aaa</Checkbox>
            <Checkbox>Bbb</Checkbox>
            <Checkbox>Ccc</Checkbox>
          </CheckboxGroup>
        </Flex>

        <Flex direction="column">
          <Text>Mixed Children Types</Text>
          <CheckboxGroup aria-label="Mixed Children Types">
            {/* eslint-disable react/jsx-curly-brace-presence */}
            {'String 1'}
            {'String 2'}
            {444}
            {999}
            {true}
            {false}
            <Checkbox>Aaa</Checkbox>
          </CheckboxGroup>
        </Flex>
      </Flex>
    </SampleSection>
  );
}

export default CheckboxGroups;
