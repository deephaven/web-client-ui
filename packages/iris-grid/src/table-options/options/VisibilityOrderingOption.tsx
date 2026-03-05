import React, { useCallback } from 'react';
import { vsSymbolStructure } from '@deephaven/icons';
import type { MoveOperation, ModelIndex } from '@deephaven/grid';
import { VisibilityOrderingBuilder } from '../../sidebar';
import { useTableOptionsHost } from '../TableOptionsHostContext';
import type { TableOption, TableOptionPanelProps } from '../TableOption';
import type ColumnHeaderGroup from '../../ColumnHeaderGroup';
import type { ColumnName } from '../../CommonTypes';

/**
 * Panel component for Visibility & Ordering option.
 * Wraps the existing VisibilityOrderingBuilder component.
 */
function VisibilityOrderingPanel(_props: TableOptionPanelProps): JSX.Element {
  const { gridState, dispatch } = useTableOptionsHost();
  const { model, movedColumns, hiddenColumns, columnHeaderGroups } = gridState;

  const handleColumnVisibilityChanged = useCallback(
    (columns: readonly ModelIndex[], isVisible: boolean) => {
      dispatch({ type: 'SET_COLUMN_VISIBILITY', columns, isVisible });
    },
    [dispatch]
  );

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET_COLUMN_VISIBILITY' });
  }, [dispatch]);

  const handleMovedColumnsChanged = useCallback(
    (columns: readonly MoveOperation[], onChangeApplied?: () => void) => {
      dispatch({ type: 'SET_MOVED_COLUMNS', columns, onChangeApplied });
    },
    [dispatch]
  );

  const handleColumnHeaderGroupChanged = useCallback(
    (groups: readonly ColumnHeaderGroup[]) => {
      dispatch({ type: 'SET_COLUMN_HEADER_GROUPS', groups });
    },
    [dispatch]
  );

  const handleFrozenColumnsChanged = useCallback(
    (columns: readonly ColumnName[]) => {
      dispatch({ type: 'SET_FROZEN_COLUMNS', columns });
    },
    [dispatch]
  );

  return (
    <VisibilityOrderingBuilder
      model={model}
      movedColumns={movedColumns}
      hiddenColumns={hiddenColumns}
      columnHeaderGroups={columnHeaderGroups}
      onColumnVisibilityChanged={handleColumnVisibilityChanged}
      onReset={handleReset}
      onMovedColumnsChanged={handleMovedColumnsChanged}
      onColumnHeaderGroupChanged={handleColumnHeaderGroupChanged}
      onFrozenColumnsChanged={handleFrozenColumnsChanged}
    />
  );
}

/**
 * Visibility & Ordering option configuration.
 * Always available (no isAvailable check needed).
 */
export const VisibilityOrderingOption: TableOption = {
  type: 'visibility-ordering',

  menuItem: {
    title: 'Organize Columns',
    icon: vsSymbolStructure,
    order: 10, // Near the top
  },

  Panel: VisibilityOrderingPanel,
};

export default VisibilityOrderingOption;
