import React, { useCallback, useEffect, useMemo } from 'react';
import {
  PluginType,
  type WidgetMiddlewarePlugin,
  type WidgetMiddlewareComponentProps,
  type WidgetMiddlewarePanelProps,
} from '@deephaven/plugin';
import { type dh } from '@deephaven/jsapi-types';
import { Button } from '@deephaven/components';
import { vsHistory, vsTrash } from '@deephaven/icons';
import { usePersistentState } from '@deephaven/dashboard';
import { type MoveOperation } from '@deephaven/grid';
import {
  type TableOption,
  type TableOptionPanelProps,
  type GridStateSnapshot,
  useTableOptionsHost,
  defaultTableOptionsRegistry,
  IrisGridUtils,
  type DehydratedQuickFilter,
  type DehydratedAdvancedFilter,
  type DehydratedSort,
} from '@deephaven/iris-grid';
import type { ColumnName } from '@deephaven/iris-grid';

/**
 * Dehydrated (JSON-serializable) snapshot of table state.
 * Stored via usePersistentState for cross-session persistence.
 */
interface DehydratedStateSnapshot {
  /** Unique identifier */
  id: string;
  /** When the snapshot was taken (ISO string for JSON serialization) */
  timestamp: string;
  /** Quick filters state (dehydrated) */
  quickFilters: readonly DehydratedQuickFilter[];
  /** Advanced filters state (dehydrated) */
  advancedFilters: readonly DehydratedAdvancedFilter[];
  /** Sort configuration (dehydrated) */
  sorts: readonly DehydratedSort[];
  /** Reverse sort order */
  reverse: boolean;
  /** Cross-column search value */
  searchValue: string;
  /** Columns for cross-column search */
  selectedSearchColumns: readonly ColumnName[];
  /** Invert search column selection */
  invertSearchColumns: boolean;
  /** Select distinct columns */
  selectDistinctColumns: readonly ColumnName[];
  /** Custom columns */
  customColumns: readonly ColumnName[];
  /** Re-arranged columns (move operations) */
  movedColumns: readonly MoveOperation[];
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
 */
function dehydrateSnapshot(
  gridState: GridStateSnapshot,
  irisGridUtils: IrisGridUtils
): Omit<DehydratedStateSnapshot, 'id' | 'timestamp'> {
  const { model, quickFilters, advancedFilters, sorts } = gridState;
  return {
    quickFilters: IrisGridUtils.dehydrateQuickFilters(quickFilters),
    advancedFilters: irisGridUtils.dehydrateAdvancedFilters(
      model.columns,
      advancedFilters
    ),
    sorts: IrisGridUtils.dehydrateSort(sorts),
    reverse: gridState.reverse,
    searchValue: gridState.searchValue,
    selectedSearchColumns: [...gridState.selectedSearchColumns],
    invertSearchColumns: gridState.invertSearchColumns,
    selectDistinctColumns: [...gridState.selectDistinctColumns],
    customColumns: [...gridState.customColumns],
    movedColumns: [...gridState.movedColumns],
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

  const snapshots = state.snapshots;

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
      const { columns, formatter } = model;

      // Get timezone from the model's formatter
      const timeZone = formatter.timeZone;

      // Hydrate quick filters
      const hydratedQuickFilters = irisGridUtils.hydrateQuickFilters(
        columns,
        snapshot.quickFilters,
        timeZone
      );

      // Hydrate advanced filters
      const hydratedAdvancedFilters = irisGridUtils.hydrateAdvancedFilters(
        columns,
        snapshot.advancedFilters,
        timeZone
      );

      // Hydrate sorts
      const hydratedSorts = irisGridUtils.hydrateSort(columns, snapshot.sorts);

      // Note: Dispatch order matters! SET_SELECT_DISTINCT_COLUMNS and SET_CUSTOM_COLUMNS
      // trigger handlers that reset sorts/filters, so we dispatch them first (if changing),
      // then restore everything else.

      // Only dispatch SELECT_DISTINCT if actually changing (to avoid clearing everything)
      const currentSelectDistinct = gridState.selectDistinctColumns;
      const newSelectDistinct = snapshot.selectDistinctColumns;
      const selectDistinctChanging =
        currentSelectDistinct.length !== newSelectDistinct.length ||
        !currentSelectDistinct.every((col, i) => col === newSelectDistinct[i]);

      if (selectDistinctChanging) {
        dispatch({
          type: 'SET_SELECT_DISTINCT_COLUMNS',
          columns: [...snapshot.selectDistinctColumns],
        });
      }

      dispatch({
        type: 'SET_CUSTOM_COLUMNS',
        columns: [...snapshot.customColumns],
      });

      // Now restore filters, sorts, and search (after select distinct is handled)
      dispatch({
        type: 'SET_QUICK_FILTERS',
        filters: hydratedQuickFilters,
      });
      dispatch({
        type: 'SET_ADVANCED_FILTERS',
        filters: hydratedAdvancedFilters,
      });
      dispatch({
        type: 'SET_CROSS_COLUMN_SEARCH',
        searchValue: snapshot.searchValue,
        selectedSearchColumns: [...snapshot.selectedSearchColumns],
        invertSearchColumns: snapshot.invertSearchColumns,
      });

      // SET_SORTS and SET_REVERSE must be last since other dispatches can clear them
      dispatch({ type: 'SET_SORTS', sorts: hydratedSorts });
      dispatch({ type: 'SET_REVERSE', reverse: snapshot.reverse });

      // Restore moved columns (re-arranged column order)
      dispatch({
        type: 'SET_MOVED_COLUMNS',
        columns: [...snapshot.movedColumns],
      });

      // Stay on the Table History screen after restoring
    },
    [dispatch, model, irisGridUtils, gridState.selectDistinctColumns]
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

  // Compute what has changed since the last saved snapshot
  const changedProperties = useMemo(() => {
    const lastSnapshot = snapshots[snapshots.length - 1];
    if (lastSnapshot == null) {
      return null; // No previous snapshot to compare against
    }

    const currentDehydrated = dehydrateSnapshot(gridState, irisGridUtils);
    const changes: string[] = [];

    // Compare sorts
    const sortsChanged =
      JSON.stringify(currentDehydrated.sorts) !==
      JSON.stringify(lastSnapshot.sorts);
    if (sortsChanged) {
      changes.push(`Sorts: ${currentDehydrated.sorts.length} column(s)`);
    }

    // Compare quick filters
    const quickFiltersChanged =
      JSON.stringify(currentDehydrated.quickFilters) !==
      JSON.stringify(lastSnapshot.quickFilters);
    if (quickFiltersChanged) {
      changes.push(
        `Quick Filters: ${currentDehydrated.quickFilters.length} filter(s)`
      );
    }

    // Compare advanced filters
    const advancedFiltersChanged =
      JSON.stringify(currentDehydrated.advancedFilters) !==
      JSON.stringify(lastSnapshot.advancedFilters);
    if (advancedFiltersChanged) {
      changes.push(
        `Advanced Filters: ${currentDehydrated.advancedFilters.length} filter(s)`
      );
    }

    // Compare search
    if (currentDehydrated.searchValue !== lastSnapshot.searchValue) {
      changes.push(`Search: "${currentDehydrated.searchValue || '(empty)'}"`);
    }

    // Compare reverse
    if (currentDehydrated.reverse !== lastSnapshot.reverse) {
      changes.push(`Reverse: ${currentDehydrated.reverse}`);
    }

    // Compare select distinct
    const selectDistinctChanged =
      JSON.stringify(currentDehydrated.selectDistinctColumns) !==
      JSON.stringify(lastSnapshot.selectDistinctColumns);
    if (selectDistinctChanged) {
      changes.push(
        `Select Distinct: ${currentDehydrated.selectDistinctColumns.length} column(s)`
      );
    }

    // Compare custom columns
    const customColumnsChanged =
      JSON.stringify(currentDehydrated.customColumns) !==
      JSON.stringify(lastSnapshot.customColumns);
    if (customColumnsChanged) {
      changes.push(
        `Custom Columns: ${currentDehydrated.customColumns.length} column(s)`
      );
    }

    // Compare moved columns
    const movedColumnsChanged =
      JSON.stringify(currentDehydrated.movedColumns) !==
      JSON.stringify(lastSnapshot.movedColumns);
    if (movedColumnsChanged) {
      changes.push(
        `Column Order: ${currentDehydrated.movedColumns.length} move(s)`
      );
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
            <h6 className="text-muted mb-2">Saved Snapshots</h6>
            <ul className="list-unstyled">
              {snapshots.map(snapshot => (
                <li
                  key={snapshot.id}
                  className="d-flex align-items-center justify-content-between py-1"
                >
                  <button
                    type="button"
                    className="btn btn-link p-0 text-start"
                    onClick={() => handleRestoreSnapshot(snapshot)}
                    title="Click to restore this snapshot"
                  >
                    {formatTimestamp(snapshot.timestamp)}
                  </button>
                  <Button
                    kind="ghost"
                    icon={vsTrash}
                    tooltip="Delete"
                    aria-label="Delete snapshot"
                    onClick={() => handleDeleteSnapshot(snapshot.id)}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-2">
            <Button kind="secondary" onClick={handleClearAll}>
              Clear All Snapshots
            </Button>
          </div>
        </>
      )}

      <p className="text-muted small mt-3">
        Save the current table state (filters, sorts, search) and restore it
        later by clicking on a timestamp.
      </p>
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
