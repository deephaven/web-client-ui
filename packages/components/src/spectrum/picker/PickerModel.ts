import type {
  ItemKey,
  NormalizedSpectrumPickerProps,
  TooltipOptions,
} from '../utils';

export type PickerCommonProps = {
  /** The currently selected key in the collection (controlled). */
  selectedKey?: ItemKey | null;

  /** The initial selected key in the collection (uncontrolled). */
  defaultSelectedKey?: ItemKey;

  /** Can be set to true or a TooltipOptions to enable item tooltips */
  tooltip?: boolean | TooltipOptions;

  /** Handler that is called when the picker is scrolled. */
  onScroll?: (event: Event) => void;

  /**
   * Handler that is called when the selection change.
   * Note that under the hood, this is just an alias for Spectrum's
   * `onSelectionChange`. We are renaming for better consistency with other
   * components.
   */
  onChange?: (key: ItemKey) => void;

  /**
   * Handler that is called when the selection changes.
   * @deprecated Use `onChange` instead
   */
  onSelectionChange?: (key: ItemKey) => void;
} & /*
 * Support remaining SpectrumPickerProps.
 * Note that `selectedKey`, `defaultSelectedKey`, and `onSelectionChange` are
 * re-defined above to account for boolean types which aren't included in the
 * React `Key` type, but are actually supported by the Spectrum Picker component.
 */ Omit<
  NormalizedSpectrumPickerProps,
  | 'children'
  | 'items'
  | 'onSelectionChange'
  | 'selectedKey'
  | 'defaultSelectedKey'
>;
