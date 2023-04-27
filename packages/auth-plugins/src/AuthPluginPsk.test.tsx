import React from 'react';
import Cookies from 'js-cookie';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiContext, ClientContext } from '@deephaven/jsapi-bootstrap';
import { dh } from '@deephaven/jsapi-shim';
import { CoreClient } from '@deephaven/jsapi-types';
import AuthPluginPsk from './AuthPluginPsk';
import { AUTH_HANDLER_TYPE_PSK as AUTH_TYPE } from './AuthHandlerTypes';
import { AuthConfigMap } from './AuthPlugin';

let mockOnBroadcastLogin = jest.fn();
let mockOnBroadcastLogout = jest.fn();
jest.mock('@deephaven/jsapi-components', () => ({
  ...jest.requireActual('@deephaven/jsapi-components'),
  useBroadcastLoginListener: jest.fn((onLogin, onLogout) => {
    mockOnBroadcastLogin = onLogin;
    mockOnBroadcastLogout = onLogout;
  }),
}));

// Disable CSSTransition delays to make testing simpler
jest.mock('react-transition-group', () => ({
  CSSTransition: ({ children, in: inProp }) =>
    inProp !== false ? children : null,
}));

jest.mock('js-cookie');
const mockedCookie = Cookies as jest.Mocked<typeof Cookies>;
const mockChildText = 'Mock Auth Psk Child';
const mockChild = <div>{mockChildText}</div>;
const authConfigMap = new Map();

function expectMockChild() {
  return expect(screen.queryByText(mockChildText));
}

function expectLoading() {
  return expect(screen.queryByTestId('auth-psk-loading'));
}

function expectInput() {
  return expect(screen.queryByRole('textbox', { name: 'Token' }));
}

function makeCoreClient() {
  return new dh.CoreClient('wss://test.mockurl.example.com');
}

function renderComponent(
  client: CoreClient = makeCoreClient(),
  authConfigValues: AuthConfigMap = new Map()
) {
  return render(
    <ApiContext.Provider value={dh}>
      <ClientContext.Provider value={client}>
        <AuthPluginPsk.Component authConfigValues={authConfigValues}>
          {mockChild}
        </AuthPluginPsk.Component>
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
      expect(AuthPluginPsk.isAvailable(authHandlers, authConfigMap)).toBe(
        result
      );
    }
  );
});

