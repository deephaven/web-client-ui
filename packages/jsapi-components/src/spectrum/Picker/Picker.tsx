import {
  NormalizedPickerItemData,
  Picker as PickerBase,
  PickerProps as PickerPropsBase,
} from '@deephaven/components';
import { dh } from '@deephaven/jsapi-types';
import { PICKER_ITEM_HEIGHT, PICKER_TOP_OFFSET } from '@deephaven/utils';
import { useCallback, useEffect, useMemo } from 'react';
import useGetItemIndexByValue from '../../useGetItemIndexByValue';
import { useViewportData } from '../../useViewportData';
import { getPickerKeyColumn } from './PickerUtils';
import { usePickerItemRowDeserializer } from './usePickerItemRowDeserializer';

export interface PickerProps extends Omit<PickerPropsBase, 'children'> {
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
  const keyColumn = useMemo(
    () => getPickerKeyColumn(table, keyColumnName),
    [keyColumnName, table]
  );

  const deserializeRow = usePickerItemRowDeserializer({
    table,
    keyColumnName,
    labelColumnName,
  });

  const getItemIndexByValue = useGetItemIndexByValue({
    table,
    columnName: keyColumn.name,
    value: selectedKey,
  });

  const getInitialScrollPosition = useCallback(async () => {
    const index = await getItemIndexByValue();

    if (index == null) {
      return null;
    }

    return index * PICKER_ITEM_HEIGHT + PICKER_TOP_OFFSET;
  }, [getItemIndexByValue]);

  const { viewportData, onScroll, setViewport } = useViewportData<
    NormalizedPickerItemData,
    dh.Table
  >({
    reuseItemsOnTableResize: true,
    table,
    itemHeight: PICKER_ITEM_HEIGHT,
    deserializeRow,
  });

  useEffect(
    // Set viewport to include the selected item so that its data will load and
    // the real `key` will be available to show the selection in the UI.
    function setViewportFromSelectedKey() {
      getItemIndexByValue().then(index => {
        if (index != null) {
          setViewport(index);
        }
      });
    },
    [getItemIndexByValue, setViewport]
  );

  return (
    <PickerBase
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      getInitialScrollPosition={getInitialScrollPosition}
      selectedKey={selectedKey}
      onScroll={onScroll}
    >
      {viewportData.items}
    </PickerBase>
  );
}

export default Picker;
