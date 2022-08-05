/** Shim for using jquery in frameworks included by react (such as bootstrap) */
import $ from 'jquery';

declare global {
  interface Window {
    $: typeof $;
    jQuery: typeof $;
  }
}

window.$ = $;
window.jQuery = $;

export type { Range } from '@deephaven/utils';
export { default as AutoCompleteInput } from './AutoCompleteInput';
export { default as AutoResizeTextarea } from './AutoResizeTextarea';
export { default as BasicModal } from './BasicModal';
export { default as Button } from './Button';
export { default as ButtonGroup } from './ButtonGroup';
export { default as ButtonOld } from './ButtonOld';
export { default as CardFlip } from './CardFlip';
export * from './context-actions';
export { default as Collapse } from './Collapse';
export { default as Checkbox } from './Checkbox';
export { default as ComboBox } from './ComboBox';
export { default as CustomTimeSelect } from './CustomTimeSelect';
export { default as DebouncedSearchInput } from './DebouncedSearchInput';
export { default as DeephavenSpinner } from './DeephavenSpinner';
export { default as DraggableItemList } from './DraggableItemList';
export * from './DraggableItemList';
export { default as DragUtils } from './DragUtils';
export { default as HierarchicalCheckboxMenu } from './HierarchicalCheckboxMenu';
export * from './HierarchicalCheckboxMenu';
export * from './ItemList';
export { default as ItemListItem } from './ItemListItem';
export { default as LoadingOverlay } from './LoadingOverlay';
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as DropdownMenu } from './menu-actions';
export * from './menu-actions';
export { default as MaskedInput } from './MaskedInput';
export * from './MaskedInput';
export * from './navigation';
export { default as Option } from './Option';
export * from './popper';
export * from './modal';
export { default as RadioGroup } from './RadioGroup';
export { default as RadioItem } from './RadioItem';
export { default as Select } from './Select';
export { default as SearchInput } from './SearchInput';
export { default as SelectValueList } from './SelectValueList';
export * from './SelectValueList';
export * from './shortcuts';
export { default as SocketedButton } from './SocketedButton';
export { default as ThemeExport } from './ThemeExport';
export { default as TimeInput } from './TimeInput';
export { default as TimeSlider } from './TimeSlider';
export { default as ToastNotification } from './ToastNotification';
export { default as UISwitch } from './UISwitch';
export { default as ValidateLabelInput } from './ValidateLabelInput';
