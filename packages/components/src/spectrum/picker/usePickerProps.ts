import { EMPTY_FUNCTION, ensureArray } from '@deephaven/utils';
import { DOMRef } from '@react-types/shared';
import { useMemo } from 'react';
import { PICKER_TOP_OFFSET } from '../../UIConstants';
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

/** Props that are derived by `usePickerProps`. */
export type UsePickerDerivedProps<THtml extends HTMLElement> = {
  children: (SectionElement<unknown> | ItemElement<unknown>)[];
  defaultSelectedKey?: ItemKey | undefined;
  ref: DOMRef<THtml>;
  selectedKey?: ItemKey | null | undefined;
  onOpenChange: (isOpen: boolean) => void;
  onSelectionChange: ((key: ItemKey | null) => void) | undefined;
};

/** 
 * Props that are passed through untouched. (should exclude all of the
 * destructured props passed into `usePickerProps` that are not in the spread
 * ...props)
) */
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

/** Props returned from `usePickerProps` hook. */
export type UsePickerProps<
  TProps,
  THtml extends HTMLElement,
> = UsePickerDerivedProps<THtml> & UsePickerPassthroughProps<TProps>;

/**
 * Derive props for Picker components (e.g. Picker and ComboBox). Specifically
 * handles wrapping children items and initial scroll position when the picker
 * is opened.
 */
export function usePickerProps<
  TProps,
  THtml extends HTMLElement = HTMLElement,
>({
  children,
  defaultSelectedKey,
  selectedKey,
  tooltip = true,
  onChange: onChangeHandler,
  onOpenChange: onOpenChangeHandler,
  onScroll = EMPTY_FUNCTION,
  onSelectionChange: onSelectionChangeHandler,
  ...props
}: PickerPropsT<TProps>): UsePickerProps<TProps, THtml> {
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

  const { ref, onOpenChange } = usePickerScrollOnOpen<THtml>({
    getInitialScrollPosition,
    onScroll,
    onOpenChange: onOpenChangeHandler,
  });

  return {
    ...props,
    defaultSelectedKey,
    ref,
    selectedKey,
    children: items,
    onOpenChange,
    onSelectionChange: onChangeMaybeUncontrolled,
  };
}

export default usePickerProps;
