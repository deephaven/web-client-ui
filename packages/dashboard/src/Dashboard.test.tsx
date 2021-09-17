import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import Dashboard, { DashboardProps } from './Dashboard';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useStore: () => ({}),
}));

function makeDashboard({
  id,
  fallbackComponent,
  children,
  data,
  layoutConfig,
  onDataChange,
  onGoldenLayoutChange,
  onLayoutConfigChange,
}: DashboardProps = {}): ReactWrapper {
  return mount(
    <Dashboard
      id={id}
      fallbackComponent={fallbackComponent}
      data={data}
      layoutConfig={layoutConfig}
      onDataChange={onDataChange}
      onLayoutConfigChange={onLayoutConfigChange}
      onGoldenLayoutChange={onGoldenLayoutChange}
    >
      {children}
    </Dashboard>
  );
}

it('mounts and unmounts properly', () => {
  const dashboard = makeDashboard();
  dashboard.unmount();
});
