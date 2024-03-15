import React, { useCallback } from 'react';
import classNames from 'classnames';
import {
  DashboardUtils,
  DEFAULT_DASHBOARD_ID,
  DehydratedDashboardPanelProps,
  LazyDashboard,
} from '@deephaven/dashboard';
import {
  sanitizeVariableDescriptor,
  useObjectFetcher,
} from '@deephaven/jsapi-bootstrap';
import LayoutManager, { ItemConfigType } from '@deephaven/golden-layout';
import { LoadingOverlay } from '@deephaven/components';
import EmptyDashboard from './EmptyDashboard';

interface AppDashboardsProps {
  dashboards: {
    id: string;
    layoutConfig: ItemConfigType[];
    key?: string;
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
  const fetchObject = useObjectFetcher();

  const hydratePanel = useCallback(
    (hydrateProps: DehydratedDashboardPanelProps, id: string) => {
      const { metadata } = hydrateProps;
      try {
        if (metadata != null) {
          const widget = sanitizeVariableDescriptor(metadata);
          return {
            fetch: async () => fetchObject(widget),
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
