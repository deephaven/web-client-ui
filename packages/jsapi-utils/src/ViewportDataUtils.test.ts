import { Column, Table } from '@deephaven/jsapi-shim';
import { useListData } from '@react-stately/data';
import { act, renderHook } from '@testing-library/react-hooks';
import {
  KeyedItem,
  OnTableUpdatedEvent,
  RowDeserializer,
  ViewportRow,
  createKeyFromOffsetRow,
  createOnTableUpdatedHandler,
} from './ViewportDataUtils';

/** Create a mock Table with minimal methods for our tests. */
function mockTable(): Table {
  const columns: Column[] = [];

  return {
    columns,
  } as Table;
}

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

const deserializeRow: RowDeserializer<unknown> = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  // Mock deserializer just returns the row given to it.
  (deserializeRow as jest.Mock).mockImplementation(row => row);
});

describe('createKeyFromOffsetRow', () => {
  it.each([
    [{ offsetInSnapshot: 4 } as ViewportRow, 5, '9'],
    [{ offsetInSnapshot: 27 } as ViewportRow, 99, '126'],
  ] as const)(
    'should create a string key based on the actual row offset',
    (row, offset, expected) => {
      const actual = createKeyFromOffsetRow(row, offset);
      expect(actual).toEqual(expected);
    }
  );
});

describe('createOnTableUpdatedHandler', () => {
  it('should create a handler that adds items to a ListData of KeyedItems', () => {
    const table = mockTable();

    const { result: viewportDataRef } = renderHook(() =>
      useListData<KeyedItem<unknown>>({})
    );

    const handler = createOnTableUpdatedHandler(
      table,
      viewportDataRef.current,
      deserializeRow
    );

    const offset = 5;
    const rows: ViewportRow[] = [
      mockViewportRow(0),
      mockViewportRow(1),
      mockViewportRow(2),
    ];

    const event = mockUpdateEvent(offset, rows);
    const expectedItems = [
      { key: '5', item: rows[0] },
      { key: '6', item: rows[1] },
      { key: '7', item: rows[2] },
    ];

    act(() => {
      handler(event);
    });

    expect(viewportDataRef.current.items).toEqual(expectedItems);
  });

  it('should create a handler that updates existing items in a ListData', () => {
    const table = mockTable();

    const { result: viewportDataRef } = renderHook(() =>
      useListData<KeyedItem<unknown>>({})
    );

    act(() => {
      viewportDataRef.current.append({ key: '0' });
    });

    expect(viewportDataRef.current.items).toEqual([{ key: '0' }]);
    expect(viewportDataRef.current.getItem('0')).toEqual({ key: '0' });

    const offset = 0;
    const row = mockViewportRow(0);
    const event = mockUpdateEvent(offset, [row]);

    const handler = createOnTableUpdatedHandler(
      table,
      viewportDataRef.current,
      deserializeRow
    );

    act(() => {
      handler(event);
    });

    expect(viewportDataRef.current.items).toEqual([{ key: '0', item: row }]);
  });
});
