import { act, renderHook } from '@testing-library/react-hooks';
import { Table } from '@deephaven/jsapi-shim';
import { KeyedItem } from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/utils';
import useInitializeViewportData from './useInitializeViewportData';
import useTableSize from './useTableSize';

jest.mock('./useTableSize');

const tableA = TestUtils.createMockProxy<Table>({ size: 4 });
const expectedInitialA: KeyedItem<unknown>[] = [
  { key: '0' },
  { key: '1' },
  { key: '2' },
  { key: '3' },
];

const tableB = TestUtils.createMockProxy<Table>({ size: 2 });
const expectedInitialB = [{ key: '0' }, { key: '1' }];

beforeEach(() => {
  TestUtils.asMock(useTableSize).mockImplementation(table => table?.size ?? 0);
});

it('should initialize a ListData object based on Table size', () => {
  const { result } = renderHook(() => useInitializeViewportData(tableA));

  expect(result.current.items).toEqual(expectedInitialA);
});

it('should re-initialize a ListData object if Table reference changes', () => {
  const { result, rerender } = renderHook(
    ({ table }) => useInitializeViewportData(table),
    {
      initialProps: { table: tableA },
    }
  );

  // Update an item
  const updatedItem = { key: '0', item: 'mock.item' };
  act(() => {
    result.current.update(updatedItem.key, updatedItem);
  });

  const expectedAfterUpdate = [updatedItem, ...expectedInitialA.slice(1)];
  expect(result.current.items).toEqual(expectedAfterUpdate);

  // Re-render with a new table instance
  rerender({ table: tableB });

  expect(result.current.items).toEqual(expectedInitialB);
});

it.each([
  [3, [...expectedInitialA.slice(0, -1)]],
  [5, [...expectedInitialA, { key: '4' }]],
])(
  'should re-initialize a ListData object if Table size changes',
  (newSize, expectedAfterSizeChange) => {
    const { result, rerender } = renderHook(
      ({ table }) => useInitializeViewportData(table),
      {
        initialProps: { table: tableA },
      }
    );

    expect(result.current.items).toEqual(expectedInitialA);

    // Re-render with new size
    TestUtils.asMock(useTableSize).mockImplementation(() => newSize);
    rerender({ table: tableA });

    expect(result.current.items).toEqual(expectedAfterSizeChange);
  }
);
