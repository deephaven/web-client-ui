import React from 'react';
import { Item, Section } from '../shared';
import {
  flattenJsxChildren,
  flattenEntriesToItems,
  filterEntries,
  collectEntryItemKeys,
  filterJsxChildrenByKeys,
  resolveSelection,
  isFlatSection,
  type MultiSelectFlatEntry,
  type MultiSelectFlatItem,
  type MultiSelectFlatSection,
} from './multiSelectUtils';

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('isFlatSection', () => {
  it('returns true for section entries', () => {
    const section: MultiSelectFlatSection = {
      kind: 'section',
      key: 'sec',
      title: 'Section',
      items: [],
    };
    expect(isFlatSection(section)).toBe(true);
  });

  it('returns false for item entries', () => {
    const item: MultiSelectFlatItem = { kind: 'item', key: 'a', label: 'A' };
    expect(isFlatSection(item)).toBe(false);
  });
});

describe('flattenJsxChildren', () => {
  it('flattens plain Item elements', () => {
    const children = [
      <Item key="a" textValue="Alpha">
        Alpha
      </Item>,
      <Item key="b" textValue="Beta">
        Beta
      </Item>,
    ];

    const result = flattenJsxChildren(children);
    expect(result).toEqual([
      { kind: 'item', key: 'a', label: 'Alpha' },
      { kind: 'item', key: 'b', label: 'Beta' },
    ]);
  });

  it('flattens Section elements with nested Items', () => {
    const children = [
      <Section key="s1" title="Group">
        <Item key="x" textValue="X">
          X
        </Item>
        <Item key="y" textValue="Y">
          Y
        </Item>
      </Section>,
    ];

    const result = flattenJsxChildren(children);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      kind: 'section',
      title: 'Group',
      items: [
        { kind: 'item', key: 'x', label: 'X' },
        { kind: 'item', key: 'y', label: 'Y' },
      ],
    });
  });

  it('handles a mix of Items and Sections', () => {
    const children = [
      <Item key="a" textValue="A">
        A
      </Item>,
      <Section key="s1" title="Group">
        <Item key="b" textValue="B">
          B
        </Item>
      </Section>,
    ];

    const result = flattenJsxChildren(children);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ kind: 'item', key: 'a' });
    expect(result[1]).toMatchObject({ kind: 'section', key: 's1' });
  });

  it('skips items without keys', () => {
    // eslint-disable-next-line react/jsx-key
    const children = [<Item textValue="NoKey">NoKey</Item>];
    const result = flattenJsxChildren(children);
    expect(result).toEqual([]);
  });
});

describe('flattenEntriesToItems', () => {
  it('returns items directly and extracts items from sections', () => {
    const entries: MultiSelectFlatEntry[] = [
      { kind: 'item', key: 'a', label: 'A' },
      {
        kind: 'section',
        key: 's',
        title: 'S',
        items: [
          { kind: 'item', key: 'b', label: 'B' },
          { kind: 'item', key: 'c', label: 'C' },
        ],
      },
    ];
    const result = flattenEntriesToItems(entries);
    expect(result).toEqual([
      { kind: 'item', key: 'a', label: 'A' },
      { kind: 'item', key: 'b', label: 'B' },
      { kind: 'item', key: 'c', label: 'C' },
    ]);
  });

  it('returns empty array for empty entries', () => {
    expect(flattenEntriesToItems([])).toEqual([]);
  });
});

describe('filterEntries', () => {
  const contains = (str: string, sub: string): boolean =>
    str.toLowerCase().includes(sub.toLowerCase());

  const entries: MultiSelectFlatEntry[] = [
    { kind: 'item', key: 'apple', label: 'Apple' },
    { kind: 'item', key: 'banana', label: 'Banana' },
    {
      kind: 'section',
      key: 'citrus',
      title: 'Citrus',
      items: [
        { kind: 'item', key: 'orange', label: 'Orange' },
        { kind: 'item', key: 'lemon', label: 'Lemon' },
      ],
    },
  ];

  it('filters top-level items by text', () => {
    const result = filterEntries(entries, 'app', contains);
    expect(result).toEqual([{ kind: 'item', key: 'apple', label: 'Apple' }]);
  });

  it('filters items within sections', () => {
    const result = filterEntries(entries, 'lem', contains);
    expect(result).toEqual([
      {
        kind: 'section',
        key: 'citrus',
        title: 'Citrus',
        items: [{ kind: 'item', key: 'lemon', label: 'Lemon' }],
      },
    ]);
  });

  it('removes sections with no matching items', () => {
    const result = filterEntries(entries, 'xyz', contains);
    expect(result).toEqual([]);
  });

  it('returns all matching entries across items and sections', () => {
    const result = filterEntries(entries, 'a', contains);
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ key: 'apple' });
    expect(result[1]).toMatchObject({ key: 'banana' });
    expect(result[2]).toMatchObject({
      kind: 'section',
      items: [{ key: 'orange' }],
    });
  });
});

describe('collectEntryItemKeys', () => {
  it('collects keys from items and sections', () => {
    const entries: MultiSelectFlatEntry[] = [
      { kind: 'item', key: 'a', label: 'A' },
      {
        kind: 'section',
        key: 's',
        title: 'S',
        items: [{ kind: 'item', key: 'b', label: 'B' }],
      },
    ];
    expect(collectEntryItemKeys(entries)).toEqual(new Set(['a', 'b']));
  });
});

describe('filterJsxChildrenByKeys', () => {
  it('keeps only items whose keys are in the surviving set', () => {
    const children = [
      <Item key="a" textValue="A">
        A
      </Item>,
      <Item key="b" textValue="B">
        B
      </Item>,
      <Item key="c" textValue="C">
        C
      </Item>,
    ];
    const result = filterJsxChildrenByKeys(children, new Set(['a', 'c']));
    expect(result).toHaveLength(2);
    expect(result[0].key).toBe('a');
    expect(result[1].key).toBe('c');
  });

  it('filters items within sections and removes empty sections', () => {
    const children = [
      <Section key="s1" title="Group">
        <Item key="x" textValue="X">
          X
        </Item>
        <Item key="y" textValue="Y">
          Y
        </Item>
      </Section>,
    ];
    const result = filterJsxChildrenByKeys(children, new Set(['x']));
    expect(result).toHaveLength(1);
  });

  it('removes sections when no children survive', () => {
    const children = [
      <Section key="s1" title="Group">
        <Item key="x" textValue="X">
          X
        </Item>
      </Section>,
    ];
    const result = filterJsxChildrenByKeys(children, new Set(['nope']));
    expect(result).toHaveLength(0);
  });
});

describe('resolveSelection', () => {
  const allKeys = ['a', 'b', 'c'];

  it('returns empty set for null/undefined', () => {
    expect(resolveSelection(undefined, allKeys)).toEqual(new Set());
  });

  it('returns all keys for "all"', () => {
    expect(resolveSelection('all', allKeys)).toEqual(new Set(['a', 'b', 'c']));
  });

  it('converts an iterable to a string set', () => {
    expect(resolveSelection([1, 2] as Iterable<number>, allKeys)).toEqual(
      new Set(['1', '2'])
    );
  });

  it('converts string iterables as-is', () => {
    expect(resolveSelection(['a', 'b'], allKeys)).toEqual(new Set(['a', 'b']));
  });
});
