import MockTreeGridModel from './MockTreeGridModel';

it('properly reports values after initial creation', () => {
  const model = new MockTreeGridModel();
  expect(model.rowCount).toBe(MockTreeGridModel.DEFAULT_ROW_COUNT);
  expect(model.columnCount).toBe(MockTreeGridModel.DEFAULT_COLUMN_COUNT);
  expect(model.isRowExpandable(0)).toBe(true);
  expect(model.isRowExpanded(0)).toBe(false);
  expect(model.isRowExpandable(model.rowCount - 1)).toBe(true);
  expect(model.textForCell(0, 0)).toBe('0,0');
  expect(model.textForCell(100, 100)).toBe('100,100');
});

it('updates row count properly when expanding/collapsing nested rows', () => {
  const rowCount = 100;
  const childRowCount = 10;
  const maxDepth = 2;
  const model = new MockTreeGridModel({
    rowCount,
    childRowCount,
    maxDepth,
  });
  expect(model.rowCount).toBe(100);
  expect(model.isRowExpandable(10)).toBe(true);
  expect(model.isRowExpanded(10)).toBe(false);
  expect(model.depthForRow(10)).toBe(0);
  expect(model.depthForRow(15)).toBe(0);
  expect(model.depthForRow(18)).toBe(0);

  model.setRowExpanded(10, true);
  expect(model.isRowExpanded(10)).toBe(true);
  expect(model.depthForRow(10)).toBe(0);
  expect(model.depthForRow(15)).toBe(1);
  expect(model.depthForRow(18)).toBe(1);
  expect(model.isRowExpandable(15)).toBe(true);
  expect(model.isRowExpanded(15)).toBe(false);
  expect(model.textForCell(12, 15)).toBe('10.12,4');
  expect(model.textForRowHeader(15)).toBe('10.4');
  expect(model.rowCount).toBe(110);

  model.setRowExpanded(15, true);
  expect(model.isRowExpanded(15)).toBe(true);
  expect(model.depthForRow(10)).toBe(0);
  expect(model.depthForRow(15)).toBe(1);
  expect(model.depthForRow(18)).toBe(2);
  expect(model.isRowExpandable(18)).toBe(false); // past max depth
  expect(model.isRowExpanded(18)).toBe(false);
  expect(model.textForCell(7, 18)).toBe('10.4.7,2');
  expect(model.textForRowHeader(18)).toBe('10.4.2');
  expect(model.rowCount).toBe(120);

  model.setRowExpanded(10, false);
  expect(model.isRowExpanded(10)).toBe(false);
  expect(model.depthForRow(10)).toBe(0);
  expect(model.depthForRow(15)).toBe(0);
  expect(model.depthForRow(18)).toBe(0);
  expect(model.rowCount).toBe(100);
});

it('updates properly when expanding multiple rows at the same level', () => {
  const rowCount = 100;
  const childRowCount = 10;
  const maxDepth = 2;
  const model = new MockTreeGridModel({
    rowCount,
    childRowCount,
    maxDepth,
  });
  expect(model.rowCount).toBe(100);
  expect(model.isRowExpandable(10)).toBe(true);
  expect(model.isRowExpanded(10)).toBe(false);
  expect(model.depthForRow(10)).toBe(0);
  expect(model.depthForRow(50)).toBe(0);
  expect(model.depthForRow(99)).toBe(0);

  model.setRowExpanded(10, true);
  expect(model.isRowExpanded(10)).toBe(true);
  expect(model.isRowExpanded(60)).toBe(false);
  expect(model.isRowExpanded(109)).toBe(false);
  expect(model.depthForRow(10)).toBe(0);
  expect(model.depthForRow(15)).toBe(1);
  expect(model.depthForRow(18)).toBe(1);
  expect(model.depthForRow(60)).toBe(0);
  expect(model.depthForRow(109)).toBe(0);
  expect(model.isRowExpandable(60)).toBe(true);
  expect(model.isRowExpanded(60)).toBe(false);
  expect(model.rowCount).toBe(110);

  model.setRowExpanded(60, true);
  expect(model.isRowExpanded(10)).toBe(true);
  expect(model.isRowExpanded(60)).toBe(true);
  expect(model.isRowExpanded(119)).toBe(false);
  expect(model.depthForRow(10)).toBe(0);
  expect(model.depthForRow(60)).toBe(0);
  expect(model.depthForRow(65)).toBe(1);
  expect(model.depthForRow(119)).toBe(0);
  expect(model.rowCount).toBe(120);

  model.setRowExpanded(119, true);
  expect(model.isRowExpanded(10)).toBe(true);
  expect(model.isRowExpanded(60)).toBe(true);
  expect(model.isRowExpanded(119)).toBe(true);
  expect(model.isRowExpanded(129)).toBe(false);
  expect(model.depthForRow(10)).toBe(0);
  expect(model.depthForRow(15)).toBe(1);
  expect(model.depthForRow(65)).toBe(1);
  expect(model.depthForRow(119)).toBe(0);
  expect(model.depthForRow(124)).toBe(1);
  expect(model.rowCount).toBe(130);

  model.setRowExpanded(60, false);
  expect(model.isRowExpanded(10)).toBe(true);
  expect(model.isRowExpanded(60)).toBe(false);
  expect(model.isRowExpanded(99)).toBe(false);
  expect(model.isRowExpanded(109)).toBe(true);
  expect(model.depthForRow(10)).toBe(0);
  expect(model.depthForRow(15)).toBe(1);
  expect(model.depthForRow(60)).toBe(0);
  expect(model.depthForRow(65)).toBe(0);
  expect(model.depthForRow(109)).toBe(0);
  expect(model.depthForRow(114)).toBe(1);
  expect(model.rowCount).toBe(120);
});
