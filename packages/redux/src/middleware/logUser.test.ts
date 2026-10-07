import {
  getLogIndexedDbHistory,
  type LogIndexedDbHistory,
} from '@deephaven/log';
import { TestUtils } from '@deephaven/test-utils';
import type { MiddlewareAPI, Dispatch, AnyAction } from 'redux';
import { SET_USER } from '../actionTypes';
import logUser from './logUser';

jest.mock('@deephaven/log', () => ({
  ...jest.requireActual('@deephaven/log'),
  getLogIndexedDbHistory: jest.fn(),
}));

const setUser = jest.fn();

function dispatch(
  action: AnyAction,
  stateAfter: Record<string, unknown>
): void {
  const store = TestUtils.createMockProxy<MiddlewareAPI>({
    getState: () => stateAfter,
  });
  const next: Dispatch = jest.fn(a => a);
  logUser(store)(next)(action);
}

beforeEach(() => {
  setUser.mockClear();
  TestUtils.asMock(getLogIndexedDbHistory).mockReturnValue(
    TestUtils.createMockProxy<LogIndexedDbHistory>({ setUser })
  );
});

it('forwards the reduced user name on SET_USER', () => {
  dispatch(
    { type: SET_USER, payload: { groups: [] } },
    { user: { name: 'alice', groups: [] } }
  );

  expect(setUser).toHaveBeenCalledWith('alice');
});

it('forwards an empty name, which identifies shared logins', () => {
  dispatch({ type: SET_USER, payload: {} }, { user: { name: '' } });

  expect(setUser).toHaveBeenCalledWith('');
});

it('ignores other actions', () => {
  dispatch({ type: 'OTHER' }, { user: { name: 'alice' } });

  expect(setUser).not.toHaveBeenCalled();
});

it('does nothing when log persistence is not running', () => {
  TestUtils.asMock(getLogIndexedDbHistory).mockReturnValue(null);

  expect(() =>
    dispatch({ type: SET_USER, payload: {} }, { user: { name: 'alice' } })
  ).not.toThrow();
});
