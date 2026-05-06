import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
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
 * Test harness that controls how the parent echoes the dehydrated
 * `layoutConfig` back to `DashboardLayout`.
 *
 * The `echoMode` prop selects between three production-relevant patterns:
 *
 *  - `'same-ref'`: the parent stores and passes back the exact array reference
 *    it received. This is what the enterprise `DashboardContainer` does today
 *    (it mutates `tabModel.layoutConfig = layoutConfig` in place).
 *  - `'clone'`: the parent stores a shallow clone of the array. Any echo path
 *    that runs through a reducer or that defensively copies will produce a
 *    new top-level reference like this.
 *  - `'flush-sync'`: the parent stores the same reference but commits its
 *    state update synchronously via `flushSync` from inside
 *    `onLayoutConfigChange`. This forces the parent's prop update to commit
 *    *before* `DashboardLayout`'s own queued `setLastConfig` does, which is
 *    the lane-priority race observed in DH-21843 (`useSyncExternalStore`
 *    notifications from `react-redux` flush at the Sync lane and pre-empt the
 *    Default-lane local state update).
 */
function ControlledDashboard({
  onGoldenLayoutChange,
  onLayoutConfigChange,
  echoMode = 'same-ref',
}: {
  onGoldenLayoutChange?: (gl: LayoutManager) => void;
  onLayoutConfigChange?: (config: DashboardLayoutConfig) => void;
  echoMode?: 'same-ref' | 'clone' | 'flush-sync';
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
          if (echoMode === 'clone') {
            setLayoutConfig([...next]);
          } else if (echoMode === 'flush-sync') {
            flushSync(() => {
              setLayoutConfig(next);
            });
          } else {
            setLayoutConfig(next);
          }
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

it('does not unmount existing panels when the parent commits the echoed layoutConfig synchronously (DH-21843)', async () => {
  // Regression test for DH-21843.
  //
  // Production trace:
  //   1. golden-layout emits `stateChanged`; the throttled handler in
  //      `DashboardLayout` calls `setLastConfig(cfg)` then `onLayoutChange(cfg)`.
  //   2. The parent (`DashboardContainer`) mutates `tabModel.layoutConfig = cfg`
  //      (same reference) and dispatches a redux action.
  //   3. `react-redux`'s `useSyncExternalStore` subscribers in connected
  //      ancestors flush at the Sync lane, re-rendering the ancestor and
  //      pushing the new `layoutConfig` prop down to `DashboardLayout` *before*
  //      its own Default-lane `setLastConfig` has committed.
  //   4. `DashboardLayout` commits a render where `layoutConfig` has advanced
  //      to the new value but `lastConfig` is still the previous one. The
  //      `loadNewConfig` effect's referential `layoutConfig !== lastConfig`
  //      gate opens, the layout is wiped, every live panel is unmounted, and
  //      `ConsoleContainer`'s cleanup closes the running console session.
  //
  // We reproduce that lane ordering deterministically by having the parent
  // commit its state update via `flushSync` from inside `onLayoutConfigChange`,
  // while still passing back the *same* array reference (matching
  // `DashboardContainer`'s in-place mutation). With the bug present, the
  // panel below mounts twice: once when the `PanelEvent.OPEN` is processed,
  // and again when `loadNewConfig` wipes and rehydrates from the echoed
  // config.

  let gl: LayoutManager | null = null;
  const onLayoutConfigChange = jest.fn();

  render(
    <ControlledDashboard
      echoMode="flush-sync"
      onGoldenLayoutChange={newGl => {
        gl = newGl;
      }}
      onLayoutConfigChange={onLayoutConfigChange}
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

  expect(onLayoutConfigChange).toHaveBeenCalled();
  expect(mountCounts.get('a')).toBe(1);
});

it('does not unmount existing panels when the parent echoes back a fresh layoutConfig reference', async () => {
  // Companion regression test. Any echo path that produces a new top-level
  // array reference (reducer-produced state, defensive cloning, etc.) opens
  // the same `loadNewConfig` referential gate as the lane-tearing case above,
  // because `lastConfig` is `===`-compared against `layoutConfig`. The fix
  // (deep-equality gate against a ref) must cover both shapes.

  let gl: LayoutManager | null = null;
  const onLayoutConfigChange = jest.fn();

  render(
    <ControlledDashboard
      echoMode="clone"
      onGoldenLayoutChange={newGl => {
        gl = newGl;
      }}
      onLayoutConfigChange={onLayoutConfigChange}
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

  expect(onLayoutConfigChange).toHaveBeenCalled();
  expect(mountCounts.get('a')).toBe(1);
});

it('does not unmount existing panels when echoing back the same reference (sanity)', async () => {
  // Happy path: when the parent passes the exact same array reference back
  // *and* the echoed prop update commits in the same render as
  // `DashboardLayout`'s own `setLastConfig`, the existing referential gate
  // works. This test guards against regressing the happy path while fixing
  // the cases above.

  let gl: LayoutManager | null = null;

  render(
    <ControlledDashboard
      echoMode="same-ref"
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
