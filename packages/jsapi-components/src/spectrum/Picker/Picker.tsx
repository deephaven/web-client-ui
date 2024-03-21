import {
  NormalizedPickerItemData,
  Picker as PickerBase,
  PickerProps as PickerPropsBase,
} from '@deephaven/components';
import { dh } from '@deephaven/jsapi-types';
import { PICKER_ITEM_HEIGHT } from '@deephaven/utils';
import { useViewportData } from '../../useViewportData';
import usePickerItemRowDeserializer from './usePickerItemRowDeserializer';

export interface PickerProps extends PickerPropsBase {
  table: dh.Table;
  /* The column of values to use as item keys. Defaults to the first column. */
  keyColumn?: string;
  /* The column of values to display as primary text. Defaults to the `keyColumn` value. */
  labelColumn?: string;
}

export function Picker({
  table,
  keyColumn: keyColumnName,
  labelColumn: labelColumnName,
  ...props
}: PickerProps): JSX.Element {
  const deserializeRow = usePickerItemRowDeserializer({
    table,
    keyColumnName,
    labelColumnName,
  });

  const { viewportData, onScroll } = useViewportData<
    NormalizedPickerItemData,
    dh.Table
  >({
    reuseItemsOnTableResize: true,
    table,
    itemHeight: PICKER_ITEM_HEIGHT,
    deserializeRow,
  });

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <PickerBase {...props} onScroll={onScroll}>
      {viewportData.items}
    </PickerBase>
  );
}

export default Picker;
