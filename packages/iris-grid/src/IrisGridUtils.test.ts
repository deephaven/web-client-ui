import { GridUtils, GridRange, MoveOperation } from '@deephaven/grid';
import dh, { Column, Table, Sort } from '@deephaven/jsapi-shim';
import { TypeValue as FilterTypeValue } from '@deephaven/filters';
import { DateUtils, TableUtils } from '@deephaven/jsapi-utils';
import type { AdvancedFilter } from './CommonTypes';
import { FilterData } from './IrisGrid';
import IrisGridTestUtils from './IrisGridTestUtils';
import IrisGridUtils, {
  DehydratedSort,
  LegacyDehydratedSort,
} from './IrisGridUtils';

const tableUtils = new TableUtils(dh);

function makeFilter() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (dh as any).FilterCondition();
}

function makeColumns(count = 30) {
  const columns: Column[] = [];

  for (let i = 0; i < count; i += 1) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const column = new (dh as any).Column({ index: i, name: `name_${i}` });
    columns.push(column);
  }

  return columns;
}

function makeTable({
  columns = makeColumns(),
  sort = [] as Sort[],
} = {}): Table {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (dh as any).Table({ columns, sort });
}
function makeColumn(index: number): Column {
  return IrisGridTestUtils.makeColumn(
    `${index}`,
    IrisGridTestUtils.DEFAULT_TYPE,
    index
  );
}

describe('quickfilters tests', () => {
  it('exports/imports empty list', () => {
    const table = IrisGridTestUtils.makeTable();
    const filters = new Map();
    const exportedFilters = IrisGridUtils.dehydrateQuickFilters(filters);
    expect(exportedFilters).toEqual([]);

    const importedFilters = IrisGridUtils.hydrateQuickFilters(
      table.columns,
      exportedFilters,
      tableUtils
    );
    expect(importedFilters).toEqual(filters);
  });

  it('exports/imports quickFilters', () => {
    const table = makeTable();
    const column = 9;
    const text = '>1000';
    const filter = makeFilter();
    const quickFilters = new Map([[column, { text, filter }]]);

    const exportedFilters = IrisGridUtils.dehydrateQuickFilters(quickFilters);
    expect(exportedFilters).toEqual([
      [column, expect.objectContaining({ text })],
    ]);

    const importedFilters = IrisGridUtils.hydrateQuickFilters(
      table.columns,
      exportedFilters,
      tableUtils
    );
    expect(importedFilters).toEqual(
      new Map([
        [
          column,
          expect.objectContaining({
            text,
            filter: expect.objectContaining({}),
          }),
        ],
      ])
    );
  });
});

describe('advanced filter tests', () => {
  it('exports/imports empty list', () => {
    const table = makeTable();
    const filters = new Map();
    const exportedFilters = IrisGridUtils.dehydrateAdvancedFilters(
      table.columns,
      filters
    );
    expect(exportedFilters).toEqual([]);

    const importedFilters = IrisGridUtils.hydrateAdvancedFilters(
      table.columns,
      exportedFilters,
      tableUtils,
      'America/New_York'
    );
    expect(importedFilters).toEqual(filters);
  });

  it('exports advanced filters', () => {
    const table = makeTable();
    const column = 7;
    const filter = makeFilter();
    const options = {
      filterItems: [{ selectedType: '', value: '', key: 0 }],
      filterOperators: [],
      invertSelection: false,
      selectedValues: ['Arca', 'Bats'],
    };
    const filters = new Map([[column, { filter, options }]]);

    const exportedFilters = IrisGridUtils.dehydrateAdvancedFilters(
      table.columns,
      filters as Map<number, AdvancedFilter>
    );
    expect(exportedFilters).toEqual([
      [column, expect.objectContaining({ options })],
    ]);

    const importedFilters = IrisGridUtils.hydrateAdvancedFilters(
      table.columns,
      exportedFilters,
      tableUtils,
      'America/New_York'
    );
    expect(importedFilters).toEqual(
      new Map([
        [
          column,
          expect.objectContaining({
            options,
            filter: expect.objectContaining({}),
          }),
        ],
      ])
    );
  });
});

