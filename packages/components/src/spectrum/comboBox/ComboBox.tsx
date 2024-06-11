import { useMemo } from 'react';
import cl from 'classnames';
import {
  ComboBox as SpectrumComboBox,
  SpectrumComboBoxProps,
} from '@adobe/react-spectrum';
import {
  EMPTY_FUNCTION,
  PICKER_TOP_OFFSET,
  ensureArray,
} from '@deephaven/utils';
import { FocusableRef } from '@react-types/shared';
import { usePickerItemScale, usePickerScrollOnOpen } from '../picker';
import {
  ItemKey,
  ItemOrSection,
  NormalizedItem,
  normalizeTooltipOptions,
  TooltipOptions,
  useOnChangeTrackUncontrolled,
  useStaticItemInitialScrollPosition,
  wrapItemChildren,
} from '../utils';

export type ComboBoxProps = {
  children: ItemOrSection | ItemOrSection[];

  /** Can be set to true or a TooltipOptions to enable item tooltips */
  tooltip?: boolean | TooltipOptions;

  /** The currently selected key in the collection (controlled). */
  selectedKey?: ItemKey | null;

  /** The initial selected key in the collection (uncontrolled). */
  defaultSelectedKey?: ItemKey;

  /**
   * Handler that is called when the selection change.
   * Note that under the hood, this is just an alias for Spectrum's
   * `onSelectionChange`. We are renaming for better consistency with other
   * components.
   */
  onChange?: (key: ItemKey | null) => void;

  /** Handler that is called when the picker is scrolled. */
  onScroll?: (event: Event) => void;

  /**
   * Handler that is called when the selection changes.
   * @deprecated Use `onChange` instead
   */
  onSelectionChange?: (key: ItemKey | null) => void;
} & Omit<
  SpectrumComboBoxProps<NormalizedItem>,
  // These props are all re-defined above
  | 'children'
  | 'onSelectionChange'
  | 'selectedKey'
  | 'defaultSelectedKey'
  // Excluding `defaultItems` and `items` since we are not currently supporting
  // a render function as `children`. This simplifies the API for determining
  // initial scroll position and wrapping items with tooltips.
  | 'defaultItems'
  | 'items'
>;

export function ComboBox({
  children,
  tooltip = true,
  defaultSelectedKey,
  selectedKey,
  onChange,
  onOpenChange,
  onScroll = EMPTY_FUNCTION,
  onSelectionChange,
  // eslint-disable-next-line camelcase
  UNSAFE_className,
  ...spectrumComboBoxProps
}: ComboBoxProps): JSX.Element {
  const { itemHeight } = usePickerItemScale();

  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip),
    [tooltip]
  );

  const wrappedItems = useMemo(
    () => ensureArray(wrapItemChildren(children, tooltipOptions)),
    [children, tooltipOptions]
  );

  const { selectedKeyMaybeUncontrolled, onChangeMaybeUncontrolled } =
    useOnChangeTrackUncontrolled({
      defaultSelectedKey,
      selectedKey,
      onChange: onChange ?? onSelectionChange,
    });

  const getInitialScrollPosition = useStaticItemInitialScrollPosition({
    itemHeight,
    items: wrappedItems,
    selectedKey: selectedKeyMaybeUncontrolled,
    topOffset: PICKER_TOP_OFFSET,
  });

  const { ref: scrollRef, onOpenChange: onOpenChangeInternal } =
    usePickerScrollOnOpen({
      getInitialScrollPosition,
      onScroll,
      onOpenChange,
    });

  return (
    <SpectrumComboBox
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...spectrumComboBoxProps}
      ref={scrollRef as FocusableRef<HTMLDivElement>}
      UNSAFE_className={cl('dh-combobox', UNSAFE_className)}
      selectedKey={
        selectedKey as SpectrumComboBoxProps<NormalizedItem>['selectedKey']
      }
      defaultSelectedKey={
        defaultSelectedKey as SpectrumComboBoxProps<NormalizedItem>['defaultSelectedKey']
      }
      onSelectionChange={onChangeMaybeUncontrolled}
      onOpenChange={onOpenChangeInternal}
    >
      {wrappedItems}
    </SpectrumComboBox>
  );
}
