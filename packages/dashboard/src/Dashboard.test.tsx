import React from 'react';
import { render, RenderResult } from '@testing-library/react';
import Dashboard, { DashboardProps } from './Dashboard';

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...(jest.requireActual('react-redux') as Record<string, unknown>),
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
}: DashboardProps = {}): RenderResult {
  return render(
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
  makeDashboard();
});
