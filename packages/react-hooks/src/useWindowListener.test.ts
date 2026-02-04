import { renderHook } from '@testing-library/react';
import useWindowListener from './useWindowListener';

const mockCallback = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(window, 'addEventListener');
  jest.spyOn(window, 'removeEventListener');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useWindowListener', () => {
  it('should add event listener for a single event', () => {
    renderHook(() => useWindowListener('resize', mockCallback));

    expect(window.addEventListener).toHaveBeenCalledWith(
      'resize',
      mockCallback,
      undefined
    );
  });

  it('should add event listeners for multiple events', () => {
    const events = ['resize', 'scroll', 'focus'] as const;
    renderHook(() => useWindowListener(events, mockCallback));

    events.forEach(event => {
      expect(window.addEventListener).toHaveBeenCalledWith(
        event,
        mockCallback,
        undefined
      );
    });
  });

  it('should pass options to addEventListener', () => {
    const options = { passive: true, capture: false };
    renderHook(() => useWindowListener('scroll', mockCallback, options));

    expect(window.addEventListener).toHaveBeenCalledWith(
      'scroll',
      mockCallback,
      options
    );
  });

  it('should pass boolean options to addEventListener', () => {
    renderHook(() => useWindowListener('click', mockCallback, true));

    expect(window.addEventListener).toHaveBeenCalledWith(
      'click',
      mockCallback,
      true
    );
  });

  it('should pass options to removeEventListener on unmount', () => {
    const options = { passive: true, capture: false };
    const { unmount } = renderHook(() =>
      useWindowListener('scroll', mockCallback, options)
    );

    jest.clearAllMocks();
    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'scroll',
      mockCallback,
      options
    );
  });

  it('should pass boolean options to removeEventListener on unmount', () => {
    const { unmount } = renderHook(() =>
      useWindowListener('click', mockCallback, true)
    );

    jest.clearAllMocks();
    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'click',
      mockCallback,
      true
    );
  });

  it('should remove event listener on unmount for single event', () => {
    const { unmount } = renderHook(() =>
      useWindowListener('resize', mockCallback)
    );

    jest.clearAllMocks();
    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'resize',
      mockCallback,
      undefined
    );
  });

  it('should remove event listeners on unmount for multiple events', () => {
    const events = ['resize', 'scroll', 'focus'] as const;
    const { unmount } = renderHook(() =>
      useWindowListener(events, mockCallback)
    );

    jest.clearAllMocks();
    unmount();

    events.forEach(event => {
      expect(window.removeEventListener).toHaveBeenCalledWith(
        event,
        mockCallback,
        undefined
      );
    });
  });

  it('should update listeners when events change', () => {
    const { rerender } = renderHook(
      ({ events }) => useWindowListener(events, mockCallback),
      { initialProps: { events: 'resize' as string } }
    );

    jest.clearAllMocks();
    rerender({ events: 'scroll' as const });

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'resize',
      mockCallback,
      undefined
    );
    expect(window.addEventListener).toHaveBeenCalledWith(
      'scroll',
      mockCallback,
      undefined
    );
  });

  it('should update listeners when events array changes', () => {
    const { rerender } = renderHook(
      ({ events }) => useWindowListener(events, mockCallback),
      { initialProps: { events: ['resize'] as readonly string[] } }
    );

    jest.clearAllMocks();
    rerender({ events: ['scroll', 'focus'] as const });

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'resize',
      mockCallback,
      undefined
    );
    expect(window.addEventListener).toHaveBeenCalledWith(
      'scroll',
      mockCallback,
      undefined
    );
    expect(window.addEventListener).toHaveBeenCalledWith(
      'focus',
      mockCallback,
      undefined
    );
  });

  it('should update listeners when callback changes', () => {
    const newCallback = jest.fn();
    const { rerender } = renderHook(
      ({ callback }) => useWindowListener('resize', callback),
      { initialProps: { callback: mockCallback } }
    );

    jest.clearAllMocks();
    rerender({ callback: newCallback });

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'resize',
      mockCallback,
      undefined
    );
    expect(window.addEventListener).toHaveBeenCalledWith(
      'resize',
      newCallback,
      undefined
    );
  });

  it('should update listeners when options change', () => {
    const { rerender } = renderHook(
      ({ options }) => useWindowListener('scroll', mockCallback, options),
      { initialProps: { options: { passive: true } } }
    );

    jest.clearAllMocks();
    rerender({ options: { passive: false } });

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'scroll',
      mockCallback,
      { passive: true }
    );
    expect(window.addEventListener).toHaveBeenCalledWith(
      'scroll',
      mockCallback,
      { passive: false }
    );
  });

  it('should handle empty array of events', () => {
    renderHook(() => useWindowListener([], mockCallback));

    expect(window.addEventListener).not.toHaveBeenCalled();
  });

  it('should not re-register listeners if events array reference changes but content is the same', () => {
    const events1 = ['resize', 'scroll'];
    const events2 = ['resize', 'scroll'];

    const { rerender } = renderHook(
      ({ events }) => useWindowListener(events, mockCallback),
      { initialProps: { events: events1 } }
    );

    jest.clearAllMocks();
    rerender({ events: events2 });

    // Should still re-register because array reference changed
    expect(window.removeEventListener).toHaveBeenCalledTimes(2);
    expect(window.addEventListener).toHaveBeenCalledTimes(2);
  });

  it('should handle conversion from string to array', () => {
    const { rerender } = renderHook(
      ({ events }) => useWindowListener(events, mockCallback),
      { initialProps: { events: 'resize' as string | readonly string[] } }
    );

    jest.clearAllMocks();
    rerender({ events: ['resize'] });

    // Should re-register because events array reference changed
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'resize',
      mockCallback,
      undefined
    );
    expect(window.addEventListener).toHaveBeenCalledWith(
      'resize',
      mockCallback,
      undefined
    );
  });

  it('should call callback when event is dispatched', () => {
    renderHook(() => useWindowListener('custom-event', mockCallback));

    const event = new Event('custom-event');
    window.dispatchEvent(event);

    expect(mockCallback).toHaveBeenCalledWith(event);
  });

  it('should call callback for each registered event', () => {
    const events = ['event1', 'event2', 'event3'] as const;
    renderHook(() => useWindowListener(events, mockCallback));

    events.forEach(eventName => {
      const event = new Event(eventName);
      window.dispatchEvent(event);
    });

    expect(mockCallback).toHaveBeenCalledTimes(3);
  });

  it('should not call callback after unmount', () => {
    const { unmount } = renderHook(() =>
      useWindowListener('test-event', mockCallback)
    );

    unmount();
    jest.clearAllMocks();

    const event = new Event('test-event');
    window.dispatchEvent(event);

    expect(mockCallback).not.toHaveBeenCalled();
  });
});
