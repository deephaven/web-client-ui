import { act, renderHook } from '@testing-library/react-hooks';
import { useContext } from 'react';
import { TestUtils } from '@deephaven/utils';
import { useObjectFetch } from './useObjectFetch';

const { asMock, flushPromises } = TestUtils;

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  asMock(useContext).mockName('useContext');
});

it('should resolve the objectFetch when in the context', async () => {
  const objectFetch = jest.fn(async () => undefined);
  const unsubscribe = jest.fn();
  const descriptor = { type: 'type', name: 'name' };
  const subscribe = jest.fn((subscribeDescriptor, onUpdate) => {
    expect(descriptor).toEqual(subscribeDescriptor);
    onUpdate({ fetch: objectFetch, error: null });
    return unsubscribe;
  });
  const objectManager = { subscribe };
  asMock(useContext).mockReturnValue(objectManager);

  const { result } = renderHook(() => useObjectFetch(descriptor));
  await act(flushPromises);
  expect(result.current).toEqual({ fetch: objectFetch, error: null });
  expect(result.error).toBeUndefined();
  expect(objectFetch).not.toHaveBeenCalled();
});

it('should return an error if objectFetch not available in the context', async () => {
  const descriptor = { type: 'type', name: 'name' };
  asMock(useContext).mockReturnValue(null);

  const { result } = renderHook(() => useObjectFetch(descriptor));
  await act(flushPromises);
  expect(result.current).toEqual({
    fetch: null,
    error: expect.any(Error),
  });
  expect(result.error).toBeUndefined();
});
