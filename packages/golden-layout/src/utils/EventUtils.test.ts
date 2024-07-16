import { renderHook } from '@testing-library/react-hooks';
import EventEmitter from './EventEmitter';
import {
  listenForEvent,
  makeListenFunction,
  makeEmitFunction,
  makeEventFunctions,
  makeUseListenerFunction,
} from './EventUtils';

function makeEventEmitter(): EventEmitter {
  return {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  } as unknown as EventEmitter;
}

describe('EventUtils', () => {
  const eventEmitter = makeEventEmitter();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listenForEvent', () => {
    const event = 'test';
    const handler = jest.fn();
    const remove = listenForEvent(eventEmitter, event, handler);
    expect(eventEmitter.on).toHaveBeenCalledWith(event, handler);
    expect(eventEmitter.off).not.toHaveBeenCalled();
    jest.clearAllMocks();
    remove();
    expect(eventEmitter.on).not.toHaveBeenCalled();
    expect(eventEmitter.off).toHaveBeenCalledWith(event, handler);
  });

  it('makeListenFunction', () => {
    const event = 'test';
    const listen = makeListenFunction(event);
    const handler = jest.fn();
    listen(eventEmitter, handler);
    expect(eventEmitter.on).toHaveBeenCalledWith(event, handler);
  });

  it('makeEmitFunction', () => {
    const event = 'test';
    const emit = makeEmitFunction(event);
    const payload = { test: 'test' };
    emit(eventEmitter, payload);
    expect(eventEmitter.emit).toHaveBeenCalledWith(event, payload);
  });

  describe('makeUseListenerFunction', () => {
    it('adds listener on mount, removes on unmount', () => {
      const event = 'test';
      const useListener = makeUseListenerFunction(event);
      const handler = jest.fn();
      const { unmount } = renderHook(() => useListener(eventEmitter, handler));
      expect(eventEmitter.on).toHaveBeenCalledWith(event, handler);
      expect(eventEmitter.off).not.toHaveBeenCalled();
      jest.clearAllMocks();
      unmount();
      expect(eventEmitter.on).not.toHaveBeenCalledWith(event, handler);
      expect(eventEmitter.off).toHaveBeenCalledWith(event, handler);
    });

    it('adds listener on handler change, removes old listener', () => {
      const event = 'test';
      const useListener = makeUseListenerFunction(event);
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const { rerender } = renderHook(
        ({ handler }) => useListener(eventEmitter, handler),
        { initialProps: { handler: handler1 } }
      );
      expect(eventEmitter.on).toHaveBeenCalledWith(event, handler1);
      expect(eventEmitter.off).not.toHaveBeenCalled();
      jest.clearAllMocks();
      rerender({ handler: handler2 });
      expect(eventEmitter.on).toHaveBeenCalledWith(event, handler2);
      expect(eventEmitter.off).toHaveBeenCalledWith(event, handler1);
    });

    it('re-adds the listener on emitter change', () => {
      const event = 'test';
      const useListener = makeUseListenerFunction(event);
      const handler = jest.fn();
      const eventEmitter2 = makeEventEmitter();
      const { rerender, unmount } = renderHook(
        ({ eventEmitter, handler }) => useListener(eventEmitter, handler),
        { initialProps: { eventEmitter, handler } }
      );
      expect(eventEmitter.on).toHaveBeenCalledWith(event, handler);
      expect(eventEmitter.off).not.toHaveBeenCalled();
      jest.clearAllMocks();
      rerender({ eventEmitter: eventEmitter2, handler });
      expect(eventEmitter.on).not.toHaveBeenCalled();
      expect(eventEmitter.off).toHaveBeenCalledWith(event, handler);
      expect(eventEmitter2.on).toHaveBeenCalledWith(event, handler);

      jest.clearAllMocks();
      unmount();
      expect(eventEmitter.on).not.toHaveBeenCalled();
      expect(eventEmitter.off).not.toHaveBeenCalled();
      expect(eventEmitter2.on).not.toHaveBeenCalled();
      expect(eventEmitter2.off).toHaveBeenCalledWith(event, handler);
    });
  });

  describe('makeEventFunctions', () => {
    const event = 'test';
    const { listen, emit, useListener } = makeEventFunctions(event);
    const handler = jest.fn();

    it('listen', () => {
      listen(eventEmitter, handler);
      expect(eventEmitter.on).toHaveBeenCalledWith(event, handler);
      expect(eventEmitter.off).not.toHaveBeenCalled();
    });

    it('emit', () => {
      const payload = { test: 'test' };
      emit(eventEmitter, payload);
      expect(eventEmitter.emit).toHaveBeenCalledWith(event, payload);
    });

    it('useListener', () => {
      const { unmount } = renderHook(() => useListener(eventEmitter, handler));
      expect(eventEmitter.on).toHaveBeenCalledWith(event, handler);
      expect(eventEmitter.off).not.toHaveBeenCalled();
      jest.clearAllMocks();
      unmount();
      expect(eventEmitter.on).not.toHaveBeenCalledWith(event, handler);
      expect(eventEmitter.off).toHaveBeenCalledWith(event, handler);
    });
  });
});
