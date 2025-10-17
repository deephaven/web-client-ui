import { useCallback, useMemo, useRef, useState } from 'react';
import { DragStartEvent, useDndMonitor } from '@dnd-kit/core';
import type { TextFieldRef } from '@react-types/textfield';
import { Popper, SearchField } from '@deephaven/components';
import SortableTree from './sortable-tree/SortableTree';
import { type TreeItemRenderFnProps } from './sortable-tree/TreeItem';
import type {
  IrisGridTreeItemData,
  FlattenedIrisGridTreeItem,
} from './sortable-tree/utilities';
import './SearchWithModal.scss';
import MemoizedSearchItem from './SearchItem';
import { GridUtils } from '@deephaven/grid';
import PopperJs from 'popper.js';

interface SearchWithModalProps {
  items: FlattenedIrisGridTreeItem[];
  onModalOpenChange: (isOpen: boolean) => void;
  onClick: (name: string, event: React.MouseEvent<HTMLElement>) => void;
}

export function SearchWithModal({
  items,
  onModalOpenChange,
  onClick,
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

  useDndMonitor({
    onDragStart: (e: DragStartEvent) => {
      console.log(e);
      handleModalClose();
    },
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

  const filteredItems = useMemo(() => {
    if (searchValue === '') {
      return items;
    }
    const lowerSearch = searchValue.toLowerCase();
    return items.filter(item => item.id.toLowerCase().includes(lowerSearch));
  }, [items, searchValue]);

  return (
    <>
      <SearchField
        aria-label="Search columns"
        ref={searchRef}
        value={searchValue}
        onChange={setSearchValue}
        onFocus={handleModalOpen}
        onBlur={handleInputBlur}
      />
      <Popper
        ref={popperRef}
        isShown={isModalOpen}
        interactive
        options={{
          placement: 'bottom-end',
          modifiers: {
            preventOverflow: {
              boundariesElement: 'scrollParent',
              priority: ['top'],
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              fn: (data, options: any) => {
                const modified =
                  PopperJs.Defaults.modifiers?.preventOverflow?.fn?.(
                    data,
                    options
                  );

                if (modified == null) {
                  return data;
                }

                modified.styles.maxHeight = `${
                  document.documentElement.clientHeight -
                  data.offsets.popper.top -
                  2 * options.padding // Double padding because there is top and bottom to account for
                }px`;
                return modified ?? data;
              },
            },
            flip: {
              enabled: false,
            },
          },
        }}
        referenceObject={searchRef.current?.getInputElement()}
        className="visibility-search-list"
      >
        <SortableTree items={filteredItems} renderItem={renderItem} />
        {filteredItems.length === 0 && (
          <div className="no-results">No matching columns</div>
        )}
        {/* <div>
          <hr />
        </div>
        <button
          type="button"
          className="close-button"
          onClick={handleModalClose}
        >
          ×
        </button> */}
      </Popper>
    </>
  );
}

export default SearchWithModal;
