import { useCallback, useMemo } from 'react';
import { Item } from '@adobe/react-spectrum';
import {
  getItemKey,
  isNormalizedSection,
  type NormalizedItem,
  type NormalizedSection,
  normalizeTooltipOptions,
  type TooltipOptions,
  useRenderNormalizedItem,
  useStringifiedMultiSelection,
} from '../utils';
import { Section } from '../shared';
import {
  MultiSelect,
  type MultiSelectEntry,
  type MultiSelectItem,
  type MultiSelectProps,
  isMultiSelectSection,
} from './MultiSelect';

export type MultiSelectNormalizedProps = Omit<
  MultiSelectProps,
  'children' | 'items'
> & {
  normalizedItems: (NormalizedItem | NormalizedSection)[];
  showItemIcons: boolean;
  tooltip?: boolean | TooltipOptions;
};

/**
 * MultiSelect that takes an array of `NormalizedItem` or `NormalizedSection`
 * items as children. Handles converting selection keys and uses `useRenderNormalizedItem` to
 * render items.
 */
export function MultiSelectNormalized({
  normalizedItems,
  showItemIcons,
  tooltip = true,
  selectedKeys,
  defaultSelectedKeys,
  disabledKeys,
  onChange,
  onSelectionChange,
  selectedItemLabels,
  ...props
}: MultiSelectNormalizedProps): JSX.Element {
  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip),
    [tooltip]
  );

  const renderNormalizedItem = useRenderNormalizedItem({
    itemIconSlot: 'icon',
    showItemDescriptions: false,
    showItemIcons,
    tooltipOptions,
  });

  // Flatten all items (including those inside sections) so they're all visible to the key
  // conversion logic
  const flatItems = useMemo(
    () =>
      normalizedItems.flatMap(item =>
        isNormalizedSection(item) ? item.item?.items ?? [] : [item]
      ),
    [normalizedItems]
  );

  const {
    selectedStringKeys,
    defaultSelectedStringKeys,
    disabledStringKeys,
    onStringSelectionChange,
  } = useStringifiedMultiSelection({
    normalizedItems: flatItems,
    selectedKeys,
    defaultSelectedKeys,
    disabledKeys,
    onChange: onChange ?? onSelectionChange,
  });

  const items: MultiSelectEntry[] = useMemo(
    () =>
      normalizedItems.map(itemOrSection => {
        if (isNormalizedSection(itemOrSection)) {
          return {
            key: String(getItemKey(itemOrSection)),
            title: itemOrSection.item?.title,
            items: (itemOrSection.item?.items ?? []).map(
              (ni: NormalizedItem) => ({
                key: String(getItemKey(ni)),
                label: ni.item?.textValue ?? String(getItemKey(ni)),
                renderedChild: renderNormalizedItem(ni),
              })
            ),
          };
        }
        return {
          key: String(getItemKey(itemOrSection)),
          label:
            itemOrSection.item?.textValue ?? String(getItemKey(itemOrSection)),
          renderedChild: renderNormalizedItem(itemOrSection),
        };
      }),
    [normalizedItems, renderNormalizedItem]
  );

  const renderEntry = useCallback((entry: MultiSelectEntry): JSX.Element => {
    if (isMultiSelectSection(entry)) {
      return (
        <Section key={entry.key} title={entry.title} items={entry.items}>
          {(item: MultiSelectItem): JSX.Element =>
            (item.renderedChild as JSX.Element) ?? (
              <Item key={item.key} textValue={item.label}>
                {item.label}
              </Item>
            )
          }
        </Section>
      );
    }
    return (
      (entry.renderedChild as JSX.Element) ?? (
        <Item key={entry.key} textValue={entry.label}>
          {entry.label}
        </Item>
      )
    );
  }, []);

  return (
    <MultiSelect
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      items={items}
      selectedItemLabels={selectedItemLabels}
      // Cast needed because `useStringifiedMultiSelection` returns Spectrum's
      // `Key` (`string | number`) types, but `MultiSelectProps` expects DH's
      // `ItemKey` (`string | number | boolean`).
      // Safe at runtime since all values are strings after stringification. Kept as casts rather
      // than changing the hook to preserve consistency with `useStringifiedSelection`.
      selectedKeys={selectedStringKeys as MultiSelectProps['selectedKeys']}
      defaultSelectedKeys={
        defaultSelectedStringKeys as MultiSelectProps['defaultSelectedKeys']
      }
      disabledKeys={disabledStringKeys as MultiSelectProps['disabledKeys']}
      onChange={onStringSelectionChange as MultiSelectProps['onChange']}
    >
      {renderEntry}
    </MultiSelect>
  );
}

export default MultiSelectNormalized;
