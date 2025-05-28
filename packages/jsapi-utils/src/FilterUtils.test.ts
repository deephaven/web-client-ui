import { Key } from 'react';
import dh from '@deephaven/jsapi-shim';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { KeyedItem } from '@deephaven/utils';
import { TestUtils } from '@deephaven/test-utils';
import {
  createComboboxFilterArgs,
  createFilterConditionFactory,
  createNotNullOrEmptyFilterCondition,
  createSearchTextFilter,
  createSelectedValuesFilter,
  createShowOnlyEmptyFilterCondition,
  createValueFilter,
} from './FilterUtils';
import TableUtils from './TableUtils';

const { asMock, createMockProxy } = TestUtils;

const table = createMockProxy<DhType.Table>({});
const tableUtils = new TableUtils(dh);
const makeFilterValue = jest.spyOn(tableUtils, 'makeFilterValue');
const makeSearchTextFilter = jest.spyOn(tableUtils, 'makeSearchTextFilter');

const mockColumn = {
  A: createMockProxy<DhType.Column>({
    type: 'columnA.type',
    name: 'A',
  }),
  B: createMockProxy<DhType.Column>({
    type: 'columnB.type',
    name: 'B',
  }),
} as const;

const mockTimeZone = 'mock.timeZone';

type MockColumnName = keyof typeof mockColumn;

const findColumn = (columnName: string) =>
  mockColumn[columnName as MockColumnName];

const makeSelectValueFilter = jest.spyOn(tableUtils, 'makeSelectValueFilter');
const makeSelectValueFilterResult = createMockProxy<DhType.FilterCondition>({});
const makeFilterValueResultCache = new Map<string, DhType.FilterValue>();

type MonkeyName = `monkey-${string}`;
const getMonkeyDataItem = jest.fn<KeyedItem<{ name: MonkeyName }>, [Key]>();
const mapItem = jest.fn<Key, [KeyedItem<{ name: MonkeyName }>]>();

function createMockFilterCondition(depth: number) {
  return createMockProxy<DhType.FilterCondition>(
    ['and', 'or', 'not'].reduce(
      (config, key) => {
        // eslint-disable-next-line no-param-reassign
        config[key] = jest
          .fn()
          .mockName(key)
          .mockReturnValue(
            depth > 0
              ? createMockFilterCondition(depth - 1)
              : createMockProxy<DhType.FilterCondition>()
          );
        return config;
      },
      {} as Record<string, jest.Mock>
    )
  );
}

function createMockFilterValue() {
  return createMockProxy<DhType.FilterValue>(
    [
      'contains',
      'containsIgnoreCase',
      'eq',
      'eqIgnoreCase',
      'isNull',
      'notEq',
      'notEqIgnoreCase',
    ].reduce(
      (config, key) => {
        // eslint-disable-next-line no-param-reassign
        config[key] = jest
          .fn()
          .mockName(key)
          .mockReturnValue(createMockFilterCondition(2));
        return config;
      },
      {} as Record<string, jest.Mock>
    )
  );
}

/**
 * Get `makeFilterValue` mock result from the cache. Adds new instance to the
 * cache if it doesn't exist
 */
function getMakeFilterValueResult(value: string): DhType.FilterValue {
  if (!makeFilterValueResultCache.has(value)) {
    makeFilterValueResultCache.set(value, createMockFilterValue());
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return makeFilterValueResultCache.get(value)!;
}

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();

  asMock(table.findColumn).mockImplementation(findColumn);
  asMock(table.findColumns).mockImplementation(columnNames =>
    columnNames.map(findColumn)
  );

  Object.keys(mockColumn).forEach(key => {
    asMock(mockColumn[key as MockColumnName].filter).mockReturnValue(
      createMockFilterValue()
    );
  });

  makeFilterValue.mockImplementation((_, value) =>
    getMakeFilterValueResult(value)
  );

  makeSelectValueFilter.mockReturnValue(makeSelectValueFilterResult);

  getMonkeyDataItem.mockImplementation((key: Key) => ({
    key: String(key),
    item: { name: `monkey-${key}` },
  }));

  mapItem.mockImplementation(
    (item: KeyedItem<{ name: string }>) => item.item?.name ?? ''
  );
});

describe('createComboboxFilterArgs', () => {
  it('should create "no filter" if value matches allValue', () => {
    expect(createComboboxFilterArgs('*', '*')).toEqual({
      operator: 'notEq',
      value: '',
    });
  });

  it('should create "eq" filter if value does not match allValue', () => {
    expect(createComboboxFilterArgs('bleh', '*')).toEqual({
      operator: 'eq',
      value: 'bleh',
    });
  });
});

describe('createNotNullOrEmptyFilterCondition', () => {
  it('should create a `notNullOrEmptyFilterCondition` function', () => {
    const column = mockColumn.A;

    const actual = createNotNullOrEmptyFilterCondition(tableUtils)(column);

    expect(tableUtils.makeFilterValue).toHaveBeenCalledWith(column.type, '');

    expect(column.filter().notEq).toHaveBeenCalledWith(
      tableUtils.makeFilterValue(column.type, '')
    );

    expect(column.filter().isNull().not().and).toHaveBeenCalledWith(
      column.filter().notEq({} as DhType.FilterValue)
    );

    expect(actual).toBe(
      column
        .filter()
        .isNull()
        .not()
        .and({} as DhType.FilterCondition)
    );
  });
});