describe('sort exporting/importing', () => {
  it('exports/imports empty sort', () => {
    const sort = [];
    const table = makeTable({ sort });
    const exportedSort = IrisGridUtils.dehydrateSort(sort);
    expect(exportedSort).toEqual([]);

    const importedSort = IrisGridUtils.hydrateSort(table.columns, exportedSort);
    expect(importedSort).toEqual(sort);
  });

  it('should export (dehydrate) sorts', () => {
    const columns = makeColumns();
    const sort = [columns[3].sort(), columns[7].sort().abs().desc()];
    const dehydratedSorts = IrisGridUtils.dehydrateSort(sort);

    expect(dehydratedSorts).toEqual<DehydratedSort[]>([
      { column: columns[3].name, isAbs: false, direction: 'ASC' },
      { column: columns[7].name, isAbs: true, direction: 'DESC' },
    ]);
  });

  describe('should import (hydrate) sorts', () => {
    const columns = makeColumns();
    const sort = [columns[3].sort(), columns[7].sort().abs().desc()];
    const table = makeTable({ columns, sort });

    const dehydratedSorts = IrisGridUtils.dehydrateSort(sort);

    // Map `column` to a number to represent our LegacyDehydratedSort
    const legacyDehydratedSorts: LegacyDehydratedSort[] = dehydratedSorts.map(
      ({ column, ...rest }) => ({
        column: Number(column.split('_')[1]),
        ...rest,
      })
    );

    it.each([
      ['current', dehydratedSorts],
      ['legacy', legacyDehydratedSorts],
    ])('%s', (_label, sorts) => {
      const importedSort = IrisGridUtils.hydrateSort(table.columns, sorts);

      expect(importedSort).toEqual([
        expect.objectContaining({
          column: columns[3],
          isAbs: false,
          direction: 'ASC',
        }),
        expect.objectContaining({
          column: columns[7],
          isAbs: true,
          direction: 'DESC',
        }),
      ]);
    });
  });
});

describe('pendingDataMap hydration/dehydration', () => {
  it('dehydrates/hydrates empty map', () => {
    const pendingDataMap = new Map();
    const columns = makeColumns();
    const dehydratedMap = IrisGridUtils.dehydratePendingDataMap(
      columns,
      pendingDataMap
    );
    expect(dehydratedMap).toEqual([]);

    const hydratedMap = IrisGridUtils.hydratePendingDataMap(
      columns,
      dehydratedMap
    );
    expect(hydratedMap.size).toBe(0);
  });

  it('dehydrates/hydrates pending data', () => {
    const pendingDataMap = new Map([
      [
        1,
        {
          data: new Map([
            [3, 'Foo'],
            [4, 'Bar'],
          ]),
        },
      ],
      [
        10,
        {
          data: new Map([[7, 'Baz']]),
        },
      ],
    ]);
    const columns = makeColumns();
    const dehydratedMap = IrisGridUtils.dehydratePendingDataMap(
      columns,
      pendingDataMap
    );
    expect(dehydratedMap).toEqual([
      [
        1,
        expect.objectContaining({
          data: [
            ['name_3', 'Foo'],
            ['name_4', 'Bar'],
          ],
        }),
      ],
      [
        10,
        expect.objectContaining({
          data: [['name_7', 'Baz']],
        }),
      ],
    ]);

    const hydratedMap = IrisGridUtils.hydratePendingDataMap(
      columns,
      dehydratedMap
    );
    expect(hydratedMap.size).toBe(2);
    expect(hydratedMap.get(1)?.data.size).toBe(2);
    expect(hydratedMap.get(1)?.data.get(3)).toEqual('Foo');
    expect(hydratedMap.get(1)?.data.get(4)).toEqual('Bar');
    expect(hydratedMap.get(10)?.data.size).toBe(1);
    expect(hydratedMap.get(10)?.data.get(7)).toEqual('Baz');
  });
});

