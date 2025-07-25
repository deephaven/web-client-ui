import React from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
import { type dh } from '@deephaven/jsapi-types';
import { TestUtils } from '@deephaven/test-utils';
import { useWidget } from './useWidget';
import {
  type ObjectFetchManager,
  ObjectFetchManagerContext,
} from './useObjectFetch';
import { ApiContext } from './ApiBootstrap';
import { DeferredApiContext } from './useDeferredApi';

const WIDGET_TYPE = 'OtherWidget';

function makeWrapper(
  objectManager: ObjectFetchManager,
  api = jest.fn(),
  deferredApi?: jest.Mock
) {
  return function Wrapper({ children }: React.PropsWithChildren<never>) {
    return (
      <ObjectFetchManagerContext.Provider value={objectManager}>
        <ApiContext.Provider value={api as unknown as typeof dh}>
          {deferredApi ? (
            <DeferredApiContext.Provider value={deferredApi}>
              {children}
            </DeferredApiContext.Provider>
          ) : (
            children
          )}
        </ApiContext.Provider>
      </ObjectFetchManagerContext.Provider>
    );
  };
}

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
    const api = jest.fn();
    const wrapper = makeWrapper(objectManager, api);
    const { result } = renderHook(() => useWidget(descriptor), { wrapper });
    await act(TestUtils.flushPromises);
    expect(result.current).toEqual({
      widget,
      error: null,
      api,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should use the deferred API if available', async () => {
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
    const deferredApi = {};
    const wrapper = makeWrapper(
      objectManager,
      jest.fn(),
      jest.fn(() => deferredApi)
    );
    const { result } = renderHook(() => useWidget(descriptor), { wrapper });
    await act(TestUtils.flushPromises);
    expect(result.current).toEqual({
      widget,
      error: null,
      api: deferredApi,
    });
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
    const wrapper = makeWrapper(objectManager);

    const { result } = renderHook(() => useWidget(descriptor), { wrapper });

    expect(result.current).toEqual({ widget: null, error, api: null });
  });

  it('should return null when still loading', () => {
    const descriptor = { type: WIDGET_TYPE, name: 'name' };
    const objectFetch = { status: 'loading' };
    const subscribe = jest.fn((_, onUpdate) => {
      onUpdate(objectFetch);
      return jest.fn();
    });
    const objectManager = { subscribe };
    const wrapper = makeWrapper(objectManager);
    const { result } = renderHook(() => useWidget(descriptor), { wrapper });

    expect(result.current).toEqual({ widget: null, error: null, api: null });
  });

  it('should close the widget and exported objects when cancelled', async () => {
    const descriptor = { type: WIDGET_TYPE, name: 'name' };
    const widget: dh.Widget = TestUtils.createMockProxy<dh.Widget>({
      close: jest.fn(),
      exportedObjects: [
        TestUtils.createMockProxy<dh.WidgetExportedObject>({
          close: jest.fn(),
        }),
        TestUtils.createMockProxy<dh.WidgetExportedObject>({
          close: jest.fn(),
        }),
      ],
    });
    const fetch = jest.fn(async () => widget);
    const objectFetch = { fetch, error: null };
    const subscribe = jest.fn((_, onUpdate) => {
      onUpdate(objectFetch);
      return jest.fn();
    });
    const objectManager = { subscribe };
    const wrapper = makeWrapper(objectManager);
    const { result, unmount } = renderHook(() => useWidget(descriptor), {
      wrapper,
    });
    expect(widget.close).not.toHaveBeenCalled();
    expect(widget.exportedObjects[0].close).not.toHaveBeenCalled();
    expect(widget.exportedObjects[1].close).not.toHaveBeenCalled();

    expect(result.current).toEqual({ widget: null, error: null, api: null });

    // Unmount before flushing the promise
    unmount();
    await act(TestUtils.flushPromises);
    expect(widget.close).toHaveBeenCalledTimes(1);
    expect(widget.exportedObjects[0].close).toHaveBeenCalledTimes(1);
    expect(widget.exportedObjects[1].close).toHaveBeenCalledTimes(1);
  });

  it('should not close the widget if it is returned before unmount', async () => {
    const descriptor = { type: WIDGET_TYPE, name: 'name' };
    const widget: dh.Widget = TestUtils.createMockProxy<dh.Widget>({
      close: jest.fn(),
      exportedObjects: [
        TestUtils.createMockProxy<dh.WidgetExportedObject>({
          close: jest.fn(),
        }),
        TestUtils.createMockProxy<dh.WidgetExportedObject>({
          close: jest.fn(),
        }),
      ],
    });
    const fetch = jest.fn(async () => widget);
    const objectFetch = { fetch, error: null };
    const subscribe = jest.fn((_, onUpdate) => {
      onUpdate(objectFetch);
      return jest.fn();
    });
    const objectManager = { subscribe };
    const wrapper = makeWrapper(objectManager);
    const { result, unmount } = renderHook(() => useWidget(descriptor), {
      wrapper,
    });

    expect(result.current).toEqual({ widget: null, error: null, api: null });
    await act(TestUtils.flushPromises);
    unmount();
    expect(widget.close).not.toHaveBeenCalled();
    expect(widget.exportedObjects[0].close).not.toHaveBeenCalled();
    expect(widget.exportedObjects[1].close).not.toHaveBeenCalled();
  });

  it('should handle a Table being fetched', async () => {
    const descriptor: dh.ide.VariableDescriptor = {
      type: 'Table',
      name: 'name',
    };
    const table = TestUtils.createMockProxy<dh.Table>({ close: jest.fn() });
    const fetch = jest.fn(async () => table);
    const objectFetch = { fetch, error: null };
    const subscribe = jest.fn((subscribeDescriptor, onUpdate) => {
      expect(subscribeDescriptor).toEqual(descriptor);
      onUpdate(objectFetch);
      return jest.fn();
    });
    const objectManager = { subscribe };
    const api = jest.fn();
    const wrapper = makeWrapper(objectManager, api);
    const { result, unmount } = renderHook(() => useWidget(descriptor), {
      wrapper,
    });
    await act(TestUtils.flushPromises);
    expect(result.current).toEqual({
      widget: table,
      error: null,
      api,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    unmount();

    // Shouldn't be called if it was returned before unmount
    expect(table.close).not.toHaveBeenCalled();
  });

  it('should close the Table if unmounted before the fetch is done', async () => {
    const descriptor: dh.ide.VariableDescriptor = {
      type: 'Table',
      name: 'name',
    };
    const table = TestUtils.createMockProxy<dh.Table>({ close: jest.fn() });
    const fetch = jest.fn(async () => table);
    const objectFetch = { fetch, error: null };
    const subscribe = jest.fn((subscribeDescriptor, onUpdate) => {
      expect(subscribeDescriptor).toEqual(descriptor);
      onUpdate(objectFetch);
      return jest.fn();
    });
    const objectManager = { subscribe };
    const wrapper = makeWrapper(objectManager);
    const { unmount } = renderHook(() => useWidget(descriptor), { wrapper });

    unmount();
    await act(TestUtils.flushPromises);
    expect(table.close).toHaveBeenCalledTimes(1);
  });
});