describe('createSearchTextFilter', () => {
  it('should trim search text', () => {
    const searchText = '   blah     ';
    const trimmedSearchText = 'blah';

    createSearchTextFilter(
      tableUtils,
      mockColumn.A.name,
      searchText,
      mockTimeZone
    )(table);

    expect(makeSearchTextFilter).toHaveBeenCalledWith(
      mockColumn.A,
      trimmedSearchText,
      mockTimeZone
    );
  });

  it('should return null if given null table', () => {
    const tableArg = null;

    expect(
      createSearchTextFilter(
        tableUtils,
        mockColumn.A.name,
        'mock.searchText',
        mockTimeZone
      )(tableArg)
    ).toBeNull();
  });

  it('should return null if no columns matched', () => {
    asMock(table.findColumns).mockReturnValue([]);

    expect(
      createSearchTextFilter(
        tableUtils,
        mockColumn.A.name,
        'mock.searchText',
        mockTimeZone
      )(table)
    ).toBeNull();
  });

  it.each(['', '   '])(
    'should return null if given empty text: %s',
    searchTextArg => {
      expect(
        createSearchTextFilter(
          tableUtils,
          mockColumn.A.name,
          searchTextArg,
          mockTimeZone
        )(table)
      ).toBeNull();
    }
  );

  it.each([
    [mockColumn.A.name as MockColumnName],
    [[mockColumn.A.name, mockColumn.B.name] as MockColumnName[]],
  ])(
    'should return a containsIgnoreCase filter condition for given search text: %s',
    columnOrColumnNames => {
      const searchText = 'mock.search';

      const actual = createSearchTextFilter(
        tableUtils,
        columnOrColumnNames,
        searchText,
        mockTimeZone
      )(table);

      // Normalize to an array
      const columnNames: MockColumnName[] =
        typeof columnOrColumnNames === 'string'
          ? [columnOrColumnNames]
          : columnOrColumnNames;

      columnNames.forEach(columnName => {
        expect(
          mockColumn[columnName].filter().containsIgnoreCase
        ).toHaveBeenCalledWith(getMakeFilterValueResult(searchText));
      });

      const filterConditions = columnNames.map(columnName =>
        mockColumn[columnName as keyof typeof mockColumn]
          .filter()
          .containsIgnoreCase(
            tableUtils.makeFilterValue(mockColumn[columnName].type, searchText)
          )
      );

      expect(actual).toBe(filterConditions.reduce((cur, next) => cur.or(next)));
    }
  );
});

describe('createShowOnlyEmptyFilterCondition', () => {
  it.each([true, false])(
    'should create a `showOnlyEmptyFilterCondition` function',
    isOn => {
      const column = mockColumn.A;

      const actual = createShowOnlyEmptyFilterCondition(
        tableUtils,
        isOn
      )(column);

      expect(tableUtils.makeFilterValue).toHaveBeenCalledWith(column.type, '');
      const emptyStringValue = tableUtils.makeFilterValue(column.type, '');

      expect(column.filter().eq).toHaveBeenCalledWith(emptyStringValue);

      if (isOn) {
        expect(column.filter().isNull().or).toHaveBeenCalledWith(
          column.filter().eq({} as DhType.FilterValue)
        );
        expect(actual).toBe(
          column
            .filter()
            .isNull()
            .or({} as DhType.FilterCondition)
        );
      } else {
        expect(column.filter().notEq).toHaveBeenCalledWith(emptyStringValue);
        expect(
          column.filter().eq({} as DhType.FilterValue).or
        ).toHaveBeenCalledWith(column.filter().notEq({} as DhType.FilterValue));
      }
    }
  );
});

describe.each([undefined, 'and', 'or'] as const)(
  'createFilterConditionFactory: %s',
  operator => {
    const createColumnCondition = jest.fn<
      DhType.FilterCondition,
      [DhType.Column]
    >();

    const createMockFilterConditionResult: Record<
      string,
      DhType.FilterCondition
    > = {
      [mockColumn.A.name]: createMockFilterCondition(1),
      [mockColumn.B.name]: createMockFilterCondition(1),
    };

    beforeEach(() => {
      createColumnCondition
        .mockName('createColumnCondition')
        .mockImplementation(
          column => createMockFilterConditionResult[column.name]
        );
    });

    it('should return null if no table given: %s', () => {
      const tableArg = null;

      expect(
        createFilterConditionFactory(
          mockColumn.A.name,
          createColumnCondition,
          operator
        )(tableArg)
      ).toBeNull();
    });

    it('should return null if no columns matched', () => {
      asMock(table.findColumns).mockReturnValue([]);

      expect(
        createFilterConditionFactory(
          mockColumn.A.name,
          createColumnCondition,
          operator
        )(table)
      ).toBeNull();
    });

    it.each([
      [mockColumn.A.name as MockColumnName],
      [[mockColumn.A.name, mockColumn.B.name] as MockColumnName[]],
    ])(
      'should create a filter for the specified column names composed by the given operator: %s',
      columnOrColumnNames => {
        const actual = createFilterConditionFactory(
          columnOrColumnNames,
          createColumnCondition,
          operator
        )(table);

        // Normalize to an array
        const columnNames: MockColumnName[] =
          typeof columnOrColumnNames === 'string'
            ? [columnOrColumnNames]
            : columnOrColumnNames;

        columnNames.forEach(columnName => {
          expect(createColumnCondition).toHaveBeenCalledWith(
            mockColumn[columnName],
            expect.any(Number),
            expect.any(Array)
          );
        });

        const filterConditions = columnNames.map(
          columnName =>
            createMockFilterConditionResult[
              columnName as keyof typeof createMockFilterConditionResult
            ]
        );

        expect(actual).toBe(
          filterConditions.reduce((cur, next) => cur[operator ?? 'or'](next))
        );
      }
    );
  }
);