describe('remove columns in moved columns', () => {
  it('delete the move when the move origin column is removed', () => {
    const table = makeTable();
    let movedColumns: MoveOperation[] = [];
    movedColumns = GridUtils.moveItem(3, 0, movedColumns); // move column '3' to '0'
    const newMovedColumns = IrisGridUtils.removeColumnFromMovedColumns(
      table.columns,
      movedColumns,
      ['name_3']
    );
    expect(newMovedColumns).toEqual([]);
  });

  it('alter move origin when a column is removed', () => {
    const table = makeTable();
    let movedColumns: MoveOperation[] = [];
    movedColumns = GridUtils.moveItem(4, 1, movedColumns); // move column '4' to '1'
    const newMovedColumns = IrisGridUtils.removeColumnFromMovedColumns(
      table.columns,
      movedColumns,
      ['name_3']
    );
    expect(newMovedColumns).toEqual(GridUtils.moveItem(3, 1, [])); // new move should be {from: 3, to: 1}
  });

  it('delete the move when the move origin column is removed & alter move origin when a column is removed', () => {
    const table = makeTable();
    let movedColumns: MoveOperation[] = [];
    movedColumns = GridUtils.moveItem(3, 0, movedColumns); // move column '3' to '0', columns should be [3,0,1,2,4,5,...] after the move;
    movedColumns = GridUtils.moveItem(4, 1, movedColumns); // move column '4' to '1', columns should be [3,4,1,2,5,...] after the move;
    const newMovedColumns = IrisGridUtils.removeColumnFromMovedColumns(
      table.columns,
      movedColumns,
      ['name_3']
    );
    // columns' original state should be [0,1,2,4,5,...] after '3' is removed;
    // columns after move should be [4,0,1,2,5,...]; after columns '3' is removed;
    // move {from: 3, to: 0} is deleted because it is origin column is removed,
    // move {from: 4, to: 1 } is changed into {from: 3, to: 0};
    expect(newMovedColumns).toEqual(GridUtils.moveItem(3, 0, []));
  });

  it('delete the move when the origin and destination column is the same after the removal of a column', () => {
    const table = makeTable();
    let movedColumns: MoveOperation[] = [];
    movedColumns = GridUtils.moveItem(3, 4, movedColumns); // move a column from 3 to 4
    const newMovedColumns = IrisGridUtils.removeColumnFromMovedColumns(
      table.columns,
      movedColumns,
      ['name_4']
    );
    // column for is removed, the moved column moved back to it's original place, so delete the move
    expect(newMovedColumns).toEqual([]);
  });

  it('remove multiple columns - 1', () => {
    const table = makeTable();
    let movedColumns: MoveOperation[] = [];
    movedColumns = GridUtils.moveItem(4, 1, movedColumns); // move column '4' to '1', columns should be [0,4,1,2,3,5,...] after the move;
    const newMovedColumns = IrisGridUtils.removeColumnFromMovedColumns(
      table.columns,
      movedColumns,
      ['name_2', 'name_3']
    );
    // columns' original state should be [0,1,4,5,...] after '2' & '3' are removed;
    // columns after move should be [0,1,4,5,...]; after columns '2' & '3' are removed;
    // move {from: 4, to: 1 } is changed into {from: 2, to: 1};
    expect(newMovedColumns).toEqual(GridUtils.moveItem(2, 1, []));
  });

  it('remove multiple columns - 2', () => {
    const table = makeTable();
    let movedColumns: MoveOperation[] = [];
    movedColumns = GridUtils.moveItem(1, 4, movedColumns); // move column '1' to '4', columns should be [0,2,3,1,4,5,...] after the move;
    const newMovedColumns = IrisGridUtils.removeColumnFromMovedColumns(
      table.columns,
      movedColumns,
      ['name_2', 'name_3']
    );
    // columns' original state should be [0,1,4,5,...] after '2' & '3' are removed;
    // columns after move should be [0,4,1,5,...]; after columns '2' & '3' are removed;
    // move {from: 1, to: 4 } is changed into {from: 1, to: 2};
    expect(newMovedColumns).toEqual(GridUtils.moveItem(1, 2, []));
  });

  it('remove multiple columns - 3', () => {
    const table = makeTable();
    let movedColumns: MoveOperation[] = [];
    movedColumns = GridUtils.moveItem(4, 1, movedColumns); // move column '4' to '1', columns should be [0,4,1,2,3,5,6,...] after the move;
    movedColumns = GridUtils.moveItem(5, 6, movedColumns); // move column '3' to '0', columns should be [0,4,1,2,3,6,5...];
    const newMovedColumns = IrisGridUtils.removeColumnFromMovedColumns(
      table.columns,
      movedColumns,
      ['name_2', 'name_3']
    );
    // columns' original state should be [0,1,4,5,6...] after '2' & '3' are removed;
    // columns after moves should be [0,4,1,6,5...]; after columns '2' & '3' are removed;
    // move {from: 4, to: 1 } is changed into {from: 2, to: 1};
    // move {from: 5, to: 6 } is changed into {from: 3, to: 4};
    let expectMovedColumns = GridUtils.moveItem(2, 1, []);
    expectMovedColumns = GridUtils.moveItem(3, 4, expectMovedColumns);
    expect(newMovedColumns).toEqual(expectMovedColumns);
  });
});

