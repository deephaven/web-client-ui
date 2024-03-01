import { isValidElement, Key, ReactElement, ReactNode } from 'react';
import { SpectrumPickerProps } from '@adobe/react-spectrum';
import type { ItemRenderer } from '@react-types/shared';
import Log from '@deephaven/log';
import { Item, ItemProps } from '../Item';
import { Section, SectionProps } from '../Section';
import { PopperOptions } from '../../popper';

const log = Log.module('PickerUtils');

export const INVALID_PICKER_ITEM_ERROR_MESSAGE =
  'Picker items must be strings, numbers, booleans, <Item> or <Section> elements:';

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
  title?: ReactNode;
  items: NormalizedPickerItem[];
}

export type NormalizedSpectrumPickerProps =
  SpectrumPickerProps<NormalizedPickerItem>;

export type TooltipOptions = { placement: PopperOptions['placement'] };

/**
 * Determine if a node is a Section element.
 * @param node The node to check
 * @returns True if the node is a Section element
 */
export function isSectionElement<T>(
  node: ReactNode
): node is ReactElement<SectionProps<T>> {
  return isValidElement<SectionProps<T>>(node) && node.type === Section;
}

/**
 * Determine if a node is an Item element.
 * @param node The node to check
 * @returns True if the node is an Item element
 */
export function isItemElement<T>(
  node: ReactNode
): node is ReactElement<ItemProps<T>> {
  return isValidElement<ItemProps<T>>(node) && node.type === Item;
}

/**
 * Determine if a node is a Picker item or section. Valid types include strings,
 * numbers, booleans, Item elements, and Section elements.
 * @param node The node to check
 * @returns True if the node is a Picker item or section
 */
export function isPickerItemOrSection(
  node: ReactNode
): node is PickerItemOrSection {
  return (
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean' ||
    isItemElement(node) ||
    isSectionElement(node)
  );
}

/**
 * Determine the `key` of a picker item or section.
 * @param itemOrSection The picker item or section
 * @returns A `PickerItemKey` for the picker item
 */
function normalizeItemKey(item: PickerItem): PickerItemKey;
function normalizeItemKey(section: PickerSection): Key;
function normalizeItemKey(
  itemOrSection: PickerItem | PickerSection
): Key | PickerItemKey {
  // string, number, or boolean
  if (typeof itemOrSection !== 'object') {
    return itemOrSection;
  }

  // If `key` prop is explicitly set
  if (itemOrSection.key != null) {
    return itemOrSection.key;
  }

  // Section element
  if (isSectionElement(itemOrSection)) {
    return typeof itemOrSection.props.title === 'string'
      ? itemOrSection.props.title
      : '';
  }

  // Item element
  return (
    itemOrSection.props.textValue ??
    (typeof itemOrSection.props.children === 'string'
      ? itemOrSection.props.children
      : '')
  );
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
 * @param itemOrSection item to normalize
 * @returns NormalizedPickerItem object
 */
function normalizePickerItem(
  itemOrSection: PickerItemOrSection
): NormalizedPickerItem | NormalizedPickerSection {
  if (!isPickerItemOrSection(itemOrSection)) {
    log.debug(INVALID_PICKER_ITEM_ERROR_MESSAGE, itemOrSection);
    throw new Error(INVALID_PICKER_ITEM_ERROR_MESSAGE);
  }

  if (isSectionElement(itemOrSection)) {
    const key = normalizeItemKey(itemOrSection);
    const { title } = itemOrSection.props;

    const items = normalizePickerItemList(itemOrSection.props.children).filter(
      // We don't support nested section elements
      childItem => !isSectionElement(childItem)
    ) as NormalizedPickerItem[];

    return {
      key,
      title,
      items,
    };
  }

  const key = normalizeItemKey(itemOrSection);
  const content =
    typeof itemOrSection === 'object'
      ? itemOrSection.props.children
      : String(itemOrSection);
  const textValue = normalizeTextValue(itemOrSection);

  return {
    key,
    content,
    textValue,
  };
}

/**
 * Get normalized picker items from a picker item or array of picker items.
 * @param itemsOrSections A picker item or array of picker items
 * @returns An array of normalized picker items
 */
export function normalizePickerItemList(
  itemsOrSections: PickerItemOrSection | PickerItemOrSection[]
): (NormalizedPickerItem | NormalizedPickerSection)[] {
  const itemsArray = Array.isArray(itemsOrSections)
    ? itemsOrSections
    : [itemsOrSections];
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
