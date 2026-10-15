import 'fake-indexeddb/auto';
import { getLogIndexedDbHistory, logInit, logProxy } from './LogInit';

afterEach(() => {
  getLogIndexedDbHistory()?.disable();
  logProxy.disable();
});

it('reuses the persisted-log sink across repeat calls', () => {
  logInit(2, true, { dbName: 'log-init-test' });
  const first = getLogIndexedDbHistory();
  const listenerSpy = jest.spyOn(logProxy, 'addEventListener');

  logInit(2, true, { dbName: 'log-init-test' });

  expect(first).not.toBeNull();
  expect(getLogIndexedDbHistory()).toBe(first);
  expect(window.DHLogIndexedDbHistory).toBe(first);
  expect(listenerSpy).not.toHaveBeenCalled();
});
