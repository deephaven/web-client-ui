import React, { useCallback } from 'react';
import { vsRuby } from '@deephaven/icons';
import SelectDistinctBuilder from '../../sidebar/SelectDistinctBuilder';
import { useTableOptionsHost } from '../TableOptionsHostContext';
import type { TableOption, TableOptionPanelProps } from '../TableOption';
import type { ColumnName } from '../../CommonTypes';

/**
 * Panel component for Select Distinct option.
 * Wraps the existing SelectDistinctBuilder component.
 */
function SelectDistinctPanel(_props: TableOptionPanelProps): JSX.Element {
  const { gridState, dispatch } = useTableOptionsHost();
  const { model, selectDistinctColumns } = gridState;

  const handleChange = useCallback(
    (columns: readonly ColumnName[]) => {
      dispatch({ type: 'SET_SELECT_DISTINCT_COLUMNS', columns });
    },
    [dispatch]
  );

  return (
    <SelectDistinctBuilder
      model={model}
      selectDistinctColumns={selectDistinctColumns}
      onChange={handleChange}
    />
  );
}

/**
 * Select Distinct option configuration.
 * Shows when `model.isSelectDistinctAvailable` is true.
 */
export const SelectDistinctOption: TableOption = {
  type: 'select-distinct',

  menuItem: {
    title: 'Select Distinct Values',
    icon: vsRuby,
    isAvailable: gridState => gridState.model.isSelectDistinctAvailable,
  },

  Panel: SelectDistinctPanel,
};

export default SelectDistinctOption;
