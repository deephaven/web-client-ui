import React from 'react';
import { AUTH_HANDLER_TYPE_ANONYMOUS } from '@deephaven/auth-plugins';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import { BROADCAST_LOGIN_MESSAGE } from '@deephaven/jsapi-utils';
import type {
  CoreClient,
  IdeConnection,
  dh as DhType,
} from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/utils';
import { act, render, screen } from '@testing-library/react';
import AppBootstrap from './AppBootstrap';

const API_URL = 'http://mockserver.net:8111';
const PLUGINS_URL = 'http://mockserver.net:8111/plugins';

const mockGetServerConfigValues = jest.fn(() => Promise.resolve([]));
const mockPluginsPromise = Promise.resolve([]);
jest.mock('../plugins', () => ({
  ...jest.requireActual('../plugins'),
  loadModulePlugins: jest.fn(() => mockPluginsPromise),
}));

const mockChannel = {
  postMessage: jest.fn(),
};
jest.mock('@deephaven/jsapi-components', () => ({
  ...jest.requireActual('@deephaven/jsapi-components'),
  RefreshTokenBootstrap: jest.fn(({ children }) => children),
  useBroadcastChannel: jest.fn(() => mockChannel),
  useBroadcastLoginListener: jest.fn(),
}));

const mockChildText = 'Mock Child';
const mockChild = <div>{mockChildText}</div>;

function expectMockChild() {
  return expect(screen.queryByText(mockChildText));
}

function renderComponent(client: CoreClient) {
  const api = TestUtils.createMockProxy<DhType>({
    CoreClient: jest
      .fn()
      .mockImplementation(() => client) as unknown as CoreClient,
  });
  return render(
    <ApiContext.Provider value={api}>
      <AppBootstrap serverUrl={API_URL} pluginsUrl={PLUGINS_URL}>
        {mockChild}
      </AppBootstrap>
    </ApiContext.Provider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

it('should throw if api has not been bootstrapped', () => {
  expect(() =>
    render(
      <AppBootstrap serverUrl={API_URL} pluginsUrl={PLUGINS_URL}>
        {mockChild}
      </AppBootstrap>
    )
  ).toThrow();
  expectMockChild().toBeNull();
});

it('should display an error if no login plugin matches the provided auth handlers', async () => {
  const authConfigValues: [string, string][] = [
    ['AuthHandlers', `MockAuthHandler`],
  ];
  const mockGetAuthConfigValues = jest.fn(() =>
    Promise.resolve(authConfigValues)
  );
  const mockLogin = jest.fn(() => Promise.resolve());
  const client = TestUtils.createMockProxy<CoreClient>({
    getAuthConfigValues: mockGetAuthConfigValues,
    getServerConfigValues: mockGetServerConfigValues,
    login: mockLogin,
  });
  renderComponent(client);
  expectMockChild().toBeNull();
  expect(mockGetAuthConfigValues).toHaveBeenCalled();

  await act(async () => {
    await mockPluginsPromise;
  });

  expectMockChild().toBeNull();
  expect(mockLogin).not.toHaveBeenCalled();
  expect(
    screen.queryByText(
      'No login plugins found, please register a login plugin for auth handlers: MockAuthHandler'
    )
  ).not.toBeNull();
});

it('should log in automatically when the anonymous handler is supported', async () => {
  const authConfigValues: [string, string][] = [
    ['AuthHandlers', `${AUTH_HANDLER_TYPE_ANONYMOUS}`],
  ];
  const mockGetAuthConfigValues = jest.fn(() =>
    Promise.resolve(authConfigValues)
  );
  let mockLoginResolve;
  const mockLogin = jest.fn(
    () =>
      new Promise<void>(resolve => {
        mockLoginResolve = resolve;
      })
  );
  let mockConnectionResolve;
  const mockGetAsConnection = jest.fn(
    () =>
      new Promise<IdeConnection>(resolve => {
        mockConnectionResolve = resolve;
      })
  );
  const mockConnection = TestUtils.createMockProxy<IdeConnection>({});
  const client = TestUtils.createMockProxy<CoreClient>({
    getAsIdeConnection: mockGetAsConnection,
    getAuthConfigValues: mockGetAuthConfigValues,
    getServerConfigValues: mockGetServerConfigValues,
    login: mockLogin,
  });

  renderComponent(client);

  expectMockChild().toBeNull();
  expect(mockLogin).not.toHaveBeenCalled();

  // Wait for plugins to load
  await act(async () => {
    await mockPluginsPromise;
  });

  expect(mockChannel.postMessage).not.toHaveBeenCalled();
  expectMockChild().toBeNull();
  expect(mockLogin).toHaveBeenCalled();
  expect(screen.queryByTestId('auth-base-loading')).not.toBeNull();

  // Wait for login to complete
  await act(async () => {
    mockLoginResolve();
  });

  expect(screen.queryByTestId('auth-base-loading')).toBeNull();
  expect(screen.queryByTestId('connection-bootstrap-loading')).not.toBeNull();
  expect(screen.queryByText(mockChildText)).toBeNull();
  expect(mockChannel.postMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      message: BROADCAST_LOGIN_MESSAGE,
    })
  );

  // Wait for IdeConnection to resolve
  await act(async () => {
    mockConnectionResolve(mockConnection);
  });

  expect(screen.queryByTestId('auth-base-loading')).toBeNull();
  expect(screen.queryByTestId('connection-bootstrap-loading')).toBeNull();
  expectMockChild().not.toBeNull();
});
