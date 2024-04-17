import { useCallback, useMemo, useState } from 'react';
import type { DOMRef } from '@react-types/shared';
import { Picker as SpectrumPicker } from '@adobe/react-spectrum';
import cl from 'classnames';
import {
  EMPTY_FUNCTION,
  PICKER_ITEM_HEIGHTS,
  PICKER_TOP_OFFSET,
} from '@deephaven/utils';
import {
  NormalizedSpectrumPickerProps,
  ItemOrSection,
  getPositionOfSelectedItemElement,
  ItemKey,
  normalizeTooltipOptions,
} from '../utils/itemUtils';
import { wrapItemChildren } from '../utils/itemWrapperUtils';
import { PickerCommonProps } from './PickerModel';
import usePickerScrollOnOpen from './usePickerScrollOnOpen';

export interface PickerProps extends PickerCommonProps {
  children: ItemOrSection | ItemOrSection[];
}

export function Picker({
  children,
  tooltip = true,
  defaultSelectedKey,
  selectedKey,
  onChange,
  onOpenChange,
  onScroll = EMPTY_FUNCTION,
  onSelectionChange,
  // eslint-disable-next-line camelcase
  UNSAFE_className,
  ...spectrumPickerProps
}: PickerProps): JSX.Element {
  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip),
    [tooltip]
  );

  const [uncontrolledSelectedKey, setUncontrolledSelectedKey] =
    useState(defaultSelectedKey);

  const wrappedItems = useMemo(
    () => wrapItemChildren(children, tooltipOptions),
    [children, tooltipOptions]
  );

  const getInitialScrollPosition = useCallback(
    async () =>
      getPositionOfSelectedItemElement({
        children: wrappedItems,
        itemHeight: PICKER_ITEM_HEIGHTS.noDescription,
        itemHeightWithDescription: PICKER_ITEM_HEIGHTS.withDescription,
        selectedKey: selectedKey ?? uncontrolledSelectedKey,
        topOffset: PICKER_TOP_OFFSET,
      }),
    [selectedKey, uncontrolledSelectedKey, wrappedItems]
  );

  const onSelectionChangeInternal = useCallback(
    (key: ItemKey): void => {
      // If our component is uncontrolled, track the selected key internally
      if (selectedKey == null) {
        setUncontrolledSelectedKey(key);
      }

      (onChange ?? onSelectionChange)?.(key);
    },
    [onChange, onSelectionChange, selectedKey]
  );

  const { ref: scrollRef, onOpenChange: onOpenChangeInternal } =
    usePickerScrollOnOpen({
      getInitialScrollPosition,
      onScroll,
      onOpenChange,
    });

  return (
    <SpectrumPicker
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...spectrumPickerProps}
      ref={scrollRef as DOMRef<HTMLDivElement>}
      UNSAFE_className={cl('dh-picker', UNSAFE_className)}
      selectedKey={selectedKey as NormalizedSpectrumPickerProps['selectedKey']}
      defaultSelectedKey={
        defaultSelectedKey as NormalizedSpectrumPickerProps['defaultSelectedKey']
      }
      onSelectionChange={onSelectionChangeInternal}
      onOpenChange={onOpenChangeInternal}
    >
      {wrappedItems}
    </SpectrumPicker>
  );
}

export default Picker;
