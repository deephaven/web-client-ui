import { useCallback, useEffect, useMemo, useState } from 'react';
import { Picker as SpectrumPicker } from '@adobe/react-spectrum';
import type { DOMRef } from '@react-types/shared';
import cl from 'classnames';
import {
  getItemKey,
  isNormalizedSection,
  ItemKey,
  NormalizedItem,
  NormalizedItemData,
  NormalizedSection,
  NormalizedSectionData,
  normalizeTooltipOptions,
  PickerProps as PickerBaseProps,
  Section,
  usePickerScrollOnOpen,
  useRenderNormalizedItem,
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

  // TODO #1890 : descriptionColumn, iconColumn

  settings?: Settings;
}

export function Picker({
  table,
  keyColumn: keyColumnName,
  labelColumn: labelColumnName,
  settings,
  tooltip = true,
  selectedKey,
  defaultSelectedKey,
  UNSAFE_className,
  onChange,
  onOpenChange,
  onSelectionChange,
  ...props
}: PickerProps): JSX.Element {
  const { getFormattedString: formatValue } = useFormatter(settings);

  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip),
    [tooltip]
  );

  const [uncontrolledSelectedKey, setUncontrolledSelectedKey] =
    useState(defaultSelectedKey);

  const keyColumn = useMemo(
    () => getItemKeyColumn(table, keyColumnName),
    [keyColumnName, table]
  );

  const deserializeRow = useItemRowDeserializer({
    table,
    keyColumnName,
    labelColumnName,
    formatValue,
  });

  const getItemIndexByValue = useGetItemIndexByValue({
    table,
    columnName: keyColumn.name,
    value: selectedKey ?? uncontrolledSelectedKey,
  });

  const getInitialScrollPosition = useCallback(async () => {
    const index = await getItemIndexByValue();

    if (index == null) {
      return null;
    }

    return index * PICKER_ITEM_HEIGHTS.noDescription + PICKER_TOP_OFFSET;
  }, [getItemIndexByValue]);

  const { viewportData, onScroll, setViewport } = useViewportData<
    NormalizedItemData | NormalizedSectionData,
    DhType.Table
  >({
    reuseItemsOnTableResize: true,
    table,
    itemHeight: PICKER_ITEM_HEIGHTS.noDescription,
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

  const renderNormalizedItem = useRenderNormalizedItem(tooltipOptions);

  const { ref: scrollRef, onOpenChange: onOpenChangeInternal } =
    usePickerScrollOnOpen({
      getInitialScrollPosition,
      onScroll,
      onOpenChange,
    });

  const onSelectionChangeInternal = useCallback(
    (key: ItemKey): void => {
      // The `key` arg will always be a string due to us setting the `Item` key
      // prop in `renderItem`. We need to find the matching item to determine
      // the actual key.
      const selectedItem = normalizedItems.find(
        item => String(getItemKey(item)) === key
      );

      const actualKey = getItemKey(selectedItem) ?? key;

      // If our component is uncontrolled, track the selected key internally
      // so that we can scroll to the selected item if the user re-opens
      if (selectedKey == null) {
        setUncontrolledSelectedKey(key);
      }

      (onChange ?? onSelectionChange)?.(actualKey);
    },
    [normalizedItems, selectedKey, onChange, onSelectionChange]
  );

  return (
    <SpectrumPicker
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      ref={scrollRef as DOMRef<HTMLDivElement>}
      UNSAFE_className={cl('dh-picker', UNSAFE_className)}
      items={normalizedItems}
      // Spectrum Picker treats keys as strings if the `key` prop is explicitly
      // set on `Item` elements. Since we do this in `renderItem`, we need to
      // ensure that `selectedKey` and `defaultSelectedKey` are strings in order
      // for selection to work.
      selectedKey={selectedKey == null ? selectedKey : selectedKey.toString()}
      defaultSelectedKey={
        defaultSelectedKey == null
          ? defaultSelectedKey
          : defaultSelectedKey.toString()
      }
      onSelectionChange={
        onSelectionChangeInternal // as NormalizedSpectrumPickerProps['onSelectionChange']
      }
      onOpenChange={onOpenChangeInternal}
    >
      {itemOrSection => {
        if (isNormalizedSection(itemOrSection)) {
          return (
            <Section
              key={getItemKey(itemOrSection)}
              title={itemOrSection.item?.title}
              items={itemOrSection.item?.items}
            >
              {renderNormalizedItem}
            </Section>
          );
        }

        return renderNormalizedItem(itemOrSection);
      }}
    </SpectrumPicker>
  );
}

export default Picker;
