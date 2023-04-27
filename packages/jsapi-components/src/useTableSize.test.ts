import { act, renderHook } from '@testing-library/react-hooks';
import { Table } from '@deephaven/jsapi-shim';
import { TestUtils } from '@deephaven/utils';
import useTableSize from './useTableSize';
import useTableListener from './useTableListener';

jest.mock('./useTableListener');

beforeEach(() => {
  jest.clearAllMocks();
});

it.each([null, undefined])('should return 0 if no table', table => {
  const { result } = renderHook(() => useTableSize(table));
  expect(result.current).toEqual(0);
});

it('should return the size of the given table', () => {
  const size = 10;
  const table = TestUtils.createMockProxy<Table>({ size });

  const { result } = renderHook(() => useTableSize(table));

  expect(result.current).toEqual(size);
});

it('should re-render if dh.Table.EVENT_SIZECHANGED event occurs', () => {
  const initialSize = 10;
  const table = ({
    addEventListener: jest.fn(),
    size: initialSize,
  } as unknown) as Table;

  const { result } = renderHook(() => useTableSize(table));

  const [, , callback] = TestUtils.extractCallArgs(useTableListener, 0) ?? [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (table as any).size = 4;

  act(() => {
    callback?.({} as CustomEvent);
  });

  expect(result.current).toEqual(4);
});
