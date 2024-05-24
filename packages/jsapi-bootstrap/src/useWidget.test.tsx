import React from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
import { TestUtils } from '@deephaven/utils';
import { useWidget } from './useWidget';
import { ObjectFetchManagerContext } from './useObjectFetch';

describe('useWidget', () => {
  it('should return a widget when available', async () => {
    const descriptor = { type: 'type', name: 'name' };
    const widget = { close: jest.fn() };
    const fetch = jest.fn(async () => widget);
    const objectFetch = { fetch, error: null };
    const subscribe = jest.fn((subscribeDescriptor, onUpdate) => {
      expect(subscribeDescriptor).toEqual(descriptor);
      onUpdate(objectFetch);
      return jest.fn();
    });
    const objectManager = { subscribe };
    const wrapper = ({ children }) => (
      <ObjectFetchManagerContext.Provider value={objectManager}>
        {children}
      </ObjectFetchManagerContext.Provider>
    );
    const { result } = renderHook(() => useWidget(descriptor), { wrapper });
    await act(TestUtils.flushPromises);
    expect(result.current).toEqual({ widget, error: null });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should return an error when an error occurs', () => {
    const descriptor = { type: 'type', name: 'name' };
    const error = new Error('Error fetching widget');
    const objectFetch = { fetch: null, error };
    const subscribe = jest.fn((subscribeDescriptor, onUpdate) => {
      expect(subscribeDescriptor).toEqual(descriptor);
      onUpdate(objectFetch);
      return jest.fn();
    });
    const objectManager = { subscribe };
    const wrapper = ({ children }) => (
      <ObjectFetchManagerContext.Provider value={objectManager}>
        {children}
      </ObjectFetchManagerContext.Provider>
    );

    const { result } = renderHook(() => useWidget(descriptor), { wrapper });

    expect(result.current).toEqual({ widget: null, error });
  });

  it('should return null when still loading', () => {
    const descriptor = { type: 'type', name: 'name' };
    const objectFetch = { fetch: null, error: null };
    const subscribe = jest.fn((_, onUpdate) => {
      onUpdate(objectFetch);
      return jest.fn();
    });
    const objectManager = { subscribe };
    const wrapper = ({ children }) => (
      <ObjectFetchManagerContext.Provider value={objectManager}>
        {children}
      </ObjectFetchManagerContext.Provider>
    );
    const { result } = renderHook(() => useWidget(descriptor), { wrapper });

    expect(result.current).toEqual({ widget: null, error: null });
  });
});
