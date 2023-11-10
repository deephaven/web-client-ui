import { forwardRef } from 'react';
import { WidgetComponentProps } from '@deephaven/plugin';
import { type Table } from '@deephaven/jsapi-types';
import { PandasPanel } from './panels';
import useHydrateGrid from './useHydrateGrid';

export const PandasPlugin = forwardRef(
  (props: WidgetComponentProps, ref: React.Ref<PandasPanel>) => {
    const { localDashboardId, fetch } = props;
    const hydratedProps = useHydrateGrid(
      fetch as unknown as () => Promise<Table>,
      localDashboardId
    );

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <PandasPanel ref={ref} {...props} {...hydratedProps} />;
  }
);

PandasPlugin.displayName = 'PandasPlugin';

export default PandasPlugin;
