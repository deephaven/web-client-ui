import { act, renderHook } from '@testing-library/react-hooks';
import { Table } from '@deephaven/jsapi-shim';
import { KeyedItem } from '@deephaven/jsapi-utils';
import useInitializeViewportData from './useInitializeViewportData';

function mockTable(size: number): Table {
  return { size } as Table;
}

const tableA = mockTable(4);
const expectedInitialA: KeyedItem<unknown>[] = [
  { key: '0' },
  { key: '1' },
  { key: '2' },
  { key: '3' },
];

const tableB = mockTable(2);
const expectedInitialB = [{ key: '0' }, { key: '1' }];

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
