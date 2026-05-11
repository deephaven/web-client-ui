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
 * Test harness that simulates the production parent (`DashboardContainer` +
 * `AppMainContainer`) echoing the dehydrated `layoutConfig` back to
 * `DashboardLayout`.
 *
 * Background a single tick of the throttled body in `DashboardLayout` starts
 * two independent update chains. Chain A is the local `setLastConfig(cfg)`
 * (a `useState` update on the child). Chain B is `onLayoutChange(cfg)`, which
 * synchronously calls into `DashboardContainer.handleLayoutStateChanged`
 * (in-place mutation of `tabModel.layoutConfig`) → `AppMainContainer.handleDashboardChange`
 * (class-component `setState` plus a later redux dispatch from
 * `saveDashboard`). The bug occurs when chain B's parent re-render commits
 * the echoed prop to `DashboardLayout` *before* chain A's `setLastConfig`
 * has committed.
 *
 * The harness collapses chain B's multi-hop sequence into a single
 * `flushSync(() => setLayoutConfig(next))` from inside
 * `onLayoutConfigChange`, while still passing back the **same** array
 * reference (matching the production in-place mutation). `flushSync` is not
 * the exact production mechanism — production splits commits via the redux
 * microtask in `saveDashboard` and a separate `handleRawLayoutStateChanged`
 * listener, with `react-redux@7.2.9` subscriptions in between (not
 * `useSyncExternalStore`) — but it produces the same observable: the parent
 * re-renders with the echoed `layoutConfig` before the throttled body's
 * `setLastConfig` has committed.
 */
function ControlledDashboard({
  onGoldenLayoutChange,
  onLayoutConfigChange,
}: {
  onGoldenLayoutChange?: (gl: LayoutManager) => void;
  onLayoutConfigChange?: (config: DashboardLayoutConfig) => void;
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
          flushSync(() => {
            setLayoutConfig(next);
          });
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
  // The bug: a single tick of `DashboardLayout`'s throttled body starts two
  // independent update chains.
  //   Chain A: `setLastConfig(cfg)` — a local `useState` update on the
  //     child, enqueued for a future commit.
  //   Chain B: `onLayoutChange(cfg)` — synchronously calls
  //     `DashboardContainer.handleLayoutStateChanged`, which mutates
  //     `tabModel.layoutConfig = cfg` in place and calls
  //     `AppMainContainer.handleDashboardChange`. That handler does a
  //     class-component `setState({ tabs: [...tabs] })` to force the
  //     ancestor to re-render and propagate the echoed prop back down, plus
  //     a later redux dispatch from `saveDashboard`.
  //
  // Chain B has multiple scheduling boundaries (sync class `setState`, async
  // redux microtask, separate `handleRawLayoutStateChanged` listener).
  // Empirically, in production at least one of those re-renders commits the
  // echoed `layoutConfig` prop into `DashboardLayout` *before* chain A's
  // queued `setLastConfig` has committed. In that render `DashboardLayout`
  // sees `layoutConfig=NEW` but `lastConfig=OLD`. The `loadNewConfig`
  // effect's referential `layoutConfig !== lastConfig` gate opens, the
  // layout is wiped, every live panel is unmounted, and
  // `ConsoleContainer`'s cleanup closes the running console session.
  //
  // We reproduce that render ordering deterministically here by collapsing
  // chain B into a `flushSync(() => setLayoutConfig(next))` inside
  // `onLayoutConfigChange`, while still passing back the *same* array
  // reference (matching the production in-place mutation). With the bug
  // present, the panel below mounts twice: once when the `PanelEvent.OPEN`
  // is processed, and again when `loadNewConfig` wipes and rehydrates from
  // the echoed config.

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

it('hydrates panels from a new external layoutConfig prop', async () => {
  // Exercises the intended role of the `loadNewConfig` effect: when an
  // external `layoutConfig` prop change arrives (e.g. loading a saved layout
  // or switching tabs) and is not the echo of a state the layout already
  // holds, the effect should rehydrate the layout from that config.
  //
  // This test passes both before and after the DH-21843 fix and guards
  // against accidentally disabling the effect entirely.

  let setExternalLayoutConfig:
    | ((config: DashboardLayoutConfig | undefined) => void)
    | null = null;

  function ExternallyControlledDashboard() {
    const [layoutConfig, setLayoutConfig] = useState<
      DashboardLayoutConfig | undefined
    >(undefined);
    setExternalLayoutConfig = setLayoutConfig;
    return (
      <ApiContext.Provider value={dh}>
        <Dashboard layoutConfig={layoutConfig}>
          <TestPlugin />
        </Dashboard>
      </ApiContext.Provider>
    );
  }

  render(<ExternallyControlledDashboard />);

  await waitRAF();

  expect(screen.queryByTestId('test-panel-a')).not.toBeInTheDocument();

  const newConfig: DashboardLayoutConfig = [
    {
      type: 'stack',
      content: [
        {
          type: 'react-component',
          component: TestPanel.displayName,
          props: { metadata: { type: 'test', name: 'a' } },
          title: 'a',
        },
      ],
    },
    // Cast: the config shape mirrors what `hydrateLayoutConfig` accepts in
    // production; the strict GoldenLayout `ItemConfig` typing requires extra
    // fields that the hydrator fills in.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any;

  act(() => {
    setExternalLayoutConfig!(newConfig);
  });

  await waitRAF();

  await waitFor(() => {
    expect(screen.getByTestId('test-panel-a')).toBeInTheDocument();
  });

  expect(mountCounts.get('a')).toBe(1);
});
