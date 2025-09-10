import React from 'react';
import { renderHook } from '@testing-library/react';
import { ObjectFetchManagerContext, useObjectFetch } from './useObjectFetch';

it('should resolve the objectFetch when in the context', async () => {
  const objectFetch = jest.fn(async () => undefined);
  const unsubscribe = jest.fn();
  const descriptor = { type: 'type', name: 'name' };
  const subscribe = jest.fn((subscribeDescriptor, onUpdate) => {
    expect(subscribeDescriptor).toEqual(descriptor);
    onUpdate({ fetch: objectFetch, status: 'ready' });
    return unsubscribe;
  });
  const objectManager = { subscribe };
  const wrapper = ({ children }) => (
    <ObjectFetchManagerContext.Provider value={objectManager}>
      {children}
    </ObjectFetchManagerContext.Provider>
  );

  const { result } = renderHook(() => useObjectFetch(descriptor), { wrapper });
  expect(result.current).toEqual({ fetch: objectFetch, status: 'ready' });
  expect(result.error).toBeUndefined();
  expect(objectFetch).not.toHaveBeenCalled();
});

it('should return an error, not throw if objectFetch not available in the context', async () => {
  const descriptor = { type: 'type', name: 'name' };
  const { result } = renderHook(() => useObjectFetch(descriptor));
  expect(result.current).toEqual({
    error: expect.any(Error),
    status: 'error',
  });
  expect(result.error).toBeUndefined();
});
