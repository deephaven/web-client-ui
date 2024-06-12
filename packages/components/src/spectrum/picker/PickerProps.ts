import type { SpectrumPickerProps } from '@adobe/react-spectrum';
import type {
  ItemKey,
  ItemOrSection,
  NormalizedItem,
  NormalizedSection,
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
  | 'disabledKeys'
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
   * The item keys that are disabled. These items cannot be selected, focused,
   * or otherwise interacted with.
   */
  disabledKeys?: Iterable<ItemKey>;

  /**
   * Handler that is called when the selection change.
   * Note that under the hood, this is just an alias for Spectrum's
   * `onSelectionChange`. We are renaming for better consistency with other
   * components.
   */
  onChange?: (key: TChange) => void;

  /**
   * Method that is called when the open state of the menu changes.
   */
  onOpenChange?: (isOpen: boolean) => void;

  /** Handler that is called when the picker is scrolled. */
  onScroll?: (event: Event) => void;

  /**
   * Handler that is called when the selection changes.
   * @deprecated Use `onChange` instead
   */
  onSelectionChange?: (key: TChange) => void;
};

/**
 * Extend Picker props for usage with normalized items list instead of React
 * `children` elements.
 */
export type PickerNormalizedPropsT<TProps> = Omit<
  PickerPropsT<TProps>,
  'children'
> & {
  /**
   * Normalized format for items and sections instead React elements.
   */
  normalizedItems: (NormalizedItem | NormalizedSection)[];

  /**
   * Whether to show icons in items.
   */
  showItemIcons: boolean;

  /**
   * Get the initial scroll position to use when picker is opened.
   */
  getInitialScrollPosition?: () => Promise<number | null | undefined>;
};

export type PickerProps = PickerPropsT<SpectrumPickerProps<NormalizedItem>>;
export type PickerNormalizedProps = PickerNormalizedPropsT<PickerProps>;
