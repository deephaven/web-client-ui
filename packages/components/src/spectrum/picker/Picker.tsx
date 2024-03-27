import { Key, ReactNode, useCallback, useMemo } from 'react';
import { DOMRef } from '@react-types/shared';
import { Flex, Picker as SpectrumPicker, Text } from '@adobe/react-spectrum';
import {
  getPositionOfSelectedItem,
  findSpectrumPickerScrollArea,
  isElementOfType,
  usePopoverOnScrollRef,
} from '@deephaven/react-hooks';
import {
  EMPTY_FUNCTION,
  PICKER_ITEM_HEIGHT,
  PICKER_TOP_OFFSET,
} from '@deephaven/utils';
import cl from 'classnames';
import { Tooltip } from '../../popper';
import {
  isNormalizedPickerSection,
  NormalizedSpectrumPickerProps,
  normalizePickerItemList,
  normalizeTooltipOptions,
  NormalizedPickerItem,
  PickerItemOrSection,
  TooltipOptions,
  PickerItemKey,
  getPickerItemKey,
} from './PickerUtils';
import { PickerItemContent } from './PickerItemContent';
import { Item, Section } from '../shared';

export type PickerProps = {
  children:
    | PickerItemOrSection
    | PickerItemOrSection[]
    | NormalizedPickerItem[];
  /** Can be set to true or a TooltipOptions to enable item tooltips */
  tooltip?: boolean | TooltipOptions;
  /** The currently selected key in the collection (controlled). */
  selectedKey?: PickerItemKey | null;
  /** The initial selected key in the collection (uncontrolled). */
  defaultSelectedKey?: PickerItemKey;
  /** Function to retrieve initial scroll position when opening the picker */
  getInitialScrollPosition?: () => Promise<number | null>;
  /**
   * Handler that is called when the selection change.
   * Note that under the hood, this is just an alias for Spectrum's
   * `onSelectionChange`. We are renaming for better consistency with other
   * components.
   */
  onChange?: (key: PickerItemKey) => void;

  /** Handler that is called when the picker is scrolled. */
  onScroll?: (event: Event) => void;

  /**
   * Handler that is called when the selection changes.
   * @deprecated Use `onChange` instead
   */
  onSelectionChange?: (key: PickerItemKey) => void;
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
 * Create tooltip content optionally wrapping with a Flex column for array
 * content. This is needed for Items containing description `Text` elements.
 */
function createTooltipContent(content: ReactNode) {
  if (typeof content === 'boolean') {
    return String(content);
  }

  if (Array.isArray(content)) {
    return (
      <Flex direction="column" alignItems="start">
        {content.filter(node => isElementOfType(node, Text))}
      </Flex>
    );
  }

  return content;
}

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
    () => normalizePickerItemList(children),
    [children]
  );

  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip),
    [tooltip]
  );

  const renderItem = useCallback(
    (normalizedItem: NormalizedPickerItem) => {
      const key = getPickerItemKey(normalizedItem);
      const content = normalizedItem.item?.content ?? '';
      const textValue = normalizedItem.item?.textValue ?? '';

      return (
        <Item
          // Note that setting the `key` prop explicitly on `Item` elements
          // causes the picker to expect `selectedKey` and `defaultSelectedKey`
          // to be strings. It also passes the stringified value of the key to
          // `onSelectionChange` handlers` regardless of the actual type of the
          // key. We can't really get around setting in order to support Windowed
          // data, so we'll need to do some manual conversion of keys to strings
          // in other places of this component.
          key={key as Key}
          // The `textValue` prop gets used to provide the content of `<option>`
          // elements that back the Spectrum Picker. These are not visible in the UI,
          // but are used for accessibility purposes, so we set to an arbitrary
          // 'Empty' value so that they are not empty strings.
          textValue={textValue === '' ? 'Empty' : textValue}
        >
          <>
            <PickerItemContent>{content}</PickerItemContent>
            {tooltipOptions == null || content === '' ? null : (
              <Tooltip options={tooltipOptions}>
                {createTooltipContent(content)}
              </Tooltip>
            )}
          </>
        </Item>
      );
    },
    [tooltipOptions]
  );

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
    (key: PickerItemKey): void => {
      // The `key` arg will always be a string due to us setting the `Item` key
      // prop in `renderItem`. We need to find the matching item to determine
      // the actual key.
      const selectedItem = normalizedItems.find(
        item => String(getPickerItemKey(item)) === key
      );

      const actualKey = getPickerItemKey(selectedItem) ?? key;

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
      selectedKey={selectedKey?.toString()}
      defaultSelectedKey={defaultSelectedKey?.toString()}
      // `onChange` is just an alias for `onSelectionChange`
      onSelectionChange={
        onSelectionChangeInternal as NormalizedSpectrumPickerProps['onSelectionChange']
      }
    >
      {itemOrSection => {
        if (isNormalizedPickerSection(itemOrSection)) {
          return (
            <Section
              key={getPickerItemKey(itemOrSection)}
              title={itemOrSection.item?.title}
              items={itemOrSection.item?.items}
            >
              {renderItem}
            </Section>
          );
        }

        return renderItem(itemOrSection);
      }}
    </SpectrumPicker>
  );
}

export default Picker;
