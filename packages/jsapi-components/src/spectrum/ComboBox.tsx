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
      }
      // When the ComboBox is closed, `onInputChange` may have been called as a
      // result of user search input, ComboBox selection, or by selected key
      // prop changes. We can't determine the source here, so we clear the search
      // text and store the search value so that the list is unfiltered the next
      // time the ComboBox is opened. We also store the search value so we can
      // re-apply it in `onOpenChange` if the ComboBox is opened by user search
      // input.
      else {
        onSearchTextChange('');
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
