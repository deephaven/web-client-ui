import { Key, ReactElement, ReactNode } from 'react';
import type { SpectrumPickerProps } from '@adobe/react-spectrum';
import type { ItemProps } from '@react-types/shared';
import { PopperOptions } from '../../popper';

export type ItemElement = ReactElement<ItemProps<unknown>>;
export type PickerItem = number | string | boolean | ItemElement;
export type PickerItemKey = Key | boolean;
export type PickerSelectionChangeHandler = (key: PickerItemKey) => void;

export interface NormalizedPickerItem {
  key: PickerItemKey;
  content: ReactNode;
  textValue: string;
}

export type NormalizedSpectrumPickerProps =
  SpectrumPickerProps<NormalizedPickerItem>;

export type TooltipOptions = { placement: PopperOptions['placement'] };

/**
 * Determine the `key` of a picker item.
 * @param item The picker item
 * @returns A `PickerItemKey` for the picker item
 */
function normalizeItemKey(item: PickerItem): PickerItemKey {
  if (typeof item !== 'object') {
    return item;
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
  const content = typeof item === 'object' ? item.props.children : String(item);
  const textValue = normalizeTextValue(item);

  return {
    key,
    content,
    textValue,
  };
}

/**
 * Get normalized picker items from a picker item or array of picker items.
 * @param items A picker item or array of picker items
 * @returns An array of normalized picker items
 */
export function normalizePickerItemList(
  items: PickerItem | PickerItem[]
): NormalizedPickerItem[] {
  const itemsArray = Array.isArray(items) ? items : [items];
  return itemsArray.map(normalizePickerItem);
}

/**
 * Returns a TooltipOptions object or null if options is false or null.
 * @param options
 * @returns TooltipOptions or null
 */
export function normalizeTooltipOptions(
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
