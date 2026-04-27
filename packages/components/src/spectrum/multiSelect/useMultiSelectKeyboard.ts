import {
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { OverlayTriggerState } from '@react-stately/overlays';
import type { MenuTriggerAction } from '../comboBox';
import { type MultiSelectFlatItem } from './multiSelectUtils';

export interface UseMultiSelectKeyboardOptions {
  filteredItems: MultiSelectFlatItem[];
  allItems: MultiSelectFlatItem[];
  shouldFocusWrap: boolean;
  overlayState: OverlayTriggerState;
  openOverlay: (reason: MenuTriggerAction) => void;
  closeOverlay: () => void;
  isReadOnly: boolean;
  isDisabled: boolean;
  searchText: string;
  setSearchText: (value: string) => void;
  selectedKeys: Set<string>;
  toggleKey: (key: string) => void;
  allowsCustomValue: boolean;
  menuTrigger: 'focus' | 'input' | 'manual';
  onKeyDown: ((e: KeyboardEvent) => void) | undefined;
  listBoxContainerRef: RefObject<HTMLElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
}

export interface UseMultiSelectKeyboardResult {
  /** `onKeyDown` handler for the inline input. */
  handleInputKeyDown: (e: KeyboardEvent) => void;
}

/**
 * TODO: fragile, see if there is a better way to link focused state
 * Replicates the key-normalization Spectrum applies to listbox option ids
 * (see `@react-aria/listbox/src/utils.ts`). Whitespace is stripped so that
 * `<listId>-option-<normalizedKey>` matches the actual rendered DOM `id`.
 */
function normalizeKey(key: string): string {
  return key.replace(/\s*/g, '');
}

/**
 * Owns virtual-focus tracking, keyboard handling, and the DOM/scroll
 * side-effects for option highlighting in MultiSelect. Keyboard navigation
 * is handled outside Spectrum's ListBox because the input retains real
 * focus while options are visually highlighted via `data-dh-focused`.
 *
 * Focus is tracked by item key, so it survives filtering, virtualization, etc
 * where the underlying filteredItems array shifts independently of the user's
 * intended focus target.
 */
export function useMultiSelectKeyboard({
  filteredItems,
  allItems,
  shouldFocusWrap,
  overlayState,
  openOverlay,
  closeOverlay,
  isReadOnly,
  isDisabled,
  searchText,
  setSearchText,
  selectedKeys,
  toggleKey,
  allowsCustomValue,
  menuTrigger,
  onKeyDown,
  listBoxContainerRef,
  inputRef,
}: UseMultiSelectKeyboardOptions): UseMultiSelectKeyboardResult {
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  const moveFocus = useCallback(
    (dir: 'down' | 'up') => {
      const len = filteredItems.length;
      if (len === 0) {
        return;
      }
      setFocusedKey(prev => {
        const currentIdx =
          prev == null ? -1 : filteredItems.findIndex(i => i.key === prev);
        let nextIdx: number;
        if (dir === 'down') {
          if (currentIdx === -1) {
            nextIdx = 0;
          } else if (shouldFocusWrap) {
            nextIdx = (currentIdx + 1) % len;
          } else {
            nextIdx = Math.min(currentIdx + 1, len - 1);
          }
        } else if (currentIdx === -1) {
          nextIdx = len - 1;
        } else if (shouldFocusWrap) {
          nextIdx = (currentIdx - 1 + len) % len;
        } else {
          nextIdx = Math.max(currentIdx - 1, 0);
        }
        return filteredItems[nextIdx].key;
      });
    },
    [filteredItems, shouldFocusWrap]
  );

  const handleInputKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isDisabled) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!overlayState.isOpen) {
            openOverlay('manual');
          } else {
            moveFocus('down');
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (overlayState.isOpen) {
            moveFocus('up');
          }
          break;

        case 'Enter': {
          if (!overlayState.isOpen) {
            e.preventDefault();
            openOverlay('manual');
            break;
          }
          const focusedItemStillExists =
            focusedKey != null && filteredItems.some(i => i.key === focusedKey);
          if (!isReadOnly && focusedItemStillExists) {
            e.preventDefault();
            toggleKey(focusedKey);
          } else if (
            !isReadOnly &&
            allowsCustomValue &&
            searchText.trim() !== ''
          ) {
            e.preventDefault();
            const trimmed = searchText.trim();
            // Check if typed text exactly matches an existing item label
            const matchingItem = allItems.find(
              item => item.label.toLowerCase() === trimmed.toLowerCase()
            );
            toggleKey(matchingItem != null ? matchingItem.key : trimmed);
            setSearchText('');
          } else {
            // No focused item, no custom value — clear search and close
            setSearchText('');
            closeOverlay();
          }
          break;
        }

        case 'Escape':
          if (overlayState.isOpen) {
            e.preventDefault();
            closeOverlay();
          }
          break;

        case 'Tab':
          if (overlayState.isOpen) {
            closeOverlay();
          }
          break;

        case 'Backspace':
          if (searchText === '' && !isReadOnly && selectedKeys.size > 0) {
            const keys = [...selectedKeys];
            const lastKey = keys[keys.length - 1];
            if (lastKey != null) {
              toggleKey(lastKey);
            }
          }
          break;

        default:
          break;
      }

      onKeyDown?.(e);
    },
    [
      isDisabled,
      overlayState,
      openOverlay,
      closeOverlay,
      moveFocus,
      isReadOnly,
      focusedKey,
      filteredItems,
      allItems,
      allowsCustomValue,
      toggleKey,
      searchText,
      setSearchText,
      selectedKeys,
      onKeyDown,
    ]
  );

  // Reset state only when the dropdown closes (not every render). This avoids clearing the input
  // on each keystroke, especially in menuTrigger='manual' mode.
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (wasOpenRef.current && !overlayState.isOpen) {
      if (!allowsCustomValue) {
        setSearchText('');
      }
      setFocusedKey(null);
    }
    wasOpenRef.current = overlayState.isOpen;
  }, [overlayState.isOpen, setSearchText, allowsCustomValue]);

  // Open dropdown when user starts typing (unless menuTrigger is 'manual').
  // Intentionally watches only searchText: including overlayState.isOpen would
  // re-fire on close and auto-reopen if the input still has text.
  useEffect(() => {
    if (
      menuTrigger !== 'manual' &&
      searchText !== '' &&
      !overlayState.isOpen &&
      !isDisabled
    ) {
      openOverlay('input');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  // Spectrum's <ListBox> doesn't expose its own focus management, so we mark the focused option
  // with data-dh-focused for SCSS styling and copy the option's id onto
  // the input's aria-activedescendant.
  useEffect(() => {
    const container = listBoxContainerRef.current;
    if (container == null) {
      inputRef.current?.removeAttribute('aria-activedescendant');
      return;
    }
    const options = container.querySelectorAll<HTMLElement>('[role="option"]');
    const focusedSuffix =
      focusedKey != null ? `-option-${normalizeKey(focusedKey)}` : null;
    let focusedOptionId: string | undefined;
    options.forEach(el => {
      const matches = focusedSuffix != null && el.id.endsWith(focusedSuffix);
      if (matches) {
        el.setAttribute('data-dh-focused', 'true');
        el.scrollIntoView({ block: 'nearest' });
        focusedOptionId = el.id;
      } else {
        el.removeAttribute('data-dh-focused');
      }
    });

    const input = inputRef.current;
    if (input != null) {
      if (focusedOptionId != null) {
        input.setAttribute('aria-activedescendant', focusedOptionId);
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    }
  }, [focusedKey, filteredItems, inputRef, listBoxContainerRef]);

  return { handleInputKeyDown };
}

export default useMultiSelectKeyboard;
