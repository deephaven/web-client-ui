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
  getInitialScrollPosition?: () => Promise<number | null | undefined>;
  onScroll?: (event: Event) => void;
}

export function PickerNormalized({
  normalizedItems,
  tooltip = true,
  selectedKey,
  defaultSelectedKey,
  disabledKeys,
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

  const renderNormalizedItem = useRenderNormalizedItem(tooltipOptions);

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
      ref={scrollRef as DOMRef<HTMLDivElement>}
      UNSAFE_className={cl('dh-picker', UNSAFE_className)}
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
