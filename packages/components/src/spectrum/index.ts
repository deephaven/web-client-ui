/**
 * Re-exporting React Spectrum components + props.
 */
export {
  // Layout
  Flex,
  type FlexProps,
  Grid,
  type GridProps,

  // Buttons
  ActionButton,
  type SpectrumActionButtonProps as ActionButtonProps,
  ActionGroup,
  type SpectrumActionGroupProps as ActionGroupProps,
  LogicButton,
  type SpectrumLogicButtonProps as LogicButtonProps,
  ToggleButton,
  type SpectrumToggleButtonProps as ToggleButtonProps,

  // Collections
  ActionBar,
  type SpectrumActionBarProps as ActionBarProps,
  ActionMenu,
  type SpectrumActionMenuProps as ActionMenuProps,
  ListView,
  type SpectrumListViewProps as ListViewProps,
  MenuTrigger,
  type SpectrumMenuTriggerProps as MenuTriggerProps,
  TagGroup,
  type SpectrumTagGroupProps as TagGroupProps,

  // Date and Time
  Calendar,
  type SpectrumCalendarProps as CalendarProps,
  DateField,
  type SpectrumDateFieldProps as DateFieldProps,
  DatePicker,
  type SpectrumDatePickerProps as DatePickerProps,
  DateRangePicker,
  type SpectrumDateRangePickerProps as DateRangePickerProps,
  RangeCalendar,
  type SpectrumRangeCalendarProps as RangeCalendarProps,
  TimeField,
  type SpectrumTimeFieldProps as TimeFieldProps,

  // Forms
  CheckboxGroup,
  type SpectrumCheckboxGroupProps as CheckboxGroupProps,
  Form,
  type SpectrumFormProps as FormProps,
  NumberField,
  type SpectrumNumberFieldProps as NumberFieldProps,
  RangeSlider,
  type SpectrumRangeSliderProps as RangeSliderProps,
  Slider,
  type SpectrumSliderProps as SliderProps,
  Switch,
  type SpectrumSwitchProps as SwitchProps,
  TextArea,
  TextField,
  type SpectrumTextFieldProps as TextFieldProps,

  // Navigation
  Breadcrumbs,
  type SpectrumBreadcrumbsProps as BreadcrumbsProps,
  Link,
  type SpectrumLinkProps as LinkProps,
  TabList,
  type SpectrumTabListProps as TabListProps,
  TabPanels,
  type SpectrumTabPanelsProps as TabPanelsProps,
  Tabs,
  type SpectrumTabsProps as TabsProps,

  // Overlays
  AlertDialog,
  type SpectrumAlertDialogProps as AlertDialogProps,
  ContextualHelp,
  type SpectrumContextualHelpProps as ContextualHelpProps,
  Dialog,
  type SpectrumDialogProps as DialogProps,
  DialogContainer,
  type SpectrumDialogContainerProps as DialogContainerProps,
  DialogTrigger,
  type SpectrumDialogTriggerProps as DialogTriggerProps,

  // Pickers
  ComboBox,
  type SpectrumComboBoxProps as ComboBoxProps,

  // Status
  Badge,
  type SpectrumBadgeProps as BadgeProps,
  InlineAlert,
  type SpectrumInlineAlertProps as InlineAlertProps,
  LabeledValue,
  type SpectrumLabeledValueProps as LabeledValueProps,
  Meter,
  type SpectrumMeterProps as MeterProps,
  ProgressBar,
  type SpectrumProgressBarProps as ProgressBarProps,
  ProgressCircle,
  type SpectrumProgressCircleProps as ProgressCircleProps,
  StatusLight,
  type SpectrumStatusLightProps as StatusLightProps,

  // Content
  Avatar,
  type SpectrumAvatarProps as AvatarProps,
  Content,
  type ContentProps,
  Divider,
  type SpectrumDividerProps as DividerProps,
  Footer,
  type FooterProps,
  Heading,
  type HeadingProps,
  IllustratedMessage,
  type SpectrumIllustratedMessageProps as IllustratedMessageProps,
  Image,
  type SpectrumImageProps as ImageProps,
  Keyboard,
  type KeyboardProps,
  Text,
  type TextProps,
  View,
  type ViewProps,
  Well,
  type SpectrumWellProps as WellProps,
} from '@adobe/react-spectrum';

export { type SpectrumTextAreaProps as TextAreaProps } from '@react-types/textfield';

/**
 * Wrapping Spectrum `Item` and `Section` components will break functionality
 * due to the way they are consumed by collection components. They are only used
 * to pass data and don't render anything on their own, so they don't need to be
 * wrapped. If we do ever need to wrap them for whatever reason, the static
 * `getCollectionNode` method will need to be implemented.
 * See https://github.com/adobe/react-spectrum/blob/main/packages/%40react-stately/collections/src/Item.ts#L17
 *     https://github.com/adobe/react-spectrum/blob/main/packages/%40react-stately/collections/src/Section.ts#L18
 */
export { Item, Section } from '@adobe/react-spectrum';
export type { ItemProps, SectionProps } from '@react-types/shared';

/**
 * Custom DH components wrapping React Spectrum components.
 */
export * from './picker';
