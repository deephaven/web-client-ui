import { act, renderHook } from '@testing-library/react-hooks';
import type { dh } from '@deephaven/jsapi-types';
import { generateEmptyKeyedItems } from '@deephaven/jsapi-utils';
import { KeyedItem, TestUtils } from '@deephaven/utils';
import useInitializeViewportData from './useInitializeViewportData';
import useTableSize from './useTableSize';

jest.mock('./useTableSize');

function expectedInitialItems(size: number) {
  return [...generateEmptyKeyedItems(0, size - 1)];
}

const tableSize4 = TestUtils.createMockProxy<dh.Table>({ size: 4 });
const expectedInitial4: KeyedItem<unknown>[] = expectedInitialItems(
  tableSize4.size
);

const tableSize2 = TestUtils.createMockProxy<dh.Table>({ size: 2 });
const expectedInitial2 = expectedInitialItems(tableSize2.size);

function updatedItems(size: number): { key: string; item: string }[] {
  const items: { key: string; item: string }[] = [];

  for (let i = 0; i < size; i += 1) {
    items.push({ key: `${i}`, item: `mock.item.${i}` });
  }

  return items;
}

beforeEach(() => {
  TestUtils.asMock(useTableSize).mockImplementation(table => table?.size ?? 0);
});

describe.each([undefined, true, false])(
  'reuseItemsOnTableResize: %s',
  reuseItemsOnTableResize => {
    it.each([null])('should safely handle no table: %s', noTable => {
      const { result } = renderHook(() =>
        useInitializeViewportData(noTable, reuseItemsOnTableResize)
      );
      expect(result.current.items).toEqual([]);
    });

    it('should initialize a ListData object based on Table size', () => {
      const { result } = renderHook(() =>
        useInitializeViewportData(tableSize4, reuseItemsOnTableResize)
      );

      expect(result.current.items).toEqual(expectedInitial4);
    });

    it('should re-initialize a ListData object if Table reference changes', () => {
      const { result, rerender } = renderHook(
        ({ table }) =>
          useInitializeViewportData(table, reuseItemsOnTableResize),
        {
          initialProps: { table: tableSize4 },
        }
      );

      const updatedItems4 = updatedItems(tableSize4.size);

      // Update items
      act(() => {
        updatedItems4.forEach(updatedItem => {
          result.current.update(updatedItem.key, updatedItem);
        });
      });

      expect(result.current.items).toEqual(updatedItems4);

      // Re-render with a smaller table instance
      rerender({ table: tableSize2 });

      expect(result.current.items).toEqual(
        reuseItemsOnTableResize === true
          ? updatedItems4.slice(0, tableSize2.size)
          : expectedInitial2
      );

      // Re-render with a larger table instance
      rerender({ table: tableSize4 });

      expect(result.current.items).toEqual(
        reuseItemsOnTableResize === true
          ? [
              ...updatedItems4.slice(0, tableSize2.size),
              ...expectedInitial4.slice(tableSize2.size),
            ]
          : expectedInitial4
      );
    });

    it.each([3, 5])(
      'should re-initialize a ListData object if Table size changes: %s',
      newSize => {
        const { result, rerender } = renderHook(
          ({ table }) =>
            useInitializeViewportData(table, reuseItemsOnTableResize),
          {
            initialProps: { table: tableSize4 },
          }
        );

        expect(result.current.items).toEqual(expectedInitial4);

        const updatedItems4 = updatedItems(tableSize4.size);

        // Update items
        act(() => {
          updatedItems4.forEach(updatedItem => {
            result.current.update(updatedItem.key, updatedItem);
          });
        });

        expect(result.current.items).toEqual(updatedItems4);

        // Re-render with new size
        TestUtils.asMock(useTableSize).mockImplementation(() => newSize);
        rerender({
          table:
            tableSize4 /* this table is not actually used due to mocking `useTableSize` above */,
        });

        expect(result.current.items).toEqual(
          reuseItemsOnTableResize === true
            ? [
                ...updatedItems4.slice(0, newSize),
                ...expectedInitialItems(newSize).slice(4),
              ]
            : expectedInitialItems(newSize)
        );
      }
    );
  }
);
