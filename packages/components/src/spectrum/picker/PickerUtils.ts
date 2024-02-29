import { isValidElement, Key, ReactElement, ReactNode } from 'react';
import { Item, Section, SpectrumPickerProps } from '@adobe/react-spectrum';
import type {
  ItemProps,
  ItemRenderer,
  SectionProps,
} from '@react-types/shared';
import { PopperOptions } from '../../popper';

export type SectionPropsNoItemRenderer<T> = Omit<
  SectionProps<T>,
  'children'
> & {
  children: Exclude<SectionProps<T>['children'], ItemRenderer<T>>;
};

export type ItemElement = ReactElement<ItemProps<unknown>>;
export type SectionElement = ReactElement<SectionPropsNoItemRenderer<unknown>>;
export type PickerItem = number | string | boolean | ItemElement;
export type PickerSection = SectionElement;
export type PickerItemOrSection = PickerItem | PickerSection;

/**
 * Augment the Spectrum selection key type to include boolean values.
 * The Spectrum Picker already supports this, but the built in types don't
 * reflect it.
 */
export type PickerItemKey = Key | boolean;

/**
 * Augment the Spectrum selection change handler type to include boolean keys.
 * The Spectrum Picker already supports this, but the built in types don't
 * reflect it.
 */
export type PickerSelectionChangeHandler = (key: PickerItemKey) => void;

/**
 * The Picker supports a variety of item types, including strings, numbers,
 * booleans, and more complex React elements. This type represents a normalized
 * form to make rendering items simpler and keep the logic of transformation
 * in separate util methods.
 */
export interface NormalizedPickerItem {
  key: PickerItemKey;
  content: ReactNode;
  textValue: string;
}

export interface NormalizedPickerSection {
  key: Key;
  title: ReactNode;
  items: NormalizedPickerItem[];
}

export type NormalizedSpectrumPickerProps =
  SpectrumPickerProps<NormalizedPickerItem>;

export type TooltipOptions = { placement: PopperOptions['placement'] };

export function isSectionElement<T>(
  node: ReactNode
): node is ReactElement<SectionProps<T>> {
  return isValidElement<SectionProps<T>>(node) && node.type === Section;
}

export function isItemElement<T>(
  node: ReactNode
): node is ReactElement<ItemProps<T>> {
  return isValidElement<ItemProps<T>>(node) && node.type === Item;
}

/**
 * Determine the `key` of a picker item.
 * @param item The picker item or section
 * @returns A `PickerItemKey` for the picker item
 */
function normalizeItemKey(item: PickerItem): PickerItemKey;
function normalizeItemKey(item: PickerSection): Key;
function normalizeItemKey(
  item: PickerItem | PickerSection
): Key | PickerItemKey {
  // string, number, or boolean
  if (typeof item !== 'object') {
    return item as PickerItemKey;
  }

  // If `key` prop is explicitly set
  if (item.key != null) {
    return item.key;
  }

  if (isSectionElement(item)) {
    if (typeof item.props.title === 'string') {
      return item.props.title;
    }
  } else if (isItemElement(item)) {
    if (item.props.textValue != null) {
      return item.props.textValue;
    }
  }

  if (typeof item.props.children === 'string') {
    return item.props.children;
  }

  return '';
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
function normalizePickerItem(
  item: PickerItemOrSection
): NormalizedPickerItem | NormalizedPickerSection {
  if (isSectionElement(item)) {
    const key = normalizeItemKey(item);
    const { title } = item.props;

    const items = normalizePickerItemList(item.props.children).filter(
      // We don't support nested section elements
      childItem => !isSectionElement(childItem)
    ) as NormalizedPickerItem[];

    return {
      key,
      title,
      items,
    };
  }

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
  items: PickerItemOrSection | PickerItemOrSection[]
): (NormalizedPickerItem | NormalizedPickerSection)[] {
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
