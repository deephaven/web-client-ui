import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PluginType,
  type WidgetMiddlewarePlugin,
  type WidgetMiddlewareComponentProps,
  type WidgetMiddlewarePanelProps,
} from '@deephaven/plugin';
import { type dh } from '@deephaven/jsapi-types';
import {
  Button,
  ConfirmationDialog,
  DialogTrigger,
  SpectrumButton,
  Text,
} from '@deephaven/components';
import { vsEdit, vsHistory, vsTrash } from '@deephaven/icons';
import { usePersistentState } from '@deephaven/dashboard';
import {
  type TableOption,
  type TableOptionPanelProps,
  type GridStateSnapshot,
  useTableOptionsHost,
  defaultTableOptionsRegistry,
  IrisGridUtils,
  type DehydratedIrisGridState,
  type DehydratedGridState,
} from '@deephaven/iris-grid';

/**
 * Dehydrated (JSON-serializable) snapshot of table state.
 * Stored via usePersistentState for cross-session persistence.
 * Uses the same structure as IrisGridUtils dehydration for proper hydration.
 */
interface DehydratedStateSnapshot {
  /** Unique identifier */
  id: string;
  /** When the snapshot was taken (ISO string for JSON serialization) */
  timestamp: string;
  /** User-defined name for the snapshot (optional) */
  name?: string;
  /** Dehydrated IrisGrid state (filters, sorts, custom columns, etc.) */
  irisGridState: Partial<DehydratedIrisGridState>;
  /** Dehydrated Grid state (movedColumns, movedRows, etc.) */
  gridState: Partial<DehydratedGridState>;
}

/**
 * Persisted state structure for the Table History plugin.
 */
interface TableHistoryPersistedState {
  snapshots: DehydratedStateSnapshot[];
}

/**
 * Custom option type for the Table History plugin.
 */
const TABLE_HISTORY_OPTION_TYPE = 'table-history-option';

/**
 * Dehydrates current grid state to a JSON-serializable snapshot.
 * Uses IrisGridUtils dehydration methods for proper serialization.
 */
function dehydrateSnapshot(
  gridState: GridStateSnapshot,
  irisGridUtils: IrisGridUtils
): Omit<DehydratedStateSnapshot, 'id' | 'timestamp' | 'name'> {
  const { model, quickFilters, advancedFilters, sorts } = gridState;
  const { columns } = model;

  // Dehydrate IrisGrid state (filters, sorts, custom columns, etc.)
  const irisGridDehydrated: Partial<DehydratedIrisGridState> = {
    quickFilters: IrisGridUtils.dehydrateQuickFilters(quickFilters),
    advancedFilters: irisGridUtils.dehydrateAdvancedFilters(
      columns,
      advancedFilters
    ),
    sorts: IrisGridUtils.dehydrateSort(sorts),
    reverse: gridState.reverse,
    searchValue: gridState.searchValue,
    selectedSearchColumns: [...gridState.selectedSearchColumns],
    invertSearchColumns: gridState.invertSearchColumns,
    selectDistinctColumns: [...gridState.selectDistinctColumns],
    customColumns: [...gridState.customColumns],
  };

  // Dehydrate Grid state (movedColumns)
  // Use dehydrateGridState to properly convert column indices to names
  const gridDehydrated = IrisGridUtils.dehydrateGridState(model, {
    isStuckToBottom: false,
    isStuckToRight: false,
    movedColumns: [...gridState.movedColumns],
    movedRows: [],
  });

  return {
    irisGridState: irisGridDehydrated,
    gridState: gridDehydrated,
  };
}

/**
 * Formats a timestamp string for display.
 */
function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Table History panel that allows saving and restoring table state snapshots.
 */
