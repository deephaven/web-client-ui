import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type ItemSelection,
  type NormalizedItem,
  type NormalizedItemData,
  type NormalizedSection,
  usePickerItemScale,
} from '@deephaven/components';
import { createKeyedItemKey, TableUtils } from '@deephaven/jsapi-utils';
import { useApi } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
import { usePromiseFactory } from '@deephaven/react-hooks';
import { type KeyedItem } from '@deephaven/utils';
import useFormatter from '../../useFormatter';
import useTableUtils from '../../useTableUtils';
import type { MultiPickerWithTableProps } from '../MultiPickerProps';
import { getItemKeyColumn, getItemLabelColumn } from './itemUtils';
import { useItemRowDeserializer } from './useItemRowDeserializer';
import useSearchableViewportData from '../../useSearchableViewportData';
import useWidgetClose from '../../useWidgetClose';

const log = Log.module('jsapi-components.useMultiPickerProps');

/** Props that are derived by `useMultiPickerProps`. */
export type UseMultiPickerDerivedProps = {
  normalizedItems: (NormalizedItem | NormalizedSection)[];
  showItemIcons: boolean;
  selectedItemLabels: Map<string, string>;
  onChange: (keys: ItemSelection) => void;
  onScroll: (event: Event) => void;
  onSearchTextChange: (searchText: string) => void;
};

/**
 * Props that are passed through untouched. (should exclude all of the
 * destructured props passed into `useMultiPickerProps` that are not in the
 * spread ...props)
 */
export type UseMultiPickerPassthroughProps = Omit<
  MultiPickerWithTableProps,
  | 'table'
  | 'keyColumn'
  | 'labelColumn'
  | 'iconColumn'
  | 'settings'
  | 'onChange'
  | 'onSelectionChange'
>;

/** Props returned by `useMultiPickerProps` hook. */
export type UseMultiPickerProps = UseMultiPickerDerivedProps &
  UseMultiPickerPassthroughProps;

