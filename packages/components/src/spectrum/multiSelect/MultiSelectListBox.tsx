import { type ReactElement, type RefObject } from 'react';
import { ListBox } from '@adobe/react-spectrum';
import type { Key, LoadingState, Selection } from '@react-types/shared';

export interface MultiSelectListBoxProps {
  /** Container ref used by the keyboard hook for virtual focus DOM ops. */
  containerRef: RefObject<HTMLDivElement>;
  /** ID applied to the inner Spectrum `<ListBox>`. */
  listBoxId: string;
  /** Spectrum `LoadingState` for the items collection. */
  loadingState: LoadingState | undefined;
  /** JSX children to render inside `<ListBox>`. */
  filteredJsxChildren: ReactElement[];
  /** Selected keys */
  selectedKeys: Iterable<string>;
  /** Disabled keys for `<ListBox>`. */
  disabledKeys: Key[] | undefined;
  /** Selection change handler from `<ListBox>`. */
  onSelectionChange: (selection: Selection) => void;
  /** ARIA label applied to the `<ListBox>`. */
  ariaLabel: string;
  /** When provided, the ListBox is replaced with this empty-state message. */
  emptyMessage?: string;
}

/**
 * Popover content for `MultiSelect`. Renders either an empty-state message (text-only)
 * or the Spectrum `<ListBox>`. Private subcomponent of `MultiSelect`.
 */
export function MultiSelectListBox({
  containerRef,
  listBoxId,
  loadingState,
  filteredJsxChildren,
  selectedKeys,
  disabledKeys,
  onSelectionChange,
  ariaLabel,
  emptyMessage,
}: MultiSelectListBoxProps): JSX.Element {
  if (emptyMessage != null) {
    return <div className="dh-multi-select-empty">{emptyMessage}</div>;
  }

  return (
    <div ref={containerRef} className="dh-multi-select-list-box-container">
      <ListBox
        id={listBoxId}
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={onSelectionChange}
        disabledKeys={disabledKeys}
        aria-label={ariaLabel}
        isLoading={loadingState === 'loadingMore'}
      >
        {filteredJsxChildren}
      </ListBox>
    </div>
  );
}

export default MultiSelectListBox;
