import { renderHook } from '@testing-library/react-hooks';
import type { Column, Table } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/utils';
import useGetItemPosition, {
  UseGetItemPositionOptions,
} from './useGetItemPosition';

const { asMock, createMockProxy } = TestUtils;

beforeEach(() => {
  jest.resetAllMocks();
  expect.hasAssertions();
});

describe.each([undefined, 4])('useGetItemPosition: topOffset:%s', topOffset => {
  const table = createMockProxy<Table>();
  const columnName = 'mock.columnName';
  const defaultValue = 'mock.defaultValue';
  const itemHeight = 10;
  const value = 'mock.value';

  const mockResult = {
    column: createMockProxy<Column>(),
    rowIndex: 999,
  };

  const options = {
    table,
    columnName,
    defaultValue,
    itemHeight,
    topOffset,
    value,
  } satisfies UseGetItemPositionOptions;

  beforeEach(() => {
    asMock(table.findColumn)
      .mockName('findColumn')
      .mockReturnValue(mockResult.column);

    asMock(table.seekRow)
      .mockName('seekRow')
      .mockResolvedValue(mockResult.rowIndex);
  });

  it.each([undefined, null])(
    'should return topOffset if table is null or undefined: table:%s',
    async givenTable => {
      const { result } = renderHook(() =>
        useGetItemPosition({
          ...options,
          table: givenTable,
        })
      );

      const actual = await result.current();

      expect(actual).toEqual(options.topOffset ?? 0);
    }
  );

  it.each([options.defaultValue, ''])(
    'should return topOffset when value equals defaultValue or empty string: value:%s',
    async givenValue => {
      const { result } = renderHook(() =>
        useGetItemPosition({
          ...options,
          value: givenValue,
        })
      );

      const actual = await result.current();

      expect(actual).toEqual(options.topOffset ?? 0);
    }
  );

  it.each([
    [undefined, 0],
    [null, 0],
    [defaultValue, 1],
  ])(
    'should create a callback that returns an item position: givenDefaultValue:%s, expectedItemOffset:%s',
    async (givenDefaultValue, expectedItemOffset) => {
      const { result } = renderHook(() =>
        useGetItemPosition({ ...options, defaultValue: givenDefaultValue })
      );

      const actual = await result.current();

      expect(actual).toEqual(
        (mockResult.rowIndex + expectedItemOffset) * options.itemHeight +
          (options.topOffset ?? 0)
      );
    }
  );
});
