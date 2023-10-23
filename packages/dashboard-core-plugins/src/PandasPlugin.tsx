import { DashboardPanelProps } from '@deephaven/dashboard';
import { WidgetComponentProps } from '@deephaven/plugin';
import { forwardRef, useMemo } from 'react';
import { PandasPanel } from './panels';
import useHydrateGrid from './useHydrateGrid';

export const PandasPlugin = forwardRef(
  (props: WidgetComponentProps, ref: React.Ref<PandasPanel>) => {
    const hydrate = useHydrateGrid<DashboardPanelProps>();
    const { localDashboardId } = props;
    const hydratedProps = useMemo(
      () => hydrate(props, localDashboardId),
      [hydrate, props, localDashboardId]
    );

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <PandasPanel ref={ref} {...hydratedProps} />;
  }
);

PandasPlugin.displayName = 'PandasPlugin';

export default PandasPlugin;
