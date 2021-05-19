import dh from '@deephaven/jsapi-shim';
import { FilterOperator, FilterType } from './filters';
import TableUtils from './TableUtils';
import DateUtils from './DateUtils';

const DEFAULT_TIME_ZONE_ID = 'America/New_York';
const EXPECT_TIME_ZONE_PARAM = expect.objectContaining({
  id: DEFAULT_TIME_ZONE_ID,
});

jest.mock('@deephaven/redux', () => ({
  getTimeZone: jest.fn(() => 'America/New_York'),
  store: {
    getState: () => ({}),
  },
}));

function makeColumns(count = 5) {
  const columns = [];

  for (let i = 0; i < count; i += 1) {
    const column = new dh.Column({ index: i, name: `${i}` });
    columns.push(column);
  }

  return columns;
}

it('toggles sort properly', () => {
  const columns = makeColumns();
  const table = new dh.Table({ columns });
  let tableSorts = [];

  expect(table).not.toBe(null);
  expect(table.sort.length).toBe(0);

  tableSorts = TableUtils.toggleSortForColumn(tableSorts, table, 0, true);
  table.applySort(tableSorts);
  expect(table.sort.length).toBe(1);
  expect(table.sort[0].column).toBe(columns[0]);
  expect(table.sort[0].direction).toBe(TableUtils.sortDirection.ascending);

  tableSorts = TableUtils.toggleSortForColumn(tableSorts, table, 3, true);
  table.applySort(tableSorts);
  expect(table.sort.length).toBe(2);
  expect(table.sort[0].column).toBe(columns[0]);
  expect(table.sort[0].direction).toBe(TableUtils.sortDirection.ascending);
  expect(table.sort[1].column).toBe(columns[3]);
  expect(table.sort[1].direction).toBe(TableUtils.sortDirection.ascending);

  tableSorts = TableUtils.toggleSortForColumn(tableSorts, table, 0, true);
  table.applySort(tableSorts);
  expect(table.sort.length).toBe(2);
  expect(table.sort[0].column).toBe(columns[3]);
  expect(table.sort[0].direction).toBe(TableUtils.sortDirection.ascending);
  expect(table.sort[1].column).toBe(columns[0]);
  expect(table.sort[1].direction).toBe(TableUtils.sortDirection.descending);

  tableSorts = TableUtils.toggleSortForColumn(tableSorts, table, 0, true);
  table.applySort(tableSorts);
  expect(table.sort.length).toBe(1);
  expect(table.sort[0].column).toBe(columns[3]);
  expect(table.sort[0].direction).toBe(TableUtils.sortDirection.ascending);

  tableSorts = TableUtils.toggleSortForColumn(tableSorts, table, 3, true);
  table.applySort(tableSorts);
  expect(table.sort.length).toBe(1);
  expect(table.sort[0].column).toBe(columns[3]);
  expect(table.sort[0].direction).toBe(TableUtils.sortDirection.descending);

  tableSorts = TableUtils.toggleSortForColumn(tableSorts, table, 3, true);
  table.applySort(tableSorts);

  expect(table.sort.length).toBe(0);
});