export function useMultiPickerProps({
  table: tableSource,
  keyColumn: keyColumnName,
  labelColumn: labelColumnName,
  iconColumn: iconColumnName,
  settings,
  onChange,
  onSelectionChange,
  ...props
}: MultiPickerWithTableProps): UseMultiPickerProps {
  const { itemHeight } = usePickerItemScale();

  const { getFormattedString: formatValue, timeZone } = useFormatter(settings);

  // Copy table so we can apply filters without affecting the original table.
  const { data: tableCopy } = usePromiseFactory(
    TableUtils.copyTableAndApplyFilters,
    [tableSource]
  );

  useWidgetClose(tableCopy);

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

  const { onScroll, onSearchTextChange, viewportData } =
    useSearchableViewportData({
      reuseItemsOnTableResize: true,
      table: tableCopy,
      itemHeight,
      deserializeRow,
      searchColumnNames,
      timeZone,
    });

  const dh = useApi();
  const tableUtils = useTableUtils();

  // When selected keys point to rows outside the initial viewport, we take a table snapshot of
  // just those rows to load their real label data. This avoids moving the viewport and ensures all
  // selected items display correct labels.
  const selectedKeysForSnapshot =
    props.selectedKeys ?? props.defaultSelectedKeys;
  const hasLoadedSnapshotRef = useRef(false);
  const [snapshotItemsByIndex, setSnapshotItemsByIndex] = useState<
    Map<number, KeyedItem<NormalizedItemData>>
  >(new Map());

  // Reset when table changes so we re-snapshot.
  useEffect(() => {
    hasLoadedSnapshotRef.current = false;
    setSnapshotItemsByIndex(new Map());
  }, [tableCopy]);

  useEffect(
    function snapshotSelectedKeyLabels() {
      if (
        hasLoadedSnapshotRef.current ||
        tableCopy == null ||
        keyColumn == null ||
        selectedKeysForSnapshot == null ||
        selectedKeysForSnapshot === 'all'
      ) {
        return;
      }

      let isCanceled = false;
      hasLoadedSnapshotRef.current = true;

      const column = tableCopy.findColumn(keyColumn.name);
      const columnValueType = tableUtils.getValueType(column.type);

      (async () => {
        try {
          // Seek row indices for all selected keys
          const rowIndices: number[] = [];
          await Promise.all(
            [...selectedKeysForSnapshot].map(async key => {
              if (isCanceled) {
                return;
              }
              const index = await tableCopy.seekRow(
                0,
                column,
                columnValueType,
                key
              );
              if (index !== -1) {
                rowIndices.push(index);
              }
            })
          );

          rowIndices.sort((a, b) => a - b);

          if (isCanceled || rowIndices.length === 0) {
            return;
          }

          // Take a snapshot of just those rows
          const rangeSet = dh.RangeSet.ofItems(rowIndices);
          const tableData = await tableCopy.createSnapshot({
            rows: rangeSet,
            columns: tableCopy.columns,
          });

          if (isCanceled) {
            return;
          }

          const itemMap = new Map<number, KeyedItem<NormalizedItemData>>();
          tableData.rows.forEach((row, i) => {
            const rowIndex = rowIndices[i];
            const item = deserializeRow(row);
            itemMap.set(rowIndex, {
              key: createKeyedItemKey(rowIndex),
              item,
            });
          });

          if (!isCanceled) {
            setSnapshotItemsByIndex(itemMap);
          }
        } catch (err) {
          log.error('Error loading labels for selected keys', err);
        }
      })();

      return () => {
        isCanceled = true;
      };
    },
    [
      selectedKeysForSnapshot,
      tableCopy,
      keyColumn,
      tableUtils,
      dh,
      deserializeRow,
    ]
  );

  // Label cache for every selected item resolved (from viewport or snapshot). This ensures that
  // when search filtering narrows the table, tags for selected items that are no longer in the
  // filtered results still display their correct labels.
  // NOTE: This is passed using a separate `selectedItemLabels` prop so it only affects tag
  // rendering.
  const labelCacheRef = useRef<Map<string, string>>(new Map());
  const [selectedItemLabels, setSelectedItemLabels] = useState<
    Map<string, string>
  >(new Map());

  // Merge snapshot data into viewport items (needed for initial load of labels, otherwise they
  // display key values).
  const normalizedItems = useMemo(() => {
    if (snapshotItemsByIndex.size === 0) {
      return viewportData.items;
    }

    return viewportData.items.map((item, index) => {
      if (item.item == null) {
        const snapshotItem = snapshotItemsByIndex.get(index);
        if (snapshotItem != null) {
          return snapshotItem;
        }
      }
      return item;
    });
  }, [viewportData.items, snapshotItemsByIndex]);

  // Update the label cache whenever normalizedItems or selected keys change.
  useEffect(
    function updateLabelCache() {
      const currentSelectedKeys =
        props.selectedKeys ?? props.defaultSelectedKeys;

      let selectedKeySet: Set<string> | null;
      if (currentSelectedKeys instanceof Array) {
        selectedKeySet = new Set(currentSelectedKeys.map(String));
      } else if (currentSelectedKeys === 'all') {
        selectedKeySet = null;
      } else {
        selectedKeySet = new Set<string>();
      }

      let cacheUpdated = false;

      // Cache labels from all resolved items that are currently selected. The normalizedItems
      // merge already includes snapshot data, so this single pass should cover both viewport
      // and snapshot sources.
      normalizedItems.forEach(item => {
        if (item.item != null) {
          const key = String(item.item.key);
          const label = item.item.textValue;
          if (
            label != null &&
            (selectedKeySet == null || selectedKeySet.has(key)) &&
            labelCacheRef.current.get(key) !== label
          ) {
            labelCacheRef.current.set(key, label);
            cacheUpdated = true;
          }
        }
      });

      if (cacheUpdated) {
        setSelectedItemLabels(new Map(labelCacheRef.current));
      }
    },
    [normalizedItems, props.selectedKeys, props.defaultSelectedKeys]
  );

  const onSelectionChangeInternal = useCallback(
    (keys: ItemSelection): void => {
      (onChange ?? onSelectionChange)?.(keys);
    },
    [onChange, onSelectionChange]
  );

  return {
    ...props,
    normalizedItems,
    selectedItemLabels,
    showItemIcons: iconColumnName != null,
    onChange: onSelectionChangeInternal,
    onScroll,
    onSearchTextChange,
  };
}

export default useMultiPickerProps;
