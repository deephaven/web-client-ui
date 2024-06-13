import { PickerNormalized } from '@deephaven/components';
import { PickerProps } from './PickerProps';
import { usePickerProps } from './utils';

export function Picker(props: PickerProps): JSX.Element {
  const pickerProps = usePickerProps(props);

  return (
    <PickerNormalized
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...pickerProps}
    />
  );
}

export default Picker;
