import { useMemo } from 'react';
import { Picker as SpectrumPicker } from '@adobe/react-spectrum';
import type { DOMRef } from '@react-types/shared';
import cl from 'classnames';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import { Section } from '../shared';
import type { PickerProps as PickerBaseProps } from './Picker';

import {
  getItemKey,
  isNormalizedSection,
  NormalizedItem,
  NormalizedSection,
  normalizeTooltipOptions,
  useRenderNormalizedItem,
  useStringifiedSelection,
} from '../utils';
import usePickerScrollOnOpen from './usePickerScrollOnOpen';

export interface PickerNormalizedProps
  extends Omit<PickerBaseProps, 'children'> {
  normalizedItems: (NormalizedItem | NormalizedSection)[];
  showItemIcons: boolean;
  getInitialScrollPosition?: () => Promise<number | null | undefined>;
  onScroll?: (event: Event) => void;
}

/**
 * Picker that takes an array of `NormalizedItem` or `NormalizedSection` items
 * as children and uses a render item function to render the items. This is
 * necessary to support windowed data.
 */
export function PickerNormalized({
  normalizedItems,
  tooltip = true,
  selectedKey,
  defaultSelectedKey,
  disabledKeys,
  showItemIcons,
  UNSAFE_className,
  getInitialScrollPosition,
  onChange,
  onOpenChange,
  onScroll = EMPTY_FUNCTION,
  onSelectionChange,
  ...props
}: PickerNormalizedProps): JSX.Element {
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

  const { ref: scrollRef, onOpenChange: onOpenChangeInternal } =
    usePickerScrollOnOpen({
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

  return (
    <SpectrumPicker
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      key={forceRerenderKey}
      ref={scrollRef as DOMRef<HTMLDivElement>}
      UNSAFE_className={cl(
        'dh-picker',
        'dh-picker-normalized',
        UNSAFE_className
      )}
      items={normalizedItems}
      selectedKey={selectedStringKey}
      defaultSelectedKey={defaultSelectedStringKey}
      disabledKeys={disabledStringKeys}
      onSelectionChange={onStringSelectionChange}
      onOpenChange={onOpenChangeInternal}
    >
      {itemOrSection => {
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
      }}
    </SpectrumPicker>
  );
}

export default PickerNormalized;
