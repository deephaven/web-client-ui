import { renderHook } from '@testing-library/react-hooks';
import type { Table } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/utils';
import useTableClose from './useTableClose';

const table = TestUtils.createMockProxy<Table>({});
const closedTable = TestUtils.createMockProxy<Table>({ isClosed: true });

beforeEach(() => {
  jest.clearAllMocks();
});

it('should close table on unmount', () => {
  const { unmount } = renderHook(() => useTableClose(table));

  expect(table.close).not.toHaveBeenCalled();

  unmount();

  expect(table.close).toHaveBeenCalled();
});

it.each([closedTable, null, undefined])(
  'should not call close if no table given or table already closed',
  maybeTable => {
    const { unmount } = renderHook(() => useTableClose(maybeTable));

    unmount();

    if (maybeTable) {
      expect(maybeTable.close).not.toHaveBeenCalled();
    }
  }
);

it('should close previous table if reference changes', () => {
  const nextTable = TestUtils.createMockProxy<Table>({});

  const { rerender } = renderHook(t => useTableClose(t), {
    initialProps: table,
  });

  expect(table.close).not.toHaveBeenCalled();

  rerender(nextTable);

  expect(table.close).toHaveBeenCalled();
  expect(nextTable.close).not.toHaveBeenCalled();
});
