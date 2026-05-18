import { act, renderHook, waitFor } from '@testing-library/react';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { usePickerItemScale } from '@deephaven/components';
import { TableUtils } from '@deephaven/jsapi-utils';
import { usePromiseFactory } from '@deephaven/react-hooks';
import { TestUtils } from '@deephaven/test-utils';
import { useMultiPickerProps } from './useMultiPickerProps';
import { getItemKeyColumn, getItemLabelColumn } from './itemUtils';
import { useItemRowDeserializer } from './useItemRowDeserializer';
import useSearchableViewportData from '../../useSearchableViewportData';
import useFormatter from '../../useFormatter';
import useTableUtils from '../../useTableUtils';

jest.mock('@deephaven/components', () => ({
  ...jest.requireActual('@deephaven/components'),
  usePickerItemScale: jest.fn(),
}));
jest.mock('@deephaven/jsapi-bootstrap', () => ({
  useApi: jest.fn(),
}));
jest.mock('@deephaven/jsapi-utils', () => ({
  ...jest.requireActual('@deephaven/jsapi-utils'),
  TableUtils: { copyTableAndApplyFilters: jest.fn() },
}));
jest.mock('@deephaven/react-hooks', () => ({
  ...jest.requireActual('@deephaven/react-hooks'),
  usePromiseFactory: jest.fn(),
}));
jest.mock('./itemUtils');
jest.mock('./useItemRowDeserializer');
jest.mock('../../useSearchableViewportData');
jest.mock('../../useFormatter');
jest.mock('../../useTableUtils');
jest.mock('../../useWidgetClose');

const { asMock, createMockProxy } = TestUtils;

