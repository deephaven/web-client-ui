import { useCallback, useMemo } from 'react';
import { DOMRef } from '@react-types/shared';
import { Picker as SpectrumPicker } from '@adobe/react-spectrum';
import {
  getPositionOfSelectedItem,
  findSpectrumPickerScrollArea,
  usePopoverOnScrollRef,
} from '@deephaven/react-hooks';
import {
  EMPTY_FUNCTION,
  PICKER_ITEM_HEIGHT,
  PICKER_TOP_OFFSET,
} from '@deephaven/utils';
import cl from 'classnames';
import {
  isNormalizedSection,
  NormalizedSpectrumPickerProps,
  normalizeItemList,
  normalizeTooltipOptions,
  NormalizedItem,
  ItemOrSection,
  TooltipOptions,
  ItemKey,
  getItemKey,
} from '../utils/itemUtils';
import { Section } from '../shared';
import { useRenderNormalizedItem } from '../utils';

export type PickerProps = {
  children: ItemOrSection | ItemOrSection[] | NormalizedItem[];
  /** Can be set to true or a TooltipOptions to enable item tooltips */
  tooltip?: boolean | TooltipOptions;
  /** The currently selected key in the collection (controlled). */
  selectedKey?: ItemKey | null;
  /** The initial selected key in the collection (uncontrolled). */
  defaultSelectedKey?: ItemKey;
  /** Function to retrieve initial scroll position when opening the picker */
  getInitialScrollPosition?: () => Promise<number | null>;
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
 * provided via the `items` prop or as children. Each item can be a string,
 * number, boolean, or a Spectrum <Item> element. The remaining props are just
 * pass through props for the Spectrum Picker component.
 * See https://react-spectrum.adobe.com/react-spectrum/Picker.html
 */
export function Picker({
  children,
  tooltip = true,
  defaultSelectedKey,
  selectedKey,
  getInitialScrollPosition,
  onChange,
  onOpenChange,
  onScroll = EMPTY_FUNCTION,
  onSelectionChange,
  // eslint-disable-next-line camelcase
  UNSAFE_className,
  ...spectrumPickerProps
}: PickerProps): JSX.Element {
  const normalizedItems = useMemo(
    () => normalizeItemList(children),
    [children]
  );

  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip),
    [tooltip]
  );

  const renderNormalizedItem = useRenderNormalizedItem(tooltipOptions);

  const getInitialScrollPositionInternal = useCallback(
    () =>
      getInitialScrollPosition == null
        ? getPositionOfSelectedItem({
            keyedItems: normalizedItems,
            // TODO: #1890 & deephaven-plugins#371 add support for sections and
            // items with descriptions since they impact the height calculations
            itemHeight: PICKER_ITEM_HEIGHT,
            selectedKey,
            topOffset: PICKER_TOP_OFFSET,
          })
        : getInitialScrollPosition(),
    [getInitialScrollPosition, normalizedItems, selectedKey]
  );

  const { ref: scrollRef, onOpenChange: popoverOnOpenChange } =
    usePopoverOnScrollRef(
      findSpectrumPickerScrollArea,
      onScroll,
      getInitialScrollPositionInternal
    );

  const onOpenChangeInternal = useCallback(
    (isOpen: boolean): void => {
      // Attach scroll event handling
      popoverOnOpenChange(isOpen);

      onOpenChange?.(isOpen);
    },
    [onOpenChange, popoverOnOpenChange]
  );

  const onSelectionChangeInternal = useCallback(
    (key: ItemKey): void => {
      // The `key` arg will always be a string due to us setting the `Item` key
      // prop in `renderItem`. We need to find the matching item to determine
      // the actual key.
      const selectedItem = normalizedItems.find(
        item => String(getItemKey(item)) === key
      );

      const actualKey = getItemKey(selectedItem) ?? key;

      (onChange ?? onSelectionChange)?.(actualKey);
    },
    [normalizedItems, onChange, onSelectionChange]
  );

  return (
    <SpectrumPicker
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...spectrumPickerProps}
      // The `ref` prop type defined by React Spectrum is incorrect here
      ref={scrollRef as unknown as DOMRef<HTMLDivElement>}
      onOpenChange={onOpenChangeInternal}
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
      // `onChange` is just an alias for `onSelectionChange`
      onSelectionChange={
        onSelectionChangeInternal as NormalizedSpectrumPickerProps['onSelectionChange']
      }
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
