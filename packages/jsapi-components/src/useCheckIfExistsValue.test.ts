import { act, renderHook, waitFor } from '@testing-library/react';
import { type dh } from '@deephaven/jsapi-types';
import { type TableUtils } from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/test-utils';
import useCheckIfExistsValue from './useCheckIfExistsValue';
import useTableUtils from './useTableUtils';

jest.mock('@deephaven/jsapi-utils');
jest.mock('./useTableUtils');

const { asMock, createMockProxy } = TestUtils;

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

afterEach(() => {
  jest.useRealTimers();
});

describe.each([true, false])('useCheckIfExistsValue: %s', valueExists => {
  const mock = {
    table: createMockProxy<dh.Table>(),
    tableUtils: createMockProxy<TableUtils>(),
    columnNames: ['mock.columnA', 'mock.columnB'],
    debounceMs: 500,
  };

  function completeDebounce() {
    act(() => {
      jest.advanceTimersByTime(mock.debounceMs);
    });
  }

  beforeEach(() => {
    asMock(useTableUtils)
      .mockName('useTableUtils')
      .mockReturnValue(mock.tableUtils);

    asMock(mock.tableUtils.doesColumnValueExist).mockResolvedValue(valueExists);
  });

  it.each([true, false])(
    'should check if value exists and return result: isCaseSensitive:%s',
    async isCaseSensitive => {
      const { result } = renderHook(() =>
        useCheckIfExistsValue(
          mock.table,
          mock.columnNames,
          mock.debounceMs,
          isCaseSensitive
        )
      );
      await waitFor(() =>
        expect(mock.tableUtils.doesColumnValueExist).toHaveBeenCalled()
      );

      expect(mock.tableUtils.doesColumnValueExist).toHaveBeenCalledWith(
        mock.table,
        mock.columnNames,
        '',
        isCaseSensitive
      );

      expect(result.current).toEqual({
        valueTrimmed: '',
        valueTrimmedDebounced: '',
        valueExists,
        trimAndUpdateValue: expect.any(Function),
      });
    }
  );

  it('should treat valueExists as indeterminant while value check is pending', async () => {
    // eslint-disable-next-line no-promise-executor-return
    const unresolvedPromise = new Promise<boolean>(() => undefined);
    asMock(mock.tableUtils.doesColumnValueExist).mockReturnValue(
      unresolvedPromise
    );

    const { result } = renderHook(() =>
      useCheckIfExistsValue(mock.table, mock.columnNames, mock.debounceMs, true)
    );
    await waitFor(() =>
      expect(result.current).toMatchObject({
        valueExists: null,
        valueTrimmed: '',
        valueTrimmedDebounced: '',
      })
    );
  });

  it('should trim search text and treat valueExists as indeterminant while debouncing', async () => {
    jest.useFakeTimers();

    const { result } = renderHook(() =>
      useCheckIfExistsValue(mock.table, mock.columnNames, mock.debounceMs, true)
    );

    completeDebounce();

    act(() => result.current.trimAndUpdateValue('  blah  '));

    // While text change debounce is still settling
    expect(result.current).toMatchObject({
      valueExists: null,
      valueTrimmed: 'blah',
      valueTrimmedDebounced: '',
    });

    completeDebounce();
    await waitFor(() =>
      expect(result.current).toMatchObject({
        valueExists,
        valueTrimmed: 'blah',
        valueTrimmedDebounced: 'blah',
      })
    );
  });
});
