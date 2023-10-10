import { DashboardPanelProps } from '@deephaven/dashboard';
import { forwardRef, useMemo } from 'react';
import { PandasPanel } from './panels';
import useHydrateGrid from './useHydrateGrid';

export const PandasPlugin = forwardRef(
  (props: DashboardPanelProps, ref: React.Ref<PandasPanel>) => {
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
