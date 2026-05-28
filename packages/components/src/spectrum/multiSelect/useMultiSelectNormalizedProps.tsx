import { useMemo } from 'react';
import { Section } from '@adobe/react-spectrum';
import {
  getItemKey,
  isNormalizedSection,
  normalizeTooltipOptions,
  useRenderNormalizedItem,
  useStringifiedMultiSelection,
} from '../utils';
import {
  type MultiSelectNormalizedProps,
  type MultiSelectProps,
} from './MultiSelectProps';

/** Props that are derived by `useMultiSelectNormalizedProps` */
export type UseMultiSelectNormalizedDerivedProps = {
  children: JSX.Element[];
  forceRerenderKey: string;
  selectedKeys: MultiSelectProps['selectedKeys'];
  defaultSelectedKeys: MultiSelectProps['defaultSelectedKeys'];
  disabledKeys: MultiSelectProps['disabledKeys'];
  onChange: MultiSelectProps['onChange'];
};

/**
 * Props that are passed through untouched. Should exclude all of the
 * destructured props passed into `useMultiSelectNormalizedProps` that are not
 * in the spread `...props`.
 */
export type UseMultiSelectNormalizedPassthroughProps = Omit<
  MultiSelectNormalizedProps,
  | 'normalizedItems'
  | 'showItemIcons'
  | 'tooltip'
  | 'selectedKeys'
  | 'defaultSelectedKeys'
  | 'disabledKeys'
  | 'onChange'
  | 'onSelectionChange'
>;

/** Props returned from `useMultiSelectNormalizedProps` hook. */
export type UseMultiSelectNormalizedResult =
  UseMultiSelectNormalizedDerivedProps &
    UseMultiSelectNormalizedPassthroughProps;

export function useMultiSelectNormalizedProps({
  normalizedItems,
  showItemIcons,
  tooltip = true,
  selectedKeys,
  defaultSelectedKeys,
  disabledKeys,
  onChange,
  onSelectionChange,
  ...props
}: MultiSelectNormalizedProps): UseMultiSelectNormalizedResult {
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

  // Spectrum doesn't re-render if only the render function identity changes,
  // so we expose a key that the parent can use to force a re-render.
  const forceRerenderKey = `${showItemIcons}-${tooltipOptions?.placement}`;

  // Stringification operates on the flat item list so selection works for
  // items inside sections too.
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

  const children = useMemo(
    () =>
      normalizedItems.map(itemOrSection => {
        if (isNormalizedSection(itemOrSection)) {
          return (
            <Section
              key={getItemKey(itemOrSection)}
              title={itemOrSection.item?.title}
              items={itemOrSection.item?.items}
            >
              {renderNormalizedItem}
            </Section>
          );
        }
        return renderNormalizedItem(itemOrSection);
      }),
    [normalizedItems, renderNormalizedItem]
  );

  return {
    ...props,
    children,
    forceRerenderKey,
    selectedKeys: selectedStringKeys as MultiSelectProps['selectedKeys'],
    defaultSelectedKeys:
      defaultSelectedStringKeys as MultiSelectProps['defaultSelectedKeys'],
    disabledKeys: disabledStringKeys as MultiSelectProps['disabledKeys'],
    onChange: onStringSelectionChange as MultiSelectProps['onChange'],
  };
}

export default useMultiSelectNormalizedProps;
