import { act } from '@testing-library/react-hooks';
import type { Column, Table, TreeTable } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/utils';
import {
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

const { asMock, createMockProxy } = TestUtils;

function mockViewportRow(offsetInSnapshot: number): ViewportRow {
  return { offsetInSnapshot } as ViewportRow;
}

function mockColumn(name: string) {
  return {
    name,
  } as Column;
}

const deserializeRow: RowDeserializer<unknown> = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  // Mock deserializer just returns the row given to it.
  TestUtils.asMock(deserializeRow).mockImplementation(row => row);
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
  const mock = {
    deserializeRow: jest.fn() as RowDeserializer<unknown>,
    rows: [
      createMockProxy<ViewportRow>({ offsetInSnapshot: 0 }),
      createMockProxy<ViewportRow>({ offsetInSnapshot: 1 }),
      createMockProxy<ViewportRow>({ offsetInSnapshot: 2 }),
    ],
    updateEvent: (offset: number, rows: ViewportRow[], columns: Column[]) =>
      createMockProxy<OnTableUpdatedEvent>({
        detail: {
          offset,
          rows,
          columns,
        },
      }),
  };

  const cols: Column[] = [];

  beforeEach(() => {
    asMock(mock.deserializeRow).mockImplementation(a => ({
      label: 'deserialized',
      row: a,
    }));
  });

  it('should create a handler that bulk updates items', () => {
    const bulkUpdate = jest.fn();

    const offset = 2;
    const event = mock.updateEvent(offset, mock.rows, cols);

    const handler = createOnTableUpdatedHandler(
      { bulkUpdate },
      mock.deserializeRow
    );

    act(() => {
      handler(event);
    });

    mock.rows.forEach(row => {
      expect(mock.deserializeRow).toHaveBeenCalledWith(row, cols);
    });
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
    [0, 0, [{ key: '0' }]],
    [0, 1, [{ key: '0' }, { key: '1' }]],
    [
      0,
      4,
      [{ key: '0' }, { key: '1' }, { key: '2' }, { key: '3' }, { key: '4' }],
    ],
    [3, 5, [{ key: '3' }, { key: '4' }, { key: '5' }]],
  ] as const)(
    'should generate a sequence of string keys for the given range: %s',
    (start, end, expected) => {
      const actual = [...generateEmptyKeyedItems(start, end)];
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
