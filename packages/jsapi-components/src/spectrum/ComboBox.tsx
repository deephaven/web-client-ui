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

      // Only apply search text if ComboBox is open. Note that `onInputChange`
      // fires before `onOpenChange`, so we have to check `isOpenRef` to see the
      // last value set by `onOpenChange`.
      if (isOpenRef.current) {
        onSearchTextChange(value);
      } else {
        // If the ComboBox is closed, reset the search text but store the value
        // so it can be re-applied if the ComboBox is opened by user input.
        onSearchTextChange('');
        inputValueRef.current = value;
      }
    },
    [onInputChangeInternal, onSearchTextChange]
  );

  const onOpenChange = useCallback(
    (isOpen: boolean, menuTrigger?: MenuTriggerAction) => {
      pickerProps.onOpenChange?.(isOpen);

      // Restore search text when ComboBox has been opened by user input.
      if (isOpen && menuTrigger === 'input') {
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
