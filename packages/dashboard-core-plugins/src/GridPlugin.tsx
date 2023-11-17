import { forwardRef } from 'react';
import { type WidgetComponentProps } from '@deephaven/plugin';
import { type Table } from '@deephaven/jsapi-types';
import useHydrateGrid from './useHydrateGrid';
import ConnectedIrisGridPanel, {
  type IrisGridPanel,
} from './panels/IrisGridPanel';

export const GridPlugin = forwardRef(
  (props: WidgetComponentProps, ref: React.Ref<IrisGridPanel>) => {
    const { localDashboardId, fetch } = props;
    const hydratedProps = useHydrateGrid(
      fetch as unknown as () => Promise<Table>,
      localDashboardId
    );

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <ConnectedIrisGridPanel ref={ref} {...props} {...hydratedProps} />;
  }
);

GridPlugin.displayName = 'GridPlugin';

export default GridPlugin;
