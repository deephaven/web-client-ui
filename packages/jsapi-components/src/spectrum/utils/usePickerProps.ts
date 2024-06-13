import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ItemKey,
  NormalizedItem,
  NormalizedItemData,
  NormalizedSection,
  NormalizedSectionData,
  usePickerItemScale,
} from '@deephaven/components';
import { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { PICKER_TOP_OFFSET } from '@deephaven/utils';
import useFormatter from '../../useFormatter';
import type { PickerWithTableProps } from '../PickerProps';
import { getItemKeyColumn } from './itemUtils';
import useItemRowDeserializer from './useItemRowDeserializer';
import useGetItemIndexByValue from '../../useGetItemIndexByValue';
import useViewportData from '../../useViewportData';

const log = Log.module('jsapi-components.usePickerProps');

/** Props that are derived by `usePickerProps`. */
export type UsePickerDerivedProps = {
  normalizedItems: (NormalizedItem | NormalizedSection)[];
  showItemIcons: boolean;
  getInitialScrollPosition: () => Promise<number | null>;
  onChange: (key: ItemKey | null) => void;
  onScroll: (event: Event) => void;
};

/** 
 * Props that are passed through untouched. (should exclude all of the
 * destructured props passed into `usePickerProps` that are not in the spread
 * ...props)
) */
export type UsePickerPassthroughProps<TProps> = Omit<
  PickerWithTableProps<TProps>,
  | 'table'
  | 'keyColumn'
  | 'labelColumn'
  | 'iconColumn'
  | 'settings'
  | 'onChange'
  | 'onSelectionChange'
>;

/** Props returned by `usePickerProps` hook. */
export type UsePickerProps<TProps> = UsePickerDerivedProps &
  UsePickerPassthroughProps<TProps>;

export function usePickerProps<TProps>({
  table,
  keyColumn: keyColumnName,
  labelColumn: labelColumnName,
  iconColumn: iconColumnName,
  settings,
  onChange,
  onSelectionChange,
  ...props
}: PickerWithTableProps<TProps>): UsePickerProps<TProps> {
  const { itemHeight } = usePickerItemScale();

  const { getFormattedString: formatValue } = useFormatter(settings);

  // `null` is a valid value for `selectedKey` in controlled mode, so we check
  // for explicit `undefined` to identify uncontrolled mode.
  const isUncontrolled = props.selectedKey === undefined;
  const [uncontrolledSelectedKey, setUncontrolledSelectedKey] = useState<
    ItemKey | null | undefined
  >(props.defaultSelectedKey);

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
    (key: ItemKey | null): void => {
      // If our component is uncontrolled, track the selected key internally
      // so that we can scroll to the selected item if the user re-opens
      if (isUncontrolled) {
        setUncontrolledSelectedKey(key);
      }

      (onChange ?? onSelectionChange)?.(key);
    },
    [isUncontrolled, onChange, onSelectionChange]
  );

  return {
    ...props,
    normalizedItems,
    showItemIcons: iconColumnName != null,
    getInitialScrollPosition,
    onChange: onSelectionChangeInternal,
    onScroll,
  };
}

export default usePickerProps;
