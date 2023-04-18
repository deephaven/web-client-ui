import { renderHook } from '@testing-library/react-hooks';
import { Table } from '@deephaven/jsapi-shim';
import useSetPaddedViewportCallback from './useSetPaddedViewportCallback';

function mockTable(): Table {
  const setViewport: Table['setViewport'] = jest.fn();
  return { setViewport, size: 100 } as Table;
}

beforeEach(() => {
  jest.clearAllMocks();
});

it('should create a callback that sets a padded viewport', () => {
  const table = mockTable();
  const viewportSize = 10;
  const viewportPadding = 4;

  const { result } = renderHook(() =>
    useSetPaddedViewportCallback(table, viewportSize, viewportPadding)
  );

  // Call our `setPaddedViewport` callback.
  const firstRow = 30;
  result.current(firstRow);

  const expected = {
    firstRow: firstRow - viewportPadding,
    lastRow: firstRow + viewportSize + viewportPadding - 1,
  };

  expect(table.setViewport).toHaveBeenCalledWith(
    expected.firstRow,
    expected.lastRow
  );
});
