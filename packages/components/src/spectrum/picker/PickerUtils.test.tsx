import React from 'react';
import { Item, Text } from '@adobe/react-spectrum';
import {
  getNormalizedPickerItemsFromProps,
  NormalizedPickerItem,
  normalizeTooltipOptions,
  PickerChildrenOrItemsProps,
  PickerItem,
} from './PickerUtils';

beforeEach(() => {
  expect.hasAssertions();
});

/* eslint-disable react/jsx-key */
const expectedNormalizations = new Map<PickerItem, NormalizedPickerItem>([
  [
    999,
    {
      content: '999',
      key: '999',
      textValue: '999',
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
      key: 'Single string',
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

const propsWithChildren = {
  empty: { children: [] } as PickerChildrenOrItemsProps,
  single: { children: mixedItems[0] } as PickerChildrenOrItemsProps,
  mixed: { children: mixedItems } as PickerChildrenOrItemsProps,
};

const propsWithItems = {
  empty: { items: [] } as PickerChildrenOrItemsProps,
  mixed: { items: mixedItems } as PickerChildrenOrItemsProps,
};

describe('getNormalizedPickerItemsFromProps', () => {
  it.each([
    propsWithChildren.empty,
    propsWithChildren.single,
    propsWithChildren.mixed,
    propsWithItems.empty,
    propsWithItems.mixed,
  ])('should return normalized picker items: %s', props => {
    let items = props.items == null ? props.children : props.items;

    if (!Array.isArray(items)) {
      items = [items];
    }

    const expected = items.map(item => expectedNormalizations.get(item));
    const actual = getNormalizedPickerItemsFromProps(props);
    expect(actual).toEqual(expected);
  });
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
