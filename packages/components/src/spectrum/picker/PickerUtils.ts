import { isValidElement, Key, ReactElement, ReactNode } from 'react';
import { SpectrumPickerProps } from '@adobe/react-spectrum';
import type { ItemRenderer } from '@react-types/shared';
import Log from '@deephaven/log';
import { KeyedItem } from '@deephaven/utils';
import { Item, ItemProps, Section, SectionProps } from '../shared';
import { PopperOptions } from '../../popper';

const log = Log.module('PickerUtils');

export const INVALID_PICKER_ITEM_ERROR_MESSAGE =
  'Picker items must be strings, numbers, booleans, <Item> or <Section> elements:';

/**
 * React Spectrum <Section> supports an `ItemRenderer` function as a child. The
 * DH picker makes use of this internally, but we don't want to support it as
 * an incoming prop.
 */
type SectionPropsNoItemRenderer<T> = Omit<SectionProps<T>, 'children'> & {
  children: Exclude<SectionProps<T>['children'], ItemRenderer<T>>;
};

type ItemElement = ReactElement<ItemProps<unknown>>;
type SectionElement = ReactElement<SectionPropsNoItemRenderer<unknown>>;

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

export interface NormalizedPickerItemData {
  key?: PickerItemKey;
  content: ReactNode;
  textValue?: string;
}

export interface NormalizedPickerSectionData {
  key?: Key;
  title?: ReactNode;
  items: NormalizedPickerItem[];
}

/**
 * The Picker supports a variety of item types, including strings, numbers,
 * booleans, and more complex React elements. This type represents a normalized
 * form to make rendering items simpler and keep the logic of transformation
 * in separate util methods. It also adheres to the `KeyedItem` interface to
 * be compatible with Windowed data utils (e.g. `useViewportData`).
 */
export type NormalizedPickerItem = KeyedItem<
  NormalizedPickerItemData,
  PickerItemKey | undefined
>;

export type NormalizedPickerSection = KeyedItem<
  NormalizedPickerSectionData,
  Key | undefined
>;

export type NormalizedSpectrumPickerProps =
  SpectrumPickerProps<NormalizedPickerItem>;

export type TooltipOptions = { placement: PopperOptions['placement'] };

/**
 * Picker uses a normalized item that includes a `key` prop and an optional
 * `item` prop. This is mostly to support Windowed data where items are created
 * before their data has been loaded (data gets set in the `item` prop). If
 * data has loaded, return its `key`. If not, return the top-level `key` on the
 * normalized item.
 * @param item The normalized picker item or section
 * @returns The `key` of the item or section
 */
export function getPickerItemKey<
  TItem extends NormalizedPickerItem | NormalizedPickerSection,
  TKey extends TItem extends NormalizedPickerItem
    ? PickerItemKey | undefined
    : TItem extends NormalizedPickerSection
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
  node:
    | PickerItemOrSection
    | PickerItemOrSection[]
    | (NormalizedPickerItem | NormalizedPickerSection)[]
): node is (NormalizedPickerItem | NormalizedPickerSection)[] {
  if (!Array.isArray(node)) {
    return false;
  }

  if (node.length === 0) {
    return true;
  }

  return !isPickerItemOrSection(node[0]) && 'key' in node[0];
}

/**
 * Determine if an object is a normalized Picker section.
 * @param maybeNormalizedPickerSection The object to check
 * @returns True if the object is a normalized Picker section
 */
export function isNormalizedPickerSection(
  maybeNormalizedPickerSection: NormalizedPickerItem | NormalizedPickerSection
): maybeNormalizedPickerSection is NormalizedPickerSection {
  return (
    maybeNormalizedPickerSection.item != null &&
    'items' in maybeNormalizedPickerSection.item
  );
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
 * @returns A `PickerItemKey` for the picker item or undefined if a key can't be determined
 */
function normalizeItemKey(item: PickerItem): PickerItemKey | undefined;
function normalizeItemKey(section: PickerSection): Key | undefined;
function normalizeItemKey(
  itemOrSection: PickerItem | PickerSection
): Key | PickerItemKey | undefined {
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
 * Get a normalized `textValue` for a picker item ensuring it is a string.
 * @param item The picker item
 * @returns A string `textValue` for the picker item
 */
function normalizeTextValue(item: PickerItem): string | undefined {
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
 * Get normalized picker items from a picker item or array of picker items.
 * @param itemsOrSections A picker item or array of picker items
 * @returns An array of normalized picker items
 */
export function normalizePickerItemList(
  itemsOrSections:
    | PickerItemOrSection
    | PickerItemOrSection[]
    | NormalizedPickerItem[]
): (NormalizedPickerItem | NormalizedPickerSection)[] {
  // If already normalized, just return as-is
  if (isNormalizedItemsWithKeysList(itemsOrSections)) {
    return itemsOrSections;
  }

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
): TooltipOptions | null {
  if (options == null || options === false) {
    return null;
  }

  if (options === true) {
    return { placement: 'right' };
  }

  return options;
}
