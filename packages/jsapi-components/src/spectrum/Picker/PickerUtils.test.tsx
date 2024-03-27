import { type dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/utils';
import { getPickerKeyColumn, getPickerLabelColumn } from './PickerUtils';

const { createMockProxy } = TestUtils;

const keyColumn = createMockProxy<dh.Column>({ name: 'keyColumn' });
const labelColumn = createMockProxy<dh.Column>({ name: 'labelColumn' });
const otherColumn = createMockProxy<dh.Column>({ name: 'otherColumn' });

const columns = [keyColumn, labelColumn, otherColumn];

const table = createMockProxy<dh.Table>({
  columns,
  findColumn: jest.fn(
    columnName => columns.find(column => column.name === columnName)!
  ),
});

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('getPickerKeyColumn', () => {
  it.each([
    ['keyColumn', keyColumn],
    [undefined, columns[0]],
  ])(
    'should return the given key column or fallback to the first column',
    (keyColumnName, expectedColumn) => {
      const actual = getPickerKeyColumn(table, keyColumnName);
      expect(actual).toBe(expectedColumn);
    }
  );
});

describe('getPickerLabelColumn', () => {
  it.each([
    ['labelColumn', labelColumn],
    [undefined, keyColumn],
  ])(
    'should return the given label column or fallback to the key column',
    (labelColumnName, expectedColumn) => {
      const actual = getPickerLabelColumn(table, keyColumn, labelColumnName);
      expect(actual).toBe(expectedColumn);
    }
  );
});
