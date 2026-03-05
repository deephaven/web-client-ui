import React from 'react';
import { render, screen, act } from '@testing-library/react';
import {
  PluginType,
  PluginsContext,
  type WidgetPlugin,
  type WidgetMiddlewarePlugin,
  type WidgetComponentProps,
  type WidgetMiddlewareComponentProps,
} from '@deephaven/plugin';
import { Provider } from 'react-redux';
import { Dashboard, PanelEvent } from '@deephaven/dashboard';
import { createMockStore } from '@deephaven/redux';
import { dh } from '@deephaven/jsapi-shim';
import { ApiContext, ObjectFetcherContext } from '@deephaven/jsapi-bootstrap';
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

const objectFetcher = jest.fn(() => ({}));

const DEFAULT_PLUGINS = [
  ['test-widget-plugin', testWidgetPlugin],
  ['test-widget-plugin-with-panel', testWidgetPluginWithPanel],
  ['test-dashboard-plugin', WidgetLoaderPluginConfig],
] as [string, WidgetPlugin][];

function createAndMountDashboard(
  plugins: [string, WidgetPlugin][] = DEFAULT_PLUGINS
) {
  const store = createMockStore();
  let layoutManager: LayoutManager | undefined;

  render(
    <ApiContext.Provider value={dh}>
      <ObjectFetcherContext.Provider value={objectFetcher}>
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
      </ObjectFetcherContext.Provider>
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
          widget: { type: 'test-widget', name: 'name' },
        })
    );
    expect(screen.queryAllByText('TestWidget').length).toBe(0);
    expect(screen.queryAllByText('TestWidgetTwo').length).toBe(1);

    act(
      () =>
        layoutManager?.eventHub.emit(PanelEvent.OPEN, {
          widget: { type: 'test-widget-a', name: 'name' },
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

describe('middleware plugin chaining', () => {
  function TestMiddlewareWrapper({
    Component,
    ...props
  }: WidgetMiddlewareComponentProps) {
    return (
      <div data-testid="middleware-wrapper">
        <span>MiddlewareWrapper</span>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component {...props} />
      </div>
    );
  }

  function TestMiddlewareWrapperTwo({
    Component,
    ...props
  }: WidgetMiddlewareComponentProps) {
    return (
      <div data-testid="middleware-wrapper-two">
        <span>MiddlewareWrapperTwo</span>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <Component {...props} />
      </div>
    );
  }

  const testMiddlewarePlugin: WidgetMiddlewarePlugin = {
    name: 'test-middleware',
    type: PluginType.WIDGET_PLUGIN,
    component: TestMiddlewareWrapper,
    supportedTypes: 'test-widget',
    isMiddleware: true,
  };

  const testMiddlewarePluginTwo: WidgetMiddlewarePlugin = {
    name: 'test-middleware-two',
    type: PluginType.WIDGET_PLUGIN,
    component: TestMiddlewareWrapperTwo,
    supportedTypes: 'test-widget',
    isMiddleware: true,
  };

  it('chains middleware plugin around base widget', async () => {
    const layoutManager = createAndMountDashboard([
      ['test-widget-plugin', testWidgetPlugin],
      ['test-middleware-plugin', testMiddlewarePlugin],
    ]);

    act(
      () =>
        layoutManager?.eventHub.emit(PanelEvent.OPEN, {
          widget: { type: 'test-widget' },
        })
    );

    // Both the middleware wrapper and the base widget should be rendered
    expect(screen.queryAllByText('MiddlewareWrapper').length).toBe(1);
    expect(screen.queryAllByText('TestWidget').length).toBe(1);

    // The widget should be inside the middleware wrapper
    const wrapper = screen.getByTestId('middleware-wrapper');
    expect(wrapper).toContainElement(screen.getByText('TestWidget'));
  });

  it('chains multiple middleware plugins in registration order', async () => {
    const layoutManager = createAndMountDashboard([
      ['test-widget-plugin', testWidgetPlugin],
      ['test-middleware-plugin', testMiddlewarePlugin],
      ['test-middleware-plugin-two', testMiddlewarePluginTwo],
    ]);

    act(
      () =>
        layoutManager?.eventHub.emit(PanelEvent.OPEN, {
          widget: { type: 'test-widget' },
        })
    );

    // All components should be rendered
    expect(screen.queryAllByText('MiddlewareWrapper').length).toBe(1);
    expect(screen.queryAllByText('MiddlewareWrapperTwo').length).toBe(1);
    expect(screen.queryAllByText('TestWidget').length).toBe(1);

    // Middleware should be chained in registration order (first middleware is outermost)
    const wrapperOne = screen.getByTestId('middleware-wrapper');
    const wrapperTwo = screen.getByTestId('middleware-wrapper-two');
    expect(wrapperOne).toContainElement(wrapperTwo);
    expect(wrapperTwo).toContainElement(screen.getByText('TestWidget'));
  });

  it('middleware registered before base plugin is still applied', async () => {
    const layoutManager = createAndMountDashboard([
      ['test-middleware-plugin', testMiddlewarePlugin],
      ['test-widget-plugin', testWidgetPlugin],
    ]);

    act(
      () =>
        layoutManager?.eventHub.emit(PanelEvent.OPEN, {
          widget: { type: 'test-widget' },
        })
    );

    // Middleware should wrap the base widget
    expect(screen.queryAllByText('MiddlewareWrapper').length).toBe(1);
    expect(screen.queryAllByText('TestWidget').length).toBe(1);
    const wrapper = screen.getByTestId('middleware-wrapper');
    expect(wrapper).toContainElement(screen.getByText('TestWidget'));
  });

  it('middleware without base plugin is not rendered', async () => {
    const layoutManager = createAndMountDashboard([
      [
        'test-middleware-only',
        {
          ...testMiddlewarePlugin,
          supportedTypes: 'middleware-only-type',
        },
      ],
    ]);

    act(
      () =>
        layoutManager?.eventHub.emit(PanelEvent.OPEN, {
          widget: { type: 'middleware-only-type' },
        })
    );

    // Nothing should be rendered since there's no base plugin
    expect(screen.queryAllByText('MiddlewareWrapper').length).toBe(0);
  });

  it('base plugin replacement keeps middleware chain', async () => {
    const layoutManager = createAndMountDashboard([
      ['test-widget-plugin', testWidgetPlugin],
      ['test-middleware-plugin', testMiddlewarePlugin],
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

    // The second base plugin should replace the first, but middleware should still apply
    expect(screen.queryAllByText('MiddlewareWrapper').length).toBe(1);
    expect(screen.queryAllByText('TestWidget').length).toBe(0);
    expect(screen.queryAllByText('TestWidgetTwo').length).toBe(1);

    const wrapper = screen.getByTestId('middleware-wrapper');
    expect(wrapper).toContainElement(screen.getByText('TestWidgetTwo'));
  });
});
