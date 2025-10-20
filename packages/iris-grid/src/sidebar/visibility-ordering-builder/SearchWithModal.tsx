import React, { useCallback, useMemo, useRef, useState } from 'react';
import { type DragStartEvent, useDndMonitor } from '@dnd-kit/core';
import type { TextFieldRef } from '@react-types/textfield';
import { GridUtils } from '@deephaven/grid';
import { ActionButton, Popper, SearchField } from '@deephaven/components';
import { useResizeObserver } from '@deephaven/react-hooks';
import SortableTree from './sortable-tree/SortableTree';
import { type TreeItemRenderFnProps } from './sortable-tree/TreeItem';
import type {
  IrisGridTreeItemData,
  FlattenedIrisGridTreeItem,
} from './sortable-tree/utilities';
import './SearchWithModal.scss';
import MemoizedSearchItem from './SearchItem';

interface SearchWithModalProps {
  items: FlattenedIrisGridTreeItem[];
  onModalOpenChange: (isOpen: boolean) => void;
  onClick: (name: string, event: React.MouseEvent<HTMLElement>) => void;
  onDragStart?: (event: DragStartEvent) => void;
  addToSelection: (columnNames: string[], addToExisting: boolean) => void;
}

export function SearchWithModal({
  items,
  onModalOpenChange,
  onClick,
  onDragStart,
  addToSelection,
}: SearchWithModalProps): JSX.Element {
  const [searchValue, setSearchValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchRef = useRef<TextFieldRef>(null);
  const popperRef = useRef<Popper>(null);

  const handleModalOpen = useCallback(() => {
    if (isModalOpen) {
      return;
    }
    setIsModalOpen(true);
    onModalOpenChange(true);
  }, [onModalOpenChange, isModalOpen]);

  const handleModalClose = useCallback(() => {
    if (!isModalOpen) {
      return;
    }
    setIsModalOpen(false);
    onModalOpenChange(false);
  }, [onModalOpenChange, isModalOpen]);

  const handleInputChange = useCallback(
    (value: string) => {
      // Open in case the user hit escape to close the modal then started typing
      // without blurring the input
      handleModalOpen();
      setSearchValue(value);
    },
    [handleModalOpen]
  );

  const handleInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (
        !popperRef.current ||
        !popperRef.current.element.contains(e.relatedTarget as Node)
      ) {
        handleModalClose();
      }
    },
    [handleModalClose]
  );

  const handleModalBlur = useCallback(
    (e: React.FocusEvent) => {
      const searchElement = searchRef.current?.getInputElement();
      if (!searchElement || !searchElement.contains(e.relatedTarget as Node)) {
        handleModalClose();
      }
    },
    [handleModalClose]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      onDragStart?.(event);
      handleModalClose();
    },
    [onDragStart, handleModalClose]
  );

  useDndMonitor({
    onDragStart: handleDragStart,
  });

  const handleClick = useCallback(
    (name: string, event: React.MouseEvent<HTMLElement>) => {
      onClick(name, event);
      if (!event.shiftKey && !GridUtils.isModifierKeyDown(event)) {
        handleModalClose();
      }
    },
    [onClick, handleModalClose]
  );

  const renderItem = useCallback(
    ({
      value,
      item,
      ref,
      handleProps,
    }: TreeItemRenderFnProps<IrisGridTreeItemData>): JSX.Element => (
      <MemoizedSearchItem
        key={item.id}
        ref={ref}
        value={value}
        item={item}
        onClick={handleClick}
        handleProps={handleProps}
      />
    ),
    [handleClick]
  );

  // Close on escape with empty search.
  // If there is a search value, let the input handle the escape to clear the search.
  const handleEscapeKeydown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && searchValue === '') {
        handleModalClose();
      }
    },
    [handleModalClose, searchValue]
  );

  // Detect if the user resizes the panel height while the popper is open
  useResizeObserver(
    searchRef.current
      ?.getInputElement()
      ?.closest('.visibility-ordering-builder'),
    () => {
      popperRef.current?.scheduleUpdate();
    }
  );

  const filteredItems = useMemo(() => {
    if (searchValue === '') {
      return items;
    }
    const lowerSearch = searchValue.toLowerCase();
    return items.filter(item => item.id.toLowerCase().includes(lowerSearch));
  }, [items, searchValue]);

  const handleSelectMatching = useCallback(() => {
    const matchingNames = filteredItems.map(item => item.id);
    addToSelection(matchingNames, false);
    handleModalClose();
  }, [filteredItems, addToSelection, handleModalClose]);

  const hasMultipleSelection = useMemo(() => {
    let foundOne = false;
    return filteredItems.some(item => {
      if (item.selected) {
        if (foundOne) {
          return true;
        }
        foundOne = true;
      }
      return false;
    });
  }, [filteredItems]);

  const hasMultipleMatches = searchValue !== '' && filteredItems.length > 1;
  const showFooterButtons = hasMultipleSelection || hasMultipleMatches;

  return (
    <>
      <SearchField
        aria-label="Search columns"
        ref={searchRef}
        value={searchValue}
        onChange={handleInputChange}
        onFocus={handleModalOpen}
        onBlur={handleInputBlur}
        onKeyDown={handleEscapeKeydown}
      />
      <Popper
        ref={popperRef}
        isShown={isModalOpen}
        interactive
        keepInParent
        onBlur={handleModalBlur}
        options={{
          placement: 'bottom-end',
          modifiers: {
            preventOverflow: {
              priority: ['top'],
            },
            flip: {
              enabled: false,
            },
          },
        }}
        referenceObject={searchRef.current?.getInputElement()}
        className="visibility-search-list"
      >
        <div className="visibility-search-list-inner">
          {filteredItems.length === 0 ? (
            <div className="no-results">No matching columns</div>
          ) : (
            <>
              <SortableTree
                items={filteredItems}
                withDepthMarkers={false}
                renderItem={renderItem}
              />
              {showFooterButtons && (
                <div className="footer-buttons">
                  {hasMultipleSelection && (
                    <ActionButton isQuiet onPress={handleModalClose}>
                      Select Group
                    </ActionButton>
                  )}
                  {hasMultipleMatches && (
                    <ActionButton isQuiet onPress={handleSelectMatching}>
                      Select Matching
                    </ActionButton>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Popper>
    </>
  );
}

export default SearchWithModal;
