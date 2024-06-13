import { ComboBoxNormalized } from '@deephaven/components';
import { dh as DhType } from '@deephaven/jsapi-types';
import { usePickerProps } from './utils';

export interface ComboBoxProps {
  table: DhType.Table;
}

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
