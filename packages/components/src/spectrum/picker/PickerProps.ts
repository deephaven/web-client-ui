import type {
  ItemKey,
  ItemOrSection,
  NormalizedSpectrumPickerProps,
  TooltipOptions,
} from '../utils';

/**
 * Extend Spectrum Picker props (also other components that adhere to the same
 * apis such as ComboBox).
 * - `children` is extended to include primitive types and to exclude render function
 * - `items` and `defaultItems` are excluded since we are not currently supporting
 * render functions as `children`
 * - selection key types are extended to include number + boolean primitive types
 * - remaining props from the original type are passed through
 */
export type PickerPropsT<TProps, TChange = ItemKey> = Omit<
  TProps,
  // These props are all re-defined below
  | 'children'
  | 'onSelectionChange'
  | 'selectedKey'
  | 'defaultSelectedKey'
  // Excluding `defaultItems` and `items` since we are not currently supporting
  // a render function as `children`. This simplifies the API for determining
  // initial scroll position and wrapping items with tooltips.
  | 'defaultItems'
  | 'items'
> & {
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
  onChange?: (key: TChange) => void;

  onOpenChange?: (isOpen: boolean) => void;

  /** Handler that is called when the picker is scrolled. */
  onScroll?: (event: Event) => void;

  /**
   * Handler that is called when the selection changes.
   * @deprecated Use `onChange` instead
   */
  onSelectionChange?: (key: TChange) => void;
};

export type PickerProps = PickerPropsT<NormalizedSpectrumPickerProps>;
