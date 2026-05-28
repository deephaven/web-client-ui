import { createRef } from 'react';
import { renderHook } from '@testing-library/react';
import { useMultiSelectScrollListener } from './useMultiSelectScrollListener';

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
    cb(0);
    return 0;
  });
  jest
    .spyOn(window, 'cancelAnimationFrame')
    .mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useMultiSelectScrollListener', () => {
  it('does not attach listener when closed', () => {
    const onScroll = jest.fn();
    const containerRef = createRef<HTMLElement>();

    renderHook(() =>
      useMultiSelectScrollListener({
        containerRef,
        isOpen: false,
        onScroll,
      })
    );

    expect(onScroll).not.toHaveBeenCalled();
  });

  it('attaches scroll listener to listbox element when open', () => {
    const onScroll = jest.fn();

    const listBox = document.createElement('div');
    listBox.setAttribute('role', 'listbox');
    const addSpy = jest.spyOn(listBox, 'addEventListener');

    const container = document.createElement('div');
    container.appendChild(listBox);

    const containerRef = { current: container };

    renderHook(() =>
      useMultiSelectScrollListener({
        containerRef,
        isOpen: true,
        onScroll,
      })
    );

    expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('falls back to container when no listbox found', () => {
    const onScroll = jest.fn();

    const container = document.createElement('div');
    const addSpy = jest.spyOn(container, 'addEventListener');

    const containerRef = { current: container };

    renderHook(() =>
      useMultiSelectScrollListener({
        containerRef,
        isOpen: true,
        onScroll,
      })
    );

    expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('invokes onScroll when the element scrolls', () => {
    const onScroll = jest.fn();

    const listBox = document.createElement('div');
    listBox.setAttribute('role', 'listbox');

    const container = document.createElement('div');
    container.appendChild(listBox);

    const containerRef = { current: container };

    renderHook(() =>
      useMultiSelectScrollListener({
        containerRef,
        isOpen: true,
        onScroll,
      })
    );

    const scrollEvent = new Event('scroll');
    listBox.dispatchEvent(scrollEvent);

    expect(onScroll).toHaveBeenCalledWith(scrollEvent);
  });

  it('removes listener when popover closes', () => {
    const onScroll = jest.fn();

    const listBox = document.createElement('div');
    listBox.setAttribute('role', 'listbox');
    const removeSpy = jest.spyOn(listBox, 'removeEventListener');

    const container = document.createElement('div');
    container.appendChild(listBox);

    const containerRef = { current: container };

    const { rerender } = renderHook(
      ({ isOpen }) =>
        useMultiSelectScrollListener({
          containerRef,
          isOpen,
          onScroll,
        }),
      { initialProps: { isOpen: true } }
    );

    rerender({ isOpen: false });

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
