import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ItemKey,
  NormalizedItem,
  NormalizedSection,
  usePickerItemScale,
} from '@deephaven/components';
import { TableUtils } from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { usePromiseFactory } from '@deephaven/react-hooks';
import { PICKER_TOP_OFFSET } from '@deephaven/utils';
import useFormatter from '../../useFormatter';
import type { PickerWithTableProps } from '../PickerProps';
import { getItemKeyColumn, getItemLabelColumn } from './itemUtils';
import { useItemRowDeserializer } from './useItemRowDeserializer';
import { useGetItemIndexByValue } from '../../useGetItemIndexByValue';
import useSearchableViewportData from '../../useSearchableViewportData';

const log = Log.module('jsapi-components.usePickerProps');

/** Props that are derived by `usePickerProps`. */
export type UsePickerDerivedProps = {
  normalizedItems: (NormalizedItem | NormalizedSection)[];
  showItemIcons: boolean;
  getInitialScrollPosition: () => Promise<number | null>;
  onChange: (key: ItemKey | null) => void;
  onScroll: (event: Event) => void;
  onSearchTextChange: (searchText: string) => void;
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
  | 'additionalFilterFactories'
  | 'onChange'
  | 'onSelectionChange'
>;

/** Props returned by `usePickerProps` hook. */
export type UsePickerProps<TProps> = UsePickerDerivedProps &
  UsePickerPassthroughProps<TProps>;

export function usePickerProps<TProps>({
  table: tableSource,
  keyColumn: keyColumnName,
  labelColumn: labelColumnName,
  iconColumn: iconColumnName,
  additionalFilterFactories,
  settings,
  onChange,
  onSelectionChange,
  ...props
}: PickerWithTableProps<TProps>): UsePickerProps<TProps> {
  const { itemHeight } = usePickerItemScale();

  const { getFormattedString: formatValue, timeZone } = useFormatter(settings);

  // `null` is a valid value for `selectedKey` in controlled mode, so we check
  // for explicit `undefined` to identify uncontrolled mode.
  const isUncontrolled = props.selectedKey === undefined;
  const [uncontrolledSelectedKey, setUncontrolledSelectedKey] = useState<
    ItemKey | null | undefined
  >(props.defaultSelectedKey);

  // Copy table so we can apply filters without affecting the original table.
  // (Note that this call is not actually applying any filters. Filter will be
  // applied in `useSearchableViewportData`.)
  const { data: tableCopy } = usePromiseFactory(
    TableUtils.copyTableAndApplyFilters,
    [tableSource, ...(additionalFilterFactories ?? [])]
  );

  useEffect(() => {
    console.log(
      '[TESTING] additionalFilters',
      additionalFilterFactories,
      tableCopy?.columns,
      tableCopy?.size
    );
  }, [additionalFilterFactories, tableCopy]);

  const keyColumn = useMemo(
    () =>
      tableCopy == null ? null : getItemKeyColumn(tableCopy, keyColumnName),
    [keyColumnName, tableCopy]
  );

  const labelColumn = useMemo(
    () =>
      tableCopy == null || keyColumn == null
        ? null
        : getItemLabelColumn(tableCopy, keyColumn, labelColumnName),
    [keyColumn, labelColumnName, tableCopy]
  );

  const searchColumnNames = useMemo(
    () => (labelColumn == null ? [] : [labelColumn.name]),
    [labelColumn]
  );

  const deserializeRow = useItemRowDeserializer({
    table: tableCopy,
    iconColumnName,
    keyColumnName,
    labelColumnName,
    formatValue,
  });

  const getItemIndexByValue = useGetItemIndexByValue({
    table: tableCopy,
    columnName: keyColumn?.name ?? null,
    value: isUncontrolled ? uncontrolledSelectedKey : props.selectedKey,
  });

  const getInitialScrollPosition = useCallback(async () => {
    const index = await getItemIndexByValue();

    if (index == null) {
      return null;
    }

    return index * itemHeight + PICKER_TOP_OFFSET;
  }, [getItemIndexByValue, itemHeight]);

  const { onScroll, onSearchTextChange, setViewport, viewportData } =
    useSearchableViewportData({
      reuseItemsOnTableResize: true,
      table: tableCopy,
      itemHeight,
      deserializeRow,
      searchColumnNames,
      timeZone,
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
    normalizedItems: viewportData.items,
    showItemIcons: iconColumnName != null,
    getInitialScrollPosition,
    onChange: onSelectionChangeInternal,
    onScroll,
    onSearchTextChange,
  };
}

export default usePickerProps;
