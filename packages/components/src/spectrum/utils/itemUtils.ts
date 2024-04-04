import { isValidElement, Key, ReactElement, ReactNode } from 'react';
import { SpectrumPickerProps } from '@adobe/react-spectrum';
import type { ItemRenderer } from '@react-types/shared';
import Log from '@deephaven/log';
import { KeyedItem } from '@deephaven/utils';
import { Item, ItemProps, Section, SectionProps } from '../shared';
import { PopperOptions } from '../../popper';

const log = Log.module('itemUtils');

export const INVALID_ITEM_ERROR_MESSAGE =
  'Items must be strings, numbers, booleans, <Item> or <Section> elements:';

/**
 * React Spectrum <Section> supports an `ItemRenderer` function as a child. The
 * DH picker makes use of this internally, but we don't want to support it as
 * an incoming prop.
 */
type SectionPropsNoItemRenderer<T> = Omit<SectionProps<T>, 'children'> & {
  children: Exclude<SectionProps<T>['children'], ItemRenderer<T>>;
};

type ItemElement = ReactElement<ItemProps<unknown>>;
export type SectionElement = ReactElement<SectionPropsNoItemRenderer<unknown>>;

export type ItemElementOrPrimitive = number | string | boolean | ItemElement;
export type ItemOrSection = ItemElementOrPrimitive | SectionElement;

/**
 * Augment the Spectrum selection key type to include boolean values.
 * Spectrum collection components already supports this, but the built in types
 * don't reflect it.
 */
export type ItemKey = Key | boolean;

/**
 * Augment the Spectrum selection change handler type to include boolean keys.
 * Spectrum components already supports this, but the built in types don't
 * reflect it.
 */
export type ItemSelectionChangeHandler = (key: ItemKey) => void;

export interface NormalizedItemData {
  key?: ItemKey;
  content: ReactNode;
  textValue?: string;
}

export interface NormalizedSectionData {
  key?: Key;
  title?: ReactNode;
  items: NormalizedItem[];
}

/**
 * Spectrum collection components support a variety of item types, including
 * strings, numbers, booleans, and more complex React elements. This type
 * represents a normalized form to make rendering items simpler and keep the
 * logic of transformation in separate util methods. It also adheres to the
 * `KeyedItem` interface to be compatible with Windowed data utils
 * (e.g. `useViewportData`).
 */
export type NormalizedItem = KeyedItem<NormalizedItemData, ItemKey | undefined>;

export type NormalizedSection = KeyedItem<
  NormalizedSectionData,
  Key | undefined
>;

export type NormalizedSpectrumPickerProps = SpectrumPickerProps<NormalizedItem>;

export type TooltipOptions = { placement: PopperOptions['placement'] };

/**
 * DH wrappers of Spectrum collection components use a normalized item that
 * includes a `key` prop and an optional `item` prop. This is mostly to support
 * Windowed data where items are created before their data has been loaded (data
 * gets set in the `item` prop). If data has loaded, return its `key`. If not,
 * return the top-level `key` on the normalized item.
 * @param item The normalized item or section
 * @returns The `key` of the item or section
 */
export function getItemKey<
  TItem extends NormalizedItem | NormalizedSection,
  TKey extends TItem extends NormalizedItem
    ? ItemKey | undefined
    : TItem extends NormalizedSection
    ? Key | undefined
    : undefined,
>(item: TItem | null | undefined): TKey {
  return (item?.item?.key ?? item?.key) as TKey;
}

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
 * Determine if a node is an array containing normalized items with keys.
 * Note that this only checks the first node in the array.
 * @param node The node to check
 * @returns True if the node is a normalized item with keys array
 */
export function isNormalizedItemsWithKeysList(
  node: ItemOrSection | ItemOrSection[] | (NormalizedItem | NormalizedSection)[]
): node is (NormalizedItem | NormalizedSection)[] {
  if (!Array.isArray(node)) {
    return false;
  }

  if (node.length === 0) {
    return true;
  }

  return !isItemOrSection(node[0]) && 'key' in node[0];
}

