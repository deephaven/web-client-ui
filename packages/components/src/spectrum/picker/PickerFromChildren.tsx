import { useCallback, useMemo, useState } from 'react';
import { DOMRef } from '@react-types/shared';
import { Picker as SpectrumPicker } from '@adobe/react-spectrum';

import {
  EMPTY_FUNCTION,
  PICKER_ITEM_HEIGHTS,
  PICKER_TOP_OFFSET,
} from '@deephaven/utils';
import cl from 'classnames';
import {
  NormalizedSpectrumPickerProps,
  normalizeTooltipOptions,
  ItemOrSection,
  TooltipOptions,
  ItemKey,
  getPositionOfSelectedItemElement,
} from '../utils/itemUtils';
import { wrapItemChildren } from '../utils/itemWrapperUtils';
import usePickerScrollOnOpen from './usePickerScrollOnOpen';

export type PickerFromChildrenProps = {
  children: ItemOrSection | ItemOrSection[];
  /** Can be set to true or a TooltipOptions to enable item tooltips */
  tooltip?: boolean | TooltipOptions;
  /** The currently selected key in the collection (controlled). */
  selectedKey?: ItemKey | null;
  /** The initial selected key in the collection (uncontrolled). */
  defaultSelectedKey?: ItemKey;
  /**
   * Handler that is called when the selection change.
   * Note that under the hood, this is just an alias for Spectrum's
   * `onSelectionChange`. We are renaming for better consistency with other
   * components.
   */
  onChange?: (key: ItemKey) => void;

  /** Handler that is called when the picker is scrolled. */
  onScroll?: (event: Event) => void;

  /**
   * Handler that is called when the selection changes.
   * @deprecated Use `onChange` instead
   */
  onSelectionChange?: (key: ItemKey) => void;
} /*
 * Support remaining SpectrumPickerProps.
 * Note that `selectedKey`, `defaultSelectedKey`, and `onSelectionChange` are
 * re-defined above to account for boolean types which aren't included in the
 * React `Key` type, but are actually supported by the Spectrum Picker component.
 */ & Omit<
  NormalizedSpectrumPickerProps,
  | 'children'
  | 'items'
  | 'onSelectionChange'
  | 'selectedKey'
  | 'defaultSelectedKey'
>;

export function PickerFromChildren({
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
}: PickerFromChildrenProps): JSX.Element {
  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip),
    [tooltip]
  );

  const wrappedItems = useMemo(
    () => wrapItemChildren(children, tooltipOptions),
    [children, tooltipOptions]
  );

  const [uncontrolledSelectedKey, setUncontrolledSelectedKey] =
    useState(defaultSelectedKey);

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

  const { ref: scrollRef, onOpenChange: onOpenChangeInternal } =
    usePickerScrollOnOpen({
      getInitialScrollPosition,
      onScroll,
      onOpenChange,
    });

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

  return (
    <SpectrumPicker
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...spectrumPickerProps}
      ref={scrollRef as unknown as DOMRef<HTMLDivElement>}
      onOpenChange={onOpenChangeInternal}
      UNSAFE_className={cl('dh-picker', UNSAFE_className)}
      selectedKey={selectedKey as NormalizedSpectrumPickerProps['selectedKey']}
      defaultSelectedKey={
        defaultSelectedKey as NormalizedSpectrumPickerProps['defaultSelectedKey']
      }
      onSelectionChange={
        onSelectionChangeInternal as NormalizedSpectrumPickerProps['onSelectionChange']
      }
    >
      {wrappedItems}
    </SpectrumPicker>
  );
}

export default PickerFromChildren;
