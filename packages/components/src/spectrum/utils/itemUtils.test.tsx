import React, { createElement } from 'react';
import {
  getItemKey,
  INVALID_ITEM_ERROR_MESSAGE,
  isItemElement,
  isNormalizedItemsWithKeysList,
  isNormalizedSection,
  isItemOrSection,
  isSectionElement,
  NormalizedItem,
  NormalizedSection,
  normalizeItemList,
  normalizeTooltipOptions,
  ItemElementOrPrimitive,
  ItemOrSection,
  SectionElement,
} from './itemUtils';
import type { PickerProps } from '../picker/Picker';
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
      item: { content: 999, key: 999, textValue: '999' },
    },
  ],
  stringLiteral: [
    'String',
    {
      item: { content: 'String', key: 'String', textValue: 'String' },
    },
  ],
  emptyStringLiteral: [
    '',
    {
      item: { content: '', key: '', textValue: '' },
    },
  ],
  booleanLiteral: [
    false,
    {
      item: { content: false, key: false, textValue: 'false' },
    },
  ],
  singleStringChild: [
    <Item textValue="textValue">Single string</Item>,
    {
      item: {
        content: 'Single string',
        key: 'textValue',
        textValue: 'textValue',
      },
    },
  ],
  singleStringChildNoTextValue: [
    // eslint-disable-next-line react/jsx-key
    <Item>Single string child no textValue</Item>,
    {
      item: {
        content: 'Single string child no textValue',
        key: 'Single string child no textValue',
        textValue: 'Single string child no textValue',
      },
    },
  ],
  elementChildNoTextValue: [
    <Item>
      <span>No textValue</span>
    </Item>,
    {
      item: { content: <span>No textValue</span> },
    },
  ],
  explicitKey: [
    <Item key="explicit.key" textValue="textValue">
      Explicit key
    </Item>,
    {
      item: {
        content: 'Explicit key',
        key: 'explicit.key',
        textValue: 'textValue',
      },
    },
  ],
  complex: [
    <Item textValue="textValue">
      <i>i</i>
      <Text>Complex</Text>
    </Item>,
    {
      item: {
        content: [<i>i</i>, <Text>Complex</Text>],
        key: 'textValue',
        textValue: 'textValue',
      },
    },
  ],
} satisfies Record<string, [ItemElementOrPrimitive, NormalizedItem]>;
/* eslint-enable react/jsx-key */

const nonItemElement = <span>Non-item element</span>;

/* eslint-disable react/jsx-key */
const expectedSections = {
  noTitle: [
    <Section>{expectedItems.singleStringChild[0]}</Section>,
    {
      item: { items: [expectedItems.singleStringChild[1]] },
    },
  ],
  title: [
    <Section title="Some Title">{expectedItems.singleStringChild[0]}</Section>,
    {
      item: {
        key: 'Some Title',
        title: 'Some Title',
        items: [expectedItems.singleStringChild[1]],
      },
    },
  ],
  explicitKey: [
    <Section key="Some Key" title="Some Title">
      {expectedItems.singleStringChild[0]}
    </Section>,
    {
      item: {
        key: 'Some Key',
        title: 'Some Title',
        items: [expectedItems.singleStringChild[1]],
      },
    },
  ],
} satisfies Record<string, [ItemElementOrPrimitive, NormalizedSection]>;
/* eslint-enable react/jsx-key */

const expectedNormalizations = new Map<
  ItemElementOrPrimitive,
  NormalizedItem | NormalizedSection
>([...Object.values(expectedItems), ...Object.values(expectedSections)]);

const mixedItems = [...expectedNormalizations.keys()];

const children = {
  empty: [] as PickerProps['children'],
  single: mixedItems[0] as PickerProps['children'],
  mixed: mixedItems as PickerProps['children'],
};

describe('getItemKey', () => {
  it.each([
    [{ key: 'top-level.key', item: { key: 'item.key' } }, 'item.key'],
    [{ key: 'top-level.key', item: {} }, 'top-level.key'],
    [{ key: 'top-level.key' }, 'top-level.key'],
    [{ item: { key: 'item.key' } }, 'item.key'],
    [{}, undefined],
  ] as NormalizedItem[])(
    'should return the item.key or fallback to the top-level key: %s, %s',
    (given, expected) => {
      const actual = getItemKey(given);
      expect(actual).toBe(expected);
    }
  );
});

describe('isNormalizedItemsWithKeysList', () => {
  const mock = {
    normalizedItemWithKey: {
      key: 'some.key',
      item: { content: '' },
    } as NormalizedItem,
    normalizedSectionWithKey: {
      key: 'some.key',
      item: { items: [] },
    } as NormalizedSection,
    item: (<Item>Item</Item>) as ItemElementOrPrimitive,
    section: (
      <Section>
        <Item>Item</Item>
      </Section>
    ) as SectionElement,
  } as const;

  it.each([
    [['item'], false],
    [['section'], false],
    [['item', 'normalizedItemWithKey'], false],
    [['section', 'normalizedItemWithKey'], false],
    [[], true],
    [['normalizedItemWithKey'], true],
    [['normalizedSectionWithKey'], true],
    [['normalizedItemWithKey', 'item'], true],
    [['normalizedSectionWithKey', 'section'], true],
  ] as [(keyof typeof mock)[], boolean][])(
    'should return true for a normalized items with keys list: %s, %s',
    (givenKeys, expected) => {
      const given = givenKeys.map(key => mock[key]) as
        | ItemOrSection[]
        | (NormalizedItem | NormalizedSection)[];

      expect(isNormalizedItemsWithKeysList(given)).toBe(expected);
    }
  );
});

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

describe('isItemOrSection', () => {
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
      expect(isItemOrSection(element)).toBe(expected);
    }
  );
});

describe('isNormalizedSection', () => {
  it.each([
    [{ item: {} } as NormalizedItem, false],
    [{ item: { items: [] } } as NormalizedSection, true],
  ])('should return true for a normalized section: %s', (obj, expected) => {
    expect(isNormalizedSection(obj)).toBe(expected);
  });
});

describe('normalizeItemList', () => {
  it.each([children.empty, children.single, children.mixed])(
    'should return normalized items: %#: %s',
    given => {
      const childrenArray = Array.isArray(given) ? given : [given];

      const expected = childrenArray.map(item =>
        expectedNormalizations.get(item)
      );

      const actual = normalizeItemList(given);
      expect(actual).toEqual(expected);
    }
  );

  it(`should throw for invalid items: %#: %s`, () => {
    expect(() => normalizeItemList(nonItemElement)).toThrow(
      INVALID_ITEM_ERROR_MESSAGE
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

  it('should allow overriding default placement', () => {
    const actual = normalizeTooltipOptions(true, 'top');
    expect(actual).toEqual({ placement: 'top' });
  });
});
