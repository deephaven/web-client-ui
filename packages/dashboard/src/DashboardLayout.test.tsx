import React, { useEffect, useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import { type LayoutManager } from '@deephaven/golden-layout';
import Dashboard from './Dashboard';
import { type DashboardLayoutConfig } from './DashboardLayout';
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

/**
 * Tests targeting the contract of `DashboardLayout`. Mounted through `Dashboard`
 * so we get a real `LayoutManager`, real `componentRegistry`, and real
 * `stateChanged` events flowing through the production hook chain.
 */

const mountCounts = new Map<string, number>();

function TestPanel({
  metadata,
}: {
  metadata?: { name?: string | null; type?: string };
}) {
  const name = metadata?.name ?? 'unknown';
  useEffect(() => {
    mountCounts.set(name, (mountCounts.get(name) ?? 0) + 1);
  }, [name]);
  return <div data-testid={`test-panel-${name}`}>{name}</div>;
}
TestPanel.displayName = 'TestPanel';

function TestPlugin(props: Partial<DashboardPluginComponentProps>) {
  assertIsDashboardPluginProps(props);
  useDashboardPanel({
    componentName: TestPanel.displayName,
    component: TestPanel,
    supportedTypes: ['test'],
    dashboardProps: props,
  });
  return null;
}

/**
 * Simulates the production pattern where `DashboardContainer` round-trips the
 * dehydrated layout through redux: the reducer always produces a fresh top-level
 * array reference, so the prop that arrives back at `DashboardLayout` is
 * structurally equal to but referentially different from what was emitted.
 */
function ControlledDashboard({
  onGoldenLayoutChange,
  onLayoutConfigChange,
  cloneOnEcho = true,
}: {
  onGoldenLayoutChange?: (gl: LayoutManager) => void;
  onLayoutConfigChange?: (config: DashboardLayoutConfig) => void;
  cloneOnEcho?: boolean;
}) {
  const [layoutConfig, setLayoutConfig] = useState<
    DashboardLayoutConfig | undefined
  >(undefined);
  return (
    <ApiContext.Provider value={dh}>
      <Dashboard
        layoutConfig={layoutConfig}
        onGoldenLayoutChange={onGoldenLayoutChange}
        onLayoutConfigChange={next => {
          onLayoutConfigChange?.(next);
          setLayoutConfig(cloneOnEcho ? [...next] : next);
        }}
      >
        <TestPlugin />
      </Dashboard>
    </ApiContext.Provider>
  );
}

const waitRAF = () =>
  act(
    () =>
      new Promise<void>(resolve => {
        requestAnimationFrame(() => resolve());
      })
  );

beforeEach(() => {
  mountCounts.clear();
});

it('does not unmount existing panels when the parent echoes back a fresh layoutConfig reference', async () => {
  // Regression test for the `loadNewConfig` race in DashboardLayout.
  //
  // When a panel is opened, golden-layout emits `stateChanged`; the throttled
  // handler in DashboardLayout calls `setLastConfig(cfg)` and
  // `onLayoutChange(cfg)`. In production, `onLayoutChange` round-trips through
  // redux and the prop that comes back is structurally equal to `cfg` but a
  // different reference (reducers always produce a new state object). The
  // `loadNewConfig` effect compares `layoutConfig !== lastConfig` referentially
  // and treats this echo as a brand-new external config, then wipes and
  // rehydrates the entire layout — unmounting & remounting every live panel
  // (which in production tears down running console sessions).
  //
  // With the bug present, the panel below mounts twice: once when the
  // PanelEvent.OPEN is processed, and again when the round-trip wipes and
  // rehydrates the layout from the echoed config.

  let gl: LayoutManager | null = null;
  const onLayoutConfigChange = jest.fn();

  render(
    <ControlledDashboard
      onGoldenLayoutChange={newGl => {
        gl = newGl;
      }}
      onLayoutConfigChange={onLayoutConfigChange}
    />
  );

  // Wait for golden-layout to initialise.
  await waitRAF();

  // Open a single panel.
  act(() => {
    gl!.eventHub.emit(PanelEvent.OPEN, {
      panelId: 'panel-a',
      widget: { type: 'test', name: 'a' },
    });
  });

  // Let the GL stateChanged event fire (throttled to RAF) and the parent
  // re-render with the echoed prop.
  await waitRAF();
  await waitRAF();

  await waitFor(() => {
    expect(screen.getByTestId('test-panel-a')).toBeInTheDocument();
  });

  expect(onLayoutConfigChange).toHaveBeenCalled();

  // The panel must have been mounted exactly once. With the bug, the
  // referentially-different echo causes `loadNewConfig` to wipe + rehydrate the
  // layout, unmounting and remounting the panel.
  expect(mountCounts.get('a')).toBe(1);
});

it('does not unmount existing panels when echoing back the same reference (sanity)', async () => {
  // Companion to the regression test above: when the parent passes the exact
  // same array reference back, the existing referential check happens to work
  // and the layout should not be torn down. This test guards against
  // accidentally regressing the happy path while fixing the bug.

  let gl: LayoutManager | null = null;

  render(
    <ControlledDashboard
      cloneOnEcho={false}
      onGoldenLayoutChange={newGl => {
        gl = newGl;
      }}
    />
  );

  await waitRAF();

  act(() => {
    gl!.eventHub.emit(PanelEvent.OPEN, {
      panelId: 'panel-a',
      widget: { type: 'test', name: 'a' },
    });
  });

  await waitRAF();
  await waitRAF();

  await waitFor(() => {
    expect(screen.getByTestId('test-panel-a')).toBeInTheDocument();
  });

  expect(mountCounts.get('a')).toBe(1);
});