describe('getPrevVisibleColumns', () => {
  const columns = IrisGridTestUtils.makeColumns(5);
  it('returns [] for startIndex < 0', () => {
    expect(IrisGridUtils.getPrevVisibleColumns(columns, -1, 1, [], [])).toEqual(
      []
    );
  });

  it('returns [] for count === 0', () => {
    expect(IrisGridUtils.getPrevVisibleColumns(columns, 0, 0, [], [])).toEqual(
      []
    );
  });

  it('skips hidden columns', () => {
    expect(
      IrisGridUtils.getPrevVisibleColumns(columns, 2, 2, [], [1])
    ).toEqual([makeColumn(0), makeColumn(2)]);

    expect(
      IrisGridUtils.getPrevVisibleColumns(columns, 3, 5, [], [1])
    ).toEqual([makeColumn(0), makeColumn(2), makeColumn(3)]);
  });
});

describe('getNextVisibleColumns', () => {
  const columns = IrisGridTestUtils.makeColumns(5);
  it('returns [] for startIndex >= columns.length', () => {
    expect(
      IrisGridUtils.getNextVisibleColumns(columns, columns.length, 1, [], [])
    ).toEqual([]);
  });

  it('returns [] for count === 0', () => {
    expect(IrisGridUtils.getNextVisibleColumns(columns, 0, 0, [], [])).toEqual(
      []
    );
  });

  it('skips hidden columns 2', () => {
    expect(
      IrisGridUtils.getNextVisibleColumns(columns, 1, 2, [], [2])
    ).toEqual([makeColumn(1), makeColumn(3)]);

    expect(
      IrisGridUtils.getNextVisibleColumns(columns, 1, 5, [], [2])
    ).toEqual([makeColumn(1), makeColumn(3), makeColumn(4)]);
  });
});

