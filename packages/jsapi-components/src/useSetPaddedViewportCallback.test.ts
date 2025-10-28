import { renderHook } from '@testing-library/react';
import type { dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import { TableUtils } from '@deephaven/jsapi-utils';
import useSetPaddedViewportCallback from './useSetPaddedViewportCallback';

let table: dh.Table;
let viewportOptions: dh.ViewportSubscriptionOptions;
const viewportSize = 10;
const viewportPadding = 4;

beforeEach(() => {
  jest.clearAllMocks();
  table = TestUtils.createMockProxy<dh.Table>({ size: 100 });
  viewportOptions = {
    rows: {
      first: 0,
      last: 0,
    },
    columns: table?.columns ?? [],
  };
});

it('should create a callback that sets a padded viewport', () => {
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

  (table.createViewportSubscription as jest.Mock).mockReturnValue(
    mockSubscription
  );

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

  // Call callback again to check if existing subscription is used
  result.current(firstRow + 10);
  expect(table.createViewportSubscription).toHaveBeenCalledTimes(1);

  expect(table.setViewport).not.toHaveBeenCalled();
});

it('should use setViewport if provided a tree table', () => {
  jest.spyOn(TableUtils, 'isTreeTable').mockReturnValue(true);

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

it('should set update viewport subscription if called in same render as the hook', () => {
  jest.spyOn(TableUtils, 'isTreeTable').mockReturnValue(false);

  const mockSubscription = {
    update: jest.fn(),
    close: jest.fn(),
  };

  (table.createViewportSubscription as jest.Mock).mockReturnValue(
    mockSubscription
  );

  renderHook(() => {
    const callback = useSetPaddedViewportCallback(
      table,
      viewportSize,
      viewportPadding,
      viewportOptions
    );

    // Call the callback in same render
    callback(30);
  });

  expect(table.createViewportSubscription).toHaveBeenCalledWith(
    viewportOptions
  );
  expect(mockSubscription.update).toHaveBeenCalled();
  expect(table.setViewport).not.toHaveBeenCalled();
});

it('should create a new subscription when viewportSubscriptionOptions or table changes', () => {
  jest.spyOn(TableUtils, 'isTreeTable').mockReturnValue(false);

  const mockSubscription1 = {
    update: jest.fn(),
    close: jest.fn(),
  };

  const mockSubscription2 = {
    update: jest.fn(),
    close: jest.fn(),
  };

  (table.createViewportSubscription as jest.Mock)
    .mockReturnValueOnce(mockSubscription1)
    .mockReturnValueOnce(mockSubscription2);

  const { result, rerender } = renderHook(
    ({ table: hookTable, options }) =>
      useSetPaddedViewportCallback(
        hookTable,
        viewportSize,
        viewportPadding,
        options
      ),
    {
      initialProps: { table, options: viewportOptions },
    }
  );

  // Call callback for the first time, which should create a subscription
  result.current(30);
  expect(table.createViewportSubscription).toHaveBeenCalledTimes(1);
  expect(table.createViewportSubscription).toHaveBeenCalledWith(
    viewportOptions
  );
  expect(mockSubscription1.update).toHaveBeenCalled();

  // Change viewportSubscriptionOptions and rerender
  const newViewportOptions = {
    ...viewportOptions,
    rows: { first: 5, last: 15 },
  };
  rerender({ table, options: newViewportOptions });
  expect(mockSubscription1.close).toHaveBeenCalled();

  // Call callback again, which should create a new subscription
  result.current(30);
  expect(table.createViewportSubscription).toHaveBeenCalledTimes(2);
  expect(table.createViewportSubscription).toHaveBeenLastCalledWith(
    newViewportOptions
  );
  expect(mockSubscription2.update).toHaveBeenCalled();

  // Change viewportSubscriptionOptions and rerender
  const newTable = TestUtils.createMockProxy<dh.Table>({ size: 100 });
  rerender({ table: newTable, options: newViewportOptions });
  expect(mockSubscription2.close).toHaveBeenCalled();

  // Call callback again, which should create a new subscription
  result.current(30);
  expect(newTable.createViewportSubscription).toHaveBeenCalledTimes(1);
  expect(newTable.createViewportSubscription).toHaveBeenCalledWith(
    newViewportOptions
  );
});

it('should close subscription on unmount', () => {
  jest.spyOn(TableUtils, 'isTreeTable').mockReturnValue(false);

  const mockSubscription = {
    update: jest.fn(),
    close: jest.fn(),
  };

  (table.createViewportSubscription as jest.Mock).mockReturnValue(
    mockSubscription
  );

  const { result, unmount } = renderHook(() =>
    useSetPaddedViewportCallback(
      table,
      viewportSize,
      viewportPadding,
      viewportOptions
    )
  );

  result.current(30);
  expect(table.createViewportSubscription).toHaveBeenCalledWith(
    viewportOptions
  );
  expect(mockSubscription.close).not.toHaveBeenCalled();

  unmount();
  expect(mockSubscription.close).toHaveBeenCalled();
});
