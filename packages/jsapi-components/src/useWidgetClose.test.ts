import { renderHook } from '@testing-library/react-hooks';
import type { dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import useWidgetClose from './useWidgetClose';

const table = TestUtils.createMockProxy<dh.Table>({});
const closedTable = TestUtils.createMockProxy<dh.Table>({ isClosed: true });

beforeEach(() => {
  jest.clearAllMocks();
});

it('should close table on unmount', () => {
  const { unmount } = renderHook(() => useWidgetClose(table));

  expect(table.close).not.toHaveBeenCalled();

  unmount();

  expect(table.close).toHaveBeenCalled();
});

it.each([closedTable, null, undefined])(
  'should not call close if no table given or table already closed',
  maybeTable => {
    const { unmount } = renderHook(() => useWidgetClose(maybeTable));

    unmount();

    if (maybeTable) {
      expect(maybeTable.close).not.toHaveBeenCalled();
    }
  }
);

it('should close previous table if reference changes', () => {
  const nextTable = TestUtils.createMockProxy<dh.Table>({});

  const { rerender } = renderHook(t => useWidgetClose(t), {
    initialProps: table,
  });

  expect(table.close).not.toHaveBeenCalled();

  rerender(nextTable);

  expect(table.close).toHaveBeenCalled();
  expect(nextTable.close).not.toHaveBeenCalled();
});
