import React from 'react';
import { render } from '@testing-library/react';
import { type CommandHistoryStorage } from '@deephaven/console';
import { CREATE_DASHBOARD, PanelEvent } from '@deephaven/dashboard';
import type { Container, EventEmitter } from '@deephaven/golden-layout';
import type { IdeConnection, IdeSession } from '@deephaven/jsapi-types';
import { dh } from '@deephaven/jsapi-shim';
import {
  type SessionConfig,
  type SessionWrapper,
} from '@deephaven/jsapi-utils';
import {
  PluginType,
  type PluginModuleMap,
  type WidgetDashboardPlugin,
  type WidgetPlugin,
} from '@deephaven/plugin';
import { TestUtils } from '@deephaven/test-utils';
import { ConsolePanel } from './ConsolePanel';

type IdeSessionConstructor = new (language: string) => IdeSession;

const mockConsole = jest.fn((_props: unknown) => null);
jest.mock('@deephaven/console', () => ({
  ...(jest.requireActual('@deephaven/console') as Record<string, unknown>),
  Console: props => mockConsole(props),
  default: props => mockConsole(props),
}));

function makeSession(language = 'TEST_LANG'): IdeSession {
  return new (dh.IdeSession as unknown as IdeSessionConstructor)(language);
}

function makeConnection({
  addEventListener = jest.fn(),
  removeEventListener = jest.fn(),
}: {
  addEventListener?: (eventName: string, callback: () => void) => void;
  removeEventListener?: (eventName: string, callback: () => void) => void;
} = {}): IdeConnection {
  return {
    addEventListener,
    removeEventListener,
  } as unknown as IdeConnection;
}

function makeSessionConfig(): SessionConfig {
  return { type: 'test_type', id: 'test_id' };
}

function makeSessionWrapper({
  config = makeSessionConfig(),
  connection = makeConnection(),
  session = makeSession(),
} = {}): SessionWrapper {
  return { session, connection, config, dh };
}

function makeCommandHistoryStorage(): CommandHistoryStorage {
  return {} as CommandHistoryStorage;
}

function renderConsolePanel({
  eventHub = TestUtils.createMockProxy<EventEmitter>(),
  container = TestUtils.createMockProxy<Container>({
    tab: undefined,
  }),
  commandHistoryStorage = makeCommandHistoryStorage(),
  timeZone = 'MockTimeZone',
  sessionWrapper = makeSessionWrapper(),
  plugins = new Map() as PluginModuleMap,
  ref,
}: {
  eventHub?: EventEmitter;
  container?: Container;
  commandHistoryStorage?: CommandHistoryStorage;
  timeZone?: string;
  sessionWrapper?: SessionWrapper;
  plugins?: PluginModuleMap;
  ref?: React.Ref<ConsolePanel>;
} = {}) {
  return render(
    <ConsolePanel
      ref={ref}
      glEventHub={eventHub}
      glContainer={container}
      commandHistoryStorage={commandHistoryStorage}
      timeZone={timeZone}
      sessionWrapper={sessionWrapper}
      localDashboardId="mock-localDashboardId"
      plugins={plugins}
    />
  );
}

beforeEach(() => {
  // Mocking the Console component causes it to be treated as a functional
  // component which causes React to log an error about passing refs. Disable
  // logging to supress this
  TestUtils.disableConsoleOutput('error');

  mockConsole.mockClear();
});

it('renders without crashing', () => {
  const { unmount } = renderConsolePanel();
  unmount();
});

describe('openWidget', () => {
  function TestWidget() {
    return null;
  }

  const widgetPlugin: WidgetPlugin = {
    name: 'test-widget-plugin',
    type: PluginType.WIDGET_PLUGIN,
    component: TestWidget,
    supportedTypes: 'test-widget',
  };

  const dashboardPayload = {
    pluginId: 'test-widget-dashboard-plugin',
    title: 'Test Dashboard',
    data: { foo: 'bar' },
  };

  const widgetDashboardPlugin: WidgetDashboardPlugin = {
    name: 'test-widget-dashboard-plugin',
    type: PluginType.WIDGET_PLUGIN,
    component: TestWidget,
    supportedTypes: 'test-widget',
    dashboardTypes: 'test-dashboard',
    createDashboardPayload: jest.fn(() => dashboardPayload),
  };

  it('emits CREATE_DASHBOARD when a matching widget dashboard plugin is found', () => {
    const eventHub = TestUtils.createMockProxy<EventEmitter>();
    const ref = React.createRef<ConsolePanel>();
    const plugins: PluginModuleMap = new Map([
      [widgetDashboardPlugin.name, widgetDashboardPlugin],
    ]);
    renderConsolePanel({ eventHub, plugins, ref });

    const widget = { type: 'test-dashboard', name: 'test', title: 'Test' };
    ref.current?.openWidget(widget);

    expect(widgetDashboardPlugin.createDashboardPayload).toHaveBeenCalledWith(
      widget
    );
    expect(eventHub.emit).toHaveBeenCalledWith(
      CREATE_DASHBOARD,
      dashboardPayload
    );
    expect(eventHub.emit).not.toHaveBeenCalledWith(
      PanelEvent.OPEN,
      expect.anything()
    );
  });

  it('emits PanelEvent.OPEN when no widget dashboard plugin matches', () => {
    const eventHub = TestUtils.createMockProxy<EventEmitter>();
    const ref = React.createRef<ConsolePanel>();
    const plugins: PluginModuleMap = new Map([
      [widgetPlugin.name, widgetPlugin],
      [widgetDashboardPlugin.name, widgetDashboardPlugin],
    ]);
    renderConsolePanel({ eventHub, plugins, ref });

    const widget = { type: 'test-widget', name: 'test', title: 'Test' };
    ref.current?.openWidget(widget);

    expect(eventHub.emit).toHaveBeenCalledWith(
      PanelEvent.OPEN,
      expect.objectContaining({
        widget: expect.objectContaining({ type: 'test-widget' }),
      })
    );
    expect(eventHub.emit).not.toHaveBeenCalledWith(
      CREATE_DASHBOARD,
      expect.anything()
    );
  });
});
