import { useCallback, useMemo } from 'react';
import { DOMRef } from '@react-types/shared';
import { Picker as SpectrumPicker } from '@adobe/react-spectrum';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import cl from 'classnames';
import {
  isNormalizedSection,
  NormalizedSpectrumPickerProps,
  normalizeTooltipOptions,
  NormalizedItem,
  TooltipOptions,
  ItemKey,
  getItemKey,
  NormalizedSection,
} from '../utils/itemUtils';
import { Section } from '../shared';
import { useRenderNormalizedItem } from '../utils';
import usePickerScrollOnOpen from './usePickerScrollOnOpen';

export type PickerFromItemsProps = {
  children: (normalizedItem: NormalizedItem) => JSX.Element;
  items: (NormalizedItem | NormalizedSection)[];
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

export function PickerFromItems({
  children,
  items,
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
}: PickerFromItemsProps): JSX.Element {
  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip),
    [tooltip]
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
      const selectedItem = items.find(item => String(getItemKey(item)) === key);

      const actualKey = getItemKey(selectedItem) ?? key;

      (onChange ?? onSelectionChange)?.(actualKey);
    },
    [items, onChange, onSelectionChange]
  );

  return (
    <SpectrumPicker
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...spectrumPickerProps}
      ref={scrollRef as unknown as DOMRef<HTMLDivElement>}
      onOpenChange={onOpenChangeInternal}
      UNSAFE_className={cl('dh-picker', UNSAFE_className)}
      items={items}
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

export default PickerFromItems;
