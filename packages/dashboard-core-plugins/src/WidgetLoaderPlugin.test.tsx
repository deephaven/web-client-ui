import React from 'react';
import { render, screen, act } from '@testing-library/react';
import {
  PluginType,
  PluginsContext,
  type WidgetPlugin,
  type WidgetComponentProps,
} from '@deephaven/plugin';
import { Provider } from 'react-redux';
import { Dashboard, PanelEvent } from '@deephaven/dashboard';
import { createMockStore } from '@deephaven/redux';
import { dh } from '@deephaven/jsapi-shim';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import { type IdeConnection } from '@deephaven/jsapi-types';
import { ConnectionContext } from '@deephaven/jsapi-components';
import {
  type LayoutManager,
  EventEmitter,
  type ItemContainer,
} from '@deephaven/golden-layout';
import { assertNotNull } from '@deephaven/utils';
import WidgetLoaderPlugin, { WrapWidgetPlugin } from './WidgetLoaderPlugin';
import WidgetLoaderPluginConfig from './WidgetLoaderPluginConfig';

function TestWidget() {
  return <div>TestWidget</div>;
}

function TestWidgetTwo() {
  return <div>TestWidgetTwo</div>;
}

function TestPanel() {
  return <div>TestPanel</div>;
}

class TestForwardRef extends React.PureComponent<WidgetComponentProps> {
  render() {
    return <div>TestForwardRef</div>;
  }
}

const testWidgetPlugin: WidgetPlugin = {
  component: TestWidget,
  name: 'widget',
  title: 'Widget',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'test-widget',
};

const testWidgetPluginWithPanel: WidgetPlugin = {
  name: 'widget-with-panel',
  title: 'Widget',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'test-widget-panel',
  component: TestWidget,
  panelComponent: TestPanel,
};

const testWidgetRefPlugin: WidgetPlugin = {
  component: TestForwardRef,
  name: 'widget',
  title: 'Widget',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'test-widget-ref',
};

function makeConnection(): IdeConnection {
  const connection = new dh.IdeConnection('http://mockserver');
  connection.getObject = jest.fn();
  return connection;
}

const DEFAULT_PLUGINS = [
  ['test-widget-plugin', testWidgetPlugin],
  ['test-widget-plugin-with-panel', testWidgetPluginWithPanel],
  ['test-dashboard-plugin', WidgetLoaderPluginConfig],
] as [string, WidgetPlugin][];

function createAndMountDashboard(
  plugins: [string, WidgetPlugin][] = DEFAULT_PLUGINS
) {
  const store = createMockStore();
  const connection = makeConnection();
  let layoutManager: LayoutManager | undefined;

  render(
    <ApiContext.Provider value={dh}>
      <ConnectionContext.Provider value={connection}>
        <PluginsContext.Provider value={new Map<string, WidgetPlugin>(plugins)}>
          <Provider store={store}>
            <Dashboard
              onGoldenLayoutChange={newLayout => {
                layoutManager = newLayout;
              }}
            >
              <WidgetLoaderPlugin />
            </Dashboard>
          </Provider>
        </PluginsContext.Provider>
      </ConnectionContext.Provider>
    </ApiContext.Provider>
  );
  assertNotNull(layoutManager);
  return layoutManager;
}

