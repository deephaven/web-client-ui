import { forwardRef } from 'react';
import { WidgetPanelProps } from '@deephaven/plugin';
import { type Table } from '@deephaven/jsapi-types';
import useHydrateGrid from './useHydrateGrid';
import ConnectedIrisGridPanel, {
  type IrisGridPanel,
} from './panels/IrisGridPanel';

export const GridPanelPlugin = forwardRef(
  (props: WidgetPanelProps<Table>, ref: React.Ref<IrisGridPanel>) => {
    const { localDashboardId, fetch, metadata } = props;
    const hydratedProps = useHydrateGrid(fetch, localDashboardId, metadata);

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <ConnectedIrisGridPanel ref={ref} {...props} {...hydratedProps} />;
  }
);

GridPanelPlugin.displayName = 'GridPanelPlugin';

export default GridPanelPlugin;
