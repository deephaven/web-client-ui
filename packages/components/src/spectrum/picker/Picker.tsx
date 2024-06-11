import { useMemo } from 'react';
import type { DOMRef } from '@react-types/shared';
import { Picker as SpectrumPicker } from '@adobe/react-spectrum';
import cl from 'classnames';
import {
  EMPTY_FUNCTION,
  ensureArray,
  PICKER_TOP_OFFSET,
} from '@deephaven/utils';
import {
  NormalizedSpectrumPickerProps,
  ItemOrSection,
  ItemKey,
  normalizeTooltipOptions,
  TooltipOptions,
} from '../utils/itemUtils';
import { wrapItemChildren } from '../utils/itemWrapperUtils';
import usePickerScrollOnOpen from './usePickerScrollOnOpen';
import {
  useOnChangeTrackUncontrolled,
  useStaticItemInitialScrollPosition,
} from '../utils';
import usePickerItemScale from './usePickerItemScale';

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
  // These props are all re-defined above
  | 'children'
  | 'onSelectionChange'
  | 'selectedKey'
  | 'defaultSelectedKey'
  // Excluding `items` since we are not currently supporting a render function
  // as `children`. This simplifies the API for determining initial scroll
  // position and wrapping items with tooltips.
  | 'items'
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
  const { itemHeight } = usePickerItemScale();

  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip),
    [tooltip]
  );

  const wrappedItems = useMemo(
    () => ensureArray(wrapItemChildren(children, tooltipOptions)),
    [children, tooltipOptions]
  );

  const { selectedKeyMaybeUncontrolled, onChangeMaybeUncontrolled } =
    useOnChangeTrackUncontrolled({
      defaultSelectedKey,
      selectedKey,
      onChange: onChange ?? onSelectionChange,
    });

  const getInitialScrollPosition = useStaticItemInitialScrollPosition({
    itemHeight,
    items: wrappedItems,
    selectedKey: selectedKeyMaybeUncontrolled,
    topOffset: PICKER_TOP_OFFSET,
  });

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
      onSelectionChange={onChangeMaybeUncontrolled}
      onOpenChange={onOpenChangeInternal}
    >
      {wrappedItems}
    </SpectrumPicker>
  );
}

export default Picker;
