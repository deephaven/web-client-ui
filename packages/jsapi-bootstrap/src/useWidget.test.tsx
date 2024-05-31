import React from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
import { dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/utils';
import { useWidget } from './useWidget';
import { ObjectFetchManagerContext } from './useObjectFetch';
import { ApiContext } from './ApiBootstrap';

const WIDGET_TYPE = 'OtherWidget';

const api = TestUtils.createMockProxy<typeof dh>({
  VariableType: TestUtils.createMockProxy<typeof dh.VariableType>({
    OTHERWIDGET: WIDGET_TYPE,
    TABLE: 'Table',
  }),
});

describe('useWidget', () => {
  it('should return a widget when available', async () => {
    const descriptor: dh.ide.VariableDescriptor = {
      type: 'OtherWidget',
      name: 'name',
    };
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
      <ApiContext.Provider value={api}>
        <ObjectFetchManagerContext.Provider value={objectManager}>
          {children}
        </ObjectFetchManagerContext.Provider>
      </ApiContext.Provider>
    );
    const { result } = renderHook(() => useWidget(descriptor), { wrapper });
    await act(TestUtils.flushPromises);
    expect(result.current).toEqual({ widget, error: null });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should return an error when an error occurs', () => {
    const descriptor: dh.ide.VariableDescriptor = {
      type: WIDGET_TYPE,
      name: 'name',
    };
    const error = new Error('Error fetching widget');
    const objectFetch = { error, status: 'error' };
    const subscribe = jest.fn((subscribeDescriptor, onUpdate) => {
      expect(subscribeDescriptor).toEqual(descriptor);
      onUpdate(objectFetch);
      return jest.fn();
    });
    const objectManager = { subscribe };
    const wrapper = ({ children }) => (
      <ApiContext.Provider value={api}>
        <ObjectFetchManagerContext.Provider value={objectManager}>
          {children}
        </ObjectFetchManagerContext.Provider>
      </ApiContext.Provider>
    );

    const { result } = renderHook(() => useWidget(descriptor), { wrapper });

    expect(result.current).toEqual({ widget: null, error });
  });

  it('should return null when still loading', () => {
    const descriptor = { type: WIDGET_TYPE, name: 'name' };
    const objectFetch = { status: 'loading' };
    const subscribe = jest.fn((_, onUpdate) => {
      onUpdate(objectFetch);
      return jest.fn();
    });
    const objectManager = { subscribe };
    const wrapper = ({ children }) => (
      <ApiContext.Provider value={api}>
        <ObjectFetchManagerContext.Provider value={objectManager}>
          {children}
        </ObjectFetchManagerContext.Provider>
      </ApiContext.Provider>
    );
    const { result } = renderHook(() => useWidget(descriptor), { wrapper });

    expect(result.current).toEqual({ widget: null, error: null });
  });

  it('should return an error when the descriptor type is not supported', () => {
    const descriptor: dh.ide.VariableDescriptor = {
      type: 'Table',
      name: 'name',
    };
    const wrapper = ({ children }) => (
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    );
    const { result } = renderHook(() => useWidget(descriptor), { wrapper });

    expect(result.current).toEqual({
      widget: null,
      error: new Error(`Unsupported descriptor type: ${descriptor.type}`),
    });
  });
});