// Re-import useApi so we can configure its return value
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useApi } = require('@deephaven/jsapi-bootstrap');

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('useMultiPickerProps - snapshot selected key labels', () => {
  const mockTable = createMockProxy<DhType.Table>({
    columns: [
      createMockProxy<DhType.Column>({ name: 'Key', type: 'String' }),
      createMockProxy<DhType.Column>({ name: 'Label', type: 'String' }),
    ],
  });
  const mockKeyColumn = createMockProxy<DhType.Column>({
    name: 'Key',
    type: 'String',
  });
  const mockLabelColumn = createMockProxy<DhType.Column>({
    name: 'Label',
    type: 'String',
  });
  const mockTableUtils = createMockProxy<TableUtils>();
  const mockRangeSetOfItems = jest.fn().mockReturnValue('mockRangeSet');
  const mockDh = {
    RangeSet: { ofItems: mockRangeSetOfItems },
  } as unknown as typeof DhType;

  function setupMocks() {
    asMock(usePickerItemScale).mockReturnValue({ itemHeight: 32 });
    asMock(usePromiseFactory).mockReturnValue({ data: mockTable });
    asMock(getItemKeyColumn).mockReturnValue(mockKeyColumn);
    asMock(getItemLabelColumn).mockReturnValue(mockLabelColumn);
    asMock(useFormatter).mockReturnValue({
      getFormattedString: jest.fn(),
      timeZone: 'UTC',
    });
    asMock(useTableUtils).mockReturnValue(mockTableUtils);
    asMock(useApi).mockReturnValue(mockDh);
    asMock(useItemRowDeserializer).mockReturnValue(
      jest.fn(row => ({
        key: row.key,
        content: row.label,
        textValue: row.label,
      }))
    );
    asMock(useSearchableViewportData).mockReturnValue({
      onScroll: jest.fn(),
      onSearchTextChange: jest.fn(),
      viewportData: { items: [] },
    });

    mockTable.findColumn.mockReturnValue(mockKeyColumn);
    mockTableUtils.getValueType.mockReturnValue('String');
  }

  function makeProps(
    overrides: {
      selectedKeys?: 'all' | Iterable<string>;
      defaultSelectedKeys?: 'all' | Iterable<string>;
    } = {}
  ) {
    return {
      table: createMockProxy<DhType.Table>(),
      ...overrides,
    };
  }

  /**
   * Helper to configure seekRow and createSnapshot mocks for given key-label
   * pairs. Each key maps to a synthetic row index (position in the array).
   */
  function mockSnapshotForKeys(
    entries: Array<{ key: string; label: string; index: number }>
  ) {
    mockTable.seekRow.mockImplementation(async (_start, _col, _type, key) => {
      const entry = entries.find(e => e.key === String(key));
      return entry ? entry.index : -1;
    });

    const mockRows = entries.map(e => ({ key: e.key, label: e.label }));

    mockTable.createSnapshot.mockResolvedValue({
      rows: mockRows,
    });

    asMock(useItemRowDeserializer).mockReturnValue(
      jest.fn(row => ({
        key: (row as { key: string }).key,
        content: (row as { label: string }).label,
        textValue: (row as { label: string }).label,
      }))
    );
  }

  it('should snapshot selected keys on mount', async () => {
    setupMocks();
    mockSnapshotForKeys([
      { key: 'A', label: 'Label A', index: 5 },
      { key: 'B', label: 'Label B', index: 10 },
    ]);

    const { result } = renderHook(() =>
      useMultiPickerProps(makeProps({ selectedKeys: ['A', 'B'] }))
    );

    await waitFor(() => {
      expect(mockTable.seekRow).toHaveBeenCalled();
    });

    // Each of the 2 keys should have been sought
    const seekedKeys = mockTable.seekRow.mock.calls.map(
      (call: unknown[]) => call[3]
    );
    expect(seekedKeys).toContain('A');
    expect(seekedKeys).toContain('B');

    expect(mockTable.createSnapshot).toHaveBeenCalled();
    expect(result.current.normalizedItems).toBeDefined();
  });

  it('should not snapshot when selectedKeys is null', async () => {
    setupMocks();
    mockSnapshotForKeys([]);

    renderHook(() => useMultiPickerProps(makeProps()));

    // Give effects a chance to run
    await waitFor(() => {
      expect(mockTable.seekRow).not.toHaveBeenCalled();
    });

    expect(mockTable.createSnapshot).not.toHaveBeenCalled();
  });

  it('should not snapshot when selectedKeys is "all"', async () => {
    setupMocks();
    mockSnapshotForKeys([]);

    renderHook(() => useMultiPickerProps(makeProps({ selectedKeys: 'all' })));

    await waitFor(() => {
      expect(mockTable.seekRow).not.toHaveBeenCalled();
    });

    expect(mockTable.createSnapshot).not.toHaveBeenCalled();
  });

  it('should not snapshot when selectedKeys is empty', async () => {
    setupMocks();
    mockSnapshotForKeys([]);

    renderHook(() => useMultiPickerProps(makeProps({ selectedKeys: [] })));

    await waitFor(() => {
      expect(mockTable.seekRow).not.toHaveBeenCalled();
    });

    expect(mockTable.createSnapshot).not.toHaveBeenCalled();
  });

  it('should snapshot newly added keys when selection grows', async () => {
    setupMocks();
    mockSnapshotForKeys([{ key: 'A', label: 'Label A', index: 5 }]);

    const { rerender } = renderHook(
      ({ selectedKeys }) => useMultiPickerProps(makeProps({ selectedKeys })),
      { initialProps: { selectedKeys: ['A'] as string[] } }
    );

    // Wait for first snapshot to complete
    await waitFor(() => {
      expect(mockTable.seekRow).toHaveBeenCalledTimes(1);
    });
    expect(mockTable.createSnapshot).toHaveBeenCalledTimes(1);

    // Now add key 'B' to the selection
    mockSnapshotForKeys([
      { key: 'A', label: 'Label A', index: 5 },
      { key: 'B', label: 'Label B', index: 10 },
    ]);

    await act(async () => {
      rerender({ selectedKeys: ['A', 'B'] });
    });

    // Should seek only the new key 'B' (key 'A' was already snapshotted)
    await waitFor(() => {
      // The second render's seekRow should only be for key 'B'
      const seekCalls = mockTable.seekRow.mock.calls;
      const lastKey = seekCalls[seekCalls.length - 1]?.[3];
      expect(lastKey).toBe('B');
    });
  });

  it('should snapshot keys that arrive after initially empty selection', async () => {
    setupMocks();
    mockSnapshotForKeys([]);

    const { rerender } = renderHook(
      ({ selectedKeys }) => useMultiPickerProps(makeProps({ selectedKeys })),
      { initialProps: { selectedKeys: [] as string[] } }
    );

    // No snapshot should happen with empty selection
    await waitFor(() => {
      expect(mockTable.seekRow).not.toHaveBeenCalled();
    });

    // Now set selection to have keys
    mockSnapshotForKeys([{ key: 'X', label: 'Label X', index: 3 }]);

    await act(async () => {
      rerender({ selectedKeys: ['X'] });
    });

    // Should now snapshot the new key
    await waitFor(() => {
      expect(mockTable.seekRow).toHaveBeenCalled();
    });

    expect(mockTable.createSnapshot).toHaveBeenCalled();
  });

  it('should reset and re-snapshot when table changes', async () => {
    setupMocks();
    mockSnapshotForKeys([{ key: 'A', label: 'Label A', index: 5 }]);

    const { rerender } = renderHook(
      ({ selectedKeys }) => useMultiPickerProps(makeProps({ selectedKeys })),
      { initialProps: { selectedKeys: ['A'] as string[] } }
    );

    await waitFor(() => {
      expect(mockTable.createSnapshot).toHaveBeenCalledTimes(1);
    });

    // Simulate table change by returning a new table from usePromiseFactory.
    // The hook's reset effect clears the snapshotted keys set, so key 'A'
    // should be snapshotted again against the new table.
    const newMockTable = createMockProxy<DhType.Table>({
      columns: mockTable.columns,
    });
    newMockTable.findColumn.mockReturnValue(mockKeyColumn);
    newMockTable.seekRow.mockResolvedValue(2);
    newMockTable.createSnapshot.mockResolvedValue({
      rows: [{ key: 'A', label: 'New Label A' }],
    });
    asMock(usePromiseFactory).mockReturnValue({ data: newMockTable });
    asMock(getItemKeyColumn).mockReturnValue(mockKeyColumn);
    asMock(getItemLabelColumn).mockReturnValue(mockLabelColumn);

    await act(async () => {
      rerender({ selectedKeys: ['A'] });
    });

    // After table change, key 'A' should be re-snapshotted from the new table
    await waitFor(() => {
      expect(newMockTable.seekRow).toHaveBeenCalled();
    });

    expect(newMockTable.createSnapshot).toHaveBeenCalled();
  });

  it('should merge snapshot data from incremental selections', async () => {
    setupMocks();
    mockSnapshotForKeys([{ key: 'A', label: 'Label A', index: 5 }]);

    const { rerender } = renderHook(
      ({ selectedKeys }) => useMultiPickerProps(makeProps({ selectedKeys })),
      { initialProps: { selectedKeys: ['A'] as string[] } }
    );

    await waitFor(() => {
      expect(mockTable.createSnapshot).toHaveBeenCalledTimes(1);
    });

    // Add key 'B' - snapshot data should merge, not replace
    mockSnapshotForKeys([{ key: 'B', label: 'Label B', index: 10 }]);
    // Reset seekRow to only return index for 'B'
    mockTable.seekRow.mockImplementation(async (_start, _col, _type, key) => {
      if (String(key) === 'B') return 10;
      return -1;
    });
    mockTable.createSnapshot.mockResolvedValue({
      rows: [{ key: 'B', label: 'Label B' }],
    });

    await act(async () => {
      rerender({ selectedKeys: ['A', 'B'] });
    });

    await waitFor(() => {
      // createSnapshot should be called again for key 'B'
      expect(mockTable.createSnapshot).toHaveBeenCalledTimes(2);
    });
  });
});
