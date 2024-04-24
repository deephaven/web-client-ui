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
  TooltipOptions,
  isItemElementWithDescription,
  isSectionElement,
} from '../utils/itemUtils';
import { wrapItemChildren } from '../utils/itemWrapperUtils';
import usePickerScrollOnOpen from './usePickerScrollOnOpen';
import { useSpectrumThemeProvider } from '../../theme';

export type PickerProps = {
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

/**
 * Picker component for selecting items from a list of items. Items can be
 * provided via the `children` prop. Each item can be a string,	number, boolean,
 * or a Spectrum <Item> element. The remaining props are just	pass through props
 * for the Spectrum Picker component.
 * See https://react-spectrum.adobe.com/react-spectrum/Picker.html
 */
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
  const { scale } = useSpectrumThemeProvider();
  const itemHeight = PICKER_ITEM_HEIGHTS[scale];

  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip),
    [tooltip]
  );

  // `null` is a valid value for `selectedKey` in controlled mode, so we check
  // for explicit `undefined` to identify uncontrolled mode.
  const isUncontrolled = selectedKey === undefined;
  const [uncontrolledSelectedKey, setUncontrolledSelectedKey] =
    useState(defaultSelectedKey);

  const wrappedItems = useMemo(
    () => wrapItemChildren(children, tooltipOptions),
    [children, tooltipOptions]
  );

  // Item descriptions and Section elements introduce variable item heights.
  // This throws off scroll position calculations, so we disable auto scrolling
  // if either of these are found.
  const disableScrollOnOpen = useMemo(
    () =>
      wrappedItems.some(
        item => isSectionElement(item) || isItemElementWithDescription(item)
      ),
    [wrappedItems]
  );

  const getInitialScrollPosition = useCallback(
    async () =>
      disableScrollOnOpen
        ? null
        : getPositionOfSelectedItemElement({
            items: wrappedItems,
            itemHeight,
            selectedKey: isUncontrolled ? uncontrolledSelectedKey : selectedKey,
            topOffset: PICKER_TOP_OFFSET,
          }),
    [
      disableScrollOnOpen,
      isUncontrolled,
      itemHeight,
      selectedKey,
      uncontrolledSelectedKey,
      wrappedItems,
    ]
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
