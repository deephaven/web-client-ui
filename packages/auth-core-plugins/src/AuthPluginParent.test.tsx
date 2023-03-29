import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { dh } from '@deephaven/jsapi-shim';
import AuthPluginParent from './AuthPluginParent';

function makeCoreClient() {
  return new dh.CoreClient('wss://test.mockurl.example.com');
}

describe('availability tests', () => {
  const client = makeCoreClient();
  const authHandlers = [];
  const authConfigValues = new Map();
  it('is available when window opener is set', () => {
    window.opener = { postMessage: jest.fn() };
    window.history.pushState(
      {},
      'Test Title',
      `/test.html?authProvider=parent`
    );
    expect(
      AuthPluginParent.isAvailable(client, authHandlers, authConfigValues)
    ).toBe(true);
  });
  it('is not available when window opener not set', () => {
    delete window.opener;
    expect(
      AuthPluginParent.isAvailable(client, authHandlers, authConfigValues)
    ).toBe(false);
  });
});

function expectLoading() {
  expect(screen.queryByTestId('auth-parent-loading')).not.toBeNull();
}

describe('component tests', () => {
  const authConfigValues = new Map();
  const mockPostMessage = jest.fn();
  let addListenerSpy: jest.SpyInstance;
  let removeListenerSpy: jest.SpyInstance;
  let listenerCallback;
  beforeEach(() => {
    addListenerSpy = jest
      .spyOn(window, 'addEventListener')
      .mockImplementation((event, cb) => {
        listenerCallback = cb;
      });

    removeListenerSpy = jest.spyOn(window, 'removeEventListener');
  });
  afterEach(() => {
    addListenerSpy.mockRestore();
    removeListenerSpy.mockRestore();
    mockPostMessage.mockClear();
  });

  it('logs in when parent window provides login credentials', async () => {
    window.opener = { postMessage: mockPostMessage };

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
    expect(mockPostMessage).toHaveBeenCalledWith(
      'requestLoginOptionsFromParent',
      '*'
    );
    expect(addListenerSpy).toHaveBeenCalledWith('message', listenerCallback);

    // Send a message that should be ignored
    listenerCallback({ data: { message: 'mock ignore this message' } });

    expect(mockLogin).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();

    // Send a message with the login details
    listenerCallback({
      data: { message: 'loginOptions', payload: loginOptions },
    });
    await Promise.resolve();
    expect(mockLogin).toHaveBeenCalledWith(loginOptions);
    expect(removeListenerSpy).toHaveBeenCalledWith('message', listenerCallback);

    await loginPromise;
    expect(onSuccess).toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  });

  it('reports failure if login credentials are invalid', async () => {
    window.opener = { postMessage: mockPostMessage };

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
    expect(mockPostMessage).toHaveBeenCalledWith(
      'requestLoginOptionsFromParent',
      '*'
    );
    expect(addListenerSpy).toHaveBeenCalledWith('message', listenerCallback);

    // Send a message with the login details
    listenerCallback({
      data: { message: 'loginOptions', payload: loginOptions },
    });
    await Promise.resolve();
    expect(mockLogin).toHaveBeenCalledWith(loginOptions);
    expect(removeListenerSpy).toHaveBeenCalledWith('message', listenerCallback);

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
