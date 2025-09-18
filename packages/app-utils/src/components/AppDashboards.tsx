import React, { useCallback } from 'react';
import classNames from 'classnames';
import {
  DashboardUtils,
  type DehydratedPanelProps,
  LazyDashboard,
} from '@deephaven/dashboard';
import { useObjectFetcher } from '@deephaven/jsapi-bootstrap';
import {
  type ItemConfig,
  type Settings as LayoutSettings,
} from '@deephaven/golden-layout';
import type LayoutManager from '@deephaven/golden-layout';
import { LoadingOverlay } from '@deephaven/components';

interface AppDashboardsProps {
  dashboards: {
    id: string;
    layoutConfig: ItemConfig[];
    layoutSettings?: Partial<LayoutSettings>;
    key?: string;
  }[];
  activeDashboard: string;
  onLayoutInitialized?: () => void;
  onGoldenLayoutChange: (goldenLayout: LayoutManager) => void;
  plugins: JSX.Element[];
  emptyDashboard?: JSX.Element;
}

export function AppDashboards({
  dashboards,
  activeDashboard,
  onLayoutInitialized,
  onGoldenLayoutChange,
  plugins,
  emptyDashboard = <LoadingOverlay data-testid="app-dashboards-loading" />,
}: AppDashboardsProps): JSX.Element {
  const fetchObject = useObjectFetcher();

  const hydratePanel = useCallback(
    (hydrateProps: DehydratedPanelProps, id: string) => {
      const { metadata } = hydrateProps;
      try {
        if (metadata != null) {
          return {
            fetch: async () => fetchObject(metadata),
            ...hydrateProps,
            localDashboardId: id,
          };
        }
      } catch (e: unknown) {
        // Ignore being unable to get the variable descriptor, do the default dashboard hydration
      }
      return DashboardUtils.hydrate(hydrateProps, id);
    },
    [fetchObject]
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
            key={d.key}
            isActive={d.id === activeDashboard}
            emptyDashboard={emptyDashboard}
            layoutConfig={d.layoutConfig}
            layoutSettings={d.layoutSettings}
            onLayoutInitialized={onLayoutInitialized}
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
