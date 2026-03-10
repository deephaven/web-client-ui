import React, { useCallback } from 'react';
import { vsSplitHorizontal } from '@deephaven/icons';
import { CustomColumnBuilder } from '../../sidebar';
import { useTableOptionsHost } from '../TableOptionsHostContext';
import type { TableOption, TableOptionPanelProps } from '../TableOption';
import type { ColumnName } from '../../CommonTypes';

/**
 * Panel component for Custom Column Builder option.
 * Wraps the existing CustomColumnBuilder component.
 */
function CustomColumnPanel(_props: TableOptionPanelProps): JSX.Element {
  const { gridState, dispatch, goBack } = useTableOptionsHost();
  const { model, customColumns } = gridState;

  const handleSave = useCallback(
    (columns: readonly ColumnName[]) => {
      dispatch({ type: 'SET_CUSTOM_COLUMNS', columns });
    },
    [dispatch]
  );

  const handleCancel = useCallback(() => {
    goBack();
  }, [goBack]);

  return (
    <CustomColumnBuilder
      model={model}
      customColumns={customColumns}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}

/**
 * Custom Column Builder option configuration.
 * Shows when `model.isCustomColumnsAvailable` is true.
 */
export const CustomColumnOption: TableOption = {
  type: 'custom-columns',

  menuItem: {
    title: 'Custom Columns',
    icon: vsSplitHorizontal,
    isAvailable: gridState => gridState.model.isCustomColumnsAvailable,
  },

  Panel: CustomColumnPanel,
};

export default CustomColumnOption;
