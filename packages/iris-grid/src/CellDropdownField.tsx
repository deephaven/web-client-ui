import React, { useCallback, useRef, useState } from 'react';
import classNames from 'classnames';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import { Item, Picker, type ItemKey } from '@deephaven/components';
import { type SELECTION_DIRECTION } from '@deephaven/grid';
import './CellDropdownField.scss';

export type CellDropdownFieldProps = {
  /** The list of allowed values to display in the dropdown. */
  options: string[];
  className?: string;
  disabled?: boolean;
  isQuickEdit?: boolean;
  value?: string;
  /** Called whenever the selected value changes. */
  onChange?: (value: string) => void;
  /** Called when the edit is cancelled, e.g. the user presses Escape. */
  onCancel?: () => void;
  /** Called when the edit is committed with the selected value and commit options. */
  onDone?: (
    value: string,
    options: {
      direction?: SELECTION_DIRECTION | null;
      fillRange?: boolean;
    }
  ) => void;
  style?: React.CSSProperties;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isQuickEdit = false,
  value: propsValue = '',
  onChange = EMPTY_FUNCTION,
  onCancel = EMPTY_FUNCTION,
  onDone = EMPTY_FUNCTION,
  style,
}: CellDropdownFieldProps): JSX.Element {
  const [value, setValue] = useState(propsValue);
  // Use a ref for `isCancelled` so the focus change handler always sees the latest value
  const isCancelled = useRef(false);

  /**
   * Handle when the selected value changes in the Picker. Updates local state and calls onChange and onDone with the new value.
   * @param key the key of the newly selected item, or null if no item is selected
   */
  const handleChange = useCallback(
    (key: ItemKey | null) => {
      const newValue = key?.toString() ?? '';
      setValue(newValue);
      onChange(newValue);
      onDone(newValue, { direction: null });
    },
    [onChange, onDone]
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
    <div className={classNames('cell-dropdown-field', className)} style={style}>
      <Picker
        UNSAFE_className="cell-dropdown-field-picker"
        selectedKey={value || null}
        autoFocus
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocusChange={handleFocusChange}
        menuWidth="max-content"
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
