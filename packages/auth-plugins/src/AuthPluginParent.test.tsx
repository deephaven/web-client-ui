import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { dh } from '@deephaven/jsapi-shim';
import { LoginOptions } from '@deephaven/jsapi-types';
import AuthPluginParent from './AuthPluginParent';

let mockParentResponse: Promise<LoginOptions>;
jest.mock('@deephaven/jsapi-utils', () => ({
  LOGIN_OPTIONS_REQUEST: 'mock-login-options-request',
  requestParentResponse: jest.fn(() => mockParentResponse),
}));

function makeCoreClient() {
  return new dh.CoreClient('wss://test.mockurl.example.com');
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
    expect(AuthPluginParent.isAvailable(authHandlers)).toBe(true);
  });
  it('is not available when window opener not set', () => {
    delete window.opener;
    expect(AuthPluginParent.isAvailable(authHandlers)).toBe(false);
  });
});

function expectLoading() {
  expect(screen.queryByTestId('auth-parent-loading')).not.toBeNull();
}

describe('component tests', () => {
  const authConfigValues = new Map();

  it('logs in when parent window provides login credentials', async () => {
    let mockResolve;
    mockParentResponse = new Promise(resolve => {
      mockResolve = resolve;
    });
    const loginOptions = { token: 'mockParentToken' };
    const loginPromise = Promise.resolve();
    const onSuccess = jest.fn();
    const onFailure = jest.fn();
    const mockLogin = jest.fn(() => loginPromise);
    const client = makeCoreClient();
    client.login = mockLogin;
    render(
      <AuthPluginParent.Component
        authConfigValues={authConfigValues}
        client={client}
        onFailure={onFailure}
        onSuccess={onSuccess}
      />
    );
    expectLoading();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
    expect(mockLogin).not.toHaveBeenCalled();

    mockResolve(loginOptions);

    await mockParentResponse;
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
    expect(mockLogin).toHaveBeenCalledWith(loginOptions);

    await loginPromise;
    expect(onSuccess).toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  });

  it('reports failure if login credentials are invalid', async () => {
    let mockResolve;
    mockParentResponse = new Promise(resolve => {
      mockResolve = resolve;
    });

    const error = 'mock test Invalid login credentials';
    const loginOptions = { token: 'mockParentToken' };
    const loginPromise = Promise.reject(error);
    const onSuccess = jest.fn();
    const onFailure = jest.fn();
    const mockLogin = jest.fn(() => loginPromise);
    const client = makeCoreClient();
    client.login = mockLogin;
    render(
      <AuthPluginParent.Component
        authConfigValues={authConfigValues}
        client={client}
        onFailure={onFailure}
        onSuccess={onSuccess}
      />
    );
    expectLoading();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
    expect(mockLogin).not.toHaveBeenCalled();

    // Send a message with the login details
    mockResolve(loginOptions);
    await mockParentResponse;
    expect(mockLogin).toHaveBeenCalledWith(loginOptions);

    await act(async () => {
      try {
        await loginPromise;
      } catch (e) {
        // expecting promise to fail
      }
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).toHaveBeenCalledWith(error);
  });
});