describe('component tests', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/test.html');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedCookie.get.mockReturnValue(undefined as any);
    jest.clearAllMocks();
  });

  it.each([
    ['WindowToken', 'CookieToken', 'WindowToken'],
    ['WindowTokenOnly', null, 'WindowTokenOnly'],
    [null, 'CookieTokenOnly', 'CookieTokenOnly'],
  ])(
    'uses initial token for: %s %s',
    async (windowToken, cookieToken, expectedResult) => {
      if (windowToken != null) {
        window.history.replaceState(null, '', `/test.html?psk=${windowToken}`);
      }

      // Need to add an `as any` because there's two typed `.get` functions in Cookies, one with a name param and one without.
      // TS and Jest mock only seem to pick up the first one with no params, which returns a key/value map.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedCookie.get.mockReturnValue(cookieToken as any);
      const loginPromise = Promise.resolve();
      const mockLogin = jest.fn(() => loginPromise);
      const client = makeCoreClient();
      client.login = mockLogin;
      renderComponent(client);
      expectLoading().toBeInTheDocument();
      expectInput().not.toBeInTheDocument();
      expectMockChild().not.toBeInTheDocument();
      await act(async () => {
        await loginPromise;
      });
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AUTH_TYPE,
          token: expectedResult,
        })
      );

      expectLoading().not.toBeInTheDocument();
      expectInput().not.toBeInTheDocument();
      expectMockChild().toBeInTheDocument();

      // Token should have been consumed and cleared out of the URL
      expect(window.location.search).toBe('');
    }
  );

  it('shows input if no token is provided', async () => {
    const mockLogin = jest.fn();
    const client = makeCoreClient();
    client.login = mockLogin;
    renderComponent(client);
    expectLoading().not.toBeInTheDocument();
    expectInput().toBeInTheDocument();
    expectMockChild().not.toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows input if login with initial token fails, does not show error', async () => {
    const mockToken = 'InitialToken';
    window.history.replaceState(null, '', `/test.html?psk=${mockToken}`);
    const loginError = new Error('Invalid test token');
    const loginPromise = Promise.reject(loginError);
    const mockLogin = jest.fn(() => loginPromise);
    const client = makeCoreClient();
    client.login = mockLogin;
    renderComponent(client);
    expectLoading().toBeInTheDocument();
    expectInput().not.toBeInTheDocument();
    expectMockChild().not.toBeInTheDocument();
    await act(async () => {
      try {
        await loginPromise;
      } catch (e) {
        // We know it fails
      }
    });
    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AUTH_TYPE,
        token: mockToken,
      })
    );

    expectLoading().not.toBeInTheDocument();
    expectInput().toBeInTheDocument();
    expectMockChild().not.toBeInTheDocument();

    // Token should have been consumed and cleared out of the URL
    expect(window.location.search).toBe('');
  });

  it('logs in with token from input', async () => {
    const user = userEvent.setup();
    const token = 'InputtedToken';
    const loginPromise = Promise.resolve();
    const mockLogin = jest.fn(() => loginPromise);
    const client = makeCoreClient();
    client.login = mockLogin;
    renderComponent(client);
    expectLoading().not.toBeInTheDocument();
    expectInput().toBeInTheDocument();
    expectMockChild().not.toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();

    await act(async () => {
      await user.type(screen.getByRole('textbox', { name: 'Token' }), token);
      await user.click(screen.getByRole('button', { name: 'Login' }));
      await loginPromise;
    });

    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AUTH_TYPE,
        token,
      })
    );

    expectMockChild().toBeInTheDocument();
    expectInput().not.toBeInTheDocument();
    expectLoading().not.toBeInTheDocument();
  });

  it('displays an error if the token inputted fails to login', async () => {
    const user = userEvent.setup();
    const token = 'BadInputtedToken';
    const loginError = new Error('Invalid test token');
    const mockLogin = jest.fn(() => Promise.reject(loginError));
    const client = makeCoreClient();
    client.login = mockLogin;
    renderComponent(client);
    expect(mockLogin).not.toHaveBeenCalled();
    expectLoading().not.toBeInTheDocument();
    expectInput().toBeInTheDocument();
    expectMockChild().not.toBeInTheDocument();

    await act(async () => {
      await user.type(screen.getByRole('textbox', { name: 'Token' }), token);
      await user.click(screen.getByRole('button', { name: 'Login' }));
    });
    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AUTH_TYPE,
        token,
      })
    );

    expect(screen.queryByRole('alert')).toBeInTheDocument();
    expectLoading().not.toBeInTheDocument();
    expectInput().toBeInTheDocument();
    expectMockChild().not.toBeInTheDocument();
  });

  it('removes the cookie if logout occurs', async () => {
    renderComponent();
    expect(mockedCookie.remove).not.toHaveBeenCalled();
    mockOnBroadcastLogout();
    expect(mockedCookie.remove).toHaveBeenCalled();
  });

  it('logs in with token from cookie if broadcast login occurs', async () => {
    const token = 'BroadcastLoginToken';
    const loginPromise = Promise.resolve();
    const mockLogin = jest.fn(() => loginPromise);
    const client = makeCoreClient();
    client.login = mockLogin;
    renderComponent(client);
    expectLoading().not.toBeInTheDocument();
    expectInput().toBeInTheDocument();
    expectMockChild().not.toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedCookie.get.mockReturnValueOnce(token as any);
    await act(async () => {
      mockOnBroadcastLogin();
      await loginPromise;
    });

    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AUTH_TYPE,
        token,
      })
    );

    expectLoading().not.toBeInTheDocument();
    expectInput().not.toBeInTheDocument();
    expectMockChild().toBeInTheDocument();
  });

  describe('clearing token from URL tests', () => {
    it.each([
      ['/', 'http://localhost/'],
      ['/?psk=12345', 'http://localhost/'],
      ['/?notpsk=abcde', 'http://localhost/?notpsk=abcde'],
      ['/test.html?psk=12345', 'http://localhost/test.html'],
      ['/test.html?notpsk=abcde', 'http://localhost/test.html?notpsk=abcde'],
      ['/test.html?psk=12345&foo=bar', 'http://localhost/test.html?foo=bar'],
      ['/test.html?psk=12345#biz', 'http://localhost/test.html#biz'],
      [
        '/test.html?psk=12345&foo=bar#biz',
        'http://localhost/test.html?foo=bar#biz',
      ],
    ])('clears token correctly for: %s', async (url, result) => {
      window.history.replaceState(null, '', url);
      renderComponent();
      await act(async () => {
        await Promise.resolve();
      });
      expect(window.location.href).toBe(result);
    });
  });
});
