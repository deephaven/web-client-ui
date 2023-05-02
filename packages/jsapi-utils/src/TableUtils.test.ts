import dh, {
  Column,
  CustomColumn,
  DateWrapper,
  FilterCondition,
  FilterValue,
  LongWrapper,
  Sort,
  Table,
  TreeTable,
} from '@deephaven/jsapi-shim';
import {
  Operator as FilterOperator,
  Type as FilterType,
  TypeValue as FilterTypeValue,
} from '@deephaven/filters';
import { TestUtils } from '@deephaven/utils';
import TableUtils, { DataType, SortDirection } from './TableUtils';
import DateUtils from './DateUtils';
// eslint-disable-next-line import/no-relative-packages
import IrisGridTestUtils from '../../iris-grid/src/IrisGridTestUtils';
import { ColumnName } from './Formatter';

const DEFAULT_TIME_ZONE_ID = 'America/New_York';
const EXPECT_TIME_ZONE_PARAM = expect.objectContaining({
  id: DEFAULT_TIME_ZONE_ID,
});

function sendEventToLastRegisteredHandler(table: Table, eventName: string) {
  const event = TestUtils.createMockProxy<CustomEvent>({});

  const lastRegisteredEventListener = TestUtils.findLastCall(
    table.addEventListener,
    ([eventType]) => eventType === eventName
  )?.[1];

  lastRegisteredEventListener?.(event);
}

function makeColumns(count = 5): Column[] {
  const columns: Column[] = [];

  for (let i = 0; i < count; i += 1) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const column = new (dh as any).Column({ index: i, name: `${i}` });
    columns.push(column);
  }

  return columns;
}

type MockFilterCondition = Record<'not' | 'and' | 'or', jest.Mock>;

function makeFilterCondition(type = ''): MockFilterCondition {
  return {
    not: jest.fn(() => makeFilterCondition(`${type}.${FilterType.eq}`)),
    and: jest.fn(() => makeFilterCondition(`${type}.${FilterType.eq}`)),
    or: jest.fn(() => makeFilterCondition(`${type}.${FilterType.eq}`)),
  };
}

describe('applyCustomColumns', () => {
  const table = TestUtils.createMockProxy<Table>({});
  const columns = [TestUtils.createMockProxy<CustomColumn>({})];

  it('should call table.applyCustomColumns and wait for dh.Table.EVENT_CUSTOMCOLUMNSCHANGED event', () => {
    const executeAndWaitForEvent = jest.spyOn(
      TableUtils,
      'executeAndWaitForEvent'
    );

    const timeout = 3000;

    TableUtils.applyCustomColumns(table, columns, timeout);

    expect(TableUtils.executeAndWaitForEvent).toHaveBeenCalledWith(
      expect.any(Function),
      table,
      dh.Table.EVENT_CUSTOMCOLUMNSCHANGED,
      timeout
    );

    const exec = executeAndWaitForEvent.mock.lastCall?.[0];
    exec?.(table);
    expect(table.applyCustomColumns).toHaveBeenCalledWith(columns);
  });
});

describe('applyFilter', () => {
  const table = TestUtils.createMockProxy<Table>({});
  const filters = [TestUtils.createMockProxy<FilterCondition>({})];

  it('should call table.applyFilter and wait for dh.Table.EVENT_FILTERCHANGED event', () => {
    const executeAndWaitForEvent = jest.spyOn(
      TableUtils,
      'executeAndWaitForEvent'
    );

    const timeout = 3000;

    TableUtils.applyFilter(table, filters, timeout);

    expect(TableUtils.executeAndWaitForEvent).toHaveBeenCalledWith(
      expect.any(Function),
      table,
      dh.Table.EVENT_FILTERCHANGED,
      timeout
    );

    const exec = executeAndWaitForEvent.mock.lastCall?.[0];
    exec?.(table);
    expect(table.applyFilter).toHaveBeenCalledWith(filters);
  });
});

describe('applyNeverFilter', () => {
  const column = TestUtils.createMockProxy<Column>({});
  const neverFilter = TestUtils.createMockProxy<FilterCondition>({});
  const makeNeverFilter = jest.spyOn(TableUtils, 'makeNeverFilter');

  const table = TestUtils.createMockProxy<Table>({
    findColumn: jest.fn().mockReturnValue(column),
  });

  beforeEach(() => {
    makeNeverFilter.mockReturnValue(neverFilter);
  });

  afterEach(() => {
    makeNeverFilter.mockRestore();
  });

  it('should call TableUtils.applyFilter with a "never filter"', () => {
    const applyFilter = jest.spyOn(TableUtils, 'applyFilter');

    const columnName = 'mock.column';
    const timeout = 3000;

    TableUtils.applyNeverFilter(table, columnName, timeout);

    expect(makeNeverFilter).toHaveBeenCalledWith(column);
    expect(applyFilter).toHaveBeenCalledWith(table, [neverFilter], timeout);
  });
});

describe('applySort', () => {
  const table = TestUtils.createMockProxy<Table>({});
  const sorts = [TestUtils.createMockProxy<Sort>({})];

  it('should call table.applySort and wait for dh.Table.EVENT_SORTCHANGED event', () => {
    const executeAndWaitForEvent = jest.spyOn(
      TableUtils,
      'executeAndWaitForEvent'
    );

    const timeout = 3000;

    TableUtils.applySort(table, sorts, timeout);

    expect(TableUtils.executeAndWaitForEvent).toHaveBeenCalledWith(
      expect.any(Function),
      table,
      dh.Table.EVENT_SORTCHANGED,
      timeout
    );

    const exec = executeAndWaitForEvent.mock.lastCall?.[0];
    exec?.(table);
    expect(table.applySort).toHaveBeenCalledWith(sorts);
  });
});

