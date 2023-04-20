import { Table } from '@deephaven/jsapi-shim';
import { TestUtils } from '@deephaven/utils';
import { renderHook } from '@testing-library/react-hooks';
import useSelectDistinctTable from './useSelectDistinctTable';

let table: Table;
let derivedTable: Table;

beforeEach(() => {
  jest.clearAllMocks();

  table = TestUtils.createMockProxy<Table>();
  derivedTable = TestUtils.createMockProxy<Table>();

  (table.selectDistinct as jest.Mock).mockResolvedValue(derivedTable);
});

it('should create and subscribe to a `selectDistinct` derivation of a given table', async () => {
  const { result, waitForNextUpdate } = renderHook(() =>
    useSelectDistinctTable(table)
  );

  expect(result.current.distinctTable).toBeNull();

  await waitForNextUpdate();

  expect(result.current.distinctTable).toBe(derivedTable);
});

it('should safely ignore null table', async () => {
  const { result, waitForNextUpdate } = renderHook(() =>
    useSelectDistinctTable(null)
  );

  expect(result.current.distinctTable).toBeNull();

  await waitForNextUpdate();

  expect(result.current.distinctTable).toBeNull();
});

it('should unsubscribe on unmount', async () => {
  const { unmount, waitForNextUpdate } = renderHook(() =>
    useSelectDistinctTable(table)
  );

  await waitForNextUpdate();

  expect(derivedTable.close).not.toHaveBeenCalled();

  unmount();

  expect(derivedTable.close).toHaveBeenCalled();
});
