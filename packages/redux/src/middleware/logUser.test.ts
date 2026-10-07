import {
  getLogIndexedDbHistory,
  type LogIndexedDbHistory,
} from '@deephaven/log';
import { TestUtils } from '@deephaven/test-utils';
import type { MiddlewareAPI, Dispatch, AnyAction } from 'redux';
import { SET_USER } from '../actionTypes';
import rootMiddleware from '.';
import logUser from './logUser';

jest.mock('@deephaven/log', () => ({
  __esModule: true,
  ...jest.requireActual('@deephaven/log'),
  getLogIndexedDbHistory: jest.fn(),
}));

const setUser = jest.fn();

function dispatch(
  action: AnyAction,
  stateBefore: Record<string, unknown>,
  next: Dispatch = jest.fn(a => a)
): void {
  const store = TestUtils.createMockProxy<MiddlewareAPI>({
    getState: () => stateBefore,
  });
  logUser(store)(next)(action);
}

beforeEach(() => {
  setUser.mockClear();
  TestUtils.asMock(getLogIndexedDbHistory).mockReturnValue(
    TestUtils.createMockProxy<LogIndexedDbHistory>({ setUser })
  );
});

it('runs before the logging middleware', () => {
  expect(rootMiddleware[0]).toBe(logUser);
});

it('switches the user before the action reaches later middleware', () => {
  const next: Dispatch = jest.fn(a => {
    expect(setUser).toHaveBeenCalledWith('alice');
    return a;
  });

  dispatch(
    { type: SET_USER, payload: { name: 'alice' } },
    { user: null },
    next
  );

  expect(next).toHaveBeenCalled();
});

it('uses the previous name when the payload omits it, like the merge reducer', () => {
  dispatch(
    { type: SET_USER, payload: { groups: [] } },
    { user: { name: 'alice', groups: [] } }
  );

  expect(setUser).toHaveBeenCalledWith('alice');
});

it('prefers the payload name over the previous user', () => {
  dispatch(
    { type: SET_USER, payload: { name: 'bob' } },
    { user: { name: 'alice' } }
  );

  expect(setUser).toHaveBeenCalledWith('bob');
});

it('forwards an empty name, which identifies shared logins', () => {
  dispatch({ type: SET_USER, payload: { name: '' } }, { user: null });

  expect(setUser).toHaveBeenCalledWith('');
});

it('ignores a null payload, which clears the user rather than setting one', () => {
  dispatch({ type: SET_USER, payload: null }, { user: { name: 'alice' } });

  expect(setUser).not.toHaveBeenCalled();
});

it('ignores other actions', () => {
  dispatch({ type: 'OTHER' }, { user: { name: 'alice' } });

  expect(setUser).not.toHaveBeenCalled();
});

it('does nothing when log persistence is not running', () => {
  TestUtils.asMock(getLogIndexedDbHistory).mockReturnValue(null);

  expect(() =>
    dispatch({ type: SET_USER, payload: { name: 'alice' } }, { user: null })
  ).not.toThrow();
});