describe('quick filter tests', () => {
  function makeFilterCondition(type = '') {
    return {
      not: jest.fn(() => makeFilterCondition(`${type}.${FilterType.eq}`)),
      and: jest.fn(() => makeFilterCondition(`${type}.${FilterType.eq}`)),
      or: jest.fn(() => makeFilterCondition(`${type}.${FilterType.eq}`)),
    };
  }

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
      type,
    };
  }

  function makeFilterColumn(type = 'string') {
    const filter = makeFilter();
    return {
      type,
      filter: () => filter,
    };
  }

  function mockFilterConditionReturnValue(filterToMock) {
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

    if (args.length > 0) {
      expect(filter[expectedFn]).toHaveBeenCalledWith(...args);
    } else {
      expect(filter[expectedFn]).toHaveBeenCalled();
    }
    expect(result).toBe(expectedResult);
  }

  function testMultiFilter(columnType, testFunction, text, expectedFilters) {
    const column = makeFilterColumn(columnType);

    const columnFilter = column.filter();
    const filters = [];
    const joinFilters = [];
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

    const result = TableUtils[testFunction](column, text);

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
        } else if (nextFilter) {
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
      ofString: value => value,
      ofNumber: value => value,
      ofDateTime: value => value,
      ofBoolean: value => value,
    };

    dh.FilterCondition = {
      invoke: jest.fn(type => makeFilterCondition(type)),
    };

    dh.i18n.DateTimeFormat.parse = (pattern, text) => {
      // Just parse out the text and pass back a date in millis
      // Real library passes back a wrapped long, but this is fine for tests
      const [year, month, day] = text
        .split('-')
        .map(value => parseInt(value, 10));
      return new Date(year, month - 1, day).getTime();
    };

    // Just return the millis value as the date wrapper for unit tests
    dh.DateWrapper.ofJsDate = date => date.getTime();
    dh.i18n.DateTimeFormat.parse = (_format, dateString) =>
      Date.parse(dateString);
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

      expect(TableUtils.makeQuickNumberFilter(column, null)).toBe(null);
      expect(TableUtils.makeQuickNumberFilter(column, undefined)).toBe(null);
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

      let expectFilterCondition = null;
      let expectAndFilterCondition = null;

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
        expectedFilters
      );
    }

    it('handles empty cases', () => {
      const column = makeFilterColumn();

      expect(TableUtils.makeQuickBooleanFilter(column, null)).toBe(null);
      expect(TableUtils.makeQuickBooleanFilter(column, undefined)).toBe(null);
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
        'io.deephaven.db.tables.utils.DBDateTime',
        'makeQuickDateFilter',
        text,
        expectedFilters
      );
    }

    it('handles invalid cases', () => {
      const column = makeFilterColumn();

      expect(() => TableUtils.makeQuickDateFilter(column, null)).toThrow();
      expect(() => TableUtils.makeQuickDateFilter(column, undefined)).toThrow();
      expect(() => TableUtils.makeQuickDateFilter(column, '')).toThrow();

      expect(() => TableUtils.makeQuickDateFilter(column, '>')).toThrow();
      expect(() => TableUtils.makeQuickDateFilter(column, 'U()$#@')).toThrow();
      expect(() =>
        TableUtils.makeQuickDateFilter(column, 'invalid str')
      ).toThrow();
      expect(() => TableUtils.makeQuickDateFilter(column, 'nu ll')).toThrow();
      expect(() =>
        TableUtils.makeQuickDateFilter(column, '20193-02-02')
      ).toThrow();
      expect(() =>
        TableUtils.makeQuickDateFilter(column, '302-111-303')
      ).toThrow();
      expect(() => TableUtils.makeQuickDateFilter(column, 4)).toThrow();
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
      dh.i18n.DateTimeFormat.parse = jest.fn((_format, dateString) =>
        Date.parse(dateString)
      );
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
      dh.i18n.DateTimeFormat.parse.mockClear();

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
      dh.i18n.DateTimeFormat.parse.mockClear();

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
      dh.i18n.DateTimeFormat.parse.mockClear();

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
      dh.i18n.DateTimeFormat.parse.mockClear();

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
      dh.i18n.DateTimeFormat.parse.mockClear();
    });

    it('handles nanos year-month-day hh:mm:ss.SSSSSSSSS', () => {
      // Since our mock can only handle to millis, check that the parse function is called with the right values
      dh.i18n.DateTimeFormat.parse = jest.fn((_format, dateString) =>
        Date.parse(dateString)
      );
      testDateFilter('2018-09-27 04:20:35.123456789', [
        [FilterType.eq, null, new Date(2018, 8, 27, 4, 20, 35, 123).getTime()],
      ]);
      expect(dh.i18n.DateTimeFormat.parse).toHaveBeenCalledWith(
        DateUtils.FULL_DATE_FORMAT,
        '2018-09-27 04:20:35.123456789',
        EXPECT_TIME_ZONE_PARAM
      );
      dh.i18n.DateTimeFormat.parse.mockClear();

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
      dh.i18n.DateTimeFormat.parse.mockClear();

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
      dh.i18n.DateTimeFormat.parse.mockClear();

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
      dh.i18n.DateTimeFormat.parse.mockClear();

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
      dh.i18n.DateTimeFormat.parse.mockClear();
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
      // Since our mock can only handle to millis, check that the parse function is called with the right values
      dh.i18n.DateTimeFormat.parse = jest.fn((_format, dateString) =>
        Date.parse(dateString)
      );
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
      dh.i18n.DateTimeFormat.parse.mockClear();

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
      dh.i18n.DateTimeFormat.parse.mockClear();
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
      const filter = column.filter();

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

      if (args.length > 0) {
        expect(filter.invoke).toHaveBeenCalledWith(...args);
      } else {
        expect(filter.invoke).toHaveBeenCalled();
      }
      expect(result).toBe(expectedResult);
    }

    it('handles empty cases', () => {
      const column = makeFilterColumn();

      expect(TableUtils.makeQuickTextFilter(column, null)).toBe(null);
      expect(TableUtils.makeQuickTextFilter(column, undefined)).toBe(null);
      expect(TableUtils.makeQuickTextFilter(column, '')).toBe(null);
    });

    it('handles null cases', () => {
      testTextFilter('null', FilterType.isNull);
      testTextFilter('    null   \n   ', FilterType.isNull);
      testTextFilter('  NuLl   \n', FilterType.isNull);
      testTextFilter('=null', FilterType.isNull);
    });

    it('handles not null cases', () => {
      const column = makeFilterColumn();
      const filter = column.filter();

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
      testMultiFilter('int', 'makeQuickFilter', '>10 && <20', [
        [FilterType.greaterThan, FilterOperator.and, 10],
        [FilterType.lessThan, null, 20],
      ]);
    });

    it('handles || multi filter case', () => {
      testMultiFilter('int', 'makeQuickFilter', '>30 || <20', [
        [FilterType.greaterThan, FilterOperator.or, 30],
        [FilterType.lessThan, null, 20],
      ]);
    });

    it('handles && and || case', () => {
      testMultiFilter('int', 'makeQuickFilter', '>10 && < 20 || =50', [
        [FilterType.greaterThan, FilterOperator.and, 10],
        [FilterType.lessThan, FilterOperator.or, 20],
        [FilterType.eq, null, 50],
      ]);
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
    promise.catch(() => {});
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
