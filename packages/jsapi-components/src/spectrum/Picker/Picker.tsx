import {
  NormalizedPickerItemData,
  Picker as PickerBase,
  PickerProps as PickerPropsBase,
} from '@deephaven/components';
import { dh as DhType } from '@deephaven/jsapi-types';
import { Settings } from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { PICKER_ITEM_HEIGHT, PICKER_TOP_OFFSET } from '@deephaven/utils';
import { useCallback, useEffect, useMemo } from 'react';
import useFormatter from '../../useFormatter';
import useGetItemIndexByValue from '../../useGetItemIndexByValue';
import { useViewportData } from '../../useViewportData';
import { getPickerKeyColumn } from './PickerUtils';
import { usePickerItemRowDeserializer } from './usePickerItemRowDeserializer';

const log = Log.module('jsapi-components.Picker');

export interface PickerProps extends Omit<PickerPropsBase, 'children'> {
  table: DhType.Table;
  /* The column of values to use as item keys. Defaults to the first column. */
  keyColumn?: string;
  /* The column of values to display as primary text. Defaults to the `keyColumn` value. */
  labelColumn?: string;

  // TODO #1890 : descriptionColumn, iconColumn

  settings?: Settings;
}

export function Picker({
  table,
  keyColumn: keyColumnName,
  labelColumn: labelColumnName,
  selectedKey,
  settings,
  ...props
}: PickerProps): JSX.Element {
  const { getFormattedString: formatValue } = useFormatter(settings);

  const keyColumn = useMemo(
    () => getPickerKeyColumn(table, keyColumnName),
    [keyColumnName, table]
  );

  const deserializeRow = usePickerItemRowDeserializer({
    table,
    keyColumnName,
    labelColumnName,
    formatValue,
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
    DhType.Table
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
      let isCanceled = false;

      getItemIndexByValue()
        .then(index => {
          if (index == null || isCanceled) {
            return;
          }

          setViewport(index);
        })
        .catch(err => {
          log.error('Error setting viewport from selected key', err);
        });

      return () => {
        isCanceled = true;
      };
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
