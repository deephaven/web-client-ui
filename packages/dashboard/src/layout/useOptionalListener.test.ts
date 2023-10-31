import { EventEmitter } from '@deephaven/golden-layout';
import { TestUtils } from '@deephaven/utils';
import { renderHook } from '@testing-library/react-hooks';
import useOptionalListener from './useOptionalListener';

it('should register listener on mount and deregister on unmount', () => {
  const listener = jest.fn();
  const eventHub = TestUtils.createMockProxy<EventEmitter>({
    on: jest.fn(),
    off: jest.fn(),
  });
  const { unmount } = renderHook(() =>
    useOptionalListener(eventHub, 'test', listener)
  );
  expect(eventHub.on).toHaveBeenCalledTimes(1);
  expect(eventHub.on).toHaveBeenCalledWith('test', listener);
  expect(eventHub.off).not.toHaveBeenCalled();
  unmount();
  expect(eventHub.off).toHaveBeenCalledTimes(1);
  expect(eventHub.off).toHaveBeenCalledWith('test', listener);
});

it('should not register if callback is not set', () => {
  const eventHub = TestUtils.createMockProxy<EventEmitter>({
    on: jest.fn(),
    off: jest.fn(),
  });
  const { unmount } = renderHook(() => useOptionalListener(eventHub, 'test'));
  expect(eventHub.on).not.toHaveBeenCalled();
  expect(eventHub.off).not.toHaveBeenCalled();
  unmount();
  expect(eventHub.on).not.toHaveBeenCalled();
  expect(eventHub.off).not.toHaveBeenCalled();
});
