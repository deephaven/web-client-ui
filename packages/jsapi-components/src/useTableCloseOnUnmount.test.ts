import { renderHook } from '@testing-library/react-hooks';
import { Table } from '@deephaven/jsapi-shim';
import { TestUtils } from '@deephaven/utils';
import useTableCloseOnUnmount from './useTableCloseOnUnmount';

const table = TestUtils.createMockProxy<Table>({});
const closedTable = TestUtils.createMockProxy<Table>({ isClosed: true });

beforeEach(() => {
  jest.clearAllMocks();
});

it('should close table on unmount', () => {
  const { unmount } = renderHook(() => useTableCloseOnUnmount(table));

  expect(table.close).not.toHaveBeenCalled();

  unmount();

  expect(table.close).toHaveBeenCalled();
});

it.each([closedTable, null, undefined])(
  'should not call close if no table given or table already closed',
  maybeTable => {
    const { unmount } = renderHook(() => useTableCloseOnUnmount(maybeTable));

    unmount();

    if (maybeTable) {
      expect(maybeTable.close).not.toHaveBeenCalled();
    }
  }
);