describe('WidgetLoaderPlugin', () => {
  it('Mounts components that should be wrapped', async () => {
    const layoutManager = createAndMountDashboard();

    act(
      () =>
        layoutManager?.eventHub.emit(PanelEvent.OPEN, {
          widget: { type: 'test-widget' },
        })
    );
    expect(screen.queryAllByText('TestWidget').length).toBe(1);
  });

  it('Mounts components that should not be wrapped', async () => {
    const layoutManager = createAndMountDashboard();

    act(
      () =>
        layoutManager?.eventHub.emit(PanelEvent.OPEN, {
          widget: { type: 'test-widget-panel' },
        })
    );
    expect(screen.queryAllByText('TestPanel').length).toBe(1);
  });

  it('Handles plugins with multiple supported types', async () => {
    const layoutManager = createAndMountDashboard([
      [
        'test-widget-plugin-two',
        {
          name: 'test-widget-plugin-two',
          type: PluginType.WIDGET_PLUGIN,
          component: TestWidgetTwo,
          supportedTypes: ['test-widget-two-a', 'test-widget-two-b'],
        },
      ],
    ]);

    act(
      () =>
        layoutManager?.eventHub.emit(PanelEvent.OPEN, {
          widget: { type: 'test-widget-two-a' },
        })
    );
    expect(screen.queryAllByText('TestWidgetTwo').length).toBe(1);

    act(
      () =>
        layoutManager?.eventHub.emit(PanelEvent.OPEN, {
          widget: { type: 'test-widget-two-b' },
        })
    );
    expect(screen.queryAllByText('TestWidgetTwo').length).toBe(2);
  });

  it('Ignores unknown widget types', async () => {
    const layoutManager = createAndMountDashboard();

    act(
      () =>
        layoutManager?.eventHub.emit(PanelEvent.OPEN, {
          widget: { type: 'unknown-widget' },
        })
    );
    expect(screen.queryAllByText('TestWidget').length).toBe(0);
    expect(screen.queryAllByText('TestPanel').length).toBe(0);
  });

  it('Does not mount if the plugin does not have supportedTypes', async () => {
    const layoutManager = createAndMountDashboard([
      [
        testWidgetPlugin.name,
        {
          ...testWidgetPlugin,
          supportedTypes: undefined,
        },
      ],
    ]);

    act(
      () =>
        layoutManager?.eventHub.emit(PanelEvent.OPEN, {
          widget: { type: 'test-widget' },
        })
    );
    expect(screen.queryAllByText('TestWidget').length).toBe(0);
  });

  it('Overrides plugins that handle the same widget type', async () => {
    const layoutManager = createAndMountDashboard([
      [
        'test-widget-plugin',
        {
          ...testWidgetPlugin,
          supportedTypes: ['test-widget', 'test-widget-a'],
        },
      ],
      [
        'test-widget-plugin-two',
        {
          name: 'test-widget-plugin-two',
          type: PluginType.WIDGET_PLUGIN,
          component: TestWidgetTwo,
          supportedTypes: 'test-widget',
        },
      ],
    ]);

    act(
      () =>
        layoutManager?.eventHub.emit(PanelEvent.OPEN, {
          widget: { type: 'test-widget' },
        })
    );
    expect(screen.queryAllByText('TestWidget').length).toBe(0);
    expect(screen.queryAllByText('TestWidgetTwo').length).toBe(1);

    act(
      () =>
        layoutManager?.eventHub.emit(PanelEvent.OPEN, {
          widget: { type: 'test-widget-a' },
        })
    );
    expect(screen.queryAllByText('TestWidget').length).toBe(1);
    expect(screen.queryAllByText('TestWidgetTwo').length).toBe(1);
  });
});

describe('component wrapper', () => {
  it('should forward callback refs', () => {
    let refObj;
    const ref = jest.fn(r => {
      refObj = r;
    });
    const Wrapper = WrapWidgetPlugin(testWidgetRefPlugin);
    render(
      <Wrapper
        ref={ref}
        glContainer={new EventEmitter() as ItemContainer}
        glEventHub={new EventEmitter()}
      />
    );
    expect(ref).toBeCalledTimes(1);
    expect(refObj).toBeInstanceOf(TestForwardRef);
  });

  it('should forward non-callback refs', () => {
    const ref = React.createRef();
    const Wrapper = WrapWidgetPlugin(testWidgetRefPlugin);
    render(
      <Wrapper
        ref={ref}
        glContainer={new EventEmitter() as ItemContainer}
        glEventHub={new EventEmitter()}
      />
    );
    expect(ref.current).toBeInstanceOf(TestForwardRef);
  });

  it('should not error if no ref passed', () => {
    const Wrapper = WrapWidgetPlugin(testWidgetRefPlugin);
    render(
      <Wrapper
        glContainer={new EventEmitter() as ItemContainer}
        glEventHub={new EventEmitter()}
      />
    );
  });
});
