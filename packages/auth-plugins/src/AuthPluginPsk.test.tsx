import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { dh } from '@deephaven/jsapi-shim';
import AuthPluginPsk from './AuthPluginPsk';
import { AUTH_HANDLER_TYPE_PSK as AUTH_TYPE } from './AuthHandlerTypes';

function makeCoreClient() {
  return new dh.CoreClient('wss://test.mockurl.example.com');
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
      expect(AuthPluginPsk.isAvailable(authHandlers)).toBe(result);
    }
  );
});

function expectLoading() {
  expect(screen.queryByTestId('auth-psk-loading')).not.toBeNull();
}

describe('component tests', () => {
  const authConfigValues = new Map();
  it('fails if no psk is provided on query URL string', () => {
    const onSuccess = jest.fn();
    const onFailure = jest.fn();
    const mockLogin = jest.fn();
    const client = makeCoreClient();
    client.login = mockLogin;
    render(
      <AuthPluginPsk.Component
        authConfigValues={authConfigValues}
        client={client}
        onFailure={onFailure}
        onSuccess={onSuccess}
      />
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).toHaveBeenCalled();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('uses the psk provided on the query URL string', async () => {
    const mockToken = 'mock-token';
    window.history.pushState({}, 'Test Title', `/test.html?psk=${mockToken}`);
    const loginPromise = Promise.resolve();
    const onSuccess = jest.fn();
    const onFailure = jest.fn();
    const mockLogin = jest.fn(() => loginPromise);
    const client = makeCoreClient();
    client.login = mockLogin;
    render(
      <AuthPluginPsk.Component
        authConfigValues={authConfigValues}
        client={client}
        onFailure={onFailure}
        onSuccess={onSuccess}
      />
    );
    expectLoading();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AUTH_TYPE,
        token: mockToken,
      })
    );
    await loginPromise;

    expect(onSuccess).toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  });

  it('reports failure if the psk provided on the query URL string fails login', async () => {
    const mockToken = 'mock-token';
    window.history.pushState({}, 'Test Title', `/test.html?psk=${mockToken}`);
    const loginError = 'Invalid token';
    const loginPromise = Promise.reject(loginError);
    const onSuccess = jest.fn();
    const onFailure = jest.fn();
    const mockLogin = jest.fn(() => loginPromise);
    const client = makeCoreClient();
    client.login = mockLogin;
    render(
      <AuthPluginPsk.Component
        authConfigValues={authConfigValues}
        client={client}
        onFailure={onFailure}
        onSuccess={onSuccess}
      />
    );
    expectLoading();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AUTH_TYPE,
        token: mockToken,
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
    expect(onFailure).toHaveBeenCalledWith(loginError);
  });
});
