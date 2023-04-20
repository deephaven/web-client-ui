import React from 'react';
import { AUTH_HANDLER_TYPE_ANONYMOUS } from '@deephaven/auth-plugins';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import {
  CoreClient,
  IdeConnection,
  dh as DhType,
} from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/utils';
import { act, render, screen } from '@testing-library/react';
import AppBootstrap from './AppBootstrap';

const API_URL = 'http://mockserver.net:8111';
const PLUGINS_URL = 'http://mockserver.net:8111/plugins';

const mockPluginsPromise = Promise.resolve([]);
jest.mock('../plugins', () => ({
  ...jest.requireActual('../plugins'),
  loadModulePlugins: jest.fn(() => mockPluginsPromise),
}));

const mockChildText = 'Mock Child';
const mockChild = <div>{mockChildText}</div>;

function expectMockChild() {
  return expect(screen.queryByText(mockChildText));
}

it('should throw if api has not been bootstrapped', () => {
  expect(() =>
    render(
      <AppBootstrap apiUrl={API_URL} pluginsUrl={PLUGINS_URL}>
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
    login: mockLogin,
  });
  const api = TestUtils.createMockProxy<DhType>({
    CoreClient: (jest
      .fn()
      .mockImplementation(() => client) as unknown) as CoreClient,
  });

  render(
    <ApiContext.Provider value={api}>
      <AppBootstrap apiUrl={API_URL} pluginsUrl={PLUGINS_URL}>
        {mockChild}
      </AppBootstrap>
    </ApiContext.Provider>
  );
  expectMockChild().toBeNull();
  expect(mockGetAuthConfigValues).toHaveBeenCalled();

  await act(async () => {
    await mockPluginsPromise;
  });

  expectMockChild().toBeNull();
  expect(mockLogin).not.toHaveBeenCalled();
  expect(
    screen.queryByText(
      'Error: No login plugins found, please register a login plugin for auth handlers: MockAuthHandler'
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
    getAuthConfigValues: mockGetAuthConfigValues,
    login: mockLogin,
    getAsIdeConnection: mockGetAsConnection,
  });
  const api = TestUtils.createMockProxy<DhType>({
    CoreClient: (jest
      .fn()
      .mockImplementation(() => client) as unknown) as CoreClient,
  });

  render(
    <ApiContext.Provider value={api}>
      <AppBootstrap apiUrl={API_URL} pluginsUrl={PLUGINS_URL}>
        <div>{mockChild}</div>
      </AppBootstrap>
    </ApiContext.Provider>
  );

  expectMockChild().toBeNull();
  expect(mockLogin).not.toHaveBeenCalled();

  // Wait for plugins to load
  await act(async () => {
    await mockPluginsPromise;
  });

  expectMockChild().toBeNull();
  expect(mockLogin).toHaveBeenCalled();
  expect(screen.queryByTestId('auth-anonymous-loading')).not.toBeNull();

  // Wait for login to complete
  await act(async () => {
    mockLoginResolve();
  });

  expect(screen.queryByTestId('auth-anonymous-loading')).toBeNull();
  expect(screen.queryByTestId('connection-bootstrap-loading')).not.toBeNull();
  expect(screen.queryByText(mockChildText)).toBeNull();

  // Wait for IdeConnection to resolve
  await act(async () => {
    mockConnectionResolve(mockConnection);
  });

  expect(screen.queryByTestId('auth-anonymous-loading')).toBeNull();
  expect(screen.queryByTestId('connection-bootstrap-loading')).toBeNull();
  expectMockChild().not.toBeNull();
});
