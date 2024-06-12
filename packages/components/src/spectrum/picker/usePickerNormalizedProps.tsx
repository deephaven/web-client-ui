import { Key, useCallback, useMemo } from 'react';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import type { DOMRef } from '@react-types/shared';
import {
  getItemKey,
  isNormalizedSection,
  NormalizedItem,
  NormalizedSection,
  normalizeTooltipOptions,
  useRenderNormalizedItem,
  useStringifiedSelection,
} from '../utils';
import { PickerNormalizedPropsT } from './PickerProps';
import { usePickerScrollOnOpen } from './usePickerScrollOnOpen';
import { Section } from '../shared';

/** Props that are derived by `usePickerNormalizedProps` */
export type UsePickerNormalizedDerivedProps<THtml extends HTMLElement> = {
  children: (itemOrSection: NormalizedItem | NormalizedSection) => JSX.Element;
  forceRerenderKey: Key;
  items: (NormalizedItem | NormalizedSection)[];
  defaultSelectedKey?: Key;
  disabledKeys?: Iterable<Key>;
  ref: DOMRef<THtml>;
  selectedKey?: Key | null;
  onSelectionChange: (key: Key | null) => void;
  onOpenChange: (isOpen: boolean) => void;
};

/**
 * Props that are passed through untouched. (should exclude all of the
 * destructured props passed into `usePickerNormalizedProps` that are not in the
 * spread ...props)
 */
export type UsePickerNormalizedPassthroughProps<TProps> = Omit<
  PickerNormalizedPropsT<TProps>,
  | 'defaultSelectedKey'
  | 'disabledKeys'
  | 'getInitialScrollPosition'
  | 'normalizedItems'
  | 'onChange'
  | 'onOpenChange'
  | 'onScroll'
  | 'onSelectionChange'
  | 'selectedKey'
  | 'showItemIcons'
  | 'tooltip'
>;

/** Props passed to `usePickerNormalizedProps` hook. */
export type UsePickerNormalizedProps<
  TProps,
  THtml extends HTMLElement,
> = UsePickerNormalizedDerivedProps<THtml> &
  UsePickerNormalizedPassthroughProps<TProps>;

export function usePickerNormalizedProps<
  TProps,
  THtml extends HTMLElement = HTMLElement,
>({
  defaultSelectedKey,
  disabledKeys,
  getInitialScrollPosition,
  normalizedItems,
  onChange,
  onOpenChange,
  onScroll = EMPTY_FUNCTION,
  onSelectionChange,
  selectedKey,
  showItemIcons,
  tooltip = true,
  ...props
}: PickerNormalizedPropsT<TProps>): UsePickerNormalizedProps<TProps, THtml> {
  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip),
    [tooltip]
  );

  const renderNormalizedItem = useRenderNormalizedItem({
    itemIconSlot: 'icon',
    // Descriptions introduce variable item heights which throws off calculation
    // of initial scroll position and setting viewport on windowed data. For now
    // not going to implement description support in Picker.
    // https://github.com/deephaven/web-client-ui/issues/1958
    showItemDescriptions: false,
    showItemIcons,
    tooltipOptions,
  });

  // Spectrum doesn't re-render if only the `renderNormalizedItems` function
  // changes, so we create a key from its dependencies that can be used to force
  // re-render.
  const forceRerenderKey = `${showItemIcons}-${tooltipOptions?.placement}`;

  const { ref, onOpenChange: onOpenChangeInternal } =
    usePickerScrollOnOpen<THtml>({
      getInitialScrollPosition,
      onScroll,
      onOpenChange,
    });

  // Spectrum Picker treats keys as strings if the `key` prop is explicitly
  // set on `Item` elements. Since we do this in `renderItem`, we need to
  // map original key types to and from strings so that selection works.
  const {
    selectedStringKey,
    defaultSelectedStringKey,
    disabledStringKeys,
    onStringSelectionChange,
  } = useStringifiedSelection({
    normalizedItems,
    selectedKey,
    defaultSelectedKey,
    disabledKeys,
    onChange: onChange ?? onSelectionChange,
  });

  const children = useCallback(
    (itemOrSection: NormalizedItem | NormalizedSection) => {
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
    },
    [renderNormalizedItem]
  );

  return {
    ...props,
    children,
    forceRerenderKey,
    ref,
    items: normalizedItems,
    selectedKey: selectedStringKey,
    defaultSelectedKey: defaultSelectedStringKey,
    disabledKeys: disabledStringKeys,
    onSelectionChange: onStringSelectionChange,
    onOpenChange: onOpenChangeInternal,
  };
}

export default usePickerNormalizedProps;
