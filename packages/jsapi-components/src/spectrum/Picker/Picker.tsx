import {
  NormalizedPickerItemData,
  Picker as PickerBase,
  PickerProps as PickerPropsBase,
} from '@deephaven/components';
import { dh } from '@deephaven/jsapi-types';
import { PICKER_ITEM_HEIGHT } from '@deephaven/utils';
import { useEffect } from 'react';
import { useViewportData } from '../../useViewportData';
import { getPickerKeyColumn } from './PickerUtils';
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
  selectedKey,
  ...props
}: PickerProps): JSX.Element {
  const deserializeRow = usePickerItemRowDeserializer({
    table,
    keyColumnName,
    labelColumnName,
  });

  const { viewportData, onScroll, setViewport } = useViewportData<
    NormalizedPickerItemData,
    dh.Table
  >({
    reuseItemsOnTableResize: true,
    table,
    itemHeight: PICKER_ITEM_HEIGHT,
    deserializeRow,
  });

  useEffect(() => {
    if (selectedKey == null) {
      return;
    }

    const keyColumn = getPickerKeyColumn(table, keyColumnName);

    // Set viewport to include the selected item so that its data will load and
    // the real `key` will be available to show the selection in the UI.
    table.seekRow(0, keyColumn, keyColumn.type, selectedKey).then(rowIndex => {
      setViewport(rowIndex);
    });
  }, [keyColumnName, selectedKey, setViewport, table]);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <PickerBase {...props} selectedKey={selectedKey} onScroll={onScroll}>
      {viewportData.items}
    </PickerBase>
  );
}

export default Picker;
