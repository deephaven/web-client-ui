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
      inputValueRef.current = value;

      onInputChangeInternal?.(value);

      // Clear search text when ComboBox is closed
      onSearchTextChange(isOpenRef.current ? value : '');
    },
    [onInputChangeInternal, onSearchTextChange]
  );

  const onOpenChange = useCallback(
    (isOpen: boolean, menuTrigger?: MenuTriggerAction) => {
      isOpenRef.current = isOpen;

      pickerProps.onOpenChange?.(isOpen);

      // Restore search text when ComboBox is being opened if menu trigger was
      // from user input.
      if (isOpen && menuTrigger === 'input') {
        onSearchTextChange(inputValueRef.current);
      }
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
