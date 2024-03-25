import React, { createElement } from 'react';
import {
  NormalizedPickerItem,
  normalizeTooltipOptions,
  normalizePickerItemList,
  PickerItem,
  isSectionElement,
  isItemElement,
  NormalizedPickerSection,
  INVALID_PICKER_ITEM_ERROR_MESSAGE,
  isPickerItemOrSection,
  isNormalizedPickerSection,
} from './PickerUtils';
import type { PickerProps } from './Picker';
import { Item, Section } from '../shared';
import { Text } from '../Text';

beforeEach(() => {
  expect.hasAssertions();
});

/* eslint-disable react/jsx-key */
const expectedItems = {
  numberLiteral: [
    999,
    {
      content: 999,
      key: 999,
      textValue: '999',
    },
  ],
  stringLiteral: [
    'String',
    {
      content: 'String',
      key: 'String',
      textValue: 'String',
    },
  ],
  emptyStringLiteral: [
    '',
    {
      content: '',
      key: '',
      textValue: '',
    },
  ],
  booleanLiteral: [
    false,
    {
      content: false,
      key: false,
      textValue: 'false',
    },
  ],
  singleStringChild: [
    <Item textValue="textValue">Single string</Item>,
    {
      content: 'Single string',
      key: 'textValue',
      textValue: 'textValue',
    },
  ],
  singleStringChildNoTextValue: [
    // eslint-disable-next-line react/jsx-key
    <Item>Single string child no textValue</Item>,
    {
      content: 'Single string child no textValue',
      key: 'Single string child no textValue',
      textValue: 'Single string child no textValue',
    },
  ],
  elementChildNoTextValue: [
    <Item>
      <span>No textValue</span>
    </Item>,
    {
      content: <span>No textValue</span>,
    },
  ],
  explicitKey: [
    <Item key="explicit.key" textValue="textValue">
      Explicit key
    </Item>,
    {
      content: 'Explicit key',
      key: 'explicit.key',
      textValue: 'textValue',
    },
  ],
  complex: [
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
} satisfies Record<string, [PickerItem, NormalizedPickerItem]>;
/* eslint-enable react/jsx-key */

const nonItemElement = <span>Non-item element</span>;

/* eslint-disable react/jsx-key */
const expectedSections = {
  noTitle: [
    <Section>{expectedItems.singleStringChild[0]}</Section>,
    {
      items: [expectedItems.singleStringChild[1]],
    },
  ],
  title: [
    <Section title="Some Title">{expectedItems.singleStringChild[0]}</Section>,
    {
      key: 'Some Title',
      title: 'Some Title',
      items: [expectedItems.singleStringChild[1]],
    },
  ],
  explicitKey: [
    <Section key="Some Key" title="Some Title">
      {expectedItems.singleStringChild[0]}
    </Section>,
    {
      key: 'Some Key',
      title: 'Some Title',
      items: [expectedItems.singleStringChild[1]],
    },
  ],
} satisfies Record<string, [PickerItem, NormalizedPickerSection]>;
/* eslint-enable react/jsx-key */

const expectedNormalizations = new Map<
  PickerItem,
  NormalizedPickerItem | NormalizedPickerSection
>([...Object.values(expectedItems), ...Object.values(expectedSections)]);

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

describe('isPickerItemOrSection', () => {
  it.each([
    [createElement(Item), true],
    [createElement(Section), true],
    ['Some string', true],
    [999, true],
    [true, true],
    [false, true],
    [createElement('span'), false],
  ])(
    'should return true for a Item or Section element: %s, %s',
    (element, expected) => {
      expect(isPickerItemOrSection(element)).toBe(expected);
    }
  );
});

describe('isNormalizedPickerSection', () => {
  it.each([
    [{ key: 'mock.key' } as NormalizedPickerItem, false],
    [{ key: 'mock.key', items: [] } as NormalizedPickerSection, true],
  ])(
    'should return true for a normalized Picker section: %s',
    (obj, expected) => {
      expect(isNormalizedPickerSection(obj)).toBe(expected);
    }
  );
});

describe('normalizePickerItemList', () => {
  it.each([children.empty, children.single, children.mixed])(
    'should return normalized picker items: %#: %s',
    given => {
      const childrenArray = Array.isArray(given) ? given : [given];

      const expected = childrenArray.map(item =>
        expectedNormalizations.get(item)
      );

      const actual = normalizePickerItemList(given);
      expect(actual).toEqual(expected);
    }
  );

  it(`should throw for invalid items: %#: %s`, () => {
    expect(() => normalizePickerItemList(nonItemElement)).toThrow(
      INVALID_PICKER_ITEM_ERROR_MESSAGE
    );
  });
});

describe('normalizeTooltipOptions', () => {
  it.each([
    [undefined, null],
    [null, null],
    [false, null],
    [true, { placement: 'right' }],
    [{ placement: 'bottom-end' }, { placement: 'bottom-end' }],
  ] as const)('should return: %s', (options, expected) => {
    const actual = normalizeTooltipOptions(options);
    expect(actual).toEqual(expected);
  });
});
