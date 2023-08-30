import { Key } from 'react';
import type {
  dh as dhType,
  Column,
  FilterCondition,
  FilterValue,
  Table,
} from '@deephaven/jsapi-types';
import { KeyedItem, TableUtils } from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/utils';
import {
  createComboboxFilterArgs,
  createFilterConditionFactory,
  createNotNullOrEmptyFilterCondition,
  createSearchTextFilter,
  createSelectedValuesFilter,
  createShowOnlyEmptyFilterCondition,
  createValueFilter,
  isSelectionEqual,
  isSelectionMaybeInvertedEqual,
  mapSelection,
  optimizeSelection,
} from './FilterUtils';

const { asMock, createMockProxy } = TestUtils;

const table = createMockProxy<Table>({});
declare const dh: dhType;
const tableUtils = new TableUtils(dh);
const makeFilterValue = jest.spyOn(tableUtils, 'makeFilterValue');

const mockColumn = {
  A: createMockProxy<Column>({
    type: 'columnA.type',
    name: 'A',
  }),
  B: createMockProxy<Column>({
    type: 'columnB.type',
    name: 'B',
  }),
} as const;

type MockColumnName = keyof typeof mockColumn;

const findColumn = (columnName: string) =>
  mockColumn[columnName as MockColumnName];

const makeSelectValueFilter = jest.spyOn(tableUtils, 'makeSelectValueFilter');
const makeSelectValueFilterResult = createMockProxy<FilterCondition>({});
const makeFilterValueResultCache = new Map<string, FilterValue>();

type MonkeyName = `monkey-${string}`;
const getMonkeyDataItem = jest.fn<KeyedItem<{ name: MonkeyName }>, [Key]>();
const mapItem = jest.fn<Key, [KeyedItem<{ name: MonkeyName }>]>();

function createMockFilterCondition(depth: number) {
  return createMockProxy<FilterCondition>(
    ['and', 'or', 'not'].reduce(
      (config, key) => {
        // eslint-disable-next-line no-param-reassign
        config[key] = jest
          .fn()
          .mockName(key)
          .mockReturnValue(
            depth > 0
              ? createMockFilterCondition(depth - 1)
              : createMockProxy<FilterCondition>()
          );
        return config;
      },
      {} as Record<string, jest.Mock>
    )
  );
}

function createMockFilterValue() {
  return createMockProxy<FilterValue>(
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
function getMakeFilterValueResult(value: string): FilterValue {
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
      column.filter().notEq({} as FilterValue)
    );

    expect(actual).toBe(
      column
        .filter()
        .isNull()
        .not()
        .and({} as FilterCondition)
    );
  });
});

describe('createSearchTextFilter', () => {
  it('should trim search text', () => {
    const searchText = '   blah     ';
    const trimmedSearchText = 'blah';

    createSearchTextFilter(tableUtils, mockColumn.A.name, searchText)(table);

    expect(makeFilterValue).toHaveBeenCalledWith(
      mockColumn.A.type,
      trimmedSearchText
    );
  });

  it('should return null if given null table', () => {
    const tableArg = null;

    expect(
      createSearchTextFilter(
        tableUtils,
        mockColumn.A.name,
        'mock.searchText'
      )(tableArg)
    ).toBeNull();
  });

  it('should return null if no columns matched', () => {
    asMock(table.findColumns).mockReturnValue([]);

    expect(
      createSearchTextFilter(
        tableUtils,
        mockColumn.A.name,
        'mock.searchText'
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
          searchTextArg
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
        searchText
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
          column.filter().eq({} as FilterValue)
        );
        expect(actual).toBe(
          column
            .filter()
            .isNull()
            .or({} as FilterCondition)
        );
      } else {
        expect(column.filter().notEq).toHaveBeenCalledWith(emptyStringValue);
        expect(column.filter().eq({} as FilterValue).or).toHaveBeenCalledWith(
          column.filter().notEq({} as FilterValue)
        );
      }
    }
  );
});

describe.each([undefined, 'and', 'or'] as const)(
  'createFilterConditionFactory: %s',
  operator => {
    const createColumnCondition = jest.fn<FilterCondition, [Column]>();

    const createMockFilterConditionResult: Record<string, FilterCondition> = {
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

describe('isSelectionEqual', () => {
  it.each([
    // Match cases
    ['all', 'all', true],
    [new Set(), new Set(), true],
    [new Set('abc'), new Set('abc'), true],
    // Mismatch cases
    ['all', new Set(), false],
    [new Set(), 'all', false],
    [new Set(), new Set('abc'), false],
    [new Set('abc'), new Set('def'), false],
  ] as const)(
    'should return true if selections represent the same selected values',
    (selectionA, selectionB, isEqual) => {
      expect(isSelectionEqual(selectionA, selectionB)).toEqual(isEqual);
    }
  );
});

describe.each([
  [true, false],
  [false, true],
  [true, true],
  [false, false],
] as const)('isSelectionMaybeInvertedEqual', (isInvertedA, isInvertedB) => {
  it.each([
    // Match cases
    ['all', 'all', true],
    [new Set(), new Set(), true],
    [new Set('abc'), new Set('abc'), true],
    // Mismatch cases
    ['all', new Set(), false],
    [new Set(), 'all', false],
    [new Set(), new Set('abc'), false],
    [new Set('abc'), new Set('def'), false],
  ] as const)(
    `should return true if selections represent the same selected values: isInvertedA:${isInvertedA}, isInvertedB:${isInvertedB}, selectionA:%s, selectionB:%s`,
    (selectionA, selectionB, areSelectionsEqual) => {
      const isEqual = isInvertedA === isInvertedB && areSelectionsEqual;

      expect(
        isSelectionMaybeInvertedEqual(
          { isInverted: isInvertedA, selection: selectionA },
          { isInverted: isInvertedB, selection: selectionB }
        )
      ).toEqual(isEqual);
    }
  );
});

describe('mapSelection', () => {
  it('should return "all" if given "all"', () => {
    const selectedItemKeys = 'all';
    expect(mapSelection(selectedItemKeys, getMonkeyDataItem, mapItem)).toEqual(
      'all'
    );
  });

  it('should return mapped itmes for selected keys', () => {
    const selectedItemKeys = new Set('abc');
    const expected = new Set<MonkeyName>(['monkey-a', 'monkey-b', 'monkey-c']);

    const actual = mapSelection(selectedItemKeys, getMonkeyDataItem, mapItem);

    expect(actual).toEqual(expected);
  });
});

describe('optimizeSelection', () => {
  it('should invert selection if selection is "all"', () => {
    const selection = 'all';
    const totalRecords = 10;

    const actual = optimizeSelection(selection, totalRecords);

    expect(actual).toEqual({
      isInverted: true,
      selection: new Set(),
    });
  });

  it.each([
    // Odd record count
    [new Set(''), 5, { isInverted: false, selection: new Set('') }],
    [new Set('12'), 5, { isInverted: false, selection: new Set('12') }],
    [new Set('123'), 5, { isInverted: true, selection: new Set('04') }],
    // Even record count
    [new Set(''), 6, { isInverted: false, selection: new Set('') }],
    [new Set('123'), 6, { isInverted: false, selection: new Set('123') }],
    [new Set('1234'), 6, { isInverted: true, selection: new Set('05') }],
  ] as const)(
    'should invert selection if selection size > half the total size',
    (selection, totalRecords, expected) => {
      const actual = optimizeSelection(selection, totalRecords);

      expect(actual).toEqual(expected);
    }
  );
});
