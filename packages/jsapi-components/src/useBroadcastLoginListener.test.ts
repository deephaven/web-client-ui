import {
  BROADCAST_LOGIN_MESSAGE,
  BROADCAST_LOGOUT_MESSAGE,
  makeMessage,
} from '@deephaven/jsapi-utils';
import { renderHook } from '@testing-library/react-hooks';
import useBroadcastChannel from './useBroadcastChannel';
import useBroadcastLoginListener from './useBroadcastLoginListener';

jest.mock('./useBroadcastChannel');
const mockedUseBroadcastChannel = useBroadcastChannel as jest.MockedFunction<
  typeof useBroadcastChannel
>;

describe('useBroadcastLoginListener', () => {
  const onLogin = jest.fn();
  const onLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should trigger onLogin when login message received', () => {
    renderHook(() => useBroadcastLoginListener(onLogin, onLogout));
    const onMessage = mockedUseBroadcastChannel.mock.calls[0][0];
    expect(onMessage).not.toBeNull();

    const loginMessage = makeMessage(BROADCAST_LOGIN_MESSAGE);
    onMessage?.({ data: loginMessage } as MessageEvent);
    expect(onLogin).toHaveBeenCalledTimes(1);
    expect(onLogin).toHaveBeenCalledWith(loginMessage);
    expect(onLogout).not.toHaveBeenCalled();
  });

  it('should trigger onLogout when logout message received', () => {
    renderHook(() => useBroadcastLoginListener(onLogin, onLogout));
    const onMessage = mockedUseBroadcastChannel.mock.calls[0][0];
    expect(onMessage).not.toBeNull();

    const logoutMessage = makeMessage(BROADCAST_LOGOUT_MESSAGE);
    onMessage?.({ data: logoutMessage } as MessageEvent);
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(onLogout).toHaveBeenCalledWith(logoutMessage);
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('should not trigger either when other message received', () => {
    renderHook(() => useBroadcastLoginListener(onLogin, onLogout));
    const onMessage = mockedUseBroadcastChannel.mock.calls[0][0];
    expect(onMessage).not.toBeNull();

    const logoutMessage = makeMessage('Test non login message');
    onMessage?.({ data: logoutMessage } as MessageEvent);
    expect(onLogin).not.toHaveBeenCalled();
    expect(onLogout).not.toHaveBeenCalled();
  });
});
