import { GridMetricCalculator } from '@deephaven/grid';
import { dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/utils';
import {
  IrisGridMetricCalculator,
  type IrisGridMetricState,
} from './IrisGridMetricCalculator';
import IrisGridModel from './IrisGridModel';

const { createMockProxy } = TestUtils;

function makeColumns(count = 5): dh.Column[] {
  return Array.from({ length: count }, (_, i) =>
    createMockProxy<dh.Column>({
      name: `Column${i + 1}`,
      type: 'java.lang.String',
    })
  );
}

function makeGridMetricState(model: IrisGridModel): IrisGridMetricState {
  return createMockProxy<IrisGridMetricState>({
    model,
    draggingColumn: undefined,
  });
}

// Spy on GridMetricCalculator.getMetrics
jest.spyOn(GridMetricCalculator.prototype, 'getMetrics');

// Spy on GridMetricCalculator.setColumnWidth
jest.spyOn(GridMetricCalculator.prototype, 'setColumnWidth');

describe('IrisGridMetricCalculator', () => {
  let calculator: IrisGridMetricCalculator;
  let model;
  let state: IrisGridMetricState;
  let columns: dh.Column[];

  beforeEach(() => {
    columns = makeColumns();
    model = createMockProxy<IrisGridModel>({
      get columns() {
        return columns;
      },
      getColumnIndexByName: name => {
        const index = columns.findIndex(col => col.name === name);
        return index !== -1 ? index : undefined;
      },
      get columnHeaderGroups() {
        return [];
      },
    });
    calculator = new IrisGridMetricCalculator();
    state = makeGridMetricState(model);
  });

  it('preserves column width based on column name instead of index', () => {
    expect(calculator.getUserColumnWidths().size).toBe(0);

    expect(model.getColumnIndexByName('Column1')).toBe(0);

    // setColumnWidth requires getMetrics call
    calculator.getMetrics(state);
    calculator.setColumnWidth(model.getColumnIndexByName('Column1'), 100);
    calculator.setColumnWidth(model.getColumnIndexByName('Column2'), 200);
    calculator.setColumnWidth(model.getColumnIndexByName('Column3'), 300);

    // Calling getMetrics to update user column widths
    calculator.getMetrics(state);
    expect(calculator.getUserColumnWidths().size).toBe(3);

    // Delete Column2
    columns = columns.filter(col => col.name !== 'Column2');

    expect(state.model.columns[1].name).toBe('Column3');

    calculator.getMetrics(state);
    expect([...calculator.getUserColumnWidths().entries()]).toEqual([
      [0, 100],
      [1, 300],
    ]);

    // Restore Column2
    columns = [
      columns[0],
      createMockProxy<dh.Column>({
        name: 'Column2',
        type: 'java.lang.String',
      }),
      ...columns.slice(1),
    ];

    calculator.getMetrics(state);
    expect([...calculator.getUserColumnWidths().entries()]).toEqual([
      [0, 100],
      [1, 200],
      [2, 300],
    ]);
  });

  it('setColumnWidth updates user column width', () => {
    calculator.getMetrics(state);
    calculator.setColumnWidth(model.getColumnIndexByName('Column1'), 100);

    expect(calculator.getUserColumnWidths().size).toBe(1);
    expect(calculator.getUserColumnWidths().get(0)).toBe(100);

    calculator.setColumnWidth(model.getColumnIndexByName('Column1'), 150);
    expect(calculator.getUserColumnWidths().get(0)).toBe(150);
  });
});