/**
 * Determine if an object is a normalized section.
 * @param maybeNormalizedSection The object to check
 * @returns True if the object is a normalized section
 */
export function isNormalizedSection(
  maybeNormalizedSection: NormalizedItem | NormalizedSection
): maybeNormalizedSection is NormalizedSection {
  return (
    maybeNormalizedSection.item != null &&
    'items' in maybeNormalizedSection.item
  );
}

/**
 * Determine if a node is an item or section. Valid types include strings,
 * numbers, booleans, Item elements, and Section elements.
 * @param node The node to check
 * @returns True if the node is an item or section
 */
export function isItemOrSection(node: ReactNode): node is ItemOrSection {
  return (
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean' ||
    isItemElement(node) ||
    isSectionElement(node)
  );
}

/**
 * Determine the `key` of an item or section.
 * @param itemOrSection The item or section
 * @returns A `ItemKey` for the item or undefined if a key can't be determined
 */
function normalizeItemKey(item: ItemElementOrPrimitive): ItemKey | undefined;
function normalizeItemKey(section: SectionElement): Key | undefined;
function normalizeItemKey(
  itemOrSection: ItemElementOrPrimitive | SectionElement
): Key | ItemKey | undefined {
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
      : undefined;
  }

  // Item element
  return (
    itemOrSection.props.textValue ??
    (typeof itemOrSection.props.children === 'string'
      ? itemOrSection.props.children
      : undefined)
  );
}

/**
 * Get a normalized `textValue` for an item ensuring it is a string.
 * @param item The item
 * @returns A string `textValue` for the item
 */
function normalizeTextValue(item: ItemElementOrPrimitive): string | undefined {
  if (typeof item !== 'object') {
    return String(item);
  }

  if (item.props.textValue != null) {
    return item.props.textValue;
  }

  if (typeof item.props.children === 'string') {
    return item.props.children;
  }

  return undefined;
}

/**
 * Normalize an item or section to an object form.
 * @param itemOrSection item to normalize
 * @returns NormalizedItem or NormalizedSection object
 */
function normalizeItem(
  itemOrSection: ItemOrSection
): NormalizedItem | NormalizedSection {
  if (!isItemOrSection(itemOrSection)) {
    log.debug(INVALID_ITEM_ERROR_MESSAGE, itemOrSection);
    throw new Error(INVALID_ITEM_ERROR_MESSAGE);
  }

  if (isSectionElement(itemOrSection)) {
    const key = normalizeItemKey(itemOrSection);
    const { title } = itemOrSection.props;

    const items = normalizeItemList(itemOrSection.props.children).filter(
      // We don't support nested section elements
      childItem => !isSectionElement(childItem)
    ) as NormalizedItem[];

    return {
      item: { key, title, items },
    };
  }

  const key = normalizeItemKey(itemOrSection);
  const content = isItemElement(itemOrSection)
    ? itemOrSection.props.children
    : itemOrSection;
  const textValue = normalizeTextValue(itemOrSection);

  return {
    item: { key, content, textValue },
  };
}

/**
 * Get normalized items from an item or array of items.
 * @param itemsOrSections An item or array of items
 * @returns An array of normalized items
 */
export function normalizeItemList(
  itemsOrSections: ItemOrSection | ItemOrSection[] | NormalizedItem[]
): (NormalizedItem | NormalizedSection)[] {
  // If already normalized, just return as-is
  if (isNormalizedItemsWithKeysList(itemsOrSections)) {
    return itemsOrSections;
  }

  const itemsArray = Array.isArray(itemsOrSections)
    ? itemsOrSections
    : [itemsOrSections];

  return itemsArray.map(normalizeItem);
}

/**
 * Returns a TooltipOptions object or null if options is false or null.
 * @param options
 * @returns TooltipOptions or null
 */
export function normalizeTooltipOptions(
  options?: boolean | TooltipOptions | null
): TooltipOptions | null {
  if (options == null || options === false) {
    return null;
  }

  if (options === true) {
    return { placement: 'right' };
  }

  return options;
}
