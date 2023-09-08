import type { Key } from 'react';
import type { Selection } from '@react-types/shared';
import type { KeyedItem } from '@deephaven/utils';
import {
  getSelectedItemCountOrAll,
  isSelectionEqual,
  isSelectionMaybeInvertedEqual,
  mapSelection,
  optimizeSelection,
} from './SelectionUtils';

type MonkeyName = `monkey-${string}`;
const getMonkeyDataItem = jest.fn<KeyedItem<{ name: MonkeyName }>, [Key]>();
const mapItem = jest.fn<Key, [KeyedItem<{ name: MonkeyName }>]>();

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();

  getMonkeyDataItem.mockImplementation((key: Key) => ({
    key: String(key),
    item: { name: `monkey-${key}` },
  }));

  mapItem.mockImplementation(
    (item: KeyedItem<{ name: string }>) => item.item?.name ?? ''
  );
});

describe('getSelectedItemCountOrAll', () => {
  const selection = {
    all: 'all' as Selection,
    five: new Set('abcde') as Selection,
    none: new Set() as Selection,
  };

  it.each([selection.all, selection.none, selection.five])(
    'should return 0 if size is 0',
    sel => {
      expect(getSelectedItemCountOrAll(0, sel)).toEqual(0);
    }
  );

  it.each([selection.all, selection.five])(
    'should return "all" if all selected',
    sel => {
      expect(getSelectedItemCountOrAll(5, sel)).toEqual('all');
    }
  );

  it('should return selection size if not all selected', () => {
    expect(getSelectedItemCountOrAll(6, selection.five)).toEqual(5);
  });
});

describe('isSelectionEqual', () => {
  it.each([
    // Match cases
    ['all', 'all', true],
    [new Set(), new Set(), true],
    [new Set('abc'), new Set('abc'), true],
    // Mismatch cases
    ['all', new Set(), false],
    [new Set(), 'all', false],
    [new Set(), new Set('abc'), false],
    [new Set('abc'), new Set('def'), false],
  ] as const)(
    'should return true if selections represent the same selected values',
    (selectionA, selectionB, isEqual) => {
      expect(isSelectionEqual(selectionA, selectionB)).toEqual(isEqual);
    }
  );
});

describe.each([
  [true, false],
  [false, true],
  [true, true],
  [false, false],
] as const)('isSelectionMaybeInvertedEqual', (isInvertedA, isInvertedB) => {
  it.each([
    // Match cases
    ['all', 'all', true],
    [new Set(), new Set(), true],
    [new Set('abc'), new Set('abc'), true],
    // Mismatch cases
    ['all', new Set(), false],
    [new Set(), 'all', false],
    [new Set(), new Set('abc'), false],
    [new Set('abc'), new Set('def'), false],
  ] as const)(
    `should return true if selections represent the same selected values: isInvertedA:${isInvertedA}, isInvertedB:${isInvertedB}, selectionA:%s, selectionB:%s`,
    (selectionA, selectionB, areSelectionsEqual) => {
      const isEqual = isInvertedA === isInvertedB && areSelectionsEqual;

      expect(
        isSelectionMaybeInvertedEqual(
          { isInverted: isInvertedA, selection: selectionA },
          { isInverted: isInvertedB, selection: selectionB }
        )
      ).toEqual(isEqual);
    }
  );
});

describe('mapSelection', () => {
  it('should return "all" if given "all"', () => {
    const selectedItemKeys = 'all';
    expect(mapSelection(selectedItemKeys, getMonkeyDataItem, mapItem)).toEqual(
      'all'
    );
  });

  it('should return mapped items for selected keys', () => {
    const selectedItemKeys = new Set('abc');
    const expected = new Set<MonkeyName>(['monkey-a', 'monkey-b', 'monkey-c']);

    const actual = mapSelection(selectedItemKeys, getMonkeyDataItem, mapItem);

    expect(actual).toEqual(expected);
  });
});

describe('optimizeSelection', () => {
  it('should invert selection if selection is "all"', () => {
    const selection = 'all';
    const totalRecords = 10;

    const actual = optimizeSelection(selection, totalRecords);

    expect(actual).toEqual({
      isInverted: true,
      selection: new Set(),
    });
  });

  it.each([
    // Odd record count
    [new Set(''), 5, { isInverted: false, selection: new Set('') }],
    [new Set('12'), 5, { isInverted: false, selection: new Set('12') }],
    [new Set('123'), 5, { isInverted: true, selection: new Set('04') }],
    // Even record count
    [new Set(''), 6, { isInverted: false, selection: new Set('') }],
    [new Set('123'), 6, { isInverted: false, selection: new Set('123') }],
    [new Set('1234'), 6, { isInverted: true, selection: new Set('05') }],
  ] as const)(
    'should invert selection if selection size > half the total size',
    (selection, totalRecords, expected) => {
      const actual = optimizeSelection(selection, totalRecords);

      expect(actual).toEqual(expected);
    }
  );
});
