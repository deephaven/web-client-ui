import React, { useCallback } from 'react';
import { dhGraphLineUp } from '@deephaven/icons';
import ChartBuilder, {
  type ChartBuilderSettings,
} from '../../sidebar/ChartBuilder';
import { useTableOptionsHost } from '../TableOptionsHostContext';
import type { TableOption, TableOptionPanelProps } from '../TableOption';

/**
 * Panel component for Chart Builder option.
 * Wraps the existing ChartBuilder component.
 */
function ChartBuilderPanel(_props: TableOptionPanelProps): JSX.Element {
  const { gridState, dispatch, closePanel } = useTableOptionsHost();
  const { model } = gridState;

  const handleChange = useCallback(
    (settings: ChartBuilderSettings) => {
      dispatch({ type: 'UPDATE_CHART_PREVIEW', settings });
    },
    [dispatch]
  );

  const handleSubmit = useCallback(
    (settings: ChartBuilderSettings) => {
      dispatch({ type: 'CREATE_CHART', settings });
      closePanel();
    },
    [dispatch, closePanel]
  );

  return (
    <ChartBuilder
      model={model}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
}

/**
 * Chart Builder option configuration.
 * Shows when chart builder is available (model supports it and onCreateChart is provided).
 */
export const ChartBuilderOption: TableOption = {
  type: 'chart-builder',

  menuItem: {
    title: 'Chart Builder',
    icon: dhGraphLineUp,
    isAvailable: gridState => gridState.isChartBuilderAvailable ?? false,
  },

  Panel: ChartBuilderPanel,
};

export default ChartBuilderOption;
