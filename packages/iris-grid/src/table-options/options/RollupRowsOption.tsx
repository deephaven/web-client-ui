import React, { useCallback } from 'react';
import { dhTriangleDownSquare } from '@deephaven/icons';
import { RollupRows } from '../../sidebar';
import { useTableOptionsHost } from '../TableOptionsHostContext';
import type { TableOption, TableOptionPanelProps } from '../TableOption';
import type { UIRollupConfig } from '../../sidebar';

/**
 * Panel component for Rollup Rows option.
 * Wraps the existing RollupRows component.
 */
function RollupRowsPanel(_props: TableOptionPanelProps): JSX.Element {
  const { gridState, dispatch } = useTableOptionsHost();
  const { model, rollupConfig } = gridState;

  const handleChange = useCallback(
    (config: UIRollupConfig) => {
      dispatch({ type: 'SET_ROLLUP_CONFIG', config });
    },
    [dispatch]
  );

  return (
    <RollupRows
      model={model}
      config={rollupConfig ?? null}
      onChange={handleChange}
    />
  );
}

/**
 * Rollup Rows option configuration.
 * Shows when `model.isRollupAvailable` is true.
 */
export const RollupRowsOption: TableOption = {
  type: 'rollup-rows',

  menuItem: {
    title: 'Rollup Rows',
    icon: dhTriangleDownSquare,
    isAvailable: gridState => gridState.model.isRollupAvailable,
  },

  Panel: RollupRowsPanel,
};

export default RollupRowsOption;
