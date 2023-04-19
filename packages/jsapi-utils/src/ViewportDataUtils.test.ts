import { Column, Table, TreeTable } from '@deephaven/jsapi-shim';
import { TestUtils } from '@deephaven/utils';
import { useListData } from '@react-stately/data';
import { act, renderHook } from '@testing-library/react-hooks';
import {
  KeyedItem,
  OnTableUpdatedEvent,
  RowDeserializer,
  ViewportRow,
  createKeyFromOffsetRow,
  createOnTableUpdatedHandler,
  defaultRowDeserializer,
  generateEmptyKeyedItems,
  getSize,
  isClosed,
  padFirstAndLastRow,
} from './ViewportDataUtils';

function mockViewportRow(offsetInSnapshot: number): ViewportRow {
  return { offsetInSnapshot } as ViewportRow;
}

function mockColumn(name: string) {
  return {
    name,
  } as Column;
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
    'should create a string key based on the actual row offset: %o',
    (row, offset, expected) => {
      const actual = createKeyFromOffsetRow(row, offset);
      expect(actual).toEqual(expected);
    }
  );
});

describe('createOnTableUpdatedHandler', () => {
  const rows: ViewportRow[] = [
    mockViewportRow(0),
    mockViewportRow(1),
    mockViewportRow(2),
  ];

  it('should do nothing if Table is null', () => {
    const table = null;

    const { result: viewportDataRef } = renderHook(() =>
      useListData<KeyedItem<unknown>>({})
    );

    const handler = createOnTableUpdatedHandler(
      table,
      viewportDataRef.current,
      deserializeRow
    );

    const event = mockUpdateEvent(5, rows);

    act(() => {
      handler(event);
    });

    expect(deserializeRow).not.toHaveBeenCalled();
    expect(viewportDataRef.current.items.length).toEqual(0);
  });

  it('should create a handler that adds items to a ListData of KeyedItems', () => {
    const table = TestUtils.createMockProxy<Table>({ columns: [] });

    const { result: viewportDataRef } = renderHook(() =>
      useListData<KeyedItem<unknown>>({})
    );

    const handler = createOnTableUpdatedHandler(
      table,
      viewportDataRef.current,
      deserializeRow
    );

    const offset = 5;
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
    const table = TestUtils.createMockProxy<Table>({ columns: [] });

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

describe('defaultRowDeserializer', () => {
  it('should map all columns with original names', () => {
    const row = mockViewportRow(10);
    // mock our get function by mapping capital column name to lowercase value
    // e.g. A: 'a'
    row.get = jest.fn(({ name }: { name: string }) => name.toLowerCase());

    const actual = defaultRowDeserializer(row, [
      mockColumn('A'),
      mockColumn('B'),
      mockColumn('C'),
    ]);

    expect(actual).toEqual({
      A: 'a',
      B: 'b',
      C: 'c',
    });
  });
});

describe('generateEmptyKeyedItems', () => {
  it.each([
    [1, [{ key: '0' }]],
    [2, [{ key: '0' }, { key: '1' }]],
    [5, [{ key: '0' }, { key: '1' }, { key: '2' }, { key: '3' }, { key: '4' }]],
  ] as const)(
    'should generate a sequence of string keys for the given count: %s',
    (count, expected) => {
      const actual = [...generateEmptyKeyedItems(count)];
      expect(actual).toEqual(expected);
    }
  );
});

describe('getSize', () => {
  it.each([undefined, null])(
    'should return zero if no table given: %s',
    table => {
      const actual = getSize(table);
      expect(actual).toEqual(0);
    }
  );

  it('should return zero if is closed', () => {
    const table = { isClosed: true, size: 10 } as Table;
    const actual = getSize(table);
    expect(actual).toEqual(0);
  });

  it('should return table size if no "isClosed" property exists', () => {
    const size = 10;
    const table = { size } as TreeTable;
    const actual = getSize(table);
    expect(actual).toEqual(size);
  });

  it('should return table size if is open', () => {
    const size = 10;
    const table = { isClosed: false, size } as Table;
    const actual = getSize(table);
    expect(actual).toEqual(size);
  });
});

describe('isClosed', () => {
  it('should return false if "isClosed property does not exist', () => {
    const table = {} as Table;
    expect(isClosed(table)).toStrictEqual(false);
  });

  it.each([false, true])(
    'should return value of "isClosed" if property exists: %s',
    value => {
      const table = { isClosed: value } as Table;
      expect(isClosed(table)).toStrictEqual(value);
    }
  );
});

describe('padFirstAndLastRow', () => {
  it.each([
    [0, [0, 12]],
    [1, [0, 13]],
    [2, [0, 14]],
    [3, [0, 15]],
    [4, [1, 16]],
    // arbitrary window in middle of table
    [50, [47, 62]],
    // pushing toward end boundary
    [85, [82, 97]],
    [86, [83, 98]],
    [87, [84, 99]],
    [88, [85, 99]],
    // start at last index 99
    [99, [96, 99]],
    // past last index
    [100, [97, 99]],
  ] as const)(
    'should pad viewport and clamp to table bounds: %s',
    (firstRow, expected) => {
      const viewportSize = 10;
      const padding = 3;
      const tableSize = 100;

      const actual = padFirstAndLastRow(
        firstRow,
        viewportSize,
        padding,
        tableSize
      );

      expect(actual).toEqual(expected);
    }
  );

  it.each([
    [0, [0, 4]],
    [1, [0, 4]],
    [2, [0, 4]],
    [3, [0, 4]],
    [4, [0, 4]],
    [5, [1, 4]],
    [6, [2, 4]],
    [7, [3, 4]],
    [8, [4, 4]],
    [9, [4, 4]],
    [10, [4, 4]],
    [-1, [0, 4]],
    [-2, [0, 4]],
    [-3, [0, 4]],
    [-4, [0, 4]],
    [-5, [0, 4]],
    [-6, [0, 3]],
    [-7, [0, 2]],
    [-8, [0, 1]],
    [-9, [0, 0]],
    [-10, [0, 0]],
  ] as const)(
    'should restrict to table size when < target size: %o',
    (firstRow, expected) => {
      const viewportSize = 6;
      const padding = 4;
      // Table size < vp + padding
      const tableSize = 5;

      const actual = padFirstAndLastRow(
        firstRow,
        viewportSize,
        padding,
        tableSize
      );

      expect(actual).toEqual(expected);
    }
  );
});
