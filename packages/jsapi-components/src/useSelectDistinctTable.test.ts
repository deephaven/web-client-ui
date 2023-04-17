import { Table } from '@deephaven/jsapi-shim';
import { renderHook } from '@testing-library/react-hooks';
import useSelectDistinctTable from './useSelectDistinctTable';

/** Create a mock Table with minimal methods for our tests. */
function mockTable(): Table {
  const selectDistinct: Table['selectDistinct'] = jest.fn();
  const findColumns: Table['findColumns'] = jest.fn();
  const close: Table['close'] = jest.fn();

  return {
    selectDistinct,
    findColumns,
    close,
  } as Table;
}

let table: Table;
let derivedTable: Table;

beforeEach(() => {
  jest.clearAllMocks();

  table = mockTable();
  derivedTable = mockTable();

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
