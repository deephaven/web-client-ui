import React from 'react';
import * as ReactReduxType from 'react-redux';
import { mount, ReactWrapper } from 'enzyme';
import Dashboard, { DashboardProps } from './Dashboard';

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...(jest.requireActual('react-redux') as typeof ReactReduxType),
  useDispatch: () => mockDispatch,
  useSelector: jest.fn(),
  useStore: () => ({}),
}));

function makeDashboard({
  id,
  fallbackComponent,
  children,
  layoutConfig,
  layoutSettings,
  onGoldenLayoutChange,
  onLayoutConfigChange,
}: DashboardProps = {}): ReactWrapper {
  return mount(
    <Dashboard
      id={id}
      fallbackComponent={fallbackComponent}
      layoutSettings={layoutSettings}
      layoutConfig={layoutConfig}
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