describe('executeAndWaitForEvent', () => {
  const table = TestUtils.createMockProxy<Table>({
    addEventListener: jest.fn(() => jest.fn()),
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([null, undefined])(
    'should resolve to null if given null or undefined: %s',
    async notTable => {
      const exec = jest.fn();
      const actual = await TableUtils.executeAndWaitForEvent(
        exec,
        notTable,
        'mock.event'
      );

      expect(actual).toBeNull();
      expect(exec).not.toHaveBeenCalled();
    }
  );

  it.each(['mock.eventA', 'mock.eventB'])(
    'should call execute callback and wait for next `eventType` event: %s',
    async eventType => {
      const exec = jest.fn();
      const tablePromise = TableUtils.executeAndWaitForEvent(
        exec,
        table,
        eventType
      );

      expect(exec).toHaveBeenCalledWith(table);

      sendEventToLastRegisteredHandler(table, eventType);

      const result = await tablePromise;

      expect(result).toBe(table);
    }
  );

  it.each(['mock.eventA', 'mock.eventB'])(
    'should execute callback and reject promise if event timeout expires: %s',
    async eventType => {
      jest.useFakeTimers();

      const exec = jest.fn();
      const timeout = 3000;
      const tablePromise = TableUtils.executeAndWaitForEvent(
        exec,
        table,
        eventType,
        timeout
      );

      expect(exec).toHaveBeenCalledWith(table);

      jest.advanceTimersByTime(timeout);

      expect(tablePromise).rejects.toThrow(`Event "${eventType}" timed out.`);
    }
  );
});

describe('toggleSortForColumn', () => {
  it('toggles sort properly', () => {
    const columns = makeColumns();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table: Table = new (dh as any).Table({ columns });
    let tableSorts: Sort[] = [];

    expect(table).not.toBe(null);
    expect(table.sort.length).toBe(0);

    tableSorts = TableUtils.toggleSortForColumn(tableSorts, columns, 0, true);
    table.applySort(tableSorts);
    expect(table.sort.length).toBe(1);
    expect(table.sort[0].column).toBe(columns[0]);
    expect(table.sort[0].direction).toBe(TableUtils.sortDirection.ascending);

    tableSorts = TableUtils.toggleSortForColumn(tableSorts, columns, 3, true);
    table.applySort(tableSorts);
    expect(table.sort.length).toBe(2);
    expect(table.sort[0].column).toBe(columns[0]);
    expect(table.sort[0].direction).toBe(TableUtils.sortDirection.ascending);
    expect(table.sort[1].column).toBe(columns[3]);
    expect(table.sort[1].direction).toBe(TableUtils.sortDirection.ascending);

    tableSorts = TableUtils.toggleSortForColumn(tableSorts, columns, 0, true);
    table.applySort(tableSorts);
    expect(table.sort.length).toBe(2);
    expect(table.sort[0].column).toBe(columns[3]);
    expect(table.sort[0].direction).toBe(TableUtils.sortDirection.ascending);
    expect(table.sort[1].column).toBe(columns[0]);
    expect(table.sort[1].direction).toBe(TableUtils.sortDirection.descending);

    tableSorts = TableUtils.toggleSortForColumn(tableSorts, columns, 0, true);
    table.applySort(tableSorts);
    expect(table.sort.length).toBe(1);
    expect(table.sort[0].column).toBe(columns[3]);
    expect(table.sort[0].direction).toBe(TableUtils.sortDirection.ascending);

    tableSorts = TableUtils.toggleSortForColumn(tableSorts, columns, 3, true);
    table.applySort(tableSorts);
    expect(table.sort.length).toBe(1);
    expect(table.sort[0].column).toBe(columns[3]);
    expect(table.sort[0].direction).toBe(TableUtils.sortDirection.descending);

    tableSorts = TableUtils.toggleSortForColumn(tableSorts, columns, 3, true);
    table.applySort(tableSorts);

    expect(table.sort.length).toBe(0);
  });

  it('should return an empty array if columnIndex is out of range', () => {
    const columns = makeColumns();
    expect(TableUtils.toggleSortForColumn([], columns, -1)).toEqual([]);
  });
});

describe('quick filter tests', () => {
  type MockFilter = ReturnType<typeof makeFilter>;
  type MockColumn = Omit<Column, 'filter'> & { filter(): MockFilter };

  function makeFilter(type = '') {
    return {
      contains: jest.fn(() =>
        makeFilterCondition(`${type}.${FilterType.contains}`)
      ),
      eq: jest.fn(() => makeFilterCondition(`${type}.${FilterType.eq}`)),
      eqIgnoreCase: jest.fn(() =>
        makeFilterCondition(`${type}.${FilterType.eqIgnoreCase}`)
      ),
      notEq: jest.fn(() => makeFilterCondition(`${type}.${FilterType.notEq}`)),
      notEqIgnoreCase: jest.fn(() =>
        makeFilterCondition(`${type}.${FilterType.notEqIgnoreCase}`)
      ),
      greaterThan: jest.fn(() =>
        makeFilterCondition(`${type}.${FilterType.greaterThan}`)
      ),
      greaterThanOrEqualTo: jest.fn(() =>
        makeFilterCondition(`${type}.${FilterType.greaterThanOrEqualTo}`)
      ),
      lessThan: jest.fn(() =>
        makeFilterCondition(`${type}.${FilterType.lessThan}`)
      ),
      lessThanOrEqualTo: jest.fn(() =>
        makeFilterCondition(`${type}.${FilterType.lessThanOrEqualTo}`)
      ),
      in: jest.fn(() => makeFilterCondition(`${type}.${FilterType.in}`)),
      inIgnoreCase: jest.fn(() =>
        makeFilterCondition(`${type}.${FilterType.inIgnoreCase}`)
      ),
      isTrue: jest.fn(() =>
        makeFilterCondition(`${type}.${FilterType.isTrue}`)
      ),
      isFalse: jest.fn(() =>
        makeFilterCondition(`${type}.${FilterType.isFalse}`)
      ),
      isNull: jest.fn(() =>
        makeFilterCondition(`${type}.${FilterType.isNull}`)
      ),
      invoke: jest.fn(() =>
        makeFilterCondition(`${type}.${FilterType.invoke}`)
      ),
      notIn: jest.fn(() => makeFilterCondition(`${type}.${FilterType.notIn}`)),
      notInIgnoreCase: jest.fn(() =>
        makeFilterCondition(`${type}.${FilterType.notInIgnoreCase}`)
      ),
      type,
    };
  }

  function makeFilterColumn(type = 'string'): MockColumn {
    const filter = makeFilter();
    const column = IrisGridTestUtils.makeColumn('test placeholder', type, 13);
    column.filter = jest.fn(() => filter);
    return column as MockColumn;
  }

  function mockFilterConditionReturnValue(filterToMock): MockFilterCondition {
    const expectFilterCondition = makeFilterCondition();
    filterToMock.mockReturnValueOnce(expectFilterCondition);
    return expectFilterCondition;
  }

  function testFilter(functionName, text, expectedFn, ...args) {
    const column = makeFilterColumn();
    const filter = column.filter();

    const expectedResult = makeFilterCondition();

    filter[expectedFn].mockReturnValueOnce(expectedResult);

    const result = TableUtils[functionName](column, text);

    expect(filter[expectedFn]).toHaveBeenCalledWith(...args);
    expect(result).toBe(expectedResult);
  }

  function testFilterWithType(
    functionName: string,
    text,
    expectedFn,
    type,
    ...args
  ) {
    const column = makeFilterColumn(type);
    const filter = column.filter();

    const expectedResult = makeFilterCondition();

    filter[expectedFn].mockReturnValueOnce(expectedResult);

    const result = TableUtils[functionName](column, text);

    expect(filter[expectedFn]).toHaveBeenCalledWith(...args);
    expect(result).toBe(expectedResult);
  }

  function testMultiFilter(
    columnType,
    testFunction,
    text,
    timeZone,
    expectedFilters
  ) {
    const column = makeFilterColumn(columnType);

    const columnFilter = column.filter();
    const filters: MockFilterCondition[] = [];
    const joinFilters: MockFilterCondition[] = [];
    for (let i = 0; i < expectedFilters.length; i += 1) {
      const [expectedFn, expectedOperator] = expectedFilters[i];
      const filter = makeFilterCondition();
      columnFilter[expectedFn].mockReturnValueOnce(filter);

      filters.push(filter);

      if (expectedOperator != null) {
        const joinFilter = makeFilterCondition();
        if (i > 0) {
          joinFilters[i - 1][expectedOperator].mockReturnValueOnce(joinFilter);
        } else {
          filter[expectedOperator].mockReturnValueOnce(joinFilter);
        }
        joinFilters.push(joinFilter);
      }
    }

    const result = TableUtils[testFunction](column, text, timeZone);

    for (let i = 0; i < expectedFilters.length; i += 1) {
      const [expectedFn, expectedOperator, ...args] = expectedFilters[i];
      const filter = filters[i];
      expect(columnFilter[expectedFn]).toHaveBeenCalledWith(...args);
      if (expectedOperator != null) {
        const nextFilter = filters[i + 1];
        if (i > 0) {
          expect(joinFilters[i - 1][expectedOperator]).toHaveBeenCalledWith(
            nextFilter
          );
        } else if (nextFilter != null) {
          expect(filter[expectedOperator]).toHaveBeenCalledWith(nextFilter);
        } else {
          expect(filter[expectedOperator]).toHaveBeenCalled();
        }
      }
    }

    if (joinFilters.length > 0) {
      expect(result).toBe(joinFilters[joinFilters.length - 1]);
    } else if (filters.length > 0) {
      expect(result).toBe(filters[filters.length - 1]);
    } else {
      expect(result).toBe(null);
    }
  }

  beforeEach(() => {
    // Just return the value for all these functions for now...
    dh.FilterValue = {
      ofString: value => value as FilterValue,
      ofNumber: value => value as FilterValue,
      ofBoolean: value => value as FilterValue,
    };

    dh.FilterCondition = {
      invoke: jest.fn(type => makeFilterCondition(type)),
      search: jest.fn(),
    };

    dh.i18n.DateTimeFormat.parse = (pattern, text) => {
      // Just parse out the text and pass back a date in millis
      // Real library passes back a wrapped long, but this is fine for tests
      const [year, month, day] = text
        .split('-')
        .map(value => parseInt(value, 10));
      return (new Date(
        year,
        month - 1,
        day
      ).getTime() as unknown) as DateWrapper;
    };

    // Just return the millis value as the date wrapper for unit tests
    dh.DateWrapper.ofJsDate = date =>
      (date.getTime() as unknown) as DateWrapper;
    dh.i18n.DateTimeFormat.parse = (_format, dateString) =>
      (Date.parse(dateString) as unknown) as DateWrapper;
  });

  describe('makeQuickFilterFromComponent', () => {
    const testComponentFilter = (
      text: string | boolean | number,
      expectedFn,
      type,
      ...args
    ) => {
      testFilterWithType(
        'makeQuickFilterFromComponent',
        text,
        expectedFn,
        type,
        ...args
      );
    };

    it('should return a number filter if column type is number', () => {
      testComponentFilter('52', FilterType.eq, 'int', 52);
      testComponentFilter('>-9', FilterType.greaterThan, 'short', -9);
    });

    it('should return a boolean filter if column type is boolean', () => {
      testComponentFilter('true', FilterType.isTrue, 'boolean');
      testComponentFilter(false, FilterType.isFalse, 'boolean');
      testComponentFilter(1, FilterType.isTrue, 'boolean');
      testComponentFilter('null', FilterType.isNull, 'java.lang.Boolean');
    });

    it('should return a date filter if column type is date', () => {
      testMultiFilter(
        'io.deephaven.time.DateTime',
        'makeQuickFilterFromComponent',
        '>2018',
        'America/New_York',
        [[FilterType.greaterThanOrEqualTo, null, new Date(2019, 0).getTime()]]
      );
      testMultiFilter(
        'io.deephaven.db.tables.utils.DBDateTime',
        'makeQuickFilterFromComponent',
        '2018-9-7',
        'America/New_York',
        [
          [
            FilterType.greaterThanOrEqualTo,
            FilterOperator.and,
            new Date(2018, 8, 7).getTime(),
          ],
          [FilterType.lessThan, null, new Date(2018, 8, 8).getTime()],
        ]
      );
    });

    it('should return a char filter if column type is char', () => {
      testComponentFilter('d', FilterType.eq, 'char', 'd');
      testComponentFilter('!c', FilterType.notEq, 'java.lang.Character', 'c');
      testComponentFilter(
        '>=c',
        FilterType.greaterThanOrEqualTo,
        'char',
        '"c"'
      );
      testComponentFilter('null', FilterType.isNull, 'char');
    });

    it('should return a text filter for any other column type', () => {
      testComponentFilter(
        '\\*foo',
        FilterType.eqIgnoreCase,
        'notatype',
        '*foo'
      );
      testComponentFilter('foo', FilterType.eqIgnoreCase, 'string', 'foo');
    });
  });

  describe('makeAdvancedValueFilter', () => {
    const filterTypesWithArgument: FilterTypeValue[] = [
      FilterType.eq,
      FilterType.eqIgnoreCase,
      FilterType.notEq,
      FilterType.notEqIgnoreCase,
      FilterType.greaterThan,
      FilterType.greaterThanOrEqualTo,
      FilterType.lessThan,
      FilterType.lessThanOrEqualTo,
    ];

    const filterTypesWithNoArguments: FilterTypeValue[] = [
      FilterType.isTrue,
      FilterType.isFalse,
      FilterType.isNull,
    ];

    const invalidFilterTypes: FilterTypeValue[] = [
      FilterType.in,
      FilterType.inIgnoreCase,
      FilterType.notIn,
      FilterType.notInIgnoreCase,
      FilterType.invoke,
    ];

    function testInvokeFilter(type, operation, value, timezone, ...args) {
      const column = makeFilterColumn(type);
      const filter = column.filter() as MockFilter;

      const nullResult = makeFilterCondition();
      const notResult = makeFilterCondition();
      const invokeResult = makeFilterCondition();
      const expectedResult = makeFilterCondition();

      filter.isNull.mockReturnValueOnce(nullResult);

      (nullResult.not as jest.Mock).mockReturnValueOnce(notResult);

      filter.invoke.mockReturnValueOnce(invokeResult);

      (notResult.and as jest.Mock).mockReturnValueOnce(expectedResult);

      const result = TableUtils.makeAdvancedValueFilter(
        column,
        operation,
        value,
        timezone
      );

      expect(filter.isNull).toHaveBeenCalled();
      expect(nullResult.not).toHaveBeenCalled();
      expect(notResult.and).toHaveBeenCalledWith(invokeResult);

      expect(filter.invoke).toHaveBeenCalledWith(...args);
      expect(result).toBe(expectedResult);
    }

    const testFilterWithOperation = (
      functionName,
      value,
      expectedFn,
      operation: FilterTypeValue,
      timezone: string,
      type: string,
      ...args
    ) => {
      const column = makeFilterColumn(type);
      const filter = column.filter();

      const expectedResult = makeFilterCondition();

      filter[expectedFn].mockReturnValueOnce(expectedResult);

      const result = TableUtils[functionName](
        column,
        operation,
        value,
        timezone
      );

      expect(filter[expectedFn]).toHaveBeenCalledWith(...args);
      expect(result).toBe(expectedResult);
    };

    const testAdvancedValueFilter = (
      value,
      expectedFn,
      operation: FilterTypeValue,
      timezone: string,
      type: string,
      ...args
    ) => {
      testFilterWithOperation(
        'makeAdvancedValueFilter',
        value,
        expectedFn,
        operation,
        timezone,
        type,
        ...args
      );
    };

    it('should return a date filter if column type is date', () => {
      const [startValue] = DateUtils.parseDateRange(
        '2022-11-12',
        DEFAULT_TIME_ZONE_ID
      );
      testAdvancedValueFilter(
        '2022-11-12',
        FilterType.greaterThanOrEqualTo,
        'greaterThanOrEqualTo',
        DEFAULT_TIME_ZONE_ID,
        'io.deephaven.time.DateTime',
        startValue
      );
    });

    it('should return a number filter if column type is number', () => {
      testAdvancedValueFilter(
        '200',
        FilterType.eq,
        FilterType.eq,
        DEFAULT_TIME_ZONE_ID,
        'int',
        200
      );
    });

    it('should return a char filter if column type is char', () => {
      testAdvancedValueFilter(
        'c',
        FilterType.notEq,
        FilterType.notEq,
        DEFAULT_TIME_ZONE_ID,
        'char',
        'c'
      );
    });

    describe('column type is not date, number, or char', () => {
      it('should call eq function with the value if operation is "eq"', () => {
        testAdvancedValueFilter(
          'test',
          FilterType.eq,
          FilterType.eq,
          DEFAULT_TIME_ZONE_ID,
          'java.lang.String',
          'test'
        );
      });

      it('should call eqIgnoreCase function with the value if operation is "eqIgnoreCase"', () => {
        testAdvancedValueFilter(
          'test',
          FilterType.eqIgnoreCase,
          FilterType.eqIgnoreCase,
          DEFAULT_TIME_ZONE_ID,
          'java.lang.String',
          'test'
        );
      });

      it('should call notEq function with the value if operation is "notEq"', () => {
        testAdvancedValueFilter(
          'true',
          FilterType.notEq,
          FilterType.notEq,
          DEFAULT_TIME_ZONE_ID,
          'boolean',
          'true'
        );
      });

      it('should call notEqIgnoreCase function with the value if operation is "notEq"', () => {
        testAdvancedValueFilter(
          'true',
          FilterType.notEq,
          FilterType.notEq,
          DEFAULT_TIME_ZONE_ID,
          'boolean',
          'true'
        );
      });

      it('handles filter types with argument of value (eq, eqIgnoreCase, notEq, notEqIgnoreCase, greaterThan, greaterThanOrEqualTo, lessThan, lessThanOrEqualTo)', () => {
        // eslint-disable-next-line no-restricted-syntax
        for (const value of filterTypesWithArgument) {
          testAdvancedValueFilter(
            'test',
            value,
            value,
            DEFAULT_TIME_ZONE_ID,
            'java.lang.String',
            'test'
          );
        }
      });

      it('handles filter types with no arguments (isTrue, isFalse, isNull)', () => {
        // eslint-disable-next-line no-restricted-syntax
        for (const value of filterTypesWithNoArguments) {
          testAdvancedValueFilter(
            'test',
            value,
            value,
            DEFAULT_TIME_ZONE_ID,
            'java.lang.String'
          );
        }
      });

      it('handles contains', () => {
        testInvokeFilter(
          'java.lang.String',
          FilterType.contains,
          'test',
          DEFAULT_TIME_ZONE_ID,
          'matches',
          `(?s)(?i).*\\Qtest\\E.*`
        );
      });

      it('handles notContains', () => {
        const column = makeFilterColumn('java.lang.String');
        const filter = column.filter() as MockFilter;

        const nullResult = makeFilterCondition();
        const notResult = makeFilterColumn();
        const invokeResult = makeFilterCondition();
        const expectedResult = makeFilterCondition();

        filter.isNull.mockReturnValueOnce(nullResult);

        filter.invoke.mockReturnValueOnce(invokeResult);

        invokeResult.not.mockReturnValueOnce(notResult);

        nullResult.or.mockReturnValueOnce(expectedResult);

        const result = TableUtils.makeAdvancedValueFilter(
          column,
          FilterType.notContains,
          'test',
          DEFAULT_TIME_ZONE_ID
        );

        expect(filter.isNull).toHaveBeenCalled();
        expect(nullResult.or).toHaveBeenCalledWith(notResult);

        expect(filter.invoke).toHaveBeenCalledWith(
          'matches',
          `(?s)(?i).*\\Qtest\\E.*`
        );

        expect(result).toBe(expectedResult);
      });

      it('handles startsWith', () => {
        testInvokeFilter(
          'java.lang.String',
          FilterType.startsWith,
          'test',
          DEFAULT_TIME_ZONE_ID,
          'matches',
          `(?s)(?i)^\\Qtest\\E.*`
        );
      });

      it('handles endsWith', () => {
        testInvokeFilter(
          'java.lang.String',
          FilterType.endsWith,
          'test',
          DEFAULT_TIME_ZONE_ID,
          'matches',
          `(?s)(?i).*\\Qtest\\E$`
        );
      });

      it('should throw an error for unexpected filter operations', () => {
        const column = makeFilterColumn('java.lang.String');

        // eslint-disable-next-line no-restricted-syntax
        for (const operation of invalidFilterTypes) {
          expect(() =>
            TableUtils.makeAdvancedValueFilter(
              column,
              operation,
              'test',
              DEFAULT_TIME_ZONE_ID
            )
          ).toThrowError(`Unexpected filter operation: ${operation}`);
        }
      });
    });
  });

  describe('quick number filters', () => {
    function testNumberFilter(text, expectedFn, ...args) {
      testFilter('makeQuickNumberFilter', text, expectedFn, ...args);
    }

    it('handles default operation', () => {
      testNumberFilter('52', FilterType.eq, 52);
    });

    it('handles empty cases', () => {
      const column = makeFilterColumn();

      expect(TableUtils.makeQuickNumberFilter(column, '')).toBe(null);
    });

    it('handles invalid cases', () => {
      const column = makeFilterColumn();

      expect(TableUtils.makeQuickNumberFilter(column, 'j*($%U#@(')).toBe(null);
      expect(TableUtils.makeQuickNumberFilter(column, '<=')).toBe(null);
      expect(TableUtils.makeQuickNumberFilter(column, '<=> 50')).toBe(null);
      expect(TableUtils.makeQuickNumberFilter(column, '== 50')).toBe(null);
      expect(TableUtils.makeQuickNumberFilter(column, '> x')).toBe(null);
      expect(TableUtils.makeQuickNumberFilter(column, '50>')).toBe(null);
      expect(TableUtils.makeQuickNumberFilter(column, '4,00')).toBe(null);
      expect(TableUtils.makeQuickNumberFilter(column, '4,00000')).toBe(null);
      expect(TableUtils.makeQuickNumberFilter(column, '40.40.40')).toBe(null);
    });

    it('handles default operation', () => {
      testNumberFilter('52', FilterType.eq, 52);
      testNumberFilter(42, FilterType.eq, 42);
      testNumberFilter('-64', FilterType.eq, -64);
      testNumberFilter('- 8', FilterType.eq, -8);
      testNumberFilter('    88\n  ', FilterType.eq, 88);
    });

    it('handles = operation', () => {
      testNumberFilter('=20', FilterType.eq, 20);
      testNumberFilter('= 99', FilterType.eq, 99);
      testNumberFilter(' = - 14  ', FilterType.eq, -14);
    });

    it('handles > operation', () => {
      testNumberFilter('>42', FilterType.greaterThan, 42);
      testNumberFilter('> 44', FilterType.greaterThan, 44);
      testNumberFilter('  >-24', FilterType.greaterThan, -24);
      testNumberFilter('  > - 9  ', FilterType.greaterThan, -9);
    });

    it('handles >= operation', () => {
      testNumberFilter('>=42', FilterType.greaterThanOrEqualTo, 42);
      testNumberFilter('>= 44', FilterType.greaterThanOrEqualTo, 44);
      testNumberFilter('  >=-24', FilterType.greaterThanOrEqualTo, -24);
      testNumberFilter('  >= - 9  ', FilterType.greaterThanOrEqualTo, -9);
    });

    it('handles => operation', () => {
      testNumberFilter('=>42', FilterType.greaterThanOrEqualTo, 42);
      testNumberFilter('=> 44', FilterType.greaterThanOrEqualTo, 44);
      testNumberFilter('  =>-24', FilterType.greaterThanOrEqualTo, -24);
      testNumberFilter('  => - 9  ', FilterType.greaterThanOrEqualTo, -9);
    });

    it('handles <= operation', () => {
      testNumberFilter('<=42', FilterType.lessThanOrEqualTo, 42);
      testNumberFilter('<= 44', FilterType.lessThanOrEqualTo, 44);
      testNumberFilter('  <=-24', FilterType.lessThanOrEqualTo, -24);
      testNumberFilter('  <= - 9  ', FilterType.lessThanOrEqualTo, -9);
    });

    it('handles =< operation', () => {
      testNumberFilter('=<42', FilterType.lessThanOrEqualTo, 42);
      testNumberFilter('=< 44', FilterType.lessThanOrEqualTo, 44);
      testNumberFilter('  =<-24', FilterType.lessThanOrEqualTo, -24);
      testNumberFilter('  =< - 9  ', FilterType.lessThanOrEqualTo, -9);
    });

    it('handles decimals', () => {
      testNumberFilter('<=4.2', FilterType.lessThanOrEqualTo, 4.2);
      testNumberFilter('>= 4.4', FilterType.greaterThanOrEqualTo, 4.4);
      testNumberFilter('  =-2.4', FilterType.eq, -2.4);
      testNumberFilter('  > - 9.01  ', FilterType.greaterThan, -9.01);
    });

    it('handles commas', () => {
      testNumberFilter('<=4,000.2', FilterType.lessThanOrEqualTo, 4000.2);
      testNumberFilter(
        '>= 4,000,000.4',
        FilterType.greaterThanOrEqualTo,
        4000000.4
      );
      testNumberFilter('  =-2,420.4', FilterType.eq, -2420.4);
      testNumberFilter(
        '  > - 9,999,999.01  ',
        FilterType.greaterThan,
        -9999999.01
      );
    });

    it('handles null', () => {
      testNumberFilter('null', FilterType.isNull);
      testNumberFilter('  null  \n ', FilterType.isNull);
    });
    it('handles NaN cases', () => {
      const column = makeFilterColumn();
      const columnFilter = column.filter();
      TableUtils.makeQuickNumberFilter(column, 'NAN');
      expect(dh.FilterCondition.invoke).toBeCalledWith('isNaN', columnFilter);
      TableUtils.makeQuickNumberFilter(column, 'NaN');
      expect(dh.FilterCondition.invoke).toBeCalledWith('isNaN', columnFilter);
      TableUtils.makeQuickNumberFilter(column, 'nan');
      expect(dh.FilterCondition.invoke).toBeCalledWith('isNaN', columnFilter);
    });
    it('handles infinity cases', () => {
      const column = makeFilterColumn();
      const columnFilter = column.filter();

      TableUtils.makeQuickNumberFilter(column, 'inf  ');
      expect(dh.FilterCondition.invoke).toBeCalledWith('isInf', columnFilter);
      expect(columnFilter.greaterThan).toHaveBeenCalled();

      TableUtils.makeQuickNumberFilter(column, '  infinity');
      expect(dh.FilterCondition.invoke).toBeCalledWith('isInf', columnFilter);
      expect(columnFilter.greaterThan).toHaveBeenCalled();

      TableUtils.makeQuickNumberFilter(column, ' - infinity');
      expect(dh.FilterCondition.invoke).toBeCalledWith('isInf', columnFilter);
      expect(columnFilter.lessThan).toHaveBeenCalled();

      TableUtils.makeQuickNumberFilter(column, 'INFINITY');
      expect(dh.FilterCondition.invoke).toBeCalledWith('isInf', columnFilter);
      expect(columnFilter.greaterThan).toHaveBeenCalled();

      TableUtils.makeQuickNumberFilter(column, '\u221E');
      expect(dh.FilterCondition.invoke).toBeCalledWith('isInf', columnFilter);
      expect(columnFilter.greaterThan).toHaveBeenCalled();

      TableUtils.makeQuickNumberFilter(column, '- \u221E');
      expect(dh.FilterCondition.invoke).toBeCalledWith('isInf', columnFilter);
      expect(columnFilter.lessThan).toHaveBeenCalled();
    });
    it('handles abnormal filter not equal cases', () => {
      const column = makeFilterColumn();
      const columnFilter = column.filter();

      let expectFilterCondition: MockFilterCondition | null = null;
      let expectAndFilterCondition: MockFilterCondition | null = null;

      expectFilterCondition = mockFilterConditionReturnValue(
        dh.FilterCondition.invoke
      );
      TableUtils.makeQuickNumberFilter(column, '!NAN');
      expect(dh.FilterCondition.invoke).toBeCalledWith('isNaN', columnFilter);
      expect(expectFilterCondition.not).toHaveBeenCalledTimes(1);

      expectFilterCondition = mockFilterConditionReturnValue(
        dh.FilterCondition.invoke
      );
      TableUtils.makeQuickNumberFilter(column, '!=nan');
      expect(dh.FilterCondition.invoke).toBeCalledWith('isNaN', columnFilter);
      expect(expectFilterCondition.not).toHaveBeenCalledTimes(1);

      expectFilterCondition = mockFilterConditionReturnValue(
        dh.FilterCondition.invoke
      );
      TableUtils.makeQuickNumberFilter(column, '!= NaN');
      expect(dh.FilterCondition.invoke).toBeCalledWith('isNaN', columnFilter);
      expect(expectFilterCondition.not).toHaveBeenCalledTimes(1);

      expectFilterCondition = mockFilterConditionReturnValue(
        dh.FilterCondition.invoke
      );
      expectAndFilterCondition = mockFilterConditionReturnValue(
        expectFilterCondition.and
      );
      TableUtils.makeQuickNumberFilter(column, '!INFINITY');
      expect(dh.FilterCondition.invoke).toBeCalledWith('isInf', columnFilter);
      expect(columnFilter.greaterThan).toHaveBeenCalled();
      expect(expectFilterCondition.and).toHaveBeenCalledTimes(1);
      expect(expectAndFilterCondition.not).toHaveBeenCalledTimes(1);

      expectFilterCondition = mockFilterConditionReturnValue(
        dh.FilterCondition.invoke
      );
      expectAndFilterCondition = mockFilterConditionReturnValue(
        expectFilterCondition.and
      );
      TableUtils.makeQuickNumberFilter(column, '!= inf');
      expect(dh.FilterCondition.invoke).toBeCalledWith('isInf', columnFilter);
      expect(columnFilter.greaterThan).toHaveBeenCalled();
      expect(expectFilterCondition.and).toHaveBeenCalledTimes(1);
      expect(expectAndFilterCondition.not).toHaveBeenCalledTimes(1);

      expectFilterCondition = mockFilterConditionReturnValue(
        dh.FilterCondition.invoke
      );
      expectAndFilterCondition = mockFilterConditionReturnValue(
        expectFilterCondition.and
      );
      TableUtils.makeQuickNumberFilter(column, '!= - \u221E');
      expect(dh.FilterCondition.invoke).toBeCalledWith('isInf', columnFilter);
      expect(columnFilter.lessThan).toHaveBeenCalled();
      expect(expectFilterCondition.and).toHaveBeenCalledTimes(1);
      expect(expectAndFilterCondition.not).toHaveBeenCalledTimes(1);

      expectFilterCondition = mockFilterConditionReturnValue(
        columnFilter.isNull
      );
      TableUtils.makeQuickNumberFilter(column, '!null');
      expect(expectFilterCondition.not).toHaveBeenCalledTimes(1);

      expectFilterCondition = mockFilterConditionReturnValue(
        columnFilter.isNull
      );
      TableUtils.makeQuickNumberFilter(column, '!= null');
      expect(expectFilterCondition.not).toHaveBeenCalledTimes(1);
    });

    it('should return null if it is an abnormal value with unsupported operations', () => {
      const column = makeFilterColumn();
      expect(TableUtils.makeQuickNumberFilter(column, '>=NaN')).toBeNull();
    });
  });

  describe('quick boolean filters', () => {
    function testBooleanFilter(text, expectedFn, ...args) {
      testFilter('makeQuickBooleanFilter', text, expectedFn, ...args);
    }

    function testMultiBooleanFilter(text, expectedFilters) {
      testMultiFilter(
        'boolean',
        'makeQuickBooleanFilter',
        text,
        'America/New_York',
        expectedFilters
      );
    }

    it('handles empty cases', () => {
      const column = makeFilterColumn();

      expect(TableUtils.makeQuickBooleanFilter(column, '')).toBe(null);
    });

    it('handles invalid cases', () => {
      const column = makeFilterColumn();

      expect(TableUtils.makeQuickBooleanFilter(column, 'U()$#@')).toBe(null);
      expect(TableUtils.makeQuickBooleanFilter(column, 'invalid str')).toBe(
        null
      );
      expect(TableUtils.makeQuickBooleanFilter(column, 'nu ll')).toBe(null);
      expect(TableUtils.makeQuickBooleanFilter(column, 'truel')).toBe(null);
      expect(TableUtils.makeQuickBooleanFilter(column, 'falsel')).toBe(null);
      expect(TableUtils.makeQuickBooleanFilter(column, 'truefalse')).toBe(null);
      expect(TableUtils.makeQuickBooleanFilter(column, 'falsetrue')).toBe(null);
      expect(TableUtils.makeQuickBooleanFilter(column, 4)).toBe(null);
    });

    it('handles true/false properly', () => {
      testBooleanFilter(false, FilterType.isFalse);
      testBooleanFilter(true, FilterType.isTrue);
    });

    it('handles 1 and 0 properly', () => {
      testBooleanFilter('0', FilterType.isFalse);
      testBooleanFilter('   0    ', FilterType.isFalse);
      testBooleanFilter(0, FilterType.isFalse);

      testBooleanFilter('1', FilterType.isTrue);
      testBooleanFilter('   1 \n   ', FilterType.isTrue);
      testBooleanFilter(1, FilterType.isTrue);
    });

    it('handles null properly', () => {
      testBooleanFilter('null', FilterType.isNull);
      testBooleanFilter('    null \n  ', FilterType.isNull);
      testBooleanFilter('Null', FilterType.isNull);
      testBooleanFilter('NULL', FilterType.isNull);
      testBooleanFilter('NuLl', FilterType.isNull);
      testBooleanFilter('   nULl   \n', FilterType.isNull);
    });

    it('handles not null properly', () => {
      testMultiBooleanFilter('!= null', [
        [FilterType.isNull, FilterOperator.not],
      ]);
      testMultiBooleanFilter('! null', [
        [FilterType.isNull, FilterOperator.not],
      ]);
      testMultiBooleanFilter('! nUll', [
        [FilterType.isNull, FilterOperator.not],
      ]);
      testMultiBooleanFilter('!= NULL', [
        [FilterType.isNull, FilterOperator.not],
      ]);
    });

    it('handles true properly', () => {
      testBooleanFilter('t', FilterType.isTrue);
      testBooleanFilter('tr', FilterType.isTrue);
      testBooleanFilter('tru', FilterType.isTrue);
      testBooleanFilter('true', FilterType.isTrue);
      testBooleanFilter('T', FilterType.isTrue);
      testBooleanFilter('TRUE', FilterType.isTrue);
      testBooleanFilter('  true   \n  ', FilterType.isTrue);
      testBooleanFilter('   TRuE   \n ', FilterType.isTrue);

      testMultiBooleanFilter('!= t', [[FilterType.isTrue, FilterOperator.not]]);
      testMultiBooleanFilter('! TRUE', [
        [FilterType.isTrue, FilterOperator.not],
      ]);
    });

    it('handles false properly', () => {
      testBooleanFilter('f', FilterType.isFalse);
      testBooleanFilter('fa', FilterType.isFalse);
      testBooleanFilter('fal', FilterType.isFalse);
      testBooleanFilter('false', FilterType.isFalse);
      testBooleanFilter('FALSE', FilterType.isFalse);
      testBooleanFilter('F', FilterType.isFalse);
      testBooleanFilter(' F  \n ', FilterType.isFalse);
      testBooleanFilter(' FaLSe  \n ', FilterType.isFalse);

      testMultiBooleanFilter('!= fa', [
        [FilterType.isFalse, FilterOperator.not],
      ]);
      testMultiBooleanFilter('! FALse', [
        [FilterType.isFalse, FilterOperator.not],
      ]);
    });
  });

  describe('quick date filters', () => {
    function testDateFilter(text, expectedFilters) {
      testMultiFilter(
        'io.deephaven.time.DateTime',
        'makeQuickDateFilter',
        text,
        'America/New_York',
        expectedFilters
      );
    }

    it('handles invalid cases', () => {
      const column = makeFilterColumn();

      expect(() => TableUtils.makeQuickDateFilter(column, '', '')).toThrow();

      expect(() => TableUtils.makeQuickDateFilter(column, '>', '')).toThrow();
      expect(() =>
        TableUtils.makeQuickDateFilter(column, 'U()$#@', '')
      ).toThrow();
      expect(() =>
        TableUtils.makeQuickDateFilter(column, 'invalid str', '')
      ).toThrow();
      expect(() =>
        TableUtils.makeQuickDateFilter(column, 'nu ll', '')
      ).toThrow();
      expect(() =>
        TableUtils.makeQuickDateFilter(column, '20193-02-02', '')
      ).toThrow();
      expect(() =>
        TableUtils.makeQuickDateFilter(column, '302-111-303', '')
      ).toThrow();
      expect(() =>
        TableUtils.makeQuickDateFilter(column, (4 as unknown) as string, '')
      ).toThrow();

      // Missing time zone
      expect(() =>
        TableUtils.makeQuickDateFilter(column, '2021-10-19', '')
      ).toThrow();
    });

    it('handles year', () => {
      testDateFilter('2018', [
        [
          FilterType.greaterThanOrEqualTo,
          FilterOperator.and,
          new Date(2018, 0).getTime(),
        ],
        [FilterType.lessThan, null, new Date(2019, 0).getTime()],
      ]);
      testDateFilter('>=2018', [
        [FilterType.greaterThanOrEqualTo, null, new Date(2018, 0).getTime()],
      ]);
      testDateFilter('>2018', [
        [FilterType.greaterThanOrEqualTo, null, new Date(2019, 0).getTime()],
      ]);
      testDateFilter('<=2018', [
        [FilterType.lessThan, null, new Date(2019, 0).getTime()],
      ]);
      testDateFilter('<2018', [
        [FilterType.lessThan, null, new Date(2018, 0).getTime()],
      ]);
    });

    it('handles year-month', () => {
      testDateFilter('2018-09', [
        [
          FilterType.greaterThanOrEqualTo,
          FilterOperator.and,
          new Date(2018, 8).getTime(),
        ],
        [FilterType.lessThan, null, new Date(2018, 9).getTime()],
      ]);
      testDateFilter('2018-9', [
        [
          FilterType.greaterThanOrEqualTo,
          FilterOperator.and,
          new Date(2018, 8).getTime(),
        ],
        [FilterType.lessThan, null, new Date(2018, 9).getTime()],
      ]);
      testDateFilter('>=2018-09', [
        [FilterType.greaterThanOrEqualTo, null, new Date(2018, 8).getTime()],
      ]);
      testDateFilter('>2018-09', [
        [FilterType.greaterThanOrEqualTo, null, new Date(2018, 9).getTime()],
      ]);
      testDateFilter('<=2018-09', [
        [FilterType.lessThan, null, new Date(2018, 9).getTime()],
      ]);
      testDateFilter('<2018-09', [
        [FilterType.lessThan, null, new Date(2018, 8).getTime()],
      ]);
    });

    it('handles year-month-day', () => {
      testDateFilter('2018-09-27', [
        [
          FilterType.greaterThanOrEqualTo,
          FilterOperator.and,
          new Date(2018, 8, 27).getTime(),
        ],
        [FilterType.lessThan, null, new Date(2018, 8, 28).getTime()],
      ]);
      testDateFilter('2018-9-27', [
        [
          FilterType.greaterThanOrEqualTo,
          FilterOperator.and,
          new Date(2018, 8, 27).getTime(),
        ],
        [FilterType.lessThan, null, new Date(2018, 8, 28).getTime()],
      ]);
      testDateFilter('2018-9-7', [
        [
          FilterType.greaterThanOrEqualTo,
          FilterOperator.and,
          new Date(2018, 8, 7).getTime(),
        ],
        [FilterType.lessThan, null, new Date(2018, 8, 8).getTime()],
      ]);
      testDateFilter('>=2018-09-27', [
        [
          FilterType.greaterThanOrEqualTo,
          null,
          new Date(2018, 8, 27).getTime(),
        ],
      ]);
      testDateFilter('>2018-09-27', [
        [
          FilterType.greaterThanOrEqualTo,
          null,
          new Date(2018, 8, 28).getTime(),
        ],
      ]);
      testDateFilter('<=2018-09-27', [
        [FilterType.lessThan, null, new Date(2018, 8, 28).getTime()],
      ]);
      testDateFilter('<2018-09-27', [
        [FilterType.lessThan, null, new Date(2018, 8, 27).getTime()],
      ]);
    });

    it('handles year-month-day hh:mm', () => {
      testDateFilter('2018-09-27 04:20', [
        [
          FilterType.greaterThanOrEqualTo,
          FilterOperator.and,
          new Date(2018, 8, 27, 4, 20).getTime(),
        ],
        [FilterType.lessThan, null, new Date(2018, 8, 27, 4, 21).getTime()],
      ]);
      testDateFilter('>=2018-09-27 04:20', [
        [
          FilterType.greaterThanOrEqualTo,
          null,
          new Date(2018, 8, 27, 4, 20).getTime(),
        ],
      ]);
      testDateFilter('>2018-09-27 04:20', [
        [
          FilterType.greaterThanOrEqualTo,
          null,
          new Date(2018, 8, 27, 4, 21).getTime(),
        ],
      ]);
      testDateFilter('<=2018-09-27 04:20', [
        [FilterType.lessThan, null, new Date(2018, 8, 27, 4, 21).getTime()],
      ]);
      testDateFilter('<2018-09-27 04:20', [
        [FilterType.lessThan, null, new Date(2018, 8, 27, 4, 20).getTime()],
      ]);
    });

    it('handles year-month-day hh:mm:ss', () => {
      testDateFilter('2018-09-27 04:20:35', [
        [
          FilterType.greaterThanOrEqualTo,
          FilterOperator.and,
          new Date(2018, 8, 27, 4, 20, 35).getTime(),
        ],
        [FilterType.lessThan, null, new Date(2018, 8, 27, 4, 20, 36).getTime()],
      ]);
      testDateFilter('>=2018-09-27 04:20:35', [
        [
          FilterType.greaterThanOrEqualTo,
          null,
          new Date(2018, 8, 27, 4, 20, 35).getTime(),
        ],
      ]);
      testDateFilter('>2018-09-27 04:20:35', [
        [
          FilterType.greaterThanOrEqualTo,
          null,
          new Date(2018, 8, 27, 4, 20, 36).getTime(),
        ],
      ]);
      testDateFilter('<=2018-09-27 04:20:35', [
        [FilterType.lessThan, null, new Date(2018, 8, 27, 4, 20, 36).getTime()],
      ]);
      testDateFilter('<2018-09-27 04:20:35', [
        [FilterType.lessThan, null, new Date(2018, 8, 27, 4, 20, 35).getTime()],
      ]);
    });

    it('handles year-month-day hh:mm:ss.SSS', () => {
      testDateFilter('2018-09-27 04:20:35.123', [
        [
          FilterType.greaterThanOrEqualTo,
          FilterOperator.and,
          new Date(2018, 8, 27, 4, 20, 35, 123).getTime(),
        ],
        [
          FilterType.lessThan,
          null,
          new Date(2018, 8, 27, 4, 20, 35, 124).getTime(),
        ],
      ]);
      testDateFilter('>=2018-09-27 04:20:35.123', [
        [
          FilterType.greaterThanOrEqualTo,
          null,
          new Date(2018, 8, 27, 4, 20, 35, 123).getTime(),
        ],
      ]);
      testDateFilter('>2018-09-27 04:20:35.123', [
        [
          FilterType.greaterThanOrEqualTo,
          null,
          new Date(2018, 8, 27, 4, 20, 35, 124).getTime(),
        ],
      ]);
      testDateFilter('<=2018-09-27 04:20:35.123', [
        [
          FilterType.lessThan,
          null,
          new Date(2018, 8, 27, 4, 20, 35, 124).getTime(),
        ],
      ]);
      testDateFilter('<2018-09-27 04:20:35.123', [
        [
          FilterType.lessThan,
          null,
          new Date(2018, 8, 27, 4, 20, 35, 123).getTime(),
        ],
      ]);
    });

    it('handles micros year-month-day hh:mm:ss.SSSSSS', () => {
      // Since our mock can only handle to millis, check that the parse function is called with the right values
      const mock = jest.fn(
        (_format, dateString) =>
          (Date.parse(dateString) as unknown) as DateWrapper
      );

      dh.i18n.DateTimeFormat.parse = mock;
      testDateFilter('2018-09-27 04:20:35.123456', [
        [
          FilterType.greaterThanOrEqualTo,
          FilterOperator.and,
          new Date(2018, 8, 27, 4, 20, 35, 123).getTime(),
        ],
        [
          FilterType.lessThan,
          null,
          new Date(2018, 8, 27, 4, 20, 35, 123).getTime(),
        ],
      ]);
      expect(dh.i18n.DateTimeFormat.parse).nthCalledWith(
        1,
        DateUtils.FULL_DATE_FORMAT,
        '2018-09-27 04:20:35.123456000',
        EXPECT_TIME_ZONE_PARAM
      );
      expect(dh.i18n.DateTimeFormat.parse).nthCalledWith(
        2,
        DateUtils.FULL_DATE_FORMAT,
        '2018-09-27 04:20:35.123457000',
        EXPECT_TIME_ZONE_PARAM
      );
      mock.mockClear();

      testDateFilter('>=2018-09-27 04:20:35.123456', [
        [
          FilterType.greaterThanOrEqualTo,
          null,
          new Date(2018, 8, 27, 4, 20, 35, 123).getTime(),
        ],
      ]);
      expect(dh.i18n.DateTimeFormat.parse).nthCalledWith(
        1,
        DateUtils.FULL_DATE_FORMAT,
        '2018-09-27 04:20:35.123456000',
        EXPECT_TIME_ZONE_PARAM
      );
      expect(dh.i18n.DateTimeFormat.parse).nthCalledWith(
        2,
        DateUtils.FULL_DATE_FORMAT,
        '2018-09-27 04:20:35.123457000',
        EXPECT_TIME_ZONE_PARAM
      );
      mock.mockClear();

      testDateFilter('>2018-09-27 04:20:35.123456', [
        [
          FilterType.greaterThanOrEqualTo,
          null,
          new Date(2018, 8, 27, 4, 20, 35, 123).getTime(),
        ],
      ]);
      expect(dh.i18n.DateTimeFormat.parse).nthCalledWith(
        1,
        DateUtils.FULL_DATE_FORMAT,
        '2018-09-27 04:20:35.123456000',
        EXPECT_TIME_ZONE_PARAM
      );
      expect(dh.i18n.DateTimeFormat.parse).nthCalledWith(
        2,
        DateUtils.FULL_DATE_FORMAT,
        '2018-09-27 04:20:35.123457000',
        EXPECT_TIME_ZONE_PARAM
      );
      mock.mockClear();

      testDateFilter('<=2018-09-27 04:20:35.123456', [
        [
          FilterType.lessThan,
          null,
          new Date(2018, 8, 27, 4, 20, 35, 123).getTime(),
        ],
      ]);
      expect(dh.i18n.DateTimeFormat.parse).nthCalledWith(
        1,
        DateUtils.FULL_DATE_FORMAT,
        '2018-09-27 04:20:35.123456000',
        EXPECT_TIME_ZONE_PARAM
      );
      expect(dh.i18n.DateTimeFormat.parse).nthCalledWith(
        2,
        DateUtils.FULL_DATE_FORMAT,
        '2018-09-27 04:20:35.123457000',
        EXPECT_TIME_ZONE_PARAM
      );
      mock.mockClear();

      testDateFilter('<2018-09-27 04:20:35.123456', [
        [
          FilterType.lessThan,
          null,
          new Date(2018, 8, 27, 4, 20, 35, 123).getTime(),
        ],
      ]);
      expect(dh.i18n.DateTimeFormat.parse).nthCalledWith(
        1,
        DateUtils.FULL_DATE_FORMAT,
        '2018-09-27 04:20:35.123456000',
        EXPECT_TIME_ZONE_PARAM
      );
      expect(dh.i18n.DateTimeFormat.parse).nthCalledWith(
        2,
        DateUtils.FULL_DATE_FORMAT,
        '2018-09-27 04:20:35.123457000',
        EXPECT_TIME_ZONE_PARAM
      );
      mock.mockClear();
    });

    it('handles nanos year-month-day hh:mm:ss.SSSSSSSSS', () => {
      const mock = jest.fn(
        (_format, dateString) =>
          (Date.parse(dateString) as unknown) as DateWrapper
      );
      // Since our mock can only handle to millis, check that the parse function is called with the right values
      dh.i18n.DateTimeFormat.parse = mock;
      testDateFilter('2018-09-27 04:20:35.123456789', [
        [FilterType.eq, null, new Date(2018, 8, 27, 4, 20, 35, 123).getTime()],
      ]);
      expect(dh.i18n.DateTimeFormat.parse).toHaveBeenCalledWith(
        DateUtils.FULL_DATE_FORMAT,
        '2018-09-27 04:20:35.123456789',
        EXPECT_TIME_ZONE_PARAM
      );
      mock.mockClear();

      testDateFilter('>=2018-09-27 04:20:35.123456789', [
        [
          FilterType.greaterThanOrEqualTo,
          null,
          new Date(2018, 8, 27, 4, 20, 35, 123).getTime(),
        ],
      ]);
      expect(dh.i18n.DateTimeFormat.parse).toHaveBeenCalledWith(
        DateUtils.FULL_DATE_FORMAT,
        '2018-09-27 04:20:35.123456789',
        EXPECT_TIME_ZONE_PARAM
      );
      mock.mockClear();

      testDateFilter('>2018-09-27 04:20:35.123456789', [
        [
          FilterType.greaterThan,
          null,
          new Date(2018, 8, 27, 4, 20, 35, 123).getTime(),
        ],
      ]);
      expect(dh.i18n.DateTimeFormat.parse).toHaveBeenCalledWith(
        DateUtils.FULL_DATE_FORMAT,
        '2018-09-27 04:20:35.123456789',
        EXPECT_TIME_ZONE_PARAM
      );
      mock.mockClear();

      testDateFilter('<=2018-09-27 04:20:35.123456789', [
        [
          FilterType.lessThanOrEqualTo,
          null,
          new Date(2018, 8, 27, 4, 20, 35, 123).getTime(),
        ],
      ]);
      expect(dh.i18n.DateTimeFormat.parse).toHaveBeenCalledWith(
        DateUtils.FULL_DATE_FORMAT,
        '2018-09-27 04:20:35.123456789',
        EXPECT_TIME_ZONE_PARAM
      );
      mock.mockClear();

      testDateFilter('<2018-09-27 04:20:35.123456789', [
        [
          FilterType.lessThan,
          null,
          new Date(2018, 8, 27, 4, 20, 35, 123).getTime(),
        ],
      ]);
      expect(dh.i18n.DateTimeFormat.parse).toHaveBeenCalledWith(
        DateUtils.FULL_DATE_FORMAT,
        '2018-09-27 04:20:35.123456789',
        EXPECT_TIME_ZONE_PARAM
      );
      mock.mockClear();
    });

    it('handles different delimiters', () => {
      testDateFilter('<2018/09/27', [
        [FilterType.lessThan, null, new Date(2018, 8, 27).getTime()],
      ]);
      testDateFilter('<2018.09.27', [
        [FilterType.lessThan, null, new Date(2018, 8, 27).getTime()],
      ]);
    });

    it('handles overflows', () => {
      const mock = jest.fn(
        (_format, dateString) =>
          (Date.parse(dateString) as unknown) as DateWrapper
      );
      // Since our mock can only handle to millis, check that the parse function is called with the right values
      dh.i18n.DateTimeFormat.parse = mock;
      testDateFilter('2018-09-27 04:20:35.99999999', [
        [
          FilterType.greaterThanOrEqualTo,
          FilterOperator.and,
          new Date(2018, 8, 27, 4, 20, 35, 999).getTime(),
        ],
        [FilterType.lessThan, null, new Date(2018, 8, 27, 4, 20, 36).getTime()],
      ]);
      expect(dh.i18n.DateTimeFormat.parse).nthCalledWith(
        1,
        DateUtils.FULL_DATE_FORMAT,
        '2018-09-27 04:20:35.999999990',
        EXPECT_TIME_ZONE_PARAM
      );
      expect(dh.i18n.DateTimeFormat.parse).nthCalledWith(
        2,
        DateUtils.FULL_DATE_FORMAT,
        '2018-09-27 04:20:36.000000000',
        EXPECT_TIME_ZONE_PARAM
      );
      mock.mockClear();

      testDateFilter('2018-12-31 23:59:59.99999999', [
        [
          FilterType.greaterThanOrEqualTo,
          FilterOperator.and,
          new Date(2018, 11, 31, 23, 59, 59, 999).getTime(),
        ],
        [FilterType.lessThan, null, new Date(2019, 0, 1).getTime()],
      ]);
      expect(dh.i18n.DateTimeFormat.parse).nthCalledWith(
        1,
        DateUtils.FULL_DATE_FORMAT,
        '2018-12-31 23:59:59.999999990',
        EXPECT_TIME_ZONE_PARAM
      );
      expect(dh.i18n.DateTimeFormat.parse).nthCalledWith(
        2,
        DateUtils.FULL_DATE_FORMAT,
        '2019-01-01 00:00:00.000000000',
        EXPECT_TIME_ZONE_PARAM
      );
      mock.mockClear();
    });

    it('handles different delimiters', () => {
      testDateFilter('<2018/09/27', [
        [FilterType.lessThan, null, new Date(2018, 8, 27).getTime()],
      ]);
      testDateFilter('<2018.09.27', [
        [FilterType.lessThan, null, new Date(2018, 8, 27).getTime()],
      ]);
    });

    it('handles date keywords', () => {
      const now = new Date(2018, 8, 25, 4, 20, 9, 52).getTime();
      const originalNow = Date.now;
      Date.now = jest.fn(() => now);

      testDateFilter('today', [
        [
          FilterType.greaterThanOrEqualTo,
          FilterOperator.and,
          new Date(2018, 8, 25).getTime(),
        ],
        [FilterType.lessThan, null, new Date(2018, 8, 26).getTime()],
      ]);

      testDateFilter('yesterday', [
        [
          FilterType.greaterThanOrEqualTo,
          FilterOperator.and,
          new Date(2018, 8, 24).getTime(),
        ],
        [FilterType.lessThan, null, new Date(2018, 8, 25).getTime()],
      ]);

      testDateFilter('now', [[FilterType.eq, null, now]]);

      Date.now = originalNow;
    });
    it('handles null and not null date', () => {
      testDateFilter('null', [[FilterType.isNull]]);
      testDateFilter('=null', [[FilterType.isNull]]);
      testDateFilter('= null', [[FilterType.isNull]]);
      testDateFilter('!= null', [[FilterType.isNull, FilterOperator.not]]);
      testDateFilter('! null', [[FilterType.isNull, FilterOperator.not]]);
    });
  });

  describe('quick text filters', () => {
    function testTextFilter(text, expectedFn, ...args) {
      testFilter('makeQuickTextFilter', text, expectedFn, ...args);
    }

    function testInvokeFilter(text, ...args) {
      const column = makeFilterColumn();
      const filter = column.filter() as MockFilter;

      const nullResult = makeFilterCondition();
      const notResult = makeFilterCondition();
      const invokeResult = makeFilterCondition();
      const expectedResult = makeFilterCondition();

      filter.isNull.mockReturnValueOnce(nullResult);

      nullResult.not.mockReturnValueOnce(notResult);

      filter.invoke.mockReturnValueOnce(invokeResult);

      notResult.and.mockReturnValueOnce(expectedResult);

      const result = TableUtils.makeQuickTextFilter(column, text);

      expect(filter.isNull).toHaveBeenCalled();
      expect(nullResult.not).toHaveBeenCalled();
      expect(notResult.and).toHaveBeenCalledWith(invokeResult);

      expect(filter.invoke).toHaveBeenCalledWith(...args);
      expect(result).toBe(expectedResult);
    }

    it('handles empty cases', () => {
      const column = makeFilterColumn();

      expect(TableUtils.makeQuickTextFilter(column, '')).toBe(null);
    });

    it('handles null cases', () => {
      testTextFilter('null', FilterType.isNull);
      testTextFilter('    null   \n   ', FilterType.isNull);
      testTextFilter('  NuLl   \n', FilterType.isNull);
      testTextFilter('=null', FilterType.isNull);
    });

    it('handles in/starts with/ends with null cases', () => {
      testInvokeFilter('~null', 'matches', '(?s)(?i).*\\Qnull\\E.*');
      testInvokeFilter('null*', 'matches', '(?s)(?i)^\\Qnull\\E.*');
      testInvokeFilter('=null*', 'matches', '(?s)(?i)^\\Qnull\\E.*');
      testInvokeFilter('*null', 'matches', '(?s)(?i).*\\Qnull\\E$');
      testInvokeFilter('=*null', 'matches', '(?s)(?i).*\\Qnull\\E$');
    });

    it('handles not null cases', () => {
      const column = makeFilterColumn();
      const filter = column.filter() as MockFilter;

      const expectedNullFilter = makeFilterCondition();
      filter.isNull.mockReturnValueOnce(expectedNullFilter);

      const expectedNotFilter = makeFilterCondition();
      expectedNullFilter.not.mockReturnValueOnce(expectedNotFilter);

      const result = TableUtils.makeQuickTextFilter(column, '!null');
      expect(filter.isNull).toHaveBeenCalled();
      expect(expectedNullFilter.not).toHaveBeenCalled();
      expect(result).toBe(expectedNotFilter);
    });

    it('handles escaped null', () => {
      testTextFilter('\\null', FilterType.eqIgnoreCase, 'null');
      testTextFilter('    \\null   \n   ', FilterType.eqIgnoreCase, 'null');
      testTextFilter('  \\NuLl   \n', FilterType.eqIgnoreCase, 'null');
      testTextFilter('=\\null', FilterType.eqIgnoreCase, 'null');
    });

    it('handles equals cases', () => {
      testTextFilter('foo', FilterType.eqIgnoreCase, 'foo');
      testTextFilter('=foo', FilterType.eqIgnoreCase, 'foo');
    });

    it('handles in cases', () => {
      testInvokeFilter('~foo', 'matches', '(?s)(?i).*\\Qfoo\\E.*');
    });

    it('handles starts with cases', () => {
      testInvokeFilter('=foo*', 'matches', '(?s)(?i)^\\Qfoo\\E.*');
      testInvokeFilter('foo*', 'matches', '(?s)(?i)^\\Qfoo\\E.*');
    });

    it('handles escaping starts with cases', () => {
      testTextFilter('foo\\*', FilterType.eqIgnoreCase, 'foo*');
      testTextFilter('=foo\\*', FilterType.eqIgnoreCase, 'foo*');
    });

    it('handles ends with cases', () => {
      testInvokeFilter('=*foo', 'matches', '(?s)(?i).*\\Qfoo\\E$');
      testInvokeFilter('*foo', 'matches', '(?s)(?i).*\\Qfoo\\E$');
    });

    it('handles escaping ends with cases', () => {
      testTextFilter('\\*foo', FilterType.eqIgnoreCase, '*foo');
      testTextFilter('=\\*foo', FilterType.eqIgnoreCase, '*foo');
    });
  });

  describe('multiple conditionals', () => {
    it('handles && multi filter case', () => {
      testMultiFilter(
        'int',
        'makeQuickFilter',
        '>10 && <20',
        'America/New_York',
        [
          [FilterType.greaterThan, FilterOperator.and, 10],
          [FilterType.lessThan, null, 20],
        ]
      );
    });

    it('handles || multi filter case', () => {
      testMultiFilter(
        'int',
        'makeQuickFilter',
        '>30 || <20',
        'America/New_York',
        [
          [FilterType.greaterThan, FilterOperator.or, 30],
          [FilterType.lessThan, null, 20],
        ]
      );
    });

    it('handles && and || case', () => {
      testMultiFilter(
        'int',
        'makeQuickFilter',
        '>10 && < 20 || =50',
        'America/New_York',
        [
          [FilterType.greaterThan, FilterOperator.and, 10],
          [FilterType.lessThan, FilterOperator.or, 20],
          [FilterType.eq, null, 50],
        ]
      );
    });

    it('throws an error if filter for andComponent is null', () => {
      const column = makeFilterColumn('char');
      expect(() =>
        TableUtils.makeQuickFilter(column, '12a && 13 || 12')
      ).toThrowError('Unable to parse quick filter from text 12a && 13 || 12');
    });
  });

  describe('quick char filters', () => {
    function testCharFilter(text, expectedFn, ...args) {
      testFilter('makeQuickCharFilter', text, expectedFn, ...args);
    }

    it('handles default operation', () => {
      testCharFilter('c', FilterType.eq, 'c');
    });

    it('handles empty cases', () => {
      const column = makeFilterColumn();

      expect(TableUtils.makeQuickCharFilter(column, '')).toBe(null);
    });

    it('handles invalid cases', () => {
      const column = makeFilterColumn();

      expect(TableUtils.makeQuickCharFilter(column, 'j*($%U#@(')).toBe(null);
      expect(TableUtils.makeQuickCharFilter(column, '<=')).toBe(null);
      expect(TableUtils.makeQuickCharFilter(column, '<=> c')).toBe(null);
      expect(TableUtils.makeQuickCharFilter(column, '== c')).toBe(null);
      expect(TableUtils.makeQuickCharFilter(column, 'c>')).toBe(null);
    });

    it('handles default operation', () => {
      testCharFilter('d', FilterType.eq, 'd');
      testCharFilter('F', FilterType.eq, 'F');
    });

    it('handles shorthand operations', () => {
      testCharFilter('=c', FilterType.eq, 'c');
      testCharFilter('!=c', FilterType.notEq, 'c');
      testCharFilter('!c', FilterType.notEq, 'c');
    });

    it('handles range operations', () => {
      testCharFilter('>c', FilterType.greaterThan, '"c"');
      testCharFilter('>=c', FilterType.greaterThanOrEqualTo, '"c"');
      testCharFilter('=>c', FilterType.greaterThanOrEqualTo, '"c"');
      testCharFilter('<c', FilterType.lessThan, '"c"');
      testCharFilter('<=c', FilterType.lessThanOrEqualTo, '"c"');
      testCharFilter('=<c', FilterType.lessThanOrEqualTo, '"c"');
    });

    it('handles values that are already quoted', () => {
      testCharFilter('"c"', FilterType.eq, '"c"');
      testCharFilter("'c'", FilterType.eq, "'c'");
    });

    it('handles null', () => {
      testCharFilter('null', FilterType.isNull);
    });
  });

  describe('makeSelectValueFilter', () => {
    const testNoSelectedItems = (type: string, expectedValue: unknown) => {
      const column = makeFilterColumn(type);
      const filter = column.filter();

      const eqResult = makeFilterCondition();
      const notEqResult = makeFilterCondition();
      const expectedResult = makeFilterCondition();

      filter.eq.mockReturnValueOnce(eqResult);
      filter.notEq.mockReturnValueOnce(notEqResult);
      eqResult.and.mockReturnValueOnce(expectedResult);

      expect(TableUtils.makeSelectValueFilter(column, [], false)).toBe(
        expectedResult
      );
      expect(filter.eq).toHaveBeenCalledWith(expectedValue);
      expect(filter.notEq).toHaveBeenCalledWith(expectedValue);
      expect(eqResult.and).toHaveBeenCalledWith(notEqResult);
    };

    it('should return null if there are no selected values and invertSelection is true', () => {
      const column = makeFilterColumn();

      expect(TableUtils.makeSelectValueFilter(column, [], true)).toBeNull();
    });

    it('handles different column types when there are no selected values and invertSelection is false', () => {
      testNoSelectedItems('java.lang.String', 'a');
      testNoSelectedItems('boolean', true);
      testNoSelectedItems(
        'io.deephaven.db.tables.utils.DBDateTime',
        expect.any(Number)
      );
      testNoSelectedItems('int', 0);
    });

    it('handles non-empty selected values with null values and invertSelection is true', () => {
      const column = makeFilterColumn('java.lang.String');
      const filter = column.filter();

      const isNullResult = makeFilterCondition();
      const notResult = makeFilterCondition();
      const notInResult = makeFilterCondition();
      const expectedResult = makeFilterCondition();

      filter.notIn.mockReturnValueOnce(notInResult);
      filter.isNull.mockReturnValueOnce(isNullResult);
      isNullResult.not.mockReturnValueOnce(notResult);
      notResult.and.mockReturnValueOnce(expectedResult);
      expect(
        TableUtils.makeSelectValueFilter(column, [null, 'string'], true)
      ).toBe(expectedResult);
      expect(filter.notIn).toHaveBeenCalledWith(['string']);
      expect(notResult.and).toHaveBeenCalledWith(notInResult);
    });

    it('handles non-empty selected values with null values and invertSelection is false', () => {
      const column = makeFilterColumn('boolean');
      const filter = column.filter();

      const isNullResult = makeFilterCondition();
      const inResult = makeFilterCondition();
      const expectedResult = makeFilterCondition();

      filter.isNull.mockReturnValueOnce(isNullResult);
      filter.in.mockReturnValueOnce(inResult);
      isNullResult.or.mockReturnValueOnce(expectedResult);
      expect(
        TableUtils.makeSelectValueFilter(column, [null, true, false], false)
      ).toBe(expectedResult);
      expect(filter.in).toHaveBeenCalledWith([true, false]);
      expect(isNullResult.or).toHaveBeenCalledWith(inResult);
    });

    it('handles all null values as selected values and invertSelection true', () => {
      const column = makeFilterColumn('boolean');
      const filter = column.filter();

      const isNullResult = makeFilterCondition();
      const expectedResult = makeFilterCondition();

      filter.isNull.mockReturnValueOnce(isNullResult);
      isNullResult.not.mockReturnValueOnce(expectedResult);
      expect(
        TableUtils.makeSelectValueFilter(column, [null, null, null], true)
      ).toBe(expectedResult);
    });

    it('handles all null values as selected values and invertSelection false', () => {
      const column = makeFilterColumn('boolean');
      const filter = column.filter();

      const isNullResult = makeFilterCondition();

      filter.isNull.mockReturnValueOnce(isNullResult);
      expect(
        TableUtils.makeSelectValueFilter(column, [null, null, null], false)
      ).toBe(isNullResult);
    });

    it('handles non-empty selected values but no null values and invertSelection is true', () => {
      const column = makeFilterColumn('int');
      const filter = column.filter();

      const expectedResult = makeFilterCondition();

      filter.notIn.mockReturnValueOnce(expectedResult);
      expect(TableUtils.makeSelectValueFilter(column, [1, 2, 3], true)).toBe(
        expectedResult
      );
      expect(filter.notIn).toHaveBeenCalledWith([1, 2, 3]);
    });

    it('handles non-empty selected values but no null values and invertSelection is false', () => {
      const column = makeFilterColumn('int');
      const filter = column.filter();

      const expectedResult = makeFilterCondition();

      filter.in.mockReturnValueOnce(expectedResult);
      expect(TableUtils.makeSelectValueFilter(column, [1, 2, 3], false)).toBe(
        expectedResult
      );
      expect(filter.in).toHaveBeenCalledWith([1, 2, 3]);
    });
  });
});

describe('makeCancelableTableEventPromise', () => {
  const DEFAULT_EVENT = 'DEFAULT_EVENT';
  const DEFAULT_TABLE = {
    removeEventListener: jest.fn(),
    addEventListener: jest.fn(() => DEFAULT_TABLE.removeEventListener),
  };
  function makeCancelableTableEventPromise(
    table = DEFAULT_TABLE,
    event = DEFAULT_EVENT,
    timeout = 0,
    matcher = null
  ) {
    const promise = TableUtils.makeCancelableTableEventPromise(
      table,
      event,
      timeout,
      matcher
    );
    promise.catch(() => null);
    return promise;
  }
  beforeAll(() => {
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.useRealTimers();
  });
  afterEach(() => {
    jest.clearAllTimers();
    DEFAULT_TABLE.removeEventListener.mockClear();
  });

  it('Subscribes to a given event, returns a cancelable promise', () => {
    const cancelablePromise = makeCancelableTableEventPromise();
    expect(DEFAULT_TABLE.addEventListener).toHaveBeenCalled();
    expect(cancelablePromise).toBeInstanceOf(Promise);
    expect(cancelablePromise).toHaveProperty('cancel');
  });
  it('Multiple cancel calls clean up subscription only once', () => {
    const cancelablePromise = makeCancelableTableEventPromise();
    cancelablePromise.cancel();
    cancelablePromise.cancel();
    expect(DEFAULT_TABLE.removeEventListener).toHaveBeenCalledTimes(1);
  });
  it('Timeout rejects promise and cleans up subscription', () => {
    const cancelablePromise = makeCancelableTableEventPromise();
    jest.runOnlyPendingTimers();
    expect.assertions(2);
    expect(DEFAULT_TABLE.removeEventListener).toHaveBeenCalledTimes(1);
    expect(cancelablePromise).rejects.not.toBeNull();
  });
  it('Cancel after timeout cleans up subscription only once', () => {
    const cancelablePromise = makeCancelableTableEventPromise();
    jest.runOnlyPendingTimers();
    cancelablePromise.cancel();
    expect(DEFAULT_TABLE.removeEventListener).toHaveBeenCalledTimes(1);
  });
});

describe('converts filter type to appropriate string value for quick filters', () => {
  function testFilterType(filterType: FilterTypeValue, expectedResult: string) {
    expect(TableUtils.getFilterOperatorString(filterType)).toBe(expectedResult);
  }
  function testFilterTypeThrows(filterType: FilterTypeValue) {
    expect(() => TableUtils.getFilterOperatorString(filterType)).toThrow();
  }
  it('handles valid options correctly', () => {
    testFilterType(FilterType.eq, '=');
    testFilterType(FilterType.notEq, '!=');
    testFilterType(FilterType.greaterThan, '>');
    testFilterType(FilterType.greaterThanOrEqualTo, '>=');
    testFilterType(FilterType.lessThan, '<');
    testFilterType(FilterType.lessThanOrEqualTo, '<=');
    testFilterType(FilterType.contains, '~');
    testFilterType(FilterType.notContains, '!~');
  });
  it('throws for types without a shorthand string', () => {
    testFilterTypeThrows(FilterType.eqIgnoreCase);
    testFilterTypeThrows(FilterType.notEqIgnoreCase);
    testFilterTypeThrows(FilterType.startsWith);
    testFilterTypeThrows(FilterType.endsWith);
    testFilterTypeThrows(FilterType.in);
    testFilterTypeThrows(FilterType.inIgnoreCase);
    testFilterTypeThrows(FilterType.notIn);
    testFilterTypeThrows(FilterType.notInIgnoreCase);
    testFilterTypeThrows(FilterType.isTrue);
    testFilterTypeThrows(FilterType.isFalse);
    testFilterTypeThrows(FilterType.isNull);
    testFilterTypeThrows(FilterType.invoke);
    testFilterTypeThrows(FilterType.containsAny);
  });
});

describe('quote values', () => {
  function testQuoteValue(value: string, expectedValue: string) {
    expect(TableUtils.quoteValue(value)).toBe(expectedValue);
  }
  it('quotes unquoted values properly', () => {
    testQuoteValue('', '""');
    testQuoteValue('c', '"c"');
    testQuoteValue('hello', '"hello"');
  });
  it('does not add quotes if already quoted', () => {
    testQuoteValue('"c"', '"c"');
    testQuoteValue("'c'", "'c'");
    testQuoteValue("''", "''");
    testQuoteValue('""', '""');
    testQuoteValue('"hello"', '"hello"');
  });
});

describe('range operations', () => {
  function testIsRangeOperation(operation: string, expectedResult = true) {
    expect(TableUtils.isRangeOperation(operation)).toBe(expectedResult);
  }

  it('returns true for range operations', () => {
    testIsRangeOperation('<');
    testIsRangeOperation('<=');
    testIsRangeOperation('=<');
    testIsRangeOperation('>');
    testIsRangeOperation('>=');
    testIsRangeOperation('=>');
  });

  it('returns false for other operations', () => {
    testIsRangeOperation('!', false);
    testIsRangeOperation('!=', false);
    testIsRangeOperation('=', false);
    testIsRangeOperation('', false);
    testIsRangeOperation('!~', false);
    testIsRangeOperation('~', false);
  });
});

describe('Sorting', () => {
  function mockSort(index: number): Sort {
    return ({
      column: { index, name: `name_${index}` },
    } as unknown) as Sort;
  }

  const sortList = {
    empty: [] as Sort[],
    hasThree: [mockSort(333), mockSort(444), mockSort(999)],
  };

  describe('getSortIndex', () => {
    // sort, columnName, expected
    const testCases: [Sort[], ColumnName, number | null][] = [
      [sortList.empty, 'name_999', null],
      [sortList.hasThree, 'non-existing', null],
      [sortList.hasThree, 'name_999', 2],
    ];

    it.each(testCases)(
      'should return index of sort for matching column name: %s, %s',
      (sort, columnName, expected) => {
        expect(TableUtils.getSortIndex(sort, columnName)).toEqual(expected);
      }
    );
  });

  describe('getSortForColumn', () => {
    // sort, columnName, expected
    const testCases: [Sort[], ColumnName, Sort | null][] = [
      [sortList.empty, 'name_999', null],
      [sortList.hasThree, 'non-existing', null],
      [sortList.hasThree, 'name_999', sortList.hasThree[2]],
    ];

    it.each(testCases)(
      'should return sort for matching column name: %s, %s',
      (sort, columnName, expected) => {
        expect(TableUtils.getSortForColumn(sort, columnName)).toEqual(expected);
      }
    );
  });
});

describe('isTreeTable', () => {
  it('should return true if table is a TreeTable', () => {
    const table: TreeTable = ({
      expand: jest.fn(),
      collapse: jest.fn(),
    } as unknown) as TreeTable;

    expect(TableUtils.isTreeTable(table)).toBe(true);
  });

  it('should return false if table is not a TreeTable', () => {
    const table = null;
    expect(TableUtils.isTreeTable(table)).toBe(false);
  });
});

describe('makeNumberValue', () => {
  it('should return null if text is "null" or ""', () => {
    expect(TableUtils.makeNumberValue('null')).toBeNull();
    expect(TableUtils.makeNumberValue('')).toBeNull();
  });

  it('should return positive infinity if text is ∞, infinity, or inf', () => {
    expect(TableUtils.makeNumberValue('∞')).toBe(Number.POSITIVE_INFINITY);
    expect(TableUtils.makeNumberValue('infinity')).toBe(
      Number.POSITIVE_INFINITY
    );
    expect(TableUtils.makeNumberValue('inf')).toBe(Number.POSITIVE_INFINITY);
  });

  it('should return positive infinity if text is -∞, -infinity, or -inf', () => {
    expect(TableUtils.makeNumberValue('-∞')).toBe(Number.NEGATIVE_INFINITY);
    expect(TableUtils.makeNumberValue('-infinity')).toBe(
      Number.NEGATIVE_INFINITY
    );
    expect(TableUtils.makeNumberValue('-inf')).toBe(Number.NEGATIVE_INFINITY);
  });

  it('should return a number if text is a number', () => {
    expect(TableUtils.makeNumberValue('123')).toBe(123);
  });

  it('should throw an error if the text is not a number of any of the special values', () => {
    expect(() => TableUtils.makeNumberValue('test')).toThrowError(
      `Invalid number 'test'`
    );
  });
});

describe('makeBooleanValue', () => {
  const testMakeBooleanValue = (
    text: string,
    expectedValue: boolean | null,
    allowEmpty = false
  ) => {
    expect(TableUtils.makeBooleanValue(text, allowEmpty)).toBe(expectedValue);
  };

  it('should return null if text is empty and allowEmpty is true', () => {
    testMakeBooleanValue('', null, true);
  });

  it('should return null if text is "null"', () => {
    testMakeBooleanValue('null', null);
  });

  it('shouhld return false for different variations of false', () => {
    testMakeBooleanValue('0', false);
    testMakeBooleanValue('f', false);
    testMakeBooleanValue('fa', false);
    testMakeBooleanValue('fal', false);
    testMakeBooleanValue('fals', false);
    testMakeBooleanValue('false', false);
    testMakeBooleanValue('n', false);
    testMakeBooleanValue('no', false);
  });

  it('should return false for different variations of false', () => {
    testMakeBooleanValue('1', true);
    testMakeBooleanValue('t', true);
    testMakeBooleanValue('tr', true);
    testMakeBooleanValue('tru', true);
    testMakeBooleanValue('true', true);
    testMakeBooleanValue('y', true);
    testMakeBooleanValue('ye', true);
    testMakeBooleanValue('yes', true);
  });

  it('should throw an error if text is not one of the above listed values', () => {
    expect(() => TableUtils.makeBooleanValue('test')).toThrowError(
      `Invalid boolean 'test'`
    );
  });
});

describe('makeValue', () => {
  const testMakeValue = (
    columnType: string,
    text: string,
    expectedValue: unknown,
    timeZone = 'America/New_York'
  ) => {
    expect(TableUtils.makeValue(columnType, text, timeZone)).toEqual(
      expectedValue
    );
  };
  it('should return null if text is "null"', () => {
    testMakeValue('decimal', 'null', null);
  });

  it('should return text if columnType is string or char', () => {
    testMakeValue('char', 'test', 'test');
    testMakeValue('java.lang.Character', 'test', 'test');
    testMakeValue('java.lang.String', 'test', 'test');
  });

  it('should return a LongWrapper if columnType is long', () => {
    const expectedLongWrapper = {
      asNumber: expect.any(Function),
      valueOf: expect.any(Function),
      toString: expect.any(Function),
      ofString: expect.any(Function),
    };
    dh.LongWrapper = {
      asNumber: jest.fn(),
      valueOf: jest.fn(),
      toString: jest.fn(),
      ofString: jest.fn(
        (str: string): LongWrapper => ({
          asNumber: jest.fn(),
          valueOf: jest.fn(),
          toString: jest.fn(),
          ofString: jest.fn(),
        })
      ),
    };
    expect(
      TableUtils.makeValue('long', 'test', 'America/New_York')
    ).toMatchObject(expectedLongWrapper);
    expect(
      TableUtils.makeValue('java.lang.Long', 'test', 'America/New_York')
    ).toMatchObject(expectedLongWrapper);
  });

  it('should return a boolean value if columnType is boolean', () => {
    testMakeValue('boolean', '', null);
    testMakeValue('java.lang.Boolean', 'null', null);
    testMakeValue('boolean', 'true', true);
    testMakeValue('boolean', 'false', false);
  });

  it('should return a DateWrapper object if columnType is date', () => {
    const now = new Date(Date.now());
    const currentDate = DateUtils.makeDateWrapper(
      'America/New_York',
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const yesterdayDate = DateUtils.makeDateWrapper(
      'America/New_York',
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1
    );
    testMakeValue(
      'io.deephaven.db.tables.utils.DBDateTime',
      'today',
      currentDate
    );
    testMakeValue('io.deephaven.time.DateTime', 'null', null);
    testMakeValue(
      'com.illumon.iris.db.tables.utils.DBDateTime',
      'yesterday',
      yesterdayDate
    );
  });

  it('should return a number if columnType is number', () => {
    testMakeValue('int', '2', 2);
    testMakeValue('java.lang.Integer', '2', 2);
    testMakeValue('java.math.BigInteger', '2222222222222222', 2222222222222222);
    testMakeValue('short', '32767', 32767);
    testMakeValue('java.lang.Short', '32767', 32767);
    testMakeValue('byte', '127', 127);
    testMakeValue('java.lang.Byte', '127', 127);

    testMakeValue('double', '1.1111111111', 1.1111111111);
    testMakeValue('java.lang.Double', '1.1111111111', 1.1111111111);
    testMakeValue(
      'java.math.BigDecimal',
      '123.11111111111111',
      123.11111111111111
    );
    testMakeValue('float', '1.111111111', 1.111111111);
    testMakeValue('java.lang.Float', '1.111111111', 1.111111111);
  });

  it('returns null if the column type does not match any of the types', () => {
    testMakeValue('invalid_type', 'test', null);
  });
});

describe('getFilterText', () => {
  it('should return the filter text', () => {
    const filter = makeFilterCondition();
    filter.toString = jest.fn(() => 'text');
    expect(TableUtils.getFilterText(filter as FilterCondition)).toBe('text');
  });

  it('should return null if filter is null', () => {
    expect(TableUtils.getFilterText()).toBeNull();
    expect(TableUtils.getFilterText(null)).toBeNull();
  });
});

describe('getFilterTypes', () => {
  const testGetFilterTypes = (
    columnTypes: string[],
    expectedArray: FilterTypeValue[]
  ) => {
    columnTypes.forEach(element => {
      expect(TableUtils.getFilterTypes(element)).toEqual(expectedArray);
    });
  };

  it('should return the valid filter types for boolean column type', () => {
    const columnTypes = ['boolean', 'java.lang.Boolean'];
    testGetFilterTypes(columnTypes, ['isTrue', 'isFalse', 'isNull']);
  });

  it('should return the valid filter types for char, number, or date column type', () => {
    const columnTypes = [
      'char',
      'java.lang.Character',
      'int',
      'java.lang.Integer',
      'java.math.BigInteger',
      'long',
      'java.lang.Long',
      'short',
      'java.lang.Short',
      'byte',
      'java.lang.Byte',
      'double',
      'java.lang.Double',
      'java.math.BigDecimal',
      'float',
      'java.lang.Float',
      'io.deephaven.db.tables.utils.DBDateTime',
      'io.deephaven.time.DateTime',
      'com.illumon.iris.db.tables.utils.DBDateTime',
    ];
    const expectedArray: FilterTypeValue[] = [
      'eq',
      'notEq',
      'greaterThan',
      'greaterThanOrEqualTo',
      'lessThan',
      'lessThanOrEqualTo',
    ];
    testGetFilterTypes(columnTypes, expectedArray);
  });

  it('should return the valid filter types for text column type', () => {
    const columnTypes = ['java.lang.String'];
    const expectedArray: FilterTypeValue[] = [
      'eq',
      'eqIgnoreCase',
      'notEq',
      'notEqIgnoreCase',
      'contains',
      'notContains',
      'startsWith',
      'endsWith',
    ];
    testGetFilterTypes(columnTypes, expectedArray);
  });

  it('should return an empty array if the column type is not one of the types listed above', () => {
    testGetFilterTypes(['test'], []);
  });
});

describe('makeColumnSort', () => {
  const testMakeColumnSort = (
    columns: readonly Column[],
    columnIndex: number,
    direction: SortDirection,
    isAbs: boolean,
    expectedValue: Partial<Sort> | null
  ) => {
    expect(
      TableUtils.makeColumnSort(columns, columnIndex, direction, isAbs)
    ).toEqual(expectedValue);
  };

  it('should return null if columnIndex is less than 0, or columnIndex is greater than or equal to columns.length', () => {
    const columns = makeColumns();
    testMakeColumnSort(columns, -1, 'ASC', true, null);
    testMakeColumnSort(columns, 6, 'ASC', true, null);
  });

  it('should return null if direction is null', () => {
    const columns = makeColumns();
    testMakeColumnSort(columns, 0, null, true, null);
  });

  it('should return an ascending sort if direction is ASC', () => {
    const columns = makeColumns();
    const expectedValue: Partial<Sort> = {
      column: columns[0],
      direction: 'ASC',
      isAbs: true,
    };
    testMakeColumnSort(columns, 0, 'ASC', true, expectedValue);
  });

  it('should return an descending sort if direction is DESC', () => {
    const columns = makeColumns();
    const expectedValue: Partial<Sort> = {
      column: columns[1],
      direction: 'DESC',
      isAbs: false,
    };
    testMakeColumnSort(columns, 1, 'DESC', false, expectedValue);
  });

  it('should return the default sort if direction is REVERSE', () => {
    const columns = makeColumns();
    const expectedValue: Partial<Sort> = {
      column: columns[2],
      direction: 'ASC',
      isAbs: true,
    };
    testMakeColumnSort(columns, 2, 'REVERSE', true, expectedValue);
  });
});

describe('sortColumns', () => {
  it('should sort the columns in ascending order based on column name', () => {
    const columns = makeColumns();
    expect(TableUtils.sortColumns(columns, true)).toEqual(columns);
  });

  it('should sort the columns in descending order based on column name', () => {
    const columns = makeColumns();
    const reversed = columns.reverse();

    expect(TableUtils.sortColumns(columns, false)).toEqual(reversed);
  });
});

describe('getNextSort', () => {
  const testGetNextSort = (
    columns: readonly Column[],
    sorts: readonly Sort[],
    columnIndex: number,
    expectedValue
  ) => {
    expect(TableUtils.getNextSort(columns, sorts, columnIndex)).toEqual(
      expectedValue
    );
  };
  it('should return null if columnIndex is out of range', () => {
    const columns = makeColumns();
    testGetNextSort(columns, [], -1, null);
    testGetNextSort(columns, [], 10, null);
  });
});

describe('sortColumn', () => {
  const testSortColumn = (
    sorts: readonly Sort[],
    columns: readonly Column[],
    modelColumn: number,
    direction: SortDirection,
    isAbs: boolean,
    addToExisting: boolean,
    expectedValue
  ) => {
    expect(
      TableUtils.sortColumn(
        sorts,
        columns,
        modelColumn,
        direction,
        isAbs,
        addToExisting
      )
    ).toEqual(expectedValue);
  };

  it('should return an empty array if columnIndex is out of range', () => {
    const columns = makeColumns();
    testSortColumn([], columns, -1, 'ASC', true, true, []);
    testSortColumn([], columns, 10, 'ASC', true, true, []);
  });

  it('applies sort properly', () => {
    const columns = makeColumns();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table: Table = new (dh as any).Table({ columns });
    let tableSorts: Sort[] = [];

    expect(table).not.toBe(null);
    expect(table.sort.length).toBe(0);

    tableSorts = TableUtils.sortColumn(
      tableSorts,
      columns,
      0,
      'ASC',
      true,
      true
    );
    table.applySort(tableSorts);
    expect(table.sort.length).toBe(1);
    expect(table.sort[0].column).toBe(columns[0]);
    expect(table.sort[0].direction).toBe(TableUtils.sortDirection.ascending);
    expect(table.sort[0].isAbs).toBe(true);

    tableSorts = TableUtils.sortColumn(
      tableSorts,
      columns,
      3,
      'ASC',
      false,
      true
    );
    table.applySort(tableSorts);
    expect(table.sort.length).toBe(2);
    expect(table.sort[0].column).toBe(columns[0]);
    expect(table.sort[0].direction).toBe(TableUtils.sortDirection.ascending);
    expect(table.sort[0].isAbs).toBe(true);
    expect(table.sort[1].column).toBe(columns[3]);
    expect(table.sort[1].direction).toBe(TableUtils.sortDirection.ascending);
    expect(table.sort[1].isAbs).toBe(false);

    tableSorts = TableUtils.sortColumn(
      tableSorts,
      columns,
      0,
      'DESC',
      false,
      true
    );
    table.applySort(tableSorts);
    expect(table.sort.length).toBe(2);
    expect(table.sort[0].column).toBe(columns[3]);
    expect(table.sort[0].direction).toBe(TableUtils.sortDirection.ascending);
    expect(table.sort[0].isAbs).toBe(false);
    expect(table.sort[1].column).toBe(columns[0]);
    expect(table.sort[1].direction).toBe(TableUtils.sortDirection.descending);
    expect(table.sort[1].isAbs).toBe(false);

    tableSorts = TableUtils.sortColumn(
      tableSorts,
      columns,
      3,
      'DESC',
      false,
      false
    );
    table.applySort(tableSorts);
    expect(table.sort.length).toBe(1);
    expect(table.sort[0].column).toBe(columns[3]);
    expect(table.sort[0].direction).toBe(TableUtils.sortDirection.descending);
    expect(table.sort[0].isAbs).toBe(false);
  });
});

describe('getNormalizedType', () => {
  const testGetNormalizedType = (
    columnType: string | null,
    expectedValue: DataType
  ) => {
    expect(TableUtils.getNormalizedType(columnType)).toBe(expectedValue);
  };

  it('returns the boolean data type for boolean column type', () => {
    testGetNormalizedType('boolean', 'boolean');
    testGetNormalizedType('java.lang.Boolean', 'boolean');
  });

  it('returns the character data type for character column type', () => {
    testGetNormalizedType('char', 'char');
    testGetNormalizedType('java.lang.Character', 'char');
  });

  it('returns the string data type for string column type', () => {
    testGetNormalizedType('string', 'string');
    testGetNormalizedType('java.lang.String', 'string');
  });

  it('returns the date time data type for date time column type', () => {
    testGetNormalizedType(
      'io.deephaven.db.tables.utils.DBDateTime',
      'datetime'
    );
    testGetNormalizedType('io.deephaven.time.DateTime', 'datetime');
    testGetNormalizedType(
      'com.illumon.iris.db.tables.utils.DBDateTime',
      'datetime'
    );
    testGetNormalizedType('datetime', 'datetime');
  });

  it('returns the decimal data type for double, float, and bigdecimal column type', () => {
    testGetNormalizedType('double', 'decimal');
    testGetNormalizedType('java.lang.Double', 'decimal');
    testGetNormalizedType('float', 'decimal');
    testGetNormalizedType('java.lang.Float', 'decimal');
    testGetNormalizedType('java.math.BigDecimal', 'decimal');
    testGetNormalizedType('decimal', 'decimal');
  });

  it('returns the int data type for int, long, short, byte, and biginteger column type', () => {
    testGetNormalizedType('int', 'int');
    testGetNormalizedType('java.lang.Integer', 'int');
    testGetNormalizedType('long', 'int');
    testGetNormalizedType('java.lang.Long', 'int');
    testGetNormalizedType('short', 'int');
    testGetNormalizedType('java.lang.Short', 'int');
    testGetNormalizedType('byte', 'int');
    testGetNormalizedType('java.lang.Byte', 'int');
    testGetNormalizedType('java.math.BigInteger', 'int');
  });

  it('returns unknown for any unknown column type', () => {
    testGetNormalizedType('test', 'unknown');
    testGetNormalizedType('unknown', 'unknown');
    testGetNormalizedType(null, 'unknown');
  });
});

describe('isBigDecimalType', () => {
  it('should return true if the column type is big decimal', () => {
    expect(TableUtils.isBigDecimalType('java.math.BigDecimal')).toBe(true);
  });

  it('should return false if column type is not big decimal', () => {
    expect(TableUtils.isBigDecimalType('test')).toBe(false);
  });
});

describe('isBigIntegerType', () => {
  it('should return true if the column type is big integer', () => {
    expect(TableUtils.isBigIntegerType('java.math.BigInteger')).toBe(true);
  });

  it('should return false if column type is not big integer', () => {
    expect(TableUtils.isBigIntegerType('test')).toBe(false);
  });
});

describe('getBaseType', () => {
  it('should return the base column type', () => {
    expect(TableUtils.getBaseType('test')).toBe('test');
    expect(TableUtils.getBaseType('test1[]test2')).toBe('test1');
  });
});

describe('isCompatibleType', () => {
  it('should return true if two types are compatible', () => {
    expect(TableUtils.isCompatibleType('boolean', 'java.lang.Boolean')).toBe(
      true
    );
    expect(TableUtils.isCompatibleType()).toBe(true);
    expect(TableUtils.isCompatibleType('int', 'long')).toBe(true);
  });

  it('should return false if two types are not compatible', () => {
    expect(TableUtils.isCompatibleType('boolean', 'int')).toBe(false);
    expect(TableUtils.isCompatibleType('boolean')).toBe(false);
    expect(TableUtils.isCompatibleType('int', 'double')).toBe(false);
  });
});
