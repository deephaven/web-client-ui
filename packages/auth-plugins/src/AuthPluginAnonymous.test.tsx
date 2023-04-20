import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import { dh } from '@deephaven/jsapi-shim';
import AuthPluginAnonymous from './AuthPluginAnonymous';
import { AUTH_HANDLER_TYPE_ANONYMOUS as AUTH_TYPE } from './AuthHandlerTypes';

function makeCoreClient() {
  return new dh.CoreClient('wss://test.mockurl.example.com');
}

describe('availability tests', () => {
  const client = makeCoreClient();
  const authConfigValues = new Map();
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
      expect(
        AuthPluginAnonymous.isAvailable(client, authHandlers, authConfigValues)
      ).toBe(result);
    }
  );
});

function expectLoading() {
  expect(screen.queryByTestId('auth-anonymous-loading')).not.toBeNull();
}

describe('component tests', () => {
  const authConfigValues = new Map();
  it('attempts to login on mount, calls success', async () => {
    const loginPromise = Promise.resolve();
    const onSuccess = jest.fn();
    const onFailure = jest.fn();
    const mockLogin = jest.fn(() => loginPromise);
    const client = makeCoreClient();
    client.login = mockLogin;
    render(
      <ApiContext.Provider value={dh}>
        <AuthPluginAnonymous.Component
          authConfigValues={authConfigValues}
          client={client}
          onFailure={onFailure}
          onSuccess={onSuccess}
        />
      </ApiContext.Provider>
    );
    expectLoading();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        type: dh.CoreClient.LOGIN_TYPE_ANONYMOUS,
      })
    );

    await loginPromise;

    expect(onSuccess).toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  });

  it('attempts to login on mount, calls failure if login fails', async () => {
    const error = 'Mock test error';
    const loginPromise = Promise.reject(error);
    const onSuccess = jest.fn();
    const onFailure = jest.fn();
    const mockLogin = jest.fn(() => loginPromise);
    const client = makeCoreClient();
    client.login = mockLogin;
    render(
      <ApiContext.Provider value={dh}>
        <AuthPluginAnonymous.Component
          authConfigValues={authConfigValues}
          client={client}
          onFailure={onFailure}
          onSuccess={onSuccess}
        />
      </ApiContext.Provider>
    );
    expectLoading();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        type: dh.CoreClient.LOGIN_TYPE_ANONYMOUS,
      })
    );

    await act(async () => {
      try {
        await loginPromise;
      } catch (e) {
        // We know it fails
      }
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).toHaveBeenCalledWith(error);
  });
});