describe.each([
  'contains',
  'containsIgnoreCase',
  'eq',
  'eqIgnoreCase',
  'notEq',
  'notEqIgnoreCase',
] as const)('createValueFilter: %s', operator => {
  const mockValue = 'mock.value';

  it('should return null if no table given: %s', () => {
    const tableArg = null;

    expect(
      createValueFilter(
        tableUtils,
        mockColumn.A.name,
        mockValue,
        operator
      )(tableArg)
    ).toBeNull();
  });

  it('should return null if no columns matched', () => {
    asMock(table.findColumns).mockReturnValue([]);

    expect(
      createValueFilter(
        tableUtils,
        mockColumn.A.name,
        mockValue,
        operator
      )(table)
    ).toBeNull();
  });

  it.each([
    [mockColumn.A.name as MockColumnName],
    [[mockColumn.A.name, mockColumn.B.name] as MockColumnName[]],
  ])(
    'should return a value filter condition for given value: %s',
    columnOrColumnNames => {
      const actual = createValueFilter(
        tableUtils,
        columnOrColumnNames,
        mockValue,
        operator
      )(table);

      // Normalize to an array
      const columnNames: MockColumnName[] =
        typeof columnOrColumnNames === 'string'
          ? [columnOrColumnNames]
          : columnOrColumnNames;

      columnNames.forEach(columnName => {
        expect(mockColumn[columnName].filter()[operator]).toHaveBeenCalledWith(
          getMakeFilterValueResult(mockValue)
        );
      });

      const filterConditions = columnNames.map(columnName =>
        mockColumn[columnName as keyof typeof mockColumn]
          .filter()
          [operator](
            tableUtils.makeFilterValue(mockColumn[columnName].type, mockValue)
          )
      );

      expect(actual).toBe(filterConditions.reduce((cur, next) => cur.or(next)));
    }
  );
});

describe('createSelectedValuesFilter', () => {
  const invertSelection = {
    true: true,
    false: false,
  };

  const emptySelectionEqAll = {
    true: true,
    false: false,
  };

  const selection = {
    empty: new Set(),
    nonEmpty: new Set('abc'),
  };

  it('should return null if no table given', () => {
    const tableArg = null;

    expect(
      createSelectedValuesFilter(
        tableUtils,
        mockColumn.A.name,
        selection.empty,
        emptySelectionEqAll.false,
        invertSelection.false
      )(tableArg)
    ).toBeNull();
  });

  it.each([
    [emptySelectionEqAll.true, selection.empty, true],
    [emptySelectionEqAll.true, selection.nonEmpty, false],
    [emptySelectionEqAll.false, selection.empty, false],
    [emptySelectionEqAll.false, selection.nonEmpty, false],
  ])(
    'should return null if emptySelectionEqAll and selection size is zero: %s, %s',
    (emptySelectionEqAllArg, selectionArg, expectedNull) => {
      const matcher = expect(
        createSelectedValuesFilter(
          tableUtils,
          mockColumn.A.name,
          selectionArg,
          emptySelectionEqAllArg,
          invertSelection.false
        )(table)
      );

      if (expectedNull) {
        matcher.toBeNull();
      } else {
        matcher.not.toBeNull();
      }
    }
  );

  it('should return null if selection is "all"', () => {
    const selectionArg = 'all';

    expect(
      createSelectedValuesFilter(
        tableUtils,
        mockColumn.A.name,
        selectionArg,
        emptySelectionEqAll.false,
        invertSelection.false
      )(table)
    ).toBeNull();
  });

  it.each([invertSelection.true, invertSelection.false])(
    'should return a selected value filter for given selection: %s',
    invertSelectionArg => {
      const selectionArg = new Set('abc');

      const actual = createSelectedValuesFilter(
        tableUtils,
        mockColumn.A.name,
        selectionArg,
        emptySelectionEqAll.false,
        invertSelectionArg
      )(table);

      expect(makeSelectValueFilter).toHaveBeenCalledWith(
        mockColumn.A,
        ['a', 'b', 'c'],
        invertSelectionArg
      );
      expect(actual).toBe(makeSelectValueFilterResult);
    }
  );
});
