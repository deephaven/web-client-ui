import {
  EMPTY_FUNCTION,
  ensureArray,
  PICKER_TOP_OFFSET,
} from '@deephaven/utils';
import { DOMRef } from '@react-types/shared';
import { useMemo } from 'react';
import {
  normalizeTooltipOptions,
  wrapItemChildren,
  useOnChangeTrackUncontrolled,
  useStaticItemInitialScrollPosition,
  ItemKey,
  SectionElement,
  ItemElement,
} from '../utils';
import type { PickerPropsT } from './PickerProps';
import usePickerItemScale from './usePickerItemScale';
import usePickerScrollOnOpen from './usePickerScrollOnOpen';

/** Props that are derived. */
export type UsePickerDerivedProps = {
  children: (SectionElement<unknown> | ItemElement<unknown>)[];
  defaultSelectedKey?: ItemKey | undefined;
  selectedKey?: ItemKey | null | undefined;
  scrollRef: DOMRef<HTMLElement>;
  onOpenChange: (isOpen: boolean) => void;
  onSelectionChange: ((key: ItemKey | null) => void) | undefined;
};

/** Props that are passed through untouched. */
export type UsePickerPassthroughProps<TProps> = Omit<
  PickerPropsT<TProps>,
  | 'children'
  | 'defaultSelectedKey'
  | 'selectedKey'
  | 'tooltip'
  | 'onChange'
  | 'onOpenChange'
  | 'onScroll'
  | 'onSelectionChange'
>;

export type UsePickerProps<TProps> = UsePickerDerivedProps &
  UsePickerPassthroughProps<TProps>;

/**
 * Derive props for Picker components (e.g. Picker and ComboBox). Specifically
 * handles wrapping children items and initial scroll position when the picker
 * is opened.
 */
export function usePickerProps<TProps>({
  children,
  defaultSelectedKey,
  selectedKey,
  tooltip = true,
  onChange: onChangeHandler,
  onOpenChange: onOpenChangeHandler,
  onScroll = EMPTY_FUNCTION,
  onSelectionChange: onSelectionChangeHandler,
  ...props
}: PickerPropsT<TProps>): UsePickerProps<TProps> {
  const { itemHeight } = usePickerItemScale();

  const tooltipOptions = useMemo(
    () => normalizeTooltipOptions(tooltip),
    [tooltip]
  );

  const items = useMemo(
    () => ensureArray(wrapItemChildren(children, tooltipOptions)),
    [children, tooltipOptions]
  );

  const { selectedKeyMaybeUncontrolled, onChangeMaybeUncontrolled } =
    useOnChangeTrackUncontrolled({
      defaultSelectedKey,
      selectedKey,
      onChange: onChangeHandler ?? onSelectionChangeHandler,
    });

  const getInitialScrollPosition = useStaticItemInitialScrollPosition({
    itemHeight,
    items,
    selectedKey: selectedKeyMaybeUncontrolled,
    topOffset: PICKER_TOP_OFFSET,
  });

  const { ref: scrollRef, onOpenChange } = usePickerScrollOnOpen({
    getInitialScrollPosition,
    onScroll,
    onOpenChange: onOpenChangeHandler,
  });

  return {
    ...props,
    defaultSelectedKey,
    selectedKey,
    children: items,
    scrollRef,
    onOpenChange,
    onSelectionChange: onChangeMaybeUncontrolled,
  };
}

export default usePickerProps;
