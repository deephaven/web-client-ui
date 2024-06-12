import { dh as DhType } from '@deephaven/jsapi-types';

export interface ComboBoxProps {
  table: DhType.Table;
}

export function ComboBox({ table }: ComboBoxProps): JSX.Element {
  return <>ComboBox</>;
}

export default ComboBox;
