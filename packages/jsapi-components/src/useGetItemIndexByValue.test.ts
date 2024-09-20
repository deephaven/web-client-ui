import { renderHook } from '@testing-library/react-hooks';
import { type dh } from '@deephaven/jsapi-types';
import { type TableUtils } from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/test-utils';
import { useGetItemIndexByValue } from './useGetItemIndexByValue';
import { useTableUtils } from './useTableUtils';

jest.mock('./useTableUtils');

const { asMock, createMockProxy } = TestUtils;

const mock = {
  columnType: 'mock.columnType',
  columnValueType: 'mock.columnValueType',
};

const mockTable = createMockProxy<dh.Table>();
const tableUtils = createMockProxy<TableUtils>();
const column = createMockProxy<dh.Column>({
  type: mock.columnType,
});

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();

  asMock(useTableUtils).mockReturnValue(tableUtils);
  asMock(mockTable.findColumn).mockReturnValue(column);
  asMock(tableUtils.getValueType).mockReturnValue(mock.columnValueType);
});

describe('useGetItemIndexByValue', () => {
  it.each([
    [mockTable, null],
    [null, 'mock.value'],
  ])(
    'should return `null` if the table or value is `null`: table: %s, value: "%s"',
    async (table, value) => {
      const { result } = renderHook(() =>
        useGetItemIndexByValue({
          columnName: 'mock.columnName',
          table,
          value,
        })
      );

      const actual = await result.current();

      expect(mockTable.findColumn).not.toHaveBeenCalled();
      expect(tableUtils.getValueType).not.toHaveBeenCalled();
      expect(mockTable.seekRow).not.toHaveBeenCalled();

      expect(actual).toBeNull();
    }
  );

  it('should throw if seekRow fails', async () => {
    asMock(mockTable.seekRow).mockRejectedValue('Some error');

    const { result } = renderHook(() =>
      useGetItemIndexByValue({
        columnName: 'mock.columnName',
        table: mockTable,
        value: 'mock.value',
      })
    );

    expect(result.current()).rejects.toEqual('Some error');
  });

  it.each([
    ['mock.value', 42, 42],
    ['mock.value', -1, null],
  ])(
    'should return a function that returns the index of the first row containing a column value or `null` if a row is not found: %s, %s, %s',
    async (value, seekRowResult, expected) => {
      const columnName = 'mock.columnName';

      asMock(mockTable.seekRow).mockResolvedValue(seekRowResult);

      const { result } = renderHook(() =>
        useGetItemIndexByValue({
          columnName,
          table: mockTable,
          value,
        })
      );

      expect(useTableUtils).toHaveBeenCalledTimes(1);

      const actual = await result.current();

      expect(mockTable.findColumn).toHaveBeenCalledWith(columnName);
      expect(tableUtils.getValueType).toHaveBeenCalledWith(mock.columnType);
      expect(mockTable.seekRow).toHaveBeenCalledWith(
        0,
        column,
        mock.columnValueType,
        value
      );
      expect(actual).toBe(expected);
    }
  );
});
