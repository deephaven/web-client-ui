import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { ApiContext, ClientContext } from '@deephaven/jsapi-bootstrap';
import { dh } from '@deephaven/jsapi-shim';
import { CoreClient, LoginOptions } from '@deephaven/jsapi-types';
import AuthPluginParent from './AuthPluginParent';
import { AuthConfigMap } from './AuthPlugin';

let mockParentResponse: Promise<LoginOptions>;
jest.mock('@deephaven/jsapi-utils', () => ({
  LOGIN_OPTIONS_REQUEST: 'mock-login-options-request',
  requestParentResponse: jest.fn(() => mockParentResponse),
}));

const mockChildText = 'Mock Auth Parent Child';
const mockChild = <div>{mockChildText}</div>;
const authConfigMap = new Map();

function expectMockChild() {
  return expect(screen.queryByText(mockChildText));
}

function expectLoading() {
  return expect(screen.queryByTestId('auth-base-loading-spinner'));
}

function expectError() {
  return expect(screen.queryByTestId('auth-base-loading-message'));
}

function makeCoreClient() {
  return new dh.CoreClient('wss://test.mockurl.example.com');
}

function renderComponent(
  authConfigValues: AuthConfigMap,
  client: CoreClient = makeCoreClient()
) {
  return render(
    <ApiContext.Provider value={dh}>
      <ClientContext.Provider value={client}>
        <AuthPluginParent.Component authConfigValues={authConfigValues}>
          {mockChild}
        </AuthPluginParent.Component>
      </ClientContext.Provider>
    </ApiContext.Provider>
  );
}

describe('availability tests', () => {
  const authHandlers = [];
  it('is available when window opener is set', () => {
    window.opener = { postMessage: jest.fn() };
    window.history.pushState(
      {},
      'Test Title',
      `/test.html?authProvider=parent`
    );
    expect(AuthPluginParent.isAvailable(authHandlers, authConfigMap)).toBe(
      true
    );
  });
  it('is not available when window opener not set', () => {
    delete window.opener;
    expect(AuthPluginParent.isAvailable(authHandlers, authConfigMap)).toBe(
      false
    );
  });
});

describe('component tests', () => {
  const authConfigValues = new Map();

  it('logs in when parent window provides login credentials', async () => {
    let mockResolve;
    mockParentResponse = new Promise(resolve => {
      mockResolve = resolve;
    });
    const loginOptions = { token: 'mockParentToken' };
    const loginPromise = Promise.resolve();
    const mockLogin = jest.fn(() => loginPromise);
    const client = makeCoreClient();
    client.login = mockLogin;
    renderComponent(authConfigValues, client);
    expectLoading().toBeInTheDocument();
    expectMockChild().not.toBeInTheDocument();
    expectError().not.toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();

    mockResolve(loginOptions);

    await act(async () => {
      await mockParentResponse;
    });
    expect(mockLogin).toHaveBeenCalledWith(loginOptions);

    await act(async () => {
      await loginPromise;
    });
    expectMockChild().toBeInTheDocument();
    expectError().not.toBeInTheDocument();
  });

  it('reports failure if login credentials are invalid', async () => {
    let mockResolve;
    mockParentResponse = new Promise(resolve => {
      mockResolve = resolve;
    });

    const error = new Error('mock test Invalid login credentials');
    const loginOptions = { token: 'mockParentToken' };
    const loginPromise = Promise.reject(error);
    const mockLogin = jest.fn(() => loginPromise);
    const client = makeCoreClient();
    client.login = mockLogin;
    renderComponent(authConfigValues, client);
    expectLoading().toBeInTheDocument();
    expectMockChild().not.toBeInTheDocument();
    expectError().not.toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();

    // Send a message with the login details
    mockResolve(loginOptions);
    await act(async () => {
      await mockParentResponse;
    });
    expect(mockLogin).toHaveBeenCalledWith(loginOptions);

    await act(async () => {
      try {
        await loginPromise;
      } catch (e) {
        // expecting promise to fail
      }
    });
    expectLoading().not.toBeInTheDocument();
    expectMockChild().not.toBeInTheDocument();
    expectError().toBeInTheDocument();
    expect(screen.getByText(`${error}`)).toBeInTheDocument();
  });
});
