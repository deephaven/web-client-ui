import React, { createElement } from 'react';
import { Item, Text } from '@adobe/react-spectrum';
import {
  NormalizedPickerItem,
  normalizeTooltipOptions,
  normalizePickerItemList,
  PickerItem,
  isSectionElement,
  isItemElement,
} from './PickerUtils';
import type { PickerProps } from './Picker';
import { Section } from '../Section';

beforeEach(() => {
  expect.hasAssertions();
});

/* eslint-disable react/jsx-key */
const expectedNormalizations = new Map<PickerItem, NormalizedPickerItem>([
  [
    999,
    {
      content: '999',
      key: 999,
      textValue: '999',
    },
  ],
  [
    true,
    {
      content: 'true',
      key: true,
      textValue: 'true',
    },
  ],
  [
    false,
    {
      content: 'false',
      key: false,
      textValue: 'false',
    },
  ],
  [
    '',
    {
      content: '',
      key: '',
      textValue: '',
    },
  ],
  [
    'String',
    {
      content: 'String',
      key: 'String',
      textValue: 'String',
    },
  ],
  [
    <Item>Single string child no textValue</Item>,
    {
      content: 'Single string child no textValue',
      key: 'Single string child no textValue',
      textValue: 'Single string child no textValue',
    },
  ],
  [
    <Item>
      <span>No textValue</span>
    </Item>,
    {
      content: <span>No textValue</span>,
      key: '',
      textValue: '',
    },
  ],
  [
    <Item textValue="textValue">Single string</Item>,
    {
      content: 'Single string',
      key: 'textValue',
      textValue: 'textValue',
    },
  ],
  [
    <Item key="explicit.key" textValue="textValue">
      Explicit key
    </Item>,
    {
      content: 'Explicit key',
      key: 'explicit.key',
      textValue: 'textValue',
    },
  ],
  [
    <Item textValue="textValue">
      <i>i</i>
      <Text>Complex</Text>
    </Item>,
    {
      content: [<i>i</i>, <Text>Complex</Text>],
      key: 'textValue',
      textValue: 'textValue',
    },
  ],
]);
/* eslint-enable react/jsx-key */

const mixedItems = [...expectedNormalizations.keys()];

const children = {
  empty: [] as PickerProps['children'],
  single: mixedItems[0] as PickerProps['children'],
  mixed: mixedItems as PickerProps['children'],
};

describe('isSectionElement', () => {
  it.each([
    [createElement(Section), true],
    [createElement(Item), false],
    ['some string', false],
  ])('should return true for a Section element', (element, expected) => {
    expect(isSectionElement(element)).toBe(expected);
  });
});

describe('isItemElement', () => {
  it.each([
    [createElement(Item), true],
    [createElement(Section), false],
    ['some string', false],
  ])('should return true for a Item element', (element, expected) => {
    expect(isItemElement(element)).toBe(expected);
  });
});

describe('normalizePickerItemList', () => {
  it.each([children.empty, children.single, children.mixed])(
    'should return normalized picker items: %s',
    given => {
      const childrenArray = Array.isArray(given) ? given : [given];

      const expected = childrenArray.map(item =>
        expectedNormalizations.get(item)
      );

      const actual = normalizePickerItemList(given);
      expect(actual).toEqual(expected);
    }
  );
});

describe('normalizeTooltipOptions', () => {
  it.each([
    [undefined, null],
    [null, null],
    [false, null],
    [true, { placement: 'top-start' }],
    [{ placement: 'bottom-end' }, { placement: 'bottom-end' }],
  ] as const)('should return: %s', (options, expected) => {
    const actual = normalizeTooltipOptions(options);
    expect(actual).toEqual(expected);
  });
});
