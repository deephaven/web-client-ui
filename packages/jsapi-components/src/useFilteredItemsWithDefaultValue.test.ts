import { renderHook } from '@testing-library/react-hooks';
import { KeyedItem } from '@deephaven/jsapi-utils';
import useFilteredItemsWithDefaultValue from './useFilteredItemsWithDefaultValue';

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('useFilteredItemsWithDefaultValue', () => {
  interface Item {
    name: string;
  }

  const defaultDisplayValue = 'default.displayValue';
  const inDefaultDisplayValue = 'displayValue';
  const notInDefaultDisplayValue = 'blah';
  const displayProp: keyof Item = 'name';

  const itemsEmpty: KeyedItem<Item>[] = [];
  const itemsLoaded: KeyedItem<Item>[] = [
    { key: '1', item: { name: 'Existing Item' } },
  ];
  const itemsLoading: KeyedItem<Item>[] = [{ key: '1' }];

  it.each([null, defaultDisplayValue])(
    'should not prepend default item if searchText is not contained in display text: %s',
    displayValue => {
      const { result } = renderHook(() =>
        useFilteredItemsWithDefaultValue(
          itemsLoaded,
          'name',
          notInDefaultDisplayValue,
          displayValue
        )
      );

      expect(result.current).toBe(itemsLoaded);
    }
  );

  describe.each([
    [itemsEmpty, false],
    [itemsLoaded, false],
    [itemsLoading, true],
  ])('Loading status: %s, %s', (items, isLoading) => {
    it.each(['', inDefaultDisplayValue, inDefaultDisplayValue.toUpperCase()])(
      'should prepend default item if searchText is empty or contained in display text and is not loading: %s',
      searchText => {
        const { result } = renderHook(() =>
          useFilteredItemsWithDefaultValue(
            items,
            'name',
            searchText,
            defaultDisplayValue
          )
        );

        if (isLoading) {
          expect(result.current).toBe(items);
        } else {
          expect(result.current).toEqual([
            {
              key: defaultDisplayValue,
              item: { [displayProp]: defaultDisplayValue },
            },
            ...items,
          ]);
        }
      }
    );
  });
});
