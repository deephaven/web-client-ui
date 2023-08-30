import { act, renderHook } from '@testing-library/react-hooks';
import type { FilterCondition, Table } from '@deephaven/jsapi-types';
import dh from '@deephaven/jsapi-shim';
import {
  OnTableUpdatedEvent,
  ViewportRow,
  generateEmptyKeyedItems,
  isClosed,
} from '@deephaven/jsapi-utils';
import { useOnScrollOffsetChangeCallback } from '@deephaven/react-hooks';
import { SCROLL_DEBOUNCE_MS, TestUtils } from '@deephaven/utils';
import useViewportData, { UseViewportDataProps } from './useViewportData';
import { makeApiContextWrapper } from './HookTestUtils';
import { useTableSize } from './useTableSize';
import { useSetPaddedViewportCallback } from './useSetPaddedViewportCallback';

jest.mock('@deephaven/react-hooks', () => ({
  ...jest.requireActual('@deephaven/react-hooks'),
  useOnScrollOffsetChangeCallback: jest.fn(),
}));
jest.mock('./useSetPaddedViewportCallback');
jest.mock('./useTableSize');

function mockViewportRow(offsetInSnapshot: number): ViewportRow {
  return { offsetInSnapshot } as ViewportRow;
}

function mockUpdateEvent(
  offset: number,
  rows: ViewportRow[]
): OnTableUpdatedEvent {
  return {
    detail: {
      offset,
      rows,
    },
  } as OnTableUpdatedEvent;
}

/** Get the last registered event handler for the given event name. */
function getLastRegisteredEventHandler(
  table: Table,
  eventName: string
): ((event: OnTableUpdatedEvent) => void) | undefined {
  const { calls } = TestUtils.asMock(table.addEventListener).mock;
  const [lastCall] = calls.filter(call => call[0] === eventName).slice(-1);
  return lastCall?.[1];
}

const table = TestUtils.createMockProxy<Table>({ size: 100 });
const table2 = TestUtils.createMockProxy<Table>({ size: table.size });
const tableIsClosed = TestUtils.createMockProxy<Table>({
  size: 100,
  isClosed: true,
});
const viewportSize = 10;
const viewportPadding = 4;
const deserializeRow = jest.fn().mockImplementation(row => row);

const options: UseViewportDataProps<unknown, Table> = {
  table,
  itemHeight: 10,
  scrollDebounce: 900,
  viewportSize,
  viewportPadding,
  deserializeRow,
};

const optionsUseDefaults: UseViewportDataProps<unknown, Table> = {
  table,
};

const optionsTableIsClosed: UseViewportDataProps<unknown, Table> = {
  table: tableIsClosed,
  itemHeight: 10,
};

const optionsTableNull: UseViewportDataProps<unknown, Table> = {
  table: null,
};

const wrapper: React.FC<Table> = makeApiContextWrapper(dh);

const useSetPaddedViewportCallbackResultA = jest
  .fn()
  .mockName('useSetPaddedViewportCallbackResultA');
const useSetPaddedViewportCallbackResultB = jest
  .fn()
  .mockName('useSetPaddedViewportCallbackResultB');
const mockOnScrollCallback = jest.fn().mockName('mockOnScrollCallback');

beforeEach(() => {
  jest.clearAllMocks();
  TestUtils.asMock(useTableSize)
    .mockName('useTableSize')
    .mockImplementation(t => t?.size ?? 0);
  TestUtils.asMock(useSetPaddedViewportCallback)
    .mockName('useSetPaddedViewportCallback')
    .mockImplementation(t =>
      t === table
        ? useSetPaddedViewportCallbackResultA
        : useSetPaddedViewportCallbackResultB
    );
  TestUtils.asMock(useOnScrollOffsetChangeCallback)
    .mockName('useOnScrollOffsetChangeCallback')
    .mockReturnValue(mockOnScrollCallback);
});

it.each([options, optionsUseDefaults, optionsTableNull, optionsTableIsClosed])(
  'should initialize viewport data: %s',
  opt => {
    const { result } = renderHook(() => useViewportData(opt), { wrapper });

    const expectedTableSize = opt.table?.size ?? 0;

    const expected = {
      initialItems: [...generateEmptyKeyedItems(0, expectedTableSize - 1)],
      viewportEnd: (opt.viewportSize ?? 10) + (opt.viewportPadding ?? 50) - 1,
    };

    expect(result.current.viewportData.items).toEqual(expected.initialItems);
    expect(result.current.size).toEqual(expectedTableSize);

    if (opt.table && !isClosed(opt.table)) {
      expect(useSetPaddedViewportCallbackResultA).toHaveBeenCalledWith(0);
    } else {
      expect(useSetPaddedViewportCallbackResultA).not.toHaveBeenCalled();
    }
  }
);

