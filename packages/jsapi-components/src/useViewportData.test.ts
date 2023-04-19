import { act, renderHook } from '@testing-library/react-hooks';
import { Table } from '@deephaven/jsapi-shim';
import {
  OnTableUpdatedEvent,
  ViewportRow,
  generateEmptyKeyedItems,
} from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/utils';
import useViewportData, { UseViewportDataProps } from './useViewportData';

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
  const { calls } = (table.addEventListener as jest.Mock).mock;
  const [lastCall] = calls.filter(call => call[0] === eventName).slice(-1);
  return lastCall?.[1];
}

const table = TestUtils.createMockProxy<Table>({ size: 100 });
const viewportSize = 10;
const viewportPadding = 4;
const deserializeRow = jest.fn().mockImplementation(row => row);

const options: UseViewportDataProps<unknown> = {
  table,
  viewportSize,
  viewportPadding,
  deserializeRow,
};

const optionsUseDefaults: UseViewportDataProps<unknown> = {
  table,
};

beforeEach(() => {
  jest.clearAllMocks();
});

it.each([options, optionsUseDefaults])(
  'should initialize viewport data: %o',
  opt => {
    const { result } = renderHook(() => useViewportData(opt));

    const expected = {
      initialItems: [...generateEmptyKeyedItems(table.size)],
      viewportEnd: (opt.viewportSize ?? 10) + (opt.viewportPadding ?? 50) - 1,
    };

    expect(result.current.viewportData.items).toEqual(expected.initialItems);
    expect(result.current.size).toEqual(table.size);
    expect(table.setViewport).toHaveBeenCalledWith(0, expected.viewportEnd);
  }
);

it('should update state on dh.Table.EVENT_UPDATED event', () => {
  const { result } = renderHook(() => useViewportData(options));

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
  const expectedInitialItems = [...generateEmptyKeyedItems(table.size)];
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
