import { PickerNormalized } from '@deephaven/components';
import { type PickerProps } from './PickerProps';
import { usePickerProps } from './utils';
import useTableClose from '../useTableClose';

export function Picker(props: PickerProps): JSX.Element {
  const pickerProps = usePickerProps<PickerProps>(props);

  useTableClose(props.table);

  return (
    <PickerNormalized
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...pickerProps}
    />
  );
}

export default Picker;
