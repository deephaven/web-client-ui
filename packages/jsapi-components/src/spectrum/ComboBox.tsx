import {
  ComboBoxNormalized,
  NormalizedItem,
  SpectrumComboBoxProps,
} from '@deephaven/components';
import { useCallback } from 'react';
import { PickerWithTableProps } from './PickerProps';
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

  const onInputChange = useCallback(
    (value: string) => {
      onInputChangeInternal?.(value);
      onSearchTextChange(value);
    },
    [onInputChangeInternal, onSearchTextChange]
  );

  return (
    <ComboBoxNormalized
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...pickerProps}
      onInputChange={onInputChange}
    />
  );
}

export default ComboBox;
