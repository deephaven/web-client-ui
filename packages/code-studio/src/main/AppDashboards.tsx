import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';
import JSZip from 'jszip';
import Dashboard, {
  DashboardLayoutConfig,
  DashboardUtils,
  DEFAULT_DASHBOARD_ID,
  DehydratedDashboardPanelProps,
  getAllDashboardsData,
  LazyDashboard,
  useAllDashboardsData,
} from '@deephaven/dashboard';
import { ConsolePlugin } from '@deephaven/dashboard-core-plugins';
import {
  getWorkspace,
  RootState,
  updateWorkspaceData,
  useWorkspace,
} from '@deephaven/redux';
import { useConnection } from '@deephaven/jsapi-components';
import { VariableDefinition } from '@deephaven/jsapi-types';
import LayoutManager, { ItemConfigType } from '@deephaven/golden-layout';
import EmptyDashboard from './EmptyDashboard';

function hydrateConsole(
  props: DehydratedDashboardPanelProps,
  id: string
): DehydratedDashboardPanelProps {
  return DashboardUtils.hydrate(
    {
      ...props,
      unzip: (zipFile: Blob) =>
        JSZip.loadAsync(zipFile).then(zip => Object.values(zip.files)),
    },
    id
  );
}

interface AppDashboardsProps {
  dashboards: {
    id: string;
    getLayoutConfig: () => Promise<ItemConfigType[]>;
  }[];
  activeDashboard: string;
  onGoldenLayoutChange: (goldenLayout: LayoutManager) => void;
  plugins: JSX.Element[];
}

export function AppDashboards({
  dashboards,
  activeDashboard,
  onGoldenLayoutChange,
  plugins,
}: AppDashboardsProps): JSX.Element {
  const workspace = useWorkspace();
  const { data: workspaceData } = workspace;
  const dashboardsData = useAllDashboardsData();
  const connection = useConnection();
  const dispatch = useDispatch();

  const hydratePanel = useCallback(
    (hydrateProps: DehydratedDashboardPanelProps, id: string) => {
      const { metadata } = hydrateProps;
      if (
        metadata?.type != null &&
        (metadata?.id != null || metadata?.name != null)
      ) {
        // Looks like a widget, hydrate it as such
        const widget: VariableDefinition =
          metadata.id != null
            ? {
                type: metadata.type,
                id: metadata.id,
              }
            : {
                type: metadata.type,
                name: metadata.name,
                title: metadata.name,
              };
        return {
          fetch: () => connection.getObject(widget),
          ...hydrateProps,
          localDashboardId: id,
        };
      }
      return DashboardUtils.hydrate(hydrateProps, id);
    },
    [connection]
  );

  const handleLayoutConfigChange = useCallback(
    (layoutConfig?: DashboardLayoutConfig) => {
      dispatch(updateWorkspaceData({ layoutConfig }));
    },
    [dispatch]
  );

  return (
    <div className="tab-content">
      {dashboards.map(d => (
        <div
          key={d.id}
          className={classNames('tab-pane', {
            active: d.id === activeDashboard,
          })}
        >
          <LazyDashboard
            id={d.id}
            emptyDashboard={<EmptyDashboard />}
            getLayoutConfig={d.getLayoutConfig}
            onGoldenLayoutChange={onGoldenLayoutChange}
            onLayoutConfigChange={handleLayoutConfigChange}
            hydrate={hydratePanel}
            plugins={plugins}
          />
        </div>
      ))}
    </div>
  );

  return (
    <Dashboard
      emptyDashboard={<EmptyDashboard />}
      id={DEFAULT_DASHBOARD_ID}
      layoutConfig={[]}
      onGoldenLayoutChange={onGoldenLayoutChange}
      onLayoutConfigChange={handleLayoutConfigChange}
      hydrate={hydratePanel}
    >
      <ConsolePlugin
        hydrateConsole={hydrateConsole}
        notebooksUrl={
          new URL(`${import.meta.env.VITE_ROUTE_NOTEBOOKS}`, document.baseURI)
            .href
        }
      />
    </Dashboard>
  );
}

export default AppDashboards;
