import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ItemKey,
  NormalizedItem,
  NormalizedItemData,
  NormalizedSection,
  NormalizedSectionData,
  PickerNormalized,
  PickerProps as PickerBaseProps,
  useSpectrumThemeProvider,
} from '@deephaven/components';
import { dh as DhType } from '@deephaven/jsapi-types';
import { Settings } from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { PICKER_ITEM_HEIGHTS, PICKER_TOP_OFFSET } from '@deephaven/utils';
import useFormatter from '../useFormatter';
import useGetItemIndexByValue from '../useGetItemIndexByValue';
import { useViewportData } from '../useViewportData';
import { getItemKeyColumn } from './utils/itemUtils';
import { useItemRowDeserializer } from './utils/useItemRowDeserializer';

const log = Log.module('jsapi-components.Picker');

export interface PickerProps extends Omit<PickerBaseProps, 'children'> {
  table: DhType.Table;
  /* The column of values to use as item keys. Defaults to the first column. */
  keyColumn?: string;
  /* The column of values to display as primary text. Defaults to the `keyColumn` value. */
  labelColumn?: string;

  /* The column of values to display as descriptions. */
  descriptionColumn?: string;

  /* The column of values to map to icons. */
  iconColumn?: string;

  settings?: Settings;
}

export function Picker({
  table,
  keyColumn: keyColumnName,
  labelColumn: labelColumnName,
  iconColumn: iconColumnName,
  settings,
  onChange,
  onSelectionChange,
  ...props
}: PickerProps): JSX.Element {
  const { scale } = useSpectrumThemeProvider();
  const itemHeight = PICKER_ITEM_HEIGHTS[scale];

  const { getFormattedString: formatValue } = useFormatter(settings);

  // `null` is a valid value for `selectedKey` in controlled mode, so we check
  // for explicit `undefined` to identify uncontrolled mode.
  const isUncontrolled = props.selectedKey === undefined;
  const [uncontrolledSelectedKey, setUncontrolledSelectedKey] = useState(
    props.defaultSelectedKey
  );

  const keyColumn = useMemo(
    () => getItemKeyColumn(table, keyColumnName),
    [keyColumnName, table]
  );

  const deserializeRow = useItemRowDeserializer({
    table,
    iconColumnName,
    keyColumnName,
    labelColumnName,
    formatValue,
  });

  const getItemIndexByValue = useGetItemIndexByValue({
    table,
    columnName: keyColumn.name,
    value: isUncontrolled ? uncontrolledSelectedKey : props.selectedKey,
  });

  const getInitialScrollPosition = useCallback(async () => {
    const index = await getItemIndexByValue();

    if (index == null) {
      return null;
    }

    return index * itemHeight + PICKER_TOP_OFFSET;
  }, [getItemIndexByValue, itemHeight]);

  const { viewportData, onScroll, setViewport } = useViewportData<
    NormalizedItemData | NormalizedSectionData,
    DhType.Table
  >({
    reuseItemsOnTableResize: true,
    table,
    itemHeight,
    deserializeRow,
  });

  const normalizedItems = viewportData.items as (
    | NormalizedItem
    | NormalizedSection
  )[];

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
    [getItemIndexByValue, settings, setViewport]
  );

  const onSelectionChangeInternal = useCallback(
    (key: ItemKey): void => {
      // If our component is uncontrolled, track the selected key internally
      // so that we can scroll to the selected item if the user re-opens
      if (isUncontrolled) {
        setUncontrolledSelectedKey(key);
      }

      (onChange ?? onSelectionChange)?.(key);
    },
    [isUncontrolled, onChange, onSelectionChange]
  );

  return (
    <PickerNormalized
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      normalizedItems={normalizedItems}
      showItemIcons={iconColumnName != null}
      getInitialScrollPosition={getInitialScrollPosition}
      onChange={onSelectionChangeInternal}
      onScroll={onScroll}
    />
  );
}

export default Picker;
