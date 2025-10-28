import { renderHook } from '@testing-library/react';
import type { dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import { TableUtils } from '@deephaven/jsapi-utils';
import useSetPaddedViewportCallback from './useSetPaddedViewportCallback';

beforeEach(() => {
  jest.clearAllMocks();
});

it('should create a callback that sets a padded viewport', () => {
  const table = TestUtils.createMockProxy<dh.Table>({ size: 100 });
  const viewportSize = 10;
  const viewportPadding = 4;

  const { result } = renderHook(() =>
    useSetPaddedViewportCallback(table, viewportSize, viewportPadding, null)
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

it('should use TableViewportSubscription if viewport options are provided', () => {
  jest.spyOn(TableUtils, 'isTreeTable').mockReturnValue(false);

  const mockSubscription = {
    update: jest.fn(),
    close: jest.fn(),
  };

  const table = TestUtils.createMockProxy<dh.Table>({ size: 100 });
  (table.createViewportSubscription as jest.Mock).mockReturnValue(
    mockSubscription
  );

  const viewportSize = 10;
  const viewportPadding = 4;
  const viewportOptions = {
    rows: {
      first: 0,
      last: 0,
    },
    columns: table?.columns ?? [],
  };

  const { result } = renderHook(() =>
    useSetPaddedViewportCallback(
      table,
      viewportSize,
      viewportPadding,
      viewportOptions
    )
  );

  // Call callback for the first time, which should create a subscription
  const firstRow = 30;
  result.current(firstRow);
  expect(table.createViewportSubscription).toHaveBeenCalledWith(
    viewportOptions
  );

  const expected = {
    firstRow: firstRow - viewportPadding,
    lastRow: firstRow + viewportSize + viewportPadding - 1,
  };

  expect(mockSubscription.update).toHaveBeenCalledWith({
    rows: {
      first: expected.firstRow,
      last: expected.lastRow,
    },
    columns: table.columns,
  });

  expect(table.setViewport).not.toHaveBeenCalled();
  expect(table.createViewportSubscription).toHaveBeenCalledTimes(1);
});

it('should use setViewport if provided a tree table', () => {
  jest.spyOn(TableUtils, 'isTreeTable').mockReturnValue(true);

  const table = TestUtils.createMockProxy<dh.TreeTable>({ size: 100 });
  const viewportSize = 10;
  const viewportPadding = 4;
  const viewportOptions = {
    rows: {
      first: 0,
      last: 0,
    },
    columns: table?.columns ?? [],
  };

  const { result } = renderHook(() =>
    useSetPaddedViewportCallback(
      table,
      viewportSize,
      viewportPadding,
      viewportOptions
    )
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