it('should memoize result', () => {
  const { rerender, result } = renderHook(() => useViewportData(options), {
    wrapper,
  });

  rerender();

  expect(result.all.length).toEqual(3);

  const [a, b] = result.all.slice(-2);

  expect(a).toBe(b);
});

it('should return table', () => {
  const { result } = renderHook(() => useViewportData(options), { wrapper });
  expect(result.current.table).toBe(options.table);
});

it.each([options, optionsTableNull, optionsTableIsClosed])(
  'should return a callback that can apply filters and refresh viewport: %s',
  opt => {
    const { result } = renderHook(() => useViewportData(opt), { wrapper });
    jest.clearAllMocks();

    const filters: FilterCondition[] = [];

    result.current.applyFiltersAndRefresh(filters);

    if (opt.table && !isClosed(opt.table)) {
      expect(opt.table.applyFilter).toHaveBeenCalledWith(filters);
      expect(useSetPaddedViewportCallbackResultA).toHaveBeenCalledWith(0);
    } else {
      expect(useSetPaddedViewportCallbackResultA).not.toHaveBeenCalled();
    }
  }
);

it('should set viewport if table size changes', () => {
  const { rerender } = renderHook(() => useViewportData(options), { wrapper });
  jest.clearAllMocks();

  rerender();
  expect(useSetPaddedViewportCallbackResultA).not.toHaveBeenCalled();

  // Change table size
  TestUtils.asMock(useTableSize).mockReturnValue(table.size - 5);

  rerender();
  expect(useSetPaddedViewportCallbackResultA).toHaveBeenCalled();
});

it('should set viewport if table reference changes', () => {
  const { rerender } = renderHook(
    t => useViewportData({ ...options, table: t }),
    {
      initialProps: table,
      wrapper,
    }
  );
  jest.clearAllMocks();

  rerender(table);

  // pass a new Table reference
  rerender(table2);

  expect(useSetPaddedViewportCallbackResultA).not.toHaveBeenCalled();
  expect(useSetPaddedViewportCallbackResultB).toHaveBeenCalled();
});

it('should update state on dh.Table.EVENT_UPDATED event', () => {
  const { result } = renderHook(() => useViewportData(options), { wrapper });

  // Extract the last event handler that was registered since it should have
  // a closure over our latest `viewportData` instance.
  const updateEventHandler = getLastRegisteredEventHandler(
    table,
    dh.Table.EVENT_UPDATED
  );

  const offset = 3;
  const row = mockViewportRow(5);
  const event = mockUpdateEvent(offset, [row]);

  act(() => {
    updateEventHandler?.(event);
  });

  const expectedKeyIndex = offset + row.offsetInSnapshot;
  const expectedInitialItems = [...generateEmptyKeyedItems(0, table.size - 1)];
  const expectedItems = [
    ...expectedInitialItems.slice(0, expectedKeyIndex),
    {
      key: String(expectedKeyIndex),
      item: row,
    },
    ...expectedInitialItems.slice(expectedKeyIndex + 1),
  ];

  expect(result.current.viewportData.items).toEqual(expectedItems);
});

it.each([options, optionsUseDefaults])(
  'should create onScroll offset change callback: %s',
  async opt => {
    const { result } = renderHook(() => useViewportData(opt), { wrapper });

    expect(result.current.onScroll).toBe(mockOnScrollCallback);
    expect(useOnScrollOffsetChangeCallback).toHaveBeenCalledWith(
      opt.itemHeight ?? 1,
      result.current.setViewport,
      opt.scrollDebounce ?? SCROLL_DEBOUNCE_MS
    );
  }
);

it.each([options, optionsTableNull, optionsTableIsClosed])(
  'should return setViewport function that sets viewport on open tables: %s',
  opt => {
    const { result } = renderHook(() => useViewportData(opt), { wrapper });

    result.current.setViewport(0);

    if (opt.table && !isClosed(opt.table)) {
      expect(useSetPaddedViewportCallbackResultA).toHaveBeenCalledWith(0);
    } else {
      expect(useSetPaddedViewportCallbackResultA).not.toHaveBeenCalled();
    }
  }
);
