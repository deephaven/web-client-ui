import React from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import Dashboard, { type DashboardProps } from './Dashboard';

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
    <ApiContext.Provider value={dh}>
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
    </ApiContext.Provider>
  );
}

it('mounts and unmounts properly', () => {
  makeDashboard();
});
