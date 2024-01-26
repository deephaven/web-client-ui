import { forwardRef } from 'react';
import { WidgetPanelProps } from '@deephaven/plugin';
import { type dh } from '@deephaven/jsapi-types';
import { PandasPanel } from './panels';
import useHydrateGrid from './useHydrateGrid';

export const PandasPanelPlugin = forwardRef(
  (props: WidgetPanelProps, ref: React.Ref<PandasPanel>) => {
    const { localDashboardId, fetch } = props;
    const hydratedProps = useHydrateGrid(
      fetch as () => Promise<dh.Table>,
      localDashboardId
    );

    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <PandasPanel ref={ref} {...props} {...hydratedProps} />
    );
  }
);

PandasPanelPlugin.displayName = 'PandasPanelPlugin';

export default PandasPanelPlugin;
