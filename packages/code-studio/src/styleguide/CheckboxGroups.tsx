import React from 'react';
import { Checkbox, CheckboxGroup, Flex, Text } from '@deephaven/components';
import SampleSection from './SampleSection';

export function CheckboxGroups(): JSX.Element {
  return (
    <SampleSection name="checkbox-groups">
      <h2 className="ui-title">Checkbox Groups</h2>
      <Flex gap="size-100" gridColumn="span 3" height="100%">
        <Flex direction="column">
          <Text>Single Child</Text>
          <CheckboxGroup aria-label="Single Child">
            <Checkbox checked={false}>Aaa</Checkbox>
          </CheckboxGroup>
        </Flex>

        <Flex direction="column">
          <Text>Multiple Children</Text>
          <CheckboxGroup aria-label="Multiple Children">
            <Checkbox checked={false}>Aaa</Checkbox>
            <Checkbox checked={false}>Bbb</Checkbox>
            <Checkbox checked={false}>Ccc</Checkbox>
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
            <Checkbox checked={false}>Aaa</Checkbox>
          </CheckboxGroup>
        </Flex>
      </Flex>
    </SampleSection>
  );
}

export default CheckboxGroups;
