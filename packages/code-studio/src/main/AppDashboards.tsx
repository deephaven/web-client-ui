import React, { useCallback } from 'react';
import classNames from 'classnames';
import {
  DashboardUtils,
  DEFAULT_DASHBOARD_ID,
  DehydratedDashboardPanelProps,
  LazyDashboard,
} from '@deephaven/dashboard';
import { useConnection } from '@deephaven/jsapi-components';
import { VariableDefinition } from '@deephaven/jsapi-types';
import LayoutManager, { ItemConfigType } from '@deephaven/golden-layout';
import { LoadingOverlay } from '@deephaven/components';
import EmptyDashboard from './EmptyDashboard';

interface AppDashboardsProps {
  dashboards: {
    id: string;
    layoutConfig: ItemConfigType[];
  }[];
  activeDashboard: string;
  onGoldenLayoutChange: (goldenLayout: LayoutManager) => void;
  plugins: JSX.Element[];
  onAutoFillClick: (event: React.MouseEvent) => void;
}

export function AppDashboards({
  dashboards,
  activeDashboard,
  onGoldenLayoutChange,
  plugins,
  onAutoFillClick,
}: AppDashboardsProps): JSX.Element {
  const connection = useConnection();

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
            isActive={d.id === activeDashboard}
            emptyDashboard={
              d.id === DEFAULT_DASHBOARD_ID ? (
                <EmptyDashboard onAutoFillClick={onAutoFillClick} />
              ) : (
                <LoadingOverlay />
              )
            }
            layoutConfig={d.layoutConfig}
            onGoldenLayoutChange={onGoldenLayoutChange}
            hydrate={hydratePanel}
            plugins={plugins}
          />
        </div>
      ))}
    </div>
  );
}

export default AppDashboards;
