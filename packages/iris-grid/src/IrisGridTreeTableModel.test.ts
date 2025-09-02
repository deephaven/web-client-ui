import { act } from '@testing-library/react';
import { GridRange } from '@deephaven/grid';
import dh from '@deephaven/jsapi-shim';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import IrisGridTestUtils from './IrisGridTestUtils';
import IrisGridTableModelTemplate from './IrisGridTableModelTemplate';
import IrisGridTreeTableModel, {
  type UITreeRow,
} from './IrisGridTreeTableModel';
import type { IrisGridThemeType } from './IrisGridTheme';

const irisGridTestUtils = new IrisGridTestUtils(dh);

describe('IrisGridTreeTableModel virtual columns', () => {
  const expectedVirtualColumn = expect.objectContaining({
    constituentType: 'string',
    description: 'Key column',
    displayName: 'Group',
    index: -1,
    isPartitionColumn: false,
    isProxy: true,
    isSortable: false,
    name: '__DH_UI_GROUP__',
    type: 'string',
  });
  const columns = irisGridTestUtils.makeColumns();

  test.each([
    [0, columns, columns],
    [1, columns, columns],
    [2, columns, [expectedVirtualColumn, ...columns]],
    [columns.length, columns, [expectedVirtualColumn, ...columns]],
  ])(
    `create virtual columns with group length %`,
    (groupedLength, allColumns, expected) => {
      const groupedColumns = allColumns.slice(0, groupedLength);
      const table = irisGridTestUtils.makeTreeTable(
        allColumns,
        [],
        groupedColumns
      );
      const model = new IrisGridTreeTableModel(dh, table);
      expect(model.columns).toEqual(expected);
    }
  );

  test.each([
    ['filter', 'Filter'],
    ['sort', 'Sort'],
    ['formatColor', 'Color'],
    ['get', 'get'],
    ['getFormat', 'getFormat'],
    ['formatNumber', 'formatNumber'],
    ['formatDate', 'formatDate'],
  ])('virtual column method %s is not implemented', (method, displayName) => {
    const groupedColumns = columns.slice(0, 2);
    const table = irisGridTestUtils.makeTreeTable(columns, [], groupedColumns);
    const model = new IrisGridTreeTableModel(dh, table);
    expect(() => model.columns[0][method]()).toThrow(
      new Error(`${displayName} not implemented for virtual column`)
    );
  });
});

