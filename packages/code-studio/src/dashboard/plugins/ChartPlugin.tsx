import React, { ComponentType, DragEvent, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ChartModel } from '@deephaven/chart';
import {
  DashboardPluginComponentProps,
  LayoutUtils,
  useListener,
} from '@deephaven/dashboard';
import shortid from 'shortid';
import { ChartPanel } from './panels';
import { ChartEvent } from './events';
import { getSessionWrapper } from '../../redux';
import { createChartModel } from '../../main/WidgetUtils';

export const ChartPlugin = ({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element => {
  const { session } = useSelector(getSessionWrapper);
  const hydrateChart = useCallback(
    props => ({
      ...props,
      localDashboardId: id,
      makeModel: () => {
        const { metadata, panelState } = props;
        createChartModel(session, metadata, panelState);
      },
    }),
    [id, session]
  );
  const handleOpen = useCallback(
    (
      title: string,
      makeModel: () => ChartModel,
      metadata: Record<string, unknown> = {},
      panelId = shortid.generate(),
      dragEvent?: DragEvent
    ) => {
      const config = {
        type: 'react-component',
        component: ChartPanel.COMPONENT,
        props: {
          localDashboardId: id,
          id: panelId,
          metadata,
          makeModel,
        },
        title,
        id: panelId,
      };

      const { root } = layout;
      LayoutUtils.openComponent({ root, config, dragEvent });
    },
    [id, layout]
  );

  const handleClose = useCallback(
    (panelId: string) => {
      const config = { component: ChartPanel.COMPONENT, id: panelId };
      const { root } = layout;
      LayoutUtils.closeComponent(root, config);
    },
    [layout]
  );

  useEffect(() => {
    const cleanups = [
      registerComponent(
        ChartPanel.COMPONENT,
        (ChartPanel as unknown) as ComponentType,
        hydrateChart
      ),
    ];
    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [hydrateChart, registerComponent]);

  useListener(layout.eventHub, ChartEvent.OPEN, handleOpen);
  useListener(layout.eventHub, ChartEvent.CLOSE, handleClose);

  return <></>;
};

export default ChartPlugin;
