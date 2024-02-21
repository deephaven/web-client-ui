import { Key, ReactElement, ReactNode } from 'react';
import type { ItemProps } from '@react-types/shared';
import { PopperOptions } from '../popper';

export type ItemElement = ReactElement<ItemProps<unknown>>;
export type PickerItem = number | string | ItemElement;

/**
 * Picker items can be provided via the items prop or as children. This type
 * enforces mutual exclusivity between the two.
 */
export type PickerChildrenOrItemsProps =
  | {
      /** Items provided via the items prop can be primitives or Item elements */
      items: PickerItem[];

      // This is just here to keep items and children mutually exclusive
      children?: undefined;
    }
  | {
      /** Items provided via children prop have to be Item elements */
      children: PickerItem | PickerItem[];

      // This is just here to keep items and children mutually exclusive
      items?: undefined;
    };

export interface NormalizedPickerItem {
  key: Key;
  display: ReactNode;
  textValue: string;
}

export type TooltipOptions = { placement: PopperOptions['placement'] };

/**
 * Determine the `key` of a picker item.
 * @param item The picker item
 * @returns A `Key` for the picker item
 */
function normalizeItemKey(item: PickerItem): Key {
  if (typeof item !== 'object') {
    return String(item);
  }

  if (item.key != null) {
    return item.key;
  }

  if (typeof item.props.children === 'string') {
    return item.props.children;
  }

  return item.props.textValue ?? '';
}

/**
 * Get a normalized `textValue` for a picker item ensuring it is a string.
 * @param item The picker item
 * @returns A string `textValue` for the picker item
 */
function normalizeTextValue(item: PickerItem): string {
  if (typeof item !== 'object') {
    return String(item);
  }

  if (item.props.textValue != null) {
    return item.props.textValue;
  }

  if (typeof item.props.children === 'string') {
    return item.props.children;
  }

  return '';
}

/**
 * Normalize a picker item to an object form.
 * @param item item to normalize
 * @returns NormalizedPickerItem object
 */
function normalizePickerItem(item: PickerItem): NormalizedPickerItem {
  const key = normalizeItemKey(item);
  const display = typeof item === 'object' ? item.props.children : String(item);
  const textValue = normalizeTextValue(item);

  return {
    key,
    display,
    textValue,
  };
}

/**
 * Get normalized picker items from either the `items` or `children` prop.
 * @param props
 * @returns An array of picker items
 */
export function getNormalizedPickerItemsFromProps({
  children,
  items,
}: PickerChildrenOrItemsProps): NormalizedPickerItem[] {
  let itemsInternal: PickerItem[];

  if (items != null) {
    itemsInternal = items;
  } else if (Array.isArray(children)) {
    itemsInternal = children;
  } else {
    itemsInternal = [children];
  }

  return itemsInternal.map(normalizePickerItem);
}

/**
 * Returns a TooltipOptions object or null if options is false or null.
 * @param options
 * @returns TooltipOptions or null
 */
export function normalizeToolTipOptions(
  options?: boolean | TooltipOptions | null
): PopperOptions | null {
  if (options == null || options === false) {
    return null;
  }

  if (options === true) {
    return { placement: 'top-start' };
  }

  return options;
}
