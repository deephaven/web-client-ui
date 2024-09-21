import {
  type NormalizedItem,
  type PickerPropsT,
  type SpectrumPickerProps,
} from '@deephaven/components';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { type Settings } from '@deephaven/jsapi-utils';

export type PickerWithTableProps<TProps> = Omit<
  PickerPropsT<TProps>,
  'children'
> & {
  table: DhType.Table;
  /* The column of values to use as item keys. Defaults to the first column. */
  keyColumn?: string;
  /* The column of values to display as primary text. Defaults to the `keyColumn` value. */
  labelColumn?: string;

  /* The column of values to map to icons. */
  iconColumn?: string;

  settings?: Settings;
};

export type PickerProps = PickerWithTableProps<
  SpectrumPickerProps<NormalizedItem>
>;