function TableHistoryPanel(_props: TableOptionPanelProps): JSX.Element {
  const { gridState, dispatch } = useTableOptionsHost();
  const { model } = gridState;

  // Create IrisGridUtils instance for hydration/dehydration
  const irisGridUtils = useMemo(() => new IrisGridUtils(model.dh), [model.dh]);

  // Persist snapshots across sessions
  const [state, setState] = usePersistentState<TableHistoryPersistedState>(
    { snapshots: [] },
    {
      type: 'TableHistoryPlugin',
      version: 1,
      deleteOnUnmount: false, // Keep snapshots when panel is closed
    }
  );

  const { snapshots } = state;

  const handleSaveSnapshot = useCallback(() => {
    const snapshot: DehydratedStateSnapshot = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...dehydrateSnapshot(gridState, irisGridUtils),
    };
    setState(prev => ({
      snapshots: [...prev.snapshots, snapshot],
    }));
  }, [gridState, irisGridUtils, setState]);

  const handleRestoreSnapshot = useCallback(
    (snapshot: DehydratedStateSnapshot) => {
      // Use RESTORE_DEHYDRATED_STATE action which handles hydration properly,
      // including graceful handling of missing columns when the table structure
      // has changed (e.g., columns hidden via Organize Columns).
      dispatch({
        type: 'RESTORE_DEHYDRATED_STATE',
        irisGridState: snapshot.irisGridState,
        gridState: snapshot.gridState,
      });

      // Stay on the Table History screen after restoring
    },
    [dispatch]
  );

  const handleDeleteSnapshot = useCallback(
    (id: string) => {
      setState(prev => ({
        snapshots: prev.snapshots.filter(s => s.id !== id),
      }));
    },
    [setState]
  );

  const handleClearAll = useCallback(() => {
    setState({ snapshots: [] });
  }, [setState]);

  /**
   * Reset the table to its initial state.
   * Clears all filters, sorts, search, select distinct, custom columns,
   * and column re-ordering, restoring the table to its default view.
   */
  const handleResetTable = useCallback(() => {
    // Clear select distinct columns first (triggers handler that resets other state)
    dispatch({
      type: 'SET_SELECT_DISTINCT_COLUMNS',
      columns: [],
    });

    // Clear custom columns
    dispatch({
      type: 'SET_CUSTOM_COLUMNS',
      columns: [],
    });

    // Clear all filters
    dispatch({
      type: 'SET_QUICK_FILTERS',
      filters: new Map(),
    });
    dispatch({
      type: 'SET_ADVANCED_FILTERS',
      filters: new Map(),
    });

    // Clear search
    dispatch({
      type: 'SET_CROSS_COLUMN_SEARCH',
      searchValue: '',
      selectedSearchColumns: [],
      invertSearchColumns: false,
    });

    // Clear sorts and reverse
    dispatch({ type: 'SET_SORTS', sorts: [] });
    dispatch({ type: 'SET_REVERSE', reverse: false });

    // Reset column order
    dispatch({
      type: 'SET_MOVED_COLUMNS',
      columns: [],
    });
  }, [dispatch]);

  // State for inline editing of snapshot names
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = useCallback((snapshot: DehydratedStateSnapshot) => {
    setEditingId(snapshot.id);
    setEditValue(snapshot.name ?? '');
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingId == null) return;
    setState(prev => ({
      snapshots: prev.snapshots.map(s =>
        s.id === editingId ? { ...s, name: editValue.trim() || undefined } : s
      ),
    }));
    setEditingId(null);
    setEditValue('');
  }, [editingId, editValue, setState]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValue('');
  }, []);

  // Compute what has changed since the last saved snapshot
  const changedProperties = useMemo(() => {
    const lastSnapshot = snapshots[snapshots.length - 1];
    if (lastSnapshot == null) {
      return null; // No previous snapshot to compare against
    }

    const currentDehydrated = dehydrateSnapshot(gridState, irisGridUtils);
    const currentIris = currentDehydrated.irisGridState;
    const currentGrid = currentDehydrated.gridState;

    // Handle backward compatibility with old snapshot format
    // Old format had properties at top level, new format nests them in irisGridState/gridState
    const lastIris = lastSnapshot.irisGridState ?? {};
    const lastGrid = lastSnapshot.gridState ?? {};
    const changes: string[] = [];

    // Compare sorts
    const sortsChanged =
      JSON.stringify(currentIris.sorts) !== JSON.stringify(lastIris.sorts);
    if (sortsChanged && currentIris.sorts != null) {
      changes.push(`Sorts: ${currentIris.sorts.length} column(s)`);
    }

    // Compare quick filters
    const quickFiltersChanged =
      JSON.stringify(currentIris.quickFilters) !==
      JSON.stringify(lastIris.quickFilters);
    if (quickFiltersChanged && currentIris.quickFilters != null) {
      changes.push(
        `Quick Filters: ${currentIris.quickFilters.length} filter(s)`
      );
    }

    // Compare advanced filters
    const advancedFiltersChanged =
      JSON.stringify(currentIris.advancedFilters) !==
      JSON.stringify(lastIris.advancedFilters);
    if (advancedFiltersChanged && currentIris.advancedFilters != null) {
      changes.push(
        `Advanced Filters: ${currentIris.advancedFilters.length} filter(s)`
      );
    }

    // Compare search
    if (currentIris.searchValue !== lastIris.searchValue) {
      const searchDisplay =
        currentIris.searchValue != null && currentIris.searchValue.length > 0
          ? currentIris.searchValue
          : '(empty)';
      changes.push(`Search: "${searchDisplay}"`);
    }

    // Compare reverse
    if (currentIris.reverse !== lastIris.reverse) {
      changes.push(`Reverse: ${currentIris.reverse}`);
    }

    // Compare select distinct
    const selectDistinctChanged =
      JSON.stringify(currentIris.selectDistinctColumns) !==
      JSON.stringify(lastIris.selectDistinctColumns);
    if (selectDistinctChanged && currentIris.selectDistinctColumns != null) {
      changes.push(
        `Select Distinct: ${currentIris.selectDistinctColumns.length} column(s)`
      );
    }

    // Compare custom columns
    const customColumnsChanged =
      JSON.stringify(currentIris.customColumns) !==
      JSON.stringify(lastIris.customColumns);
    if (customColumnsChanged && currentIris.customColumns != null) {
      changes.push(
        `Custom Columns: ${currentIris.customColumns.length} column(s)`
      );
    }

    // Compare moved columns
    const movedColumnsChanged =
      JSON.stringify(currentGrid.movedColumns) !==
      JSON.stringify(lastGrid.movedColumns);
    if (movedColumnsChanged && currentGrid.movedColumns != null) {
      changes.push(`Column Order: ${currentGrid.movedColumns.length} move(s)`);
    }

    return changes;
  }, [snapshots, gridState, irisGridUtils]);

  return (
    <div className="container mt-3">
      {/* Show changed properties since last snapshot */}
      {changedProperties != null && changedProperties.length > 0 && (
        <div className="mb-3">
          <h6 className="text-muted mb-1">Changed since last snapshot:</h6>
          <ul className="list-unstyled text-muted small mb-0">
            {changedProperties.map(change => (
              <li key={change}>• {change}</li>
            ))}
          </ul>
        </div>
      )}
      {changedProperties != null && changedProperties.length === 0 && (
        <p className="text-muted small mb-3">No changes since last snapshot.</p>
      )}

      <div className="d-flex flex-column gap-2">
        <Button kind="primary" onClick={handleSaveSnapshot}>
          Save Snapshot
        </Button>
      </div>

      {snapshots.length > 0 && (
        <>
          <div className="mt-3">
            <h6 className="text-muted mb-2">Saved Snapshots (newest first)</h6>
            <ul className="list-unstyled">
              {[...snapshots].reverse().map(snapshot => (
                <li
                  key={snapshot.id}
                  className="d-flex align-items-center justify-content-between py-1"
                >
                  {editingId === snapshot.id ? (
                    <div className="d-flex align-items-center gap-1 flex-grow-1">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        placeholder={formatTimestamp(snapshot.timestamp)}
                        autoFocus
                      />
                      <Button
                        kind="primary"
                        onClick={handleSaveEdit}
                        style={{ padding: '2px 8px', fontSize: '12px' }}
                      >
                        Save
                      </Button>
                      <Button
                        kind="secondary"
                        onClick={handleCancelEdit}
                        style={{ padding: '2px 8px', fontSize: '12px' }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-start"
                        onClick={() => handleRestoreSnapshot(snapshot)}
                        title="Click to restore this snapshot"
                      >
                        {snapshot.name || formatTimestamp(snapshot.timestamp)}
                        {snapshot.name && (
                          <span className="text-muted small ms-1">
                            ({formatTimestamp(snapshot.timestamp)})
                          </span>
                        )}
                      </button>
                      <div className="d-flex align-items-center">
                        <Button
                          kind="ghost"
                          icon={vsEdit}
                          tooltip="Rename"
                          aria-label="Rename snapshot"
                          onClick={() => handleStartEdit(snapshot)}
                        />
                        <Button
                          kind="ghost"
                          icon={vsTrash}
                          tooltip="Delete"
                          aria-label="Delete snapshot"
                          onClick={() => handleDeleteSnapshot(snapshot.id)}
                        />
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-2">
            <DialogTrigger>
              <SpectrumButton variant="secondary">
                Clear All Snapshots
              </SpectrumButton>
              {(close: () => void) => (
                <ConfirmationDialog
                  heading="Clear All Snapshots"
                  confirmationButtonLabel="Clear All"
                  onCancel={close}
                  onConfirm={() => {
                    close();
                    handleClearAll();
                  }}
                >
                  <Text>
                    Are you sure you want to clear all {snapshots.length}{' '}
                    snapshot{snapshots.length === 1 ? '' : 's'}? This action
                    cannot be undone.
                  </Text>
                </ConfirmationDialog>
              )}
            </DialogTrigger>
          </div>
        </>
      )}

      <p className="text-muted small mt-3">
        Save the current table state (filters, sorts, search) and restore it
        later by clicking on a timestamp.
      </p>

      <div className="mt-4 pt-3 border-top">
        <DialogTrigger>
          <SpectrumButton variant="secondary">Reset Table</SpectrumButton>
          {(close: () => void) => (
            <ConfirmationDialog
              heading="Reset Table"
              confirmationButtonLabel="Reset"
              onCancel={close}
              onConfirm={() => {
                close();
                handleResetTable();
              }}
            >
              <Text>
                Reset the table to its initial state? This will clear all
                filters, sorts, search, and column re-ordering.
              </Text>
            </ConfirmationDialog>
          )}
        </DialogTrigger>
        <p className="text-muted small mt-2 mb-0">
          Clear all filters, sorts, search, custom columns, and column
          re-ordering to restore the table to its default state.
        </p>
      </div>
    </div>
  );
}

TableHistoryPanel.displayName = 'TableHistoryPanel';

/**
 * Table History option for the Table Options menu.
 */
const TableHistoryOption: TableOption = {
  type: TABLE_HISTORY_OPTION_TYPE,

  menuItem: {
    title: 'Table History',
    // subtitle: 'Save and restore table state',
    icon: vsHistory,
    order: -50,
    isAvailable: () => true,
  },

  Panel: TableHistoryPanel,
};

// Register the option with the default registry
defaultTableOptionsRegistry.register(TableHistoryOption);

/**
 * Middleware component that passes through to the wrapped component.
 * The table option is registered via the module-level side effect above.
 */
function TableHistoryMiddleware({
  Component,
  ...props
}: WidgetMiddlewareComponentProps<dh.Table>): JSX.Element {
  useEffect(() => {
    // Registration happens at module level, nothing to do here
  }, []);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Component {...props} />;
}

TableHistoryMiddleware.displayName = 'TableHistoryMiddleware';

/**
 * Panel middleware that passes through to the wrapped component.
 */
function TableHistoryPanelMiddleware({
  Component,
  ...props
}: WidgetMiddlewarePanelProps<dh.Table>): JSX.Element {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Component {...props} />;
}

TableHistoryPanelMiddleware.displayName = 'TableHistoryPanelMiddleware';

/**
 * Plugin configuration for TableHistory.
 * This middleware plugin registers the Table History option in the Table Options menu.
 * Add this to your plugins array to enable the Table History feature.
 */
const TableHistoryPluginConfig: WidgetMiddlewarePlugin<dh.Table> = {
  name: '@deephaven/table-history',
  title: 'Table History',
  type: PluginType.WIDGET_PLUGIN,
  component: TableHistoryMiddleware,
  panelComponent: TableHistoryPanelMiddleware,
  supportedTypes: [
    'Table',
    'TreeTable',
    'HierarchicalTable',
    'PartitionedTable',
  ],
  isMiddleware: true,
};

export { TableHistoryPanel, TableHistoryOption, TableHistoryMiddleware };
export default TableHistoryPluginConfig;
