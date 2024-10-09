import { GridRange } from '@deephaven/grid';
import dh from '@deephaven/jsapi-shim';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import { act } from 'react-dom/test-utils';
import IrisGridTestUtils from './IrisGridTestUtils';
import IrisGridTreeTableModel from './IrisGridTreeTableModel';

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
      const table = irisGridTestUtils.makeTreeTable(allColumns, groupedColumns);
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
    const table = irisGridTestUtils.makeTreeTable(columns, groupedColumns);
    const model = new IrisGridTreeTableModel(dh, table);
    expect(() => model.columns[0][method]()).toThrow(
      new Error(`${displayName} not implemented for virtual column`)
    );
  });
});

describe('IrisGridTreeTableModel layoutHints', () => {
  test('null layout hints by default', () => {
    const columns = irisGridTestUtils.makeColumns();
    const table = irisGridTestUtils.makeTreeTable(columns, columns);
    const model = new IrisGridTreeTableModel(dh, table);

    expect(model.layoutHints).toEqual(null);
  });

  test('layoutHints set on tree table', () => {
    const columns = irisGridTestUtils.makeColumns();
    const layoutHints = { hiddenColumns: ['X'], frozenColumns: ['Y'] };
    const table = irisGridTestUtils.makeTreeTable(
      columns,
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
    const table = irisGridTestUtils.makeTreeTable(columns, columns, 100, []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (table as any).layoutHints = undefined;
    const model = new IrisGridTreeTableModel(dh, table);

    expect(model.layoutHints).toEqual(undefined);
  });

  test('layoutHints property does not exist should not crash', () => {
    const columns = irisGridTestUtils.makeColumns();
    const table = irisGridTestUtils.makeTreeTable(columns, columns, 100, []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (table as any).layoutHints;
    const model = new IrisGridTreeTableModel(dh, table);

    expect(model.layoutHints).toEqual(undefined);
  });
});

describe('IrisGridTreeTableModel values table', () => {
  it('is available for tree tables', () => {
    const columns = irisGridTestUtils.makeColumns();
    const table = irisGridTestUtils.makeTreeTable(columns, columns, 100, []);
    const model = new IrisGridTreeTableModel(dh, table);

    expect(model.isValuesTableAvailable).toBe(true);
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