describe('validate copy ranges', () => {
  function testRanges(ranges, expectedResult = true) {
    expect(IrisGridUtils.isValidSnapshotRanges(ranges)).toBe(expectedResult);
  }
  function isValid(ranges) {
    return testRanges(ranges, true);
  }
  function isInvalid(ranges) {
    return testRanges(ranges, false);
  }
  it('returns false for empty ranges', () => {
    isInvalid([]);
  });
  it('returns true for single cells', () => {
    isValid([GridRange.makeCell(0, 0)]);
    isValid([GridRange.makeCell(10, 10)]);
  });
  it('returns true for single range', () => {
    isValid([new GridRange(0, 0, 10, 10)]);
    isValid([new GridRange(10, 10, 100, 100)]);
  });
  it('returns true for range with full column or row selection', () => {
    isValid([new GridRange(null, 10, null, 20)]);
    isValid([new GridRange(10, null, 20, null)]);
  });
  it('returns true for multiple ranges with the same start/end rows', () => {
    isValid([new GridRange(3, 5, 3, 5), new GridRange(5, 5, 6, 5)]);
    isValid([new GridRange(3, 5, 3, 10), new GridRange(5, 5, 6, 10)]);
  });
  it('returns true for multiple ranges with the same start/end columns', () => {
    isValid([new GridRange(3, 5, 3, 5), new GridRange(3, 10, 3, 12)]);
    isValid([new GridRange(3, 5, 6, 5), new GridRange(3, 10, 6, 12)]);
  });
  it('returns false for multiple ranges without the same start/end rows or columns', () => {
    isInvalid([new GridRange(3, 5, 3, 5), new GridRange(6, 8, 6, 8)]);
    isInvalid([new GridRange(3, 5, 6, 10), new GridRange(3, 12, 5, 20)]);
  });
  it('returns true for multiple ranges with multiple start/end columns and rows that match', () => {
    isValid([
      GridRange.makeCell(3, 5),
      GridRange.makeCell(5, 5),
      GridRange.makeCell(3, 3),
      GridRange.makeCell(5, 3),
    ]);
    isValid([
      new GridRange(3, 5, 3, 8),
      new GridRange(6, 5, 6, 8),
      new GridRange(3, 10, 3, 10),
      new GridRange(6, 10, 6, 10),
    ]);
  });
});

describe('changeFilterColumnNamesToIndexes', () => {
  const DEFAULT_FILTER = {};
  const columns = makeColumns(10);
  it('Replaces column names with indexes', () => {
    const filters = [
      { name: 'name_1', filter: DEFAULT_FILTER },
      { name: 'name_3', filter: DEFAULT_FILTER },
      { name: 'name_5', filter: DEFAULT_FILTER },
    ];
    expect(
      IrisGridUtils.changeFilterColumnNamesToIndexes(columns, filters)
    ).toEqual([
      [1, DEFAULT_FILTER],
      [3, DEFAULT_FILTER],
      [5, DEFAULT_FILTER],
    ]);
  });

  it('Omits missing columns', () => {
    const filters = [
      { name: 'missing_1', filter: DEFAULT_FILTER },
      { name: 'name_3', filter: DEFAULT_FILTER },
      { name: 'missing_2', filter: DEFAULT_FILTER },
    ];
    expect(
      IrisGridUtils.changeFilterColumnNamesToIndexes(columns, filters)
    ).toEqual([[3, DEFAULT_FILTER]]);
  });
});

