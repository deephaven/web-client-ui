import { forwardRef, useMemo } from 'react';
import { type WidgetComponentProps } from '@deephaven/plugin';
import { type DashboardPanelProps } from '@deephaven/dashboard';
import useHydrateGrid from './useHydrateGrid';
import ConnectedIrisGridPanel, {
  IrisGridPanelProps,
  type IrisGridPanel,
} from './panels/IrisGridPanel';

export const GridPlugin = forwardRef(
  (props: WidgetComponentProps, ref: React.Ref<IrisGridPanel>) => {
    const hydrate = useHydrateGrid<
      DashboardPanelProps & Pick<IrisGridPanelProps, 'panelState'>
    >();
    const { localDashboardId } = props;
    const hydratedProps = useMemo(
      () =>
        hydrate(
          props as WidgetComponentProps &
            Pick<IrisGridPanelProps, 'panelState'>,
          localDashboardId
        ),
      [hydrate, props, localDashboardId]
    );

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <ConnectedIrisGridPanel ref={ref} {...hydratedProps} />;
  }
);

GridPlugin.displayName = 'GridPlugin';

export default GridPlugin;
