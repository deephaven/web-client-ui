import {
  act,
  Renderer,
  renderHook,
  RenderHookResult,
} from '@testing-library/react-hooks';
import { TestUtils } from '@deephaven/utils';
import useWindowedListData, {
  defaultGetKey,
  WindowedListData,
} from './useWindowedListData';

const { asMock } = TestUtils;

interface HasKey {
  key: string;
}

function initializeHookWithItems({
  items,
  getKey,
}: {
  items: HasKey[];
  getKey?: (item: HasKey) => string;
}): RenderHookResult<unknown, WindowedListData<HasKey>, Renderer<unknown>> {
  const hookResult = renderHook(() => useWindowedListData<HasKey>({ getKey }));

  act(() => {
    hookResult.result.current.append(items);
  });

  jest.clearAllMocks();

  return hookResult;
}

function itemsFromSequence(sequence: string): HasKey[] {
  return sequence
    .split('')
    .filter(c => c !== '_')
    .map(key => ({ key }));
}

const mock = {
  getKey: jest.fn<string, [HasKey]>(),
};

beforeEach(() => {
  jest.clearAllMocks();

  asMock(mock.getKey).mockImplementation(({ key }) => key);
});

it('should initially return empty items array and selectedKeys', () => {
  const { result } = renderHook(() => useWindowedListData());

  expect(result.current.items).toEqual([]);
  expect(result.current.selectedKeys).toEqual(new Set());
});

describe('getItem', () => {
  it.each([undefined, mock.getKey])(
    'should throw an error if given non-existing key: %s',
    getKey => {
      const { result } = renderHook(() =>
        useWindowedListData<HasKey>({ getKey })
      );

      expect(() => result.current.getItem('non-exists')).toThrow(
        'No item found matching key: non-exists'
      );
    }
  );

  it.each([undefined, mock.getKey])(
    'should get item matching key: %s',
    getKey => {
      const items = itemsFromSequence('abcdefg');

      const { result } = initializeHookWithItems({ items, getKey });

      const itemToMatch = 1;
      const actual = result.current.getItem(items[itemToMatch].key);

      expect(actual).toEqual(items[itemToMatch]);

      if (getKey) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i <= itemToMatch; ++i) {
          expect(getKey).toHaveBeenCalledWith(items[i]);
        }
      }
    }
  );
});

describe('append', () => {
  it('should append items to the list', () => {
    const itemsA = itemsFromSequence('abc');
    const itemsB = itemsFromSequence('DEF');

    const { result } = initializeHookWithItems({ items: itemsA });

    expect(result.current.items).toEqual(itemsA);

    act(() => {
      result.current.append(itemsB);
    });

    expect(result.current.items).toEqual([...itemsA, ...itemsB]);
  });
});

describe('insert', () => {
  const initialItems = itemsFromSequence('abc');
  const itemsToInsert = itemsFromSequence('DEF');

  it.each([
    // Negative indices should count back from end
    [-1, 'abDEFc'],
    // Indices within range should insert at index
    [0, 'DEFabc'],
    [1, 'aDEFbc'],
    [2, 'abDEFc'],
    // Indices > last index should all append to end
    [3, 'abcDEF'],
    [4, 'abcDEF'],
  ] as const)(
    'should insert items at expected index: index:%s, expected:%s',
    (index, expectedSequence) => {
      const { result } = initializeHookWithItems({ items: initialItems });

      const expectedItems = itemsFromSequence(expectedSequence);

      act(() => {
        result.current.insert(index, itemsToInsert);
      });

      expect(result.current.items).toEqual(expectedItems);
    }
  );
});

describe('remove', () => {
  it('should remove items for given keys', () => {
    const items = itemsFromSequence('0123456789');
    const { result } = initializeHookWithItems({ items });

    const keysToRemove = ['2', '4', '5'];
    const expectedItems = itemsFromSequence('01_3__6789');

    act(() => {
      result.current.remove(keysToRemove);
    });

    expect(result.current.items).toEqual(expectedItems);
  });
});

describe('update', () => {
  it('should do nothing if given a non-existent key', () => {
    const items = itemsFromSequence('abc');

    const { result } = initializeHookWithItems({ items });

    const updated = { key: 'z', name: 'updated' };

    act(() => {
      result.current.update('z', updated);
    });

    expect(result.current.items).toEqual(items);
  });

  it.each([
    ['', 'a', 'bcd'],
    ['a', 'b', 'cd'],
    ['ab', 'c', 'd'],
    ['abc', 'd', ''],
  ])('should update item by key: %s|%s|%s', (start, updateKey, end) => {
    const items = itemsFromSequence('abcd');

    const { result } = initializeHookWithItems({ items });

    const updated = { key: updateKey, name: 'updated' };

    act(() => {
      result.current.update(updateKey, updated);
    });

    expect(result.current.items).toEqual([
      ...itemsFromSequence(start),
      updated,
      ...itemsFromSequence(end),
    ]);
  });
});

describe('bulkUpdate', () => {
  const items = itemsFromSequence('abcdefg');
  const allItemsMap = new Map(items.map(item => [item.key, item]));

  it('should do nothing if given empty item map', () => {
    const { result } = initializeHookWithItems({ items });

    const resultItems = result.current.items;

    act(() => {
      result.current.bulkUpdate(new Map());
    });

    expect(result.current.items).toBe(resultItems);
  });

  it.each(['a', 'ade', 'ab', 'fg'])(
    'should bulk update given key / item pairs: %s',
    updateKeySequence => {
      const { result } = initializeHookWithItems({ items });

      const updateItems = itemsFromSequence(updateKeySequence);
      const updateItemsMap = new Map(
        updateItems.map(item => [item.key, { key: item.key, name: 'updated' }])
      );

      const expectedItems = [
        ...new Map([...allItemsMap, ...updateItemsMap]).values(),
      ];

      act(() => {
        result.current.bulkUpdate(updateItemsMap);
      });

      expect(result.current.items).toEqual(expectedItems);
    }
  );
});

describe('defaultGetKey', () => {
  it.each([null, {}, () => undefined])(
    'should throw error if item is not an object with a `key` prop: %s',
    item => {
      expect(() => defaultGetKey(item)).toThrow(
        'Item does not have a `key` prop.'
      );
    }
  );

  it('should return value of `key` prop', () => {
    const item = { key: 'a' };
    expect(defaultGetKey(item)).toEqual(item.key);
  });
});
