import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { ApiContext, ClientContext } from '@deephaven/jsapi-bootstrap';
import { dh } from '@deephaven/jsapi-shim';
import type { CoreClient } from '@deephaven/jsapi-types';
import AuthPluginAnonymous from './AuthPluginAnonymous';
import { AUTH_HANDLER_TYPE_ANONYMOUS as AUTH_TYPE } from './AuthHandlerTypes';
import { AuthConfigMap } from './AuthPlugin';

const mockChildText = 'Mock Auth Anonymous Child';
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
        <AuthPluginAnonymous.Component authConfigValues={authConfigValues}>
          {mockChild}
        </AuthPluginAnonymous.Component>
      </ClientContext.Provider>
    </ApiContext.Provider>
  );
}

describe('availability tests', () => {
  it.each([
    [[AUTH_TYPE], true],
    [['another.type', AUTH_TYPE], true],
    [[], false],
    [
      ['not-anonymous', `${AUTH_TYPE}.withsuffix`, `prefix.${AUTH_TYPE}`],
      false,
    ],
  ])(
    'returns availability based on auth handlers: %s',
    (authHandlers, result) => {
      expect(AuthPluginAnonymous.isAvailable(authHandlers, authConfigMap)).toBe(
        result
      );
    }
  );
});

describe('component tests', () => {
  const authConfigValues = new Map();
  it('attempts to login on mount, calls success', async () => {
    const loginPromise = Promise.resolve();
    const mockLogin = jest.fn(() => loginPromise);
    const client = makeCoreClient();
    client.login = mockLogin;
    renderComponent(authConfigValues, client);
    expectLoading().toBeInTheDocument();
    expectError().not.toBeInTheDocument();
    expectMockChild().not.toBeInTheDocument();
    await act(async () => {
      await loginPromise;
    });
    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        type: dh.CoreClient.LOGIN_TYPE_ANONYMOUS,
      })
    );

    expectMockChild().toBeInTheDocument();
    expectError().not.toBeInTheDocument();
  });

  it('attempts to login on mount, calls failure if login fails', async () => {
    const error = new Error('Mock test error');
    const loginPromise = Promise.reject(error);
    const mockLogin = jest.fn(() => loginPromise);
    const client = makeCoreClient();
    client.login = mockLogin;
    renderComponent(authConfigValues, client);
    expectLoading().toBeInTheDocument();
    expectMockChild().not.toBeInTheDocument();
    expectError().not.toBeInTheDocument();
    await act(async () => {
      try {
        await loginPromise;
      } catch (e) {
        // We know it fails
      }
    });
    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        type: dh.CoreClient.LOGIN_TYPE_ANONYMOUS,
      })
    );

    expectMockChild().not.toBeInTheDocument();
    expectError().toBeInTheDocument();
  });
});
