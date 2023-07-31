import { act, renderHook } from '@testing-library/react-hooks';
import dh from '@deephaven/jsapi-shim';
import type { Table } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/utils';
import useTableSize from './useTableSize';
import useTableListener from './useTableListener';
import { makeApiContextWrapper } from './HookTestUtils';

jest.mock('./useTableListener');

const wrapper = makeApiContextWrapper(dh);

beforeEach(() => {
  jest.clearAllMocks();
});

it.each([null, undefined])('should return 0 if no table', table => {
  const { result } = renderHook(() => useTableSize(table), { wrapper });
  expect(result.current).toEqual(0);
});

it('should return the size of the given table', () => {
  const size = 10;
  const table = TestUtils.createMockProxy<Table>({ size });

  const { result } = renderHook(() => useTableSize(table), { wrapper });

  expect(result.current).toEqual(size);
});

it('should re-render if dh.Table.EVENT_SIZECHANGED event occurs', () => {
  const initialSize = 10;
  const table = {
    addEventListener: jest.fn(),
    size: initialSize,
  } as unknown as Table;

  const { result } = renderHook(() => useTableSize(table), { wrapper });

  const [eventEmitter, eventName, onSizeChangeHandler] =
    TestUtils.extractCallArgs(useTableListener, 0) ?? [];

  expect(eventEmitter).toBe(table);
  expect(eventName).toEqual(dh.Table.EVENT_SIZECHANGED);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (table as any).size = 4;

  act(() => {
    onSizeChangeHandler?.({} as CustomEvent);
  });

  expect(result.current).toEqual(4);
});