describe('IrisGridTreeTableModel layoutHints', () => {
  test('null layout hints by default', () => {
    const columns = irisGridTestUtils.makeColumns();
    const table = irisGridTestUtils.makeTreeTable(columns);
    const model = new IrisGridTreeTableModel(dh, table);

    expect(model.layoutHints).toEqual(null);
  });

  test('layoutHints set on tree table', () => {
    const columns = irisGridTestUtils.makeColumns();
    const layoutHints = { hiddenColumns: ['X'], frozenColumns: ['Y'] };
    const table = irisGridTestUtils.makeTreeTable(
      columns,
      [],
      columns,
      100,
      [],
      layoutHints
    );
    const model = new IrisGridTreeTableModel(dh, table);

    expect(model.layoutHints).toEqual(layoutHints);
  });

  test('layoutHints undefined (e.g. not set on the table)', () => {
    const columns = irisGridTestUtils.makeColumns();
    const table = irisGridTestUtils.makeTreeTable(
      columns,
      [],
      columns,
      100,
      []
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (table as any).layoutHints = undefined;
    const model = new IrisGridTreeTableModel(dh, table);

    expect(model.layoutHints).toEqual(undefined);
  });

  test('layoutHints property does not exist should not crash', () => {
    const columns = irisGridTestUtils.makeColumns();
    const table = irisGridTestUtils.makeTreeTable(
      columns,
      [],
      columns,
      100,
      []
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (table as any).layoutHints;
    const model = new IrisGridTreeTableModel(dh, table);

    expect(model.layoutHints).toEqual(undefined);
  });
});

describe('IrisGridTreeTableModel values table', () => {
  it('is available for tree tables', () => {
    const columns = irisGridTestUtils.makeColumns();
    const table = irisGridTestUtils.makeTreeTable(
      columns,
      [],
      columns,
      100,
      []
    );
    const model = new IrisGridTreeTableModel(dh, table);

    expect(model.isValuesTableAvailable).toBe(true);
  });
});

describe('IrisGridTreeTableModel aggregatedColumns getter', () => {
  it('is available for tree tables', () => {
    const columns = irisGridTestUtils.makeColumns(5);
    const aggregatedColumns = columns.slice(1, 3);
    const table = irisGridTestUtils.makeTreeTable(
      columns,
      aggregatedColumns,
      columns,
      100,
      []
    );
    const model = new IrisGridTreeTableModel(dh, table);

    expect(model.isAggregatedColumnsAvailable).toBe(true);
    expect(model.aggregatedColumns).toEqual(aggregatedColumns);
  });
});

describe('IrisGridTreeTableModel isFilterable', () => {
  it('handles grouped, aggregated, and constituent columns correctly', () => {
    const columns = irisGridTestUtils.makeColumns(5);
    const groupedColumns = [columns[0]];
    const aggregatedColumns = columns.slice(2, 4);
    const table = irisGridTestUtils.makeTreeTable(
      columns,
      aggregatedColumns,
      groupedColumns,
      100,
      []
    );
    const model = new IrisGridTreeTableModel(dh, table);
    // No virtual column for a single grouped column
    // Grouped columns are filterable
    expect(model.isFilterable(0)).toBe(true);
    // Non-aggregated column is filterable
    expect(model.isFilterable(1)).toBe(true);
    // Aggregated columns are not filterable
    expect(model.isFilterable(2)).toBe(false);
    expect(model.isFilterable(3)).toBe(false);
    // Non-aggregated column is filterable
    expect(model.isFilterable(4)).toBe(true);
  });

  it('handles virtual, grouped, aggregated, and constituent columns correctly', () => {
    const columns = irisGridTestUtils.makeColumns(5);
    const groupedColumns = columns.slice(0, 2);
    const aggregatedColumns = columns.slice(2, 4);
    const table = irisGridTestUtils.makeTreeTable(
      columns,
      aggregatedColumns,
      groupedColumns,
      100,
      []
    );
    const model = new IrisGridTreeTableModel(dh, table);
    // Virtual column is not filterable
    expect(model.isFilterable(0)).toBe(false);
    // Grouped columns are filterable
    expect(model.isFilterable(1)).toBe(true);
    expect(model.isFilterable(2)).toBe(true);
    // Aggregated columns are not filterable
    expect(model.isFilterable(3)).toBe(false);
    expect(model.isFilterable(4)).toBe(false);
    // Non-aggregated column is filterable
    expect(model.isFilterable(5)).toBe(true);
  });

  it('returns true only for grouped columns when the API does not support aggregatedColumns', () => {
    const columns = irisGridTestUtils.makeColumns(5);
    const groupedColumns = columns.slice(0, 2);
    const table = irisGridTestUtils.makeTreeTable(
      columns,
      [],
      groupedColumns,
      100,
      []
    );
    const model = new IrisGridTreeTableModel(dh, table);
    jest
      .spyOn(model, 'isAggregatedColumnsAvailable', 'get')
      .mockReturnValue(false);
    // Virtual column is not filterable
    expect(model.isFilterable(0)).toBe(false);
    // Grouped columns are filterable
    expect(model.isFilterable(1)).toBe(true);
    expect(model.isFilterable(2)).toBe(true);
    // Rest of the columns are not filterable
    expect(model.isFilterable(3)).toBe(false);
    expect(model.isFilterable(4)).toBe(false);
    expect(model.isFilterable(5)).toBe(false);
  });
});

describe('IrisGridTreeTableModel snapshot', () => {
  it(`doesn't throw if selection extends past the viewport`, async () => {
    function getLastRegisteredEventHandler(
      table: DhType.TreeTable,
      eventName: string
    ): ((event) => void) | undefined {
      return TestUtils.findLastCall(
        table.addEventListener,
        ([name]) => name === eventName
      )?.[1];
    }
    function mockUpdateEvent(
      offset: number,
      rows: DhType.TreeRow[],
      columns: DhType.Column[]
    ): CustomEvent {
      return {
        detail: {
          offset,
          rows,
          columns,
        },
      } as CustomEvent;
    }
    const columns = irisGridTestUtils.makeColumns();
    const table = TestUtils.createMockProxy<DhType.TreeTable>({
      columns,
      groupedColumns: columns,
      size: 100,
    });
    const model = new IrisGridTreeTableModel(dh, table);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    model.addEventListener(IrisGridTreeTableModel.EVENT.UPDATED, () => {});
    model.setViewport(0, 5, columns);
    // Trigger update event to populate viewport data in the model
    const updateEventHandler = getLastRegisteredEventHandler(
      table,
      dh.Table.EVENT_UPDATED
    );
    const row = irisGridTestUtils.makeRow(0);
    const event = mockUpdateEvent(0, Array(6).fill(row), columns);
    act(() => {
      updateEventHandler?.(event);
    });
    // Get the snapshot for rows 2-10 with the viewport at 0-5
    await expect(async () => {
      await model.snapshot([new GridRange(0, 2, 0, 10)]);
    }).not.toThrow();
  });
});

describe('IrisGridTreeTableModel colorForCell', () => {
  let model: IrisGridTreeTableModel;

  const mockTheme: IrisGridThemeType = {
    textColor: '#text-color',
    dateColor: '#date-color',
    positiveNumberColor: '#positive-color',
    negativeNumberColor: '#negative-color',
    zeroNumberColor: '#zero-color',
    nullStringColor: '#null-string-color',
  } as IrisGridThemeType;

  const columns = {
    string: irisGridTestUtils.makeColumn('StrCol', 'java.lang.String', 0),
    number: irisGridTestUtils.makeColumn('NumCol', 'int', 0),
    date: irisGridTestUtils.makeColumn(
      'DateCol',
      'io.deephaven.time.DateTime',
      0
    ),
    dateNamed: irisGridTestUtils.makeColumn('Date', 'java.lang.String', 0),
  };

  const rows = {
    default: {
      data: new Map(),
      hasChildren: false,
      isExpanded: false,
      depth: 1,
    } as UITreeRow,
    parent: {
      data: new Map(),
      hasChildren: true,
      isExpanded: false,
      depth: 1,
    } as UITreeRow,
    leaf: {
      data: new Map(),
      hasChildren: false,
      isExpanded: false,
      depth: 2,
    } as UITreeRow,
  };

  beforeEach(() => {
    const testColumns = irisGridTestUtils.makeColumns();
    const table = irisGridTestUtils.makeTreeTable(
      testColumns,
      testColumns.slice(0, 1),
      testColumns,
      100,
      []
    );
    model = new IrisGridTreeTableModel(dh, table);

    // Setup the basic mocks needed for assertNotNull checks
    jest.spyOn(model, 'sourceColumn').mockReturnValue(columns.string);
    jest.spyOn(model, 'row').mockReturnValue(rows.default);
  });

  const mockCell = (
    value: unknown,
    format?: { color?: string },
    column?: DhType.Column,
    row?: UITreeRow
  ) => {
    if (column) jest.spyOn(model, 'sourceColumn').mockReturnValue(column);
    if (row) jest.spyOn(model, 'row').mockReturnValue(row);
    jest.spyOn(model, 'dataForCell').mockReturnValue({ value, format });
  };

  describe('colorForCell', () => {
    it('returns nullStringColor for null values', () => {
      mockCell(null);
      const result = model.colorForCell(0, 0, mockTheme);
      expect(result).toBe(mockTheme.nullStringColor);
    });

    it('returns nullStringColor for empty strings', () => {
      mockCell('');
      const result = model.colorForCell(0, 0, mockTheme);
      expect(result).toBe(mockTheme.nullStringColor);
    });

    it('returns custom color when available', () => {
      const customColor = '#e0e0e0';
      mockCell('test', { color: customColor });
      const result = model.colorForCell(0, 0, mockTheme);
      expect(result).toBe(customColor);
    });

    it('delegates to IrisGridUtils.colorForValue for standard color logic', () => {
      mockCell(42, undefined, columns.number);
      const result = model.colorForCell(0, 0, mockTheme);
      expect(result).toBe(mockTheme.positiveNumberColor);
    });
  });

  describe('colorForCell constituent type handling', () => {
    it('uses constituent type for tree table leaf nodes', () => {
      const constituentColumn = {
        ...irisGridTestUtils.makeColumn('TestCol', 'java.lang.String', 0),
        constituentType: 'int',
      } as DhType.Column;

      mockCell(1, undefined, constituentColumn, rows.leaf);
      const result = model.colorForCell(0, 0, mockTheme);
      expect(result).toBe(mockTheme.positiveNumberColor);
    });

    it('ignores constituent type for non-leaf nodes', () => {
      const constituentColumn = {
        ...irisGridTestUtils.makeColumn('TestCol', 'java.lang.String', 0),
        constituentType: 'int',
      } as DhType.Column;

      mockCell('test', undefined, constituentColumn, rows.parent);
      const result = model.colorForCell(0, 0, mockTheme);
      expect(result).toBe(mockTheme.textColor);
    });
  });
});

describe('IrisGridTreeTableModel textAlignForCell', () => {
  let model: IrisGridTreeTableModel;

  const rows = {
    default: {
      data: new Map(),
      hasChildren: false,
      isExpanded: false,
      depth: 1,
    } as UITreeRow,
    parent: {
      data: new Map(),
      hasChildren: true,
      isExpanded: false,
      depth: 1,
    } as UITreeRow,
    leaf: {
      data: new Map(),
      hasChildren: false,
      isExpanded: false,
      depth: 2,
    } as UITreeRow,
  };

  beforeEach(() => {
    const testColumns = irisGridTestUtils.makeColumns();
    const table = irisGridTestUtils.makeTreeTable(
      testColumns,
      testColumns.slice(0, 1),
      testColumns,
      100,
      []
    );
    model = new IrisGridTreeTableModel(dh, table);
  });

  it('delegates to IrisGridUtils.textAlignForValue for standard alignment logic', () => {
    const numberColumn = irisGridTestUtils.makeColumn('NumCol', 'int', 0);

    jest.spyOn(model, 'sourceColumn').mockReturnValue(numberColumn);
    jest.spyOn(model, 'row').mockReturnValue(rows.default);

    const result = model.textAlignForCell(0, 0);
    expect(result).toBe('right');
  });

  it('uses constituent type for tree table leaf row', () => {
    const constituentColumn = {
      ...irisGridTestUtils.makeColumn('TestCol', 'java.lang.String', 0),
      constituentType: 'double',
    } as DhType.Column;

    jest.spyOn(model, 'sourceColumn').mockReturnValue(constituentColumn);
    jest.spyOn(model, 'row').mockReturnValue(rows.leaf);

    const result = model.textAlignForCell(0, 0);
    expect(result).toBe('right');
  });

  it('ignores constituent type for non-leaf row', () => {
    const constituentColumn = {
      ...irisGridTestUtils.makeColumn('TestCol', 'java.lang.String', 0),
      constituentType: 'int',
    } as DhType.Column;

    jest.spyOn(model, 'sourceColumn').mockReturnValue(constituentColumn);
    jest.spyOn(model, 'row').mockReturnValue(rows.parent);

    const result = model.textAlignForCell(0, 0);
    expect(result).toBe('left');
  });

  describe('user-defined text alignment', () => {
    let modelWithAlignment: IrisGridTreeTableModel;
    let columnAlignmentMap: Map<string, CanvasTextAlign>;

    beforeEach(() => {
      const testColumns = irisGridTestUtils.makeColumns();
      columnAlignmentMap = new Map<string, CanvasTextAlign>();
      columnAlignmentMap.set('CenterCol', 'center');
      columnAlignmentMap.set('MixedCol', 'center');
      columnAlignmentMap.set('LeftCol', 'left');
      columnAlignmentMap.set('RightCol', 'right');

      const table = irisGridTestUtils.makeTreeTable(
        testColumns,
        testColumns.slice(0, 1),
        testColumns,
        100,
        []
      );
      modelWithAlignment = new IrisGridTreeTableModel(
        dh,
        table,
        undefined,
        null,
        columnAlignmentMap
      );
    });

    it.each([
      ['center', 'CenterCol', 'java.lang.String'],
      ['left', 'LeftCol', 'int'],
      ['right', 'RightCol', 'java.lang.String'],
    ] as const)(
      'uses user-defined %s alignment',
      (expectedAlignment, columnName, columnType) => {
        const testColumn = irisGridTestUtils.makeColumn(
          columnName,
          columnType,
          0
        );

        jest
          .spyOn(modelWithAlignment, 'sourceColumn')
          .mockReturnValue(testColumn);
        jest.spyOn(modelWithAlignment, 'row').mockReturnValue(rows.default);

        const result = modelWithAlignment.textAlignForCell(0, 0);
        expect(result).toBe(expectedAlignment);
      }
    );

    it('falls back to data type alignment', () => {
      const numberColumn = irisGridTestUtils.makeColumn('TestCol', 'int', 0);

      jest
        .spyOn(modelWithAlignment, 'sourceColumn')
        .mockReturnValue(numberColumn);
      jest.spyOn(modelWithAlignment, 'row').mockReturnValue(rows.default);

      const result = modelWithAlignment.textAlignForCell(0, 0);
      expect(result).toBe('right');
    });

    it('overrides constituent type for leaf nodes', () => {
      const constituentColumn = {
        ...irisGridTestUtils.makeColumn('CenterCol', 'java.lang.String', 0),
        constituentType: 'double',
      } as DhType.Column;

      jest
        .spyOn(modelWithAlignment, 'sourceColumn')
        .mockReturnValue(constituentColumn);
      jest.spyOn(modelWithAlignment, 'row').mockReturnValue(rows.leaf);

      const result = modelWithAlignment.textAlignForCell(0, 0);
      expect(result).toBe('center');
    });

    it('overrides number type for both node types', () => {
      const numberColumn = {
        ...irisGridTestUtils.makeColumn('LeftCol', 'int', 0),
        constituentType: 'double',
      } as DhType.Column;

      jest
        .spyOn(modelWithAlignment, 'sourceColumn')
        .mockReturnValue(numberColumn);

      jest.spyOn(modelWithAlignment, 'row').mockReturnValue(rows.parent);
      const parentResult = modelWithAlignment.textAlignForCell(0, 0);
      expect(parentResult).toBe('left');

      jest.spyOn(modelWithAlignment, 'row').mockReturnValue(rows.leaf);
      const leafResult = modelWithAlignment.textAlignForCell(0, 0);
      expect(leafResult).toBe('left');
    });

    it('overrides string type for both node types', () => {
      const stringColumn = {
        ...irisGridTestUtils.makeColumn('RightCol', 'java.lang.String', 0),
        constituentType: 'java.lang.String',
      } as DhType.Column;

      jest
        .spyOn(modelWithAlignment, 'sourceColumn')
        .mockReturnValue(stringColumn);

      jest.spyOn(modelWithAlignment, 'row').mockReturnValue(rows.parent);
      const parentResult = modelWithAlignment.textAlignForCell(0, 0);
      expect(parentResult).toBe('right');

      jest.spyOn(modelWithAlignment, 'row').mockReturnValue(rows.leaf);
      const leafResult = modelWithAlignment.textAlignForCell(0, 0);
      expect(leafResult).toBe('right');
    });

    it('applies consistently to all cells', () => {
      const mixedTypeColumn = {
        ...irisGridTestUtils.makeColumn('MixedCol', 'int', 0),
        constituentType: 'java.lang.String',
      } as DhType.Column;

      jest
        .spyOn(modelWithAlignment, 'sourceColumn')
        .mockReturnValue(mixedTypeColumn);

      jest.spyOn(modelWithAlignment, 'row').mockReturnValue(rows.parent);
      const parentResult = modelWithAlignment.textAlignForCell(0, 0);
      expect(parentResult).toBe('center');

      jest.spyOn(modelWithAlignment, 'row').mockReturnValue(rows.leaf);
      const leafResult = modelWithAlignment.textAlignForCell(0, 0);
      expect(leafResult).toBe('center');
    });
  });
});

describe('IrisGridTreeTableModel textForCell', () => {
  let model: IrisGridTreeTableModel;

  const columns = {
    string: irisGridTestUtils.makeColumn('StrCol', 'java.lang.String', 0),
    stringColWithStringConstituent: {
      ...irisGridTestUtils.makeColumn('StrCol', 'java.lang.String', 0),
      constituentType: 'java.lang.String',
    },
    stringColWithIntConstituent: {
      ...irisGridTestUtils.makeColumn('IntCol', 'int', 0),
      constituentType: 'int',
    } as DhType.Column,
  };

  const rows = {
    leaf: {
      data: new Map(),
      hasChildren: false,
      isExpanded: false,
      depth: 2,
    } as UITreeRow,
    parent: {
      data: new Map(),
      hasChildren: true,
      isExpanded: false,
      depth: 1,
    } as UITreeRow,
  };

  beforeEach(() => {
    const testColumns = irisGridTestUtils.makeColumns();
    const table = irisGridTestUtils.makeTreeTable(
      testColumns,
      testColumns.slice(0, 1),
      testColumns,
      100,
      []
    );
    model = new IrisGridTreeTableModel(dh, table);
  });

  const mockTextCell = (
    value: unknown,
    column: DhType.Column,
    row: UITreeRow,
    displayText?: string
  ) => {
    jest.spyOn(model, 'sourceColumn').mockReturnValue(column);
    jest.spyOn(model, 'row').mockReturnValue(row);
    jest.spyOn(model, 'valueForCell').mockReturnValue(value);
    if (displayText !== undefined) {
      jest.spyOn(model, 'displayString').mockReturnValue(displayText);
    }
  };

  describe('leaf nodes with non-string constituent type', () => {
    it('handles null values', () => {
      jest
        .spyOn(model, 'columns', 'get')
        .mockReturnValue([columns.stringColWithIntConstituent]);
      mockTextCell(null, columns.stringColWithIntConstituent, rows.leaf, '');
      const result = model.textForCell(0, 0);
      expect(result).toBe('');
    });

    it('handles normal values', () => {
      jest
        .spyOn(model, 'columns', 'get')
        .mockReturnValue([columns.stringColWithIntConstituent]);
      mockTextCell(21, columns.stringColWithIntConstituent, rows.leaf, '21');
      const result = model.textForCell(0, 0);
      expect(result).toBe('21');
    });
  });

  describe('leaf nodes with formatter settings', () => {
    beforeEach(() => {
      jest.spyOn(model, 'columns', 'get').mockReturnValue([columns.string]);
    });

    it('shows "null" when showNullStrings is true', () => {
      model.formatter.showNullStrings = true;
      mockTextCell(null, columns.stringColWithIntConstituent, rows.leaf, '');
      const result = model.textForCell(0, 0);
      expect(result).toBe('null');
    });

    it('shows empty string when showNullStrings is false', () => {
      model.formatter.showNullStrings = false;
      mockTextCell(null, columns.stringColWithIntConstituent, rows.leaf, '');
      const result = model.textForCell(0, 0);
      expect(result).toBe('');
    });

    it('shows "empty" when showEmptyStrings is true', () => {
      model.formatter.showEmptyStrings = true;
      mockTextCell('', columns.stringColWithIntConstituent, rows.leaf, '');
      const result = model.textForCell(0, 0);
      expect(result).toBe('empty');
    });

    it('shows empty string when showEmptyStrings is false', () => {
      model.formatter.showEmptyStrings = false;
      mockTextCell('', columns.stringColWithIntConstituent, rows.leaf, '');
      const result = model.textForCell(0, 0);
      expect(result).toBe('');
    });
  });

  describe('grouping column', () => {
    it('shows empty string for null values in rollup grouping columns', () => {
      Object.defineProperty(model.table, 'groupedColumns', {
        value: [],
      });
      jest
        .spyOn(model, 'getCachedGroupedColumnSet')
        .mockReturnValue(new Set([0]));
      mockTextCell(null, columns.string, { ...rows.parent, depth: 1 });
      const result = model.textForCell(0, 0);
      expect(result).toBe('');
    });
  });

  describe('non-leaf nodes', () => {
    it('delegates to superClass for parent nodes', () => {
      jest
        .spyOn(IrisGridTableModelTemplate.prototype, 'textForCell')
        .mockReturnValue('parentString');
      mockTextCell(
        'parentString',
        columns.stringColWithIntConstituent,
        rows.parent,
        'parentString'
      );
      const result = model.textForCell(0, 0);
      expect(result).toBe('parentString');
    });
  });
});
