import { cloneElement, type ReactElement, type ReactNode } from 'react';
import { ensureArray } from '@deephaven/utils';
import {
  getItemTextValue,
  isItemElement,
  isSectionElement,
  type ItemElement,
  type ItemKey,
  type SectionElement,
} from '../utils';

/**
 * Flat shape used internally by the `MultiSelect` keyboard / filter / state
 * hooks. Not part of the public API.
 */
export interface MultiSelectFlatItem {
  kind: 'item';
  key: string;
  label: string;
}

/**
 * Section-preserving shape used internally for client-side filtering. Not
 * part of the public API.
 */
export interface MultiSelectFlatSection {
  kind: 'section';
  key: string;
  title: ReactNode;
  items: MultiSelectFlatItem[];
}

export type MultiSelectFlatEntry = MultiSelectFlatItem | MultiSelectFlatSection;

/**
 * TODO: this is pretty fragile
 */
function cleanReactKey(rawKey: string): string {
  return rawKey.replace(/^\.\$/, '');
}

/**
 * Convert a JSX `<Item>` element into a flat `{key, label}` record. Returns
 * `null` for items without a key.
 */
function itemElementToFlat(
  element: ItemElement<unknown>
): MultiSelectFlatItem | null {
  if (element.key == null) {
    return null;
  }
  const key = cleanReactKey(String(element.key));
  const label =
    getItemTextValue(element) ??
    (typeof element.props.children === 'string' ? element.props.children : key);
  return { kind: 'item', key, label };
}

/**
 * Type guard that checks whether a flat entry is a section.
 */
export function isFlatSection(
  entry: MultiSelectFlatEntry
): entry is MultiSelectFlatSection {
  return entry.kind === 'section';
}

/**
 * Walk a JSX <Item>/<Section> children array and return a
 * section-preserving flat representation suitable for the internal
 * filter / keyboard / state hooks. Children are expected to have already
 * been normalized via `wrapItemChildren` so primitives have been wrapped
 * into `<Item>` elements.
 */
export function flattenJsxChildren(
  children: readonly ReactElement[]
): MultiSelectFlatEntry[] {
  const entries: MultiSelectFlatEntry[] = [];

  children.forEach(child => {
    if (isSectionElement(child)) {
      const section = child as SectionElement<unknown>;
      const sectionKey =
        section.key != null
          ? cleanReactKey(String(section.key))
          : String(entries.length);

      const sectionItems: MultiSelectFlatItem[] = [];
      ensureArray(section.props.children).forEach(sectionChild => {
        if (isItemElement(sectionChild)) {
          const item = itemElementToFlat(sectionChild as ItemElement<unknown>);
          if (item != null) {
            sectionItems.push(item);
          }
        }
      });

      entries.push({
        kind: 'section',
        key: sectionKey,
        title: section.props.title,
        items: sectionItems,
      });
      return;
    }

    if (isItemElement(child)) {
      const item = itemElementToFlat(child as ItemElement<unknown>);
      if (item != null) {
        entries.push(item);
      }
    }
  });

  return entries;
}

/**
 * Flatten a section-preserving entry list into a plain MultiSelectFlatItem[],
 * extracting items out of any sections.
 */
export function flattenEntriesToItems(
  entries: readonly MultiSelectFlatEntry[]
): MultiSelectFlatItem[] {
  return entries.flatMap(entry =>
    isFlatSection(entry) ? entry.items : [entry]
  );
}

/**
 * Filter entries by search text. Items within sections are filtered
 * individually; sections with no matching items are removed.
 */
export function filterEntries(
  entries: readonly MultiSelectFlatEntry[],
  text: string,
  contains: (string: string, substring: string) => boolean
): MultiSelectFlatEntry[] {
  const result: MultiSelectFlatEntry[] = [];
  entries.forEach(entry => {
    if (isFlatSection(entry)) {
      const filtered = entry.items.filter(item => contains(item.label, text));
      if (filtered.length > 0) {
        result.push({ ...entry, items: filtered });
      }
    } else if (contains(entry.label, text)) {
      result.push(entry);
    }
  });
  return result;
}

/**
 * Collect the set of all surviving item keys from a list of flat entries.
 * Used to drive filterJsxChildrenByKeys so we don't re-walk JSX with the
 * search text predicate.
 */
export function collectEntryItemKeys(
  entries: readonly MultiSelectFlatEntry[]
): Set<string> {
  const keys = new Set<string>();
  entries.forEach(entry => {
    if (isFlatSection(entry)) {
      entry.items.forEach(item => keys.add(item.key));
    } else {
      keys.add(entry.key);
    }
  });
  return keys;
}

export function filterJsxChildrenByKeys(
  children: readonly ReactElement[],
  survivingKeys: ReadonlySet<string>
): ReactElement[] {
  const result: ReactElement[] = [];

  children.forEach(child => {
    if (isSectionElement(child)) {
      const section = child as SectionElement<unknown>;
      const filteredChildren = filterJsxChildrenByKeys(
        ensureArray(section.props.children).filter(
          (c): c is ReactElement => c != null
        ),
        survivingKeys
      );
      if (filteredChildren.length > 0) {
        result.push(
          cloneElement(section as ReactElement, {
            children: filteredChildren,
          })
        );
      }
      return;
    }

    if (isItemElement(child)) {
      const item = child as ItemElement<unknown>;
      if (
        item.key != null &&
        survivingKeys.has(cleanReactKey(String(item.key)))
      ) {
        result.push(child);
      }
    }
  });

  return result;
}

export function resolveSelection(
  selection: 'all' | Iterable<ItemKey> | undefined,
  allKeys: string[]
): Set<string> {
  if (selection == null) {
    return new Set<string>();
  }
  if (selection === 'all') {
    return new Set(allKeys);
  }
  return new Set([...selection].map(String));
}
