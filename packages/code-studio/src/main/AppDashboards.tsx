import React, { useCallback } from 'react';
import classNames from 'classnames';
import {
  DashboardUtils,
  DEFAULT_DASHBOARD_ID,
  DehydratedDashboardPanelProps,
  isLegacyPanelProps,
  LazyDashboard,
} from '@deephaven/dashboard';
import {
  getVariableDescriptor,
  useObjectFetcher,
} from '@deephaven/jsapi-bootstrap';
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
  const fetch = useObjectFetcher();

  const hydratePanel = useCallback(
    (hydrateProps: DehydratedDashboardPanelProps, id: string) => {
      const widget = isLegacyPanelProps(hydrateProps)
        ? getVariableDescriptor(hydrateProps.metadata)
        : hydrateProps.widget;
      if (widget != null) {
        return {
          fetch: async () => fetch(widget),
          ...hydrateProps,
          localDashboardId: id,
        };
      }
      return DashboardUtils.hydrate(hydrateProps, id);
    },
    [fetch]
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
