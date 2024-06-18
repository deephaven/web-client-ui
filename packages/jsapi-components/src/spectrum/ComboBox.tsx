import {
  ComboBoxNormalized,
  NormalizedItem,
  SpectrumComboBoxProps,
} from '@deephaven/components';
import { PickerWithTableProps } from './PickerProps';
import { usePickerProps } from './utils';

export type ComboBoxProps = PickerWithTableProps<
  SpectrumComboBoxProps<NormalizedItem>
>;

export function ComboBox(props: ComboBoxProps): JSX.Element {
  const pickerProps = usePickerProps(props);
  return (
    <ComboBoxNormalized
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...pickerProps}
    />
  );
}

export default ComboBox;
