import { Key, ReactNode, useCallback, useMemo } from 'react';
import { DOMRef } from '@react-types/shared';
import { Flex, Picker as SpectrumPicker, Text } from '@adobe/react-spectrum';
import {
  findSpectrumPickerScrollArea,
  isElementOfType,
  usePopoverOnScrollRef,
} from '@deephaven/react-hooks';
import cl from 'classnames';
import { Tooltip } from '../../popper';
import {
  NormalizedSpectrumPickerProps,
  normalizePickerItemList,
  normalizeTooltipOptions,
  PickerItemOrSection,
  PickerItemKey,
  TooltipOptions,
  NormalizedPickerItem,
  isNormalizedPickerSection,
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
  /**
   * Handler that is called when the selection change.
   * Note that under the hood, this is just an alias for Spectrum's
   * `onSelectionChange`. We are renaming for better consistency with other
   * components.
   */
  onChange?: (key: PickerItemKey) => void;

  /** Handler that is called when the popover is scrolled. */
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

function noOp(): void {
  // No-op
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
  onChange,
  onOpenChange,
  onScroll = noOp,
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
      // In Windowed data scenarios, the `item` is loaded asynchronously.
      // Fallback to the top-level `key` if the `item` is not yet available.
      const key = normalizedItem.item?.key ?? normalizedItem.key;
      const { item } = normalizedItem;
      const content = item?.content ?? '';
      const textValue = item?.textValue ?? '';

      return (
        // The `textValue` prop gets used to provide the content of `<option>`
        // elements that back the Spectrum Picker. These are not visible in the UI,
        // but are used for accessibility purposes, so we set to an arbitrary
        // 'Empty' value so that they are not empty strings.
        <Item
          key={key as Key}
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

  const { ref: scrollRef, onOpenChange: popoverOnOpenChange } =
    usePopoverOnScrollRef(findSpectrumPickerScrollArea, onScroll);

  const onOpenChangeInternal = useCallback(
    (isOpen: boolean): void => {
      // Attach scroll event handling
      popoverOnOpenChange(isOpen);

      onOpenChange?.(isOpen);
    },
    [onOpenChange, popoverOnOpenChange]
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
      // Type assertions are necessary for `selectedKey`, `defaultSelectedKey`,
      // and `onSelectionChange` due to Spectrum types not accounting for
      // `boolean` keys
      selectedKey={selectedKey as NormalizedSpectrumPickerProps['selectedKey']}
      defaultSelectedKey={
        defaultSelectedKey as NormalizedSpectrumPickerProps['defaultSelectedKey']
      }
      // `onChange` is just an alias for `onSelectionChange`
      onSelectionChange={
        (onChange ??
          onSelectionChange) as NormalizedSpectrumPickerProps['onSelectionChange']
      }
    >
      {itemOrSection => {
        if (isNormalizedPickerSection(itemOrSection)) {
          return (
            <Section
              // In Windowed data scenarios, the `item` is loaded asynchronously
              // Fallback to the top-level `key` if the `item` is not yet available
              key={itemOrSection.item?.key ?? itemOrSection.key}
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