describe('combineFiltersFromList', () => {
  function createFilter(
    operator: FilterTypeValue,
    text: string,
    value: unknown,
    startColumnIndex: number
  ): FilterData {
    return { operator, text, value, startColumnIndex };
  }

  it('returns an empty string for an empty list', () => {
    expect(IrisGridUtils.combineFiltersFromList('int', [])).toEqual('');
  });

  it('disjunctively combines eq operators', () => {
    const filterList: FilterData[] = [];
    for (let i = 0; i < 3; i += 1) {
      filterList.push(createFilter('eq', `${i}`, `${i}`, i));
    }
    expect(IrisGridUtils.combineFiltersFromList('int', filterList)).toEqual(
      '0 || 1 || 2'
    );
  });

  it('conjunctively combines non-eq operators', () => {
    const filterList: FilterData[] = [];
    filterList.push(createFilter('notEq', 'foo', 'foo', 0));
    filterList.push(createFilter('contains', 'bar', 'bar', 1));
    filterList.push(createFilter('startsWith', 'baz', 'baz', 2));
    expect(IrisGridUtils.combineFiltersFromList('string', filterList)).toEqual(
      '!=foo && ~bar && baz*'
    );
  });

  it('combines eq and non-eq operators, moving all eq to the end', () => {
    const filterList: FilterData[] = [];
    filterList.push(createFilter('greaterThan', '-15', '-15', 0));
    filterList.push(createFilter('eq', '260', '260', 1));
    filterList.push(createFilter('eq', '59', '59', 2));
    filterList.push(createFilter('lessThanOrEqualTo', '0', '0', 3));
    filterList.push(createFilter('notEq', '-942', '-942', 4));
    expect(IrisGridUtils.combineFiltersFromList('int', filterList)).toEqual(
      '>-15 && <=0 && !=-942 || 260 || 59'
    );
  });

  it('orders conj. and disj. sections separately based on start column index', () => {
    const filterList: FilterData[] = [];
    filterList.push(createFilter('greaterThan', '-15', '-15', 3));
    filterList.push(createFilter('eq', '260', '260', 2));
    filterList.push(createFilter('eq', '59', '59', 0));
    filterList.push(createFilter('lessThanOrEqualTo', '0', '0', 1));
    filterList.push(createFilter('notEq', '-942', '-942', 4));
    expect(IrisGridUtils.combineFiltersFromList('int', filterList)).toEqual(
      '<=0 && >-15 && !=-942 || 59 || 260'
    );
  });

  it('handles null values correctly', () => {
    const filterList: FilterData[] = [];
    filterList.push(createFilter('greaterThan', 'null', null, 0));
    filterList.push(createFilter('eq', 'null', null, 1));
    filterList.push(createFilter('notEq', 'null', null, 2));
    expect(IrisGridUtils.combineFiltersFromList('string', filterList)).toEqual(
      '>null && !=null || =null'
    );
  });

  it('skips undefined values', () => {
    const filterList: FilterData[] = [];
    filterList.push(createFilter('endsWith', '1', '1', 0));
    filterList.push(createFilter('eq', 'null', null, 1));
    filterList.push(createFilter('notEq', 'anything', undefined, 2));
    expect(IrisGridUtils.combineFiltersFromList('string', filterList)).toEqual(
      '*1 || =null'
    );
  });

  it('returns the char character rather than Unicode value', () => {
    const filterList: FilterData[] = [];
    filterList.push(createFilter('greaterThanOrEqualTo', '105', 105, 0));
    filterList.push(createFilter('lessThan', '74', 74, 1));
    expect(IrisGridUtils.combineFiltersFromList('char', filterList)).toEqual(
      '>=i && <J'
    );
  });
});

describe('convert string to text', () => {
  it('converts null to empty string', () => {
    expect(IrisGridUtils.convertValueToText(null, 'string')).toEqual('');
  });
  it('converts empty string', () => {
    expect(IrisGridUtils.convertValueToText('', 'string')).toEqual('');
  });
  it('converts string to stri', () => {
    expect(IrisGridUtils.convertValueToText('test', 'string')).toEqual('test');
  });
  it('converts length 1 string to stri', () => {
    expect(IrisGridUtils.convertValueToText('t', 'string')).toEqual('t');
  });
  it('converts number to strin', () => {
    expect(IrisGridUtils.convertValueToText(65, 'string')).toEqual('65');
  });
});

describe('convert char to text', () => {
  it('converts number to ascii', () => {
    expect(IrisGridUtils.convertValueToText(65, 'char')).toEqual('A');
  });
  it('converts null to empty char', () => {
    expect(IrisGridUtils.convertValueToText(null, 'char')).toEqual('');
  });
});

describe('convert other column types to text', () => {
  it('converts number to string on number column', () => {
    expect(IrisGridUtils.convertValueToText(65, 'number')).toEqual('65');
  });
  it('converts null to empty string on number column', () => {
    expect(IrisGridUtils.convertValueToText(null, 'number')).toEqual('');
  });
  it('converts time correctly on datetime column', () => {
    expect(
      IrisGridUtils.convertValueToText(
        dh.i18n.DateTimeFormat.parse(
          DateUtils.FULL_DATE_FORMAT,
          '2022-02-03 02:14:59.000000000',
          dh.i18n.TimeZone.getTimeZone('NY')
        ),
        'io.deephaven.time.DateTime'
      )
    ).toEqual('2022-02-03 02:14:59.000');
  });
});
