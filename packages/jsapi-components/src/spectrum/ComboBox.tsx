import {
  ComboBoxNormalized,
  type MenuTriggerAction,
  type NormalizedItem,
  type SpectrumComboBoxProps,
} from '@deephaven/components';
import { useCallback, useRef } from 'react';
import { type PickerWithTableProps } from './PickerProps';
import { usePickerProps } from './utils';

export type ComboBoxProps = PickerWithTableProps<
  SpectrumComboBoxProps<NormalizedItem>
>;

export function ComboBox(props: ComboBoxProps): JSX.Element {
  const {
    onInputChange: onInputChangeInternal,
    onSearchTextChange,
    ...pickerProps
  } = usePickerProps<ComboBoxProps>(props);

  const isOpenRef = useRef(false);
  const inputValueRef = useRef('');

  const onInputChange = useCallback(
    (value: string) => {
      onInputChangeInternal?.(value);

      // Only apply search text if ComboBox is open.
      if (isOpenRef.current) {
        onSearchTextChange(value);
      } else {
        // If the ComboBox is closed, reset the search text. This is needed for
        // cases where the input change is not the result of user search input.
        onSearchTextChange('');

        // Store the input value so that it can be restored when the ComboBox is
        // opened as the result of user search input. Unfortunately, we can't
        // determine this here but have to wait to check the `menuTrigger` arg
        // passed to `onOpenChange`.
        inputValueRef.current = value;
      }
    },
    [onInputChangeInternal, onSearchTextChange]
  );

  const onOpenChange = useCallback(
    (isOpen: boolean, menuTrigger?: MenuTriggerAction) => {
      pickerProps.onOpenChange?.(isOpen);

      // Reset the search text when the ComboBox is closed.
      if (!isOpen) {
        onSearchTextChange('');
      }
      // Restore search text when ComboBox has been opened by user input.
      else if (menuTrigger === 'input') {
        onSearchTextChange(inputValueRef.current);
      }

      // Store the open state so that `onInputChange` has access to it.
      isOpenRef.current = isOpen;
    },
    [onSearchTextChange, pickerProps]
  );

  return (
    <ComboBoxNormalized
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...pickerProps}
      onInputChange={onInputChange}
      onOpenChange={onOpenChange}
    />
  );
}

export default ComboBox;
