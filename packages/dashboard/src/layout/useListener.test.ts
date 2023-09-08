import { EventEmitter } from '@deephaven/golden-layout';
import { TestUtils } from '@deephaven/utils';
import { renderHook } from '@testing-library/react-hooks';
import useListener from './useListener';

it('should register listener on mount and deregister on unmount', () => {
  const listener = jest.fn();
  const eventHub = TestUtils.createMockProxy<EventEmitter>({
    on: jest.fn(),
    off: jest.fn(),
  });
  const { unmount } = renderHook(() => useListener(eventHub, 'test', listener));
  expect(eventHub.on).toHaveBeenCalledTimes(1);
  expect(eventHub.on).toHaveBeenCalledWith('test', listener);
  expect(eventHub.off).not.toHaveBeenCalled();
  unmount();
  expect(eventHub.off).toHaveBeenCalledTimes(1);
  expect(eventHub.off).toHaveBeenCalledWith('test', listener);
});
