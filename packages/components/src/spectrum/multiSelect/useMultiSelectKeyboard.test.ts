import { type KeyboardEvent, createRef } from 'react';
import { renderHook, act } from '@testing-library/react';
import type { OverlayTriggerState } from '@react-stately/overlays';
import { useMultiSelectKeyboard } from './useMultiSelectKeyboard';
import type { MultiSelectFlatItem } from './multiSelectUtils';

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

const ITEMS: MultiSelectFlatItem[] = [
  { kind: 'item', key: 'a', label: 'A' },
  { kind: 'item', key: 'b', label: 'B' },
  { kind: 'item', key: 'c', label: 'C' },
];

function createMockOverlayState(isOpen = false): OverlayTriggerState {
  return {
    isOpen,
    open: jest.fn(),
    close: jest.fn(),
    toggle: jest.fn(),
    setOpen: jest.fn(),
  };
}

function createKeyEvent(
  key: string,
  overrides: Partial<KeyboardEvent> = {}
): KeyboardEvent {
  return {
    key,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    ...overrides,
  } as unknown as KeyboardEvent;
}

function createDefaultOptions(
  overrides: Record<string, unknown> = {}
): Parameters<typeof useMultiSelectKeyboard>[0] {
  return {
    filteredItems: ITEMS,
    allItems: ITEMS,
    shouldFocusWrap: false,
    overlayState: createMockOverlayState(false),
    openOverlay: jest.fn(),
    closeOverlay: jest.fn(),
    isReadOnly: false,
    isDisabled: false,
    searchText: '',
    setSearchText: jest.fn(),
    selectedKeys: new Set<string>(),
    toggleKey: jest.fn(),
    allowsCustomValue: false,
    menuTrigger: 'input' as const,
    onKeyDown: undefined,
    listBoxContainerRef: createRef<HTMLElement>(),
    inputRef: createRef<HTMLInputElement>(),
    ...overrides,
  };
}

describe('useMultiSelectKeyboard', () => {
  describe('ArrowDown', () => {
    it('opens the overlay when closed', () => {
      const openOverlay = jest.fn();
      const { result } = renderHook(() =>
        useMultiSelectKeyboard(
          createDefaultOptions({
            openOverlay,
          })
        )
      );

      act(() => {
        result.current.handleInputKeyDown(createKeyEvent('ArrowDown'));
      });

      expect(openOverlay).toHaveBeenCalledWith('manual');
    });

    it('does nothing when disabled', () => {
      const openOverlay = jest.fn();
      const { result } = renderHook(() =>
        useMultiSelectKeyboard(
          createDefaultOptions({
            isDisabled: true,
            openOverlay,
          })
        )
      );

      act(() => {
        result.current.handleInputKeyDown(createKeyEvent('ArrowDown'));
      });

      expect(openOverlay).not.toHaveBeenCalled();
    });
  });

  describe('Escape', () => {
    it('closes the overlay when open', () => {
      const closeOverlay = jest.fn();
      const { result } = renderHook(() =>
        useMultiSelectKeyboard(
          createDefaultOptions({
            overlayState: createMockOverlayState(true),
            closeOverlay,
          })
        )
      );

      const event = createKeyEvent('Escape');
      act(() => {
        result.current.handleInputKeyDown(event);
      });

      expect(closeOverlay).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('does not call closeOverlay when already closed', () => {
      const closeOverlay = jest.fn();
      const { result } = renderHook(() =>
        useMultiSelectKeyboard(
          createDefaultOptions({
            overlayState: createMockOverlayState(false),
            closeOverlay,
          })
        )
      );

      act(() => {
        result.current.handleInputKeyDown(createKeyEvent('Escape'));
      });

      expect(closeOverlay).not.toHaveBeenCalled();
    });
  });

  describe('Enter', () => {
    it('opens the overlay when closed', () => {
      const openOverlay = jest.fn();
      const { result } = renderHook(() =>
        useMultiSelectKeyboard(
          createDefaultOptions({
            openOverlay,
          })
        )
      );

      act(() => {
        result.current.handleInputKeyDown(createKeyEvent('Enter'));
      });

      expect(openOverlay).toHaveBeenCalledWith('manual');
    });
  });

  describe('Tab', () => {
    it('closes the overlay when open', () => {
      const closeOverlay = jest.fn();
      const { result } = renderHook(() =>
        useMultiSelectKeyboard(
          createDefaultOptions({
            overlayState: createMockOverlayState(true),
            closeOverlay,
          })
        )
      );

      act(() => {
        result.current.handleInputKeyDown(createKeyEvent('Tab'));
      });

      expect(closeOverlay).toHaveBeenCalled();
    });
  });

  describe('Backspace', () => {
    it('removes the last selected key when searchText is empty', () => {
      const toggleKey = jest.fn();
      const { result } = renderHook(() =>
        useMultiSelectKeyboard(
          createDefaultOptions({
            searchText: '',
            selectedKeys: new Set(['a', 'b']),
            toggleKey,
          })
        )
      );

      act(() => {
        result.current.handleInputKeyDown(createKeyEvent('Backspace'));
      });

      expect(toggleKey).toHaveBeenCalledWith('b');
    });

    it('does not remove when searchText is not empty', () => {
      const toggleKey = jest.fn();
      const { result } = renderHook(() =>
        useMultiSelectKeyboard(
          createDefaultOptions({
            searchText: 'foo',
            selectedKeys: new Set(['a']),
            toggleKey,
          })
        )
      );

      act(() => {
        result.current.handleInputKeyDown(createKeyEvent('Backspace'));
      });

      expect(toggleKey).not.toHaveBeenCalled();
    });

    it('does not remove when isReadOnly', () => {
      const toggleKey = jest.fn();
      const { result } = renderHook(() =>
        useMultiSelectKeyboard(
          createDefaultOptions({
            searchText: '',
            selectedKeys: new Set(['a']),
            isReadOnly: true,
            toggleKey,
          })
        )
      );

      act(() => {
        result.current.handleInputKeyDown(createKeyEvent('Backspace'));
      });

      expect(toggleKey).not.toHaveBeenCalled();
    });
  });

  it('forwards to onKeyDown callback', () => {
    const onKeyDown = jest.fn();
    const { result } = renderHook(() =>
      useMultiSelectKeyboard(
        createDefaultOptions({
          onKeyDown,
        })
      )
    );

    const event = createKeyEvent('x');
    act(() => {
      result.current.handleInputKeyDown(event);
    });

    expect(onKeyDown).toHaveBeenCalledWith(event);
  });
});
