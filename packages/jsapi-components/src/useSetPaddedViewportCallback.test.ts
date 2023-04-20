import { renderHook } from '@testing-library/react-hooks';
import { Table } from '@deephaven/jsapi-shim';
import { TestUtils } from '@deephaven/utils';
import useSetPaddedViewportCallback from './useSetPaddedViewportCallback';

beforeEach(() => {
  jest.clearAllMocks();
});

it('should create a callback that sets a padded viewport', () => {
  const table = TestUtils.createMockProxy<Table>({ size: 100 });
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
