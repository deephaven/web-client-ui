import React from 'react';
import {
  act,
  render,
  type RenderResult,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import { type LayoutManager } from '@deephaven/golden-layout';
import Dashboard, { type DashboardProps } from './Dashboard';
import { usePersistentState } from './usePersistentState';
import { useDashboardPanel } from './layout';
import {
  assertIsDashboardPluginProps,
  type DashboardPluginComponentProps,
} from './DashboardPlugin';
import PanelEvent from './PanelEvent';

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
  onLayoutConfigChange = jest.fn(),
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

function TestComponent() {
  const [state, setState] = usePersistentState('initial', {
    type: 'test',
    version: 1,
  });

  return (
    <button
      type="button"
      onClick={() => {
        setState('updated');
      }}
    >
      {state}
    </button>
  );
}

TestComponent.displayName = 'TestComponent';

function TestPlugin(props: Partial<DashboardPluginComponentProps>) {
  assertIsDashboardPluginProps(props);

  useDashboardPanel({
    componentName: TestComponent.displayName,
    component: TestComponent,
    supportedTypes: ['test'],
    dashboardProps: props,
  });
  return null;
}

it('saves state with usePersistentState hook', async () => {
  const user = userEvent.setup();
  const onLayoutConfigChange = jest.fn();
  let gl: LayoutManager | null = null;
  const onGoldenLayoutChange = (newGl: LayoutManager) => {
    gl = newGl;
  };
  const { unmount } = makeDashboard({
    onGoldenLayoutChange,
    onLayoutConfigChange,
    children: <TestPlugin />,
  });

  act(() =>
    gl!.eventHub.emit(PanelEvent.OPEN, {
      widget: { type: 'test' },
    })
  );
  expect(screen.getByText('initial')).toBeInTheDocument();

  const waitRAF = () =>
    act(
      () =>
        new Promise(resolve => {
          requestAnimationFrame(resolve);
        })
    );

  // Golden Layout throttles stateChanged events to once per RAF
  // The test is running too fast and getting batched into one RAF
  // so we need to wait for the initial stateChanged to fire
  await waitRAF();

  onLayoutConfigChange.mockClear();
  await user.click(screen.getByText('initial'));
  await waitFor(async () =>
    expect(await screen.findByText('updated')).toBeInTheDocument()
  );

  // Need to wait here as well because the stateChanged event fires on the next frame
  // which seems to happen after the unmount without this wait
  await waitRAF();

  act(() => unmount());

  expect(onLayoutConfigChange).toHaveBeenCalledTimes(1);

  // Remount and verify state is restored
  makeDashboard({
    layoutConfig: onLayoutConfigChange.mock.calls[0][0],
    onLayoutConfigChange,
    children: <TestPlugin />,
  });

  await waitFor(() => expect(screen.getByText('updated')).toBeInTheDocument());
});
