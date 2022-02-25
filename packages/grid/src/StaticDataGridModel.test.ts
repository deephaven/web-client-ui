import StaticDataGridModel from './StaticDataGridModel';

it('works with an empty array', () => {
  const model = new StaticDataGridModel([]);
  expect(model.columnCount).toBe(0);
  expect(model.rowCount).toBe(0);
});

it('works with a uniform data array', () => {
  const model = new StaticDataGridModel([
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5],
  ]);
  expect(model.rowCount).toBe(3);
  expect(model.columnCount).toBe(5);
});

it('takes the maximum row length for the column count', () => {
  const model = new StaticDataGridModel([[1], [1, 2, 3, 4], [1, 2]]);
  expect(model.rowCount).toBe(3);
  expect(model.columnCount).toBe(4);
});

it('takes the maximum count of headers if more specified than data', () => {
  const model = new StaticDataGridModel(
    [[1], [1, 2, 3, 4], [1, 2]],
    ['A', 'B', 'C', 'D', 'E']
  );
  expect(model.rowCount).toBe(3);
  expect(model.columnCount).toBe(5);
});

it('takes the maximum count of data if more specified than headers', () => {
  const model = new StaticDataGridModel(
    [[1], [1, 2, 3, 4, 5], [1, 2]],
    ['A', 'B', 'C', 'D']
  );
  expect(model.rowCount).toBe(3);
  expect(model.columnCount).toBe(5);
});
