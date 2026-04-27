import type { FocusEvent, KeyboardEvent, ReactNode } from 'react';
import type {
  AriaLabelingProps,
  LoadingState,
  StyleProps,
  ValidationState,
} from '@react-types/shared';
import type { MenuTriggerAction } from '../comboBox';
import type {
  ItemOrSection,
  MultipleItemSelectionProps,
  NormalizedItem,
  NormalizedSection,
  TooltipOptions,
} from '../utils';

/**
 * Public props for the `@deephaven/components` `MultiSelect`.
 *
 * The MultiSelect is a hand-built composite (custom popover + search input +
 * tag row + ListBox), not a thin wrapper around a Spectrum collection
 * component. As such it owns its own prop surface rather than extending a
 * Spectrum type. Reuse `StyleProps`, `AriaLabelingProps`, `ValidationState`,
 * and `LoadingState` from `@react-types/shared` to stay consistent with the
 * Spectrum vocabulary.
 *
 * Children follow the same shape as `PickerProps.children`: declarative
 * `Item` / `Section` JSX (no render-function `items` pattern).
 */
export interface MultiSelectProps
  extends StyleProps,
    AriaLabelingProps,
    MultipleItemSelectionProps {
  /** Item or Section elements to render in the dropdown. */
  children: ItemOrSection | ItemOrSection[];
  /** Can be set to true or a TooltipOptions to enable item tooltips. */
  tooltip?: boolean | TooltipOptions;
  /** The content to display as the field label. */
  label?: ReactNode;
  /** A description for the field. */
  description?: ReactNode;
  /** An error message for the field. */
  errorMessage?: ReactNode;
  /** Whether user input is required on the field before form submission. */
  isRequired?: boolean;
  /** Whether the input is disabled. */
  isDisabled?: boolean;
  /** Whether the input can be selected but not changed by the user. */
  isReadOnly?: boolean;
  /** Whether the input should display its "valid" or "invalid" visual styling. */
  validationState?: ValidationState;
  /** Whether the MultiSelect should be displayed with a quiet style. */
  isQuiet?: boolean;
  /** The label's overall position relative to the element it is labeling. */
  labelPosition?: 'top' | 'side';
  /** The label's horizontal alignment relative to the element it is labeling. */
  labelAlign?: 'start' | 'end';
  /** Whether the required state should be shown as an icon or text. */
  necessityIndicator?: 'icon' | 'label';
  /** A ContextualHelp element to place next to the label. */
  contextualHelp?: ReactNode;

  /** Controlled value of the search input. */
  inputValue?: string;
  /** Default (uncontrolled) value of the search input. */
  defaultInputValue?: string;
  /** Handler called when the search input value changes. */
  onInputChange?: (value: string) => void;

  /** Whether keyboard navigation is circular. */
  shouldFocusWrap?: boolean;
  /** The current loading state of the items. */
  loadingState?: LoadingState;
  /** The interaction required to display the menu. */
  menuTrigger?: 'focus' | 'input' | 'manual';
  /** Alignment of the menu relative to the input target. */
  align?: 'start' | 'end';
  /** Direction the menu will render relative to the input. */
  direction?: 'bottom' | 'top';
  /** Whether the menu should automatically flip direction when there isn't enough space. */
  shouldFlip?: boolean;
  /** Width of the menu. */
  menuWidth?: string | number;
  /** Whether the MultiSelect allows a non-item matching input value to be selected. */
  allowsCustomValue?: boolean;
  /** Whether the form value of the field is the selected key(s) or text(s). */
  formValue?: 'key' | 'text';
  /** Whether to use native HTML form validation, ARIA validation, or both. */
  validationBehavior?: 'native' | 'aria';
  /** Whether the element should receive focus on render. */
  autoFocus?: boolean;
  /** The name of the input element, used when submitting an HTML form. */
  name?: string;
  /** The element's unique identifier. */
  id?: string;
  /** Whether the field is hidden. */
  isHidden?: boolean;
  /** Handler called when the input receives focus. */
  onFocus?: (e: FocusEvent) => void;
  /** Handler called when the input loses focus. */
  onBlur?: (e: FocusEvent) => void;
  /** Handler called when the focus state changes. */
  onFocusChange?: (isFocused: boolean) => void;
  /** Handler called when a key is pressed. */
  onKeyDown?: (e: KeyboardEvent) => void;
  /** Handler called when a key is released. */
  onKeyUp?: (e: KeyboardEvent) => void;

  /**
   * Method that is called when the open state of the menu changes. The
   * `menuTrigger` argument indicates the action that caused the change
   * (`undefined` on close).
   */
  onOpenChange?: (isOpen: boolean, menuTrigger?: MenuTriggerAction) => void;

  /** Handler called when the dropdown list is scrolled. */
  onScroll?: (event: Event) => void;

  /**
   * Handler called when search text changes. When provided, client-side
   * filtering is skipped (server-side filtering is assumed by the consumer).
   */
  onSearchTextChange?: (text: string) => void;

  /**
   * External label map for selected items whose data may not be present in
   * `children` (e.g. filtered out by server-side search). Used as a fallback
   * when rendering tags.
   */
  selectedItemLabels?: Map<string, string>;
}

/**
 * Props consumed by `MultiSelectNormalized`. Built on top of `MultiSelectProps`
 * so adding a prop to the base type automatically surfaces it on the
 * normalized variant. Replaces declarative JSX `children` with a flat
 * normalized item list (used by table-backed flows in `@deephaven/jsapi-components`).
 */
export type MultiSelectNormalizedProps = Omit<MultiSelectProps, 'children'> & {
  normalizedItems: (NormalizedItem | NormalizedSection)[];
  showItemIcons: boolean;
};
