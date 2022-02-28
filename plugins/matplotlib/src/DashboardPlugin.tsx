import React, { useCallback, useEffect } from "react";
import shortid from "shortid";
import { LayoutUtils, useListener } from "@deephaven/dashboard";
import MatPlotLibPanel from "./MatPlotLibPanel";

export const MatPlotLibVariableType = "matplotlib.figure.Figure";

export const DashboardPlugin = ({ id, layout, registerComponent }) => {
  const handlePanelOpen = useCallback(
    ({ dragEvent, fetch, panelId = shortid.generate(), widget }) => {
      const { name, type } = widget;
      if (type !== MatPlotLibVariableType) {
        return;
      }
      const metadata = { name, type };
      const config = {
        type: "react-component",
        component: MatPlotLibPanel.COMPONENT,
        props: {
          localDashboardId: id,
          id: panelId,
          metadata,
          fetch,
        },
        title: name,
        id: panelId,
      };

      const { root } = layout;
      LayoutUtils.openComponent({ root, config, dragEvent });
    },
    [id, layout],
  );

  useEffect(() => {
    const cleanups = [
      registerComponent(MatPlotLibPanel.COMPONENT, MatPlotLibPanel),
    ];

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [registerComponent]);

  useListener(layout.eventHub, "PanelEvent.OPEN", handlePanelOpen);

  return <></>;
};

export default DashboardPlugin;
