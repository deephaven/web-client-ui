import { forwardRef } from 'react';
import { type WidgetPanelProps } from '@deephaven/plugin';
import { type dh } from '@deephaven/jsapi-types';
import { PandasPanel } from './panels';
import useHydrateGrid from './useHydrateGrid';

export const PandasPanelPlugin = forwardRef(
  (props: WidgetPanelProps<dh.Table>, ref: React.Ref<PandasPanel>) => {
    const { localDashboardId, fetch, metadata } = props;
    const hydratedProps = useHydrateGrid(fetch, localDashboardId, metadata);

    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <PandasPanel ref={ref} {...props} {...hydratedProps} />
    );
  }
);

PandasPanelPlugin.displayName = 'PandasPanelPlugin';

export default PandasPanelPlugin;
