import React, { useCallback, useRef, useState } from 'react';
import classNames from 'classnames';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import { Item, Picker, type ItemKey } from '@deephaven/components';
import { SELECTION_DIRECTION, type CellInputProps } from '@deephaven/grid';
import './CellDropdownField.scss';

export type CellDropdownFieldProps = CellInputProps & {
  /** The list of allowed values to display in the dropdown. */
  options: string[];
};

/**
 * A dropdown cell editor for use in an editable grid cell.
 * Renders a Picker component in place of the standard textarea used by CellInputField.
 * Intended to be supplied as the `renderCellInputComponent` prop on Grid when the
 * column restriction requires a constrained set of values.
 */
export function CellDropdownField({
  options,
  className = '',
  disabled = false,
  value: propsValue = '',
  onChange = EMPTY_FUNCTION,
  onCancel = EMPTY_FUNCTION,
  onDone = EMPTY_FUNCTION,
  style,
}: CellDropdownFieldProps): JSX.Element {
  const [value, setValue] = useState(propsValue);
  // Use a ref for `isCancelled` so the focus change handler always sees the latest value
  const isCancelled = useRef(false);
  // Track whether a selection was committed so onOpenChange can distinguish ESC from a selection
  const isSelectionCommitted = useRef(false);
  // Direction to use when committing — set by capturing Enter before Spectrum consumes it
  const commitDirection = useRef<SELECTION_DIRECTION | null>(null);

  /**
   * Handle when the selected value changes in the Picker. Updates local state and calls onChange and onDone with the new value.
   * @param key the key of the newly selected item, or null if no item is selected
   */
  const handleChange = useCallback(
    (key: ItemKey | null) => {
      const newValue = key?.toString() ?? '';
      isSelectionCommitted.current = true;
      setValue(newValue);
      onChange(newValue);
      onDone(newValue, { direction: commitDirection.current });
      commitDirection.current = null;
    },
    [onChange, onDone]
  );

  /**
   * Capture Enter before Spectrum consumes it to record the intended commit direction.
   * Spectrum handles Enter to select the highlighted item and fires onChange — by the
   * time onChange fires the key event is gone, so we must capture direction here.
   */
  const handleWrapperKeyDownCapture = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        commitDirection.current = event.shiftKey
          ? SELECTION_DIRECTION.UP
          : SELECTION_DIRECTION.DOWN;
      }
    },
    []
  );

  /**
   * Handle key down events on the Picker. Currently only handles Escape to cancel the edit, but could be expanded to handle committing the edit with Enter or other keys.
   * @param event the keyboard event
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        isCancelled.current = true;
        onCancel();
      }
    },
    [onCancel]
  );

  /**
   * When the overlay closes without a committed selection (e.g. ESC pressed while
   * the menu is open), cancel the edit. Spectrum consumes the ESC keydown to close
   * the overlay so onKeyDown never fires in that case.
   */
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen && !isSelectionCommitted.current) {
        if (commitDirection.current !== null) {
          // Enter was pressed on the already-selected item — Spectrum didn't fire
          // onChange because the value didn't change, but we should still commit.
          isSelectionCommitted.current = true;
          onDone(value, { direction: commitDirection.current });
          commitDirection.current = null;
        } else {
          isCancelled.current = true;
          onCancel();
        }
      }
    },
    [onCancel, onDone, value]
  );

  /**
   * Commit the current value when the Picker loses focus entirely (trigger + overlay).
   * Skipped if the edit was already cancelled via Escape.
   */
  const handleFocusChange = useCallback(
    (isFocused: boolean) => {
      if (!isFocused && !isCancelled.current) {
        onDone(value, { direction: null });
      }
    },
    [onDone, value]
  );

  return (
    // onKeyDownCapture captures Enter before Spectrum consumes it to set commit direction
    <div
      className={classNames(
        'grid-cell-input-field',
        'cell-dropdown-field',
        className
      )}
      style={style}
      onKeyDownCapture={handleWrapperKeyDownCapture}
    >
      <Picker
        UNSAFE_className="cell-dropdown-field-picker"
        width="100%"
        selectedKey={value || null}
        autoFocus
        defaultOpen
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onOpenChange={handleOpenChange}
        onFocusChange={handleFocusChange}
        aria-label="Cell value"
        isDisabled={disabled}
        isQuiet
      >
        {options.map(option => (
          <Item key={option}>{option}</Item>
        ))}
      </Picker>
    </div>
  );
}

export default CellDropdownField;
