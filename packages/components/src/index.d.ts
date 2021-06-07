/* eslint-disable max-classes-per-file */
import React, {
  ChangeEventHandler,
  CSSProperties,
  KeyboardEventHandler,
  MouseEventHandler,
} from 'react';

export { default as Option } from './Option';
export { default as Select } from './Select';
export { default as Button } from './Button';
export { LoadingSpinner } from './LoadingSpinner';
export { Menu, MenuItem, Page, Stack } from './navigation';
export type {
  SwitchMenuItemDef,
  MenuItemDef,
  MenuItemProps,
  MenuProps,
  PageProps,
} from './navigation';
export {
  ContextActions,
  ContextActionUtils,
  ContextMenuRoot,
} from './context-actions';
export { default as ThemeExport } from './ThemeExport';

/**
 * Some typescript definitions for JS components
 */
interface ButtonOldProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export declare const ButtonOld: React.ForwardRefRenderFunction<
  HTMLButtonElement,
  ButtonOldProps
>;

interface CheckboxProps {
  children: React.ReactNode;
  checked: boolean | null;
  className?: string;
  disabled?: boolean;
  inputClassName?: string;
  isInvalid?: boolean;
  labelClassName?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export declare const Checkbox: React.ForwardRefRenderFunction<
  HTMLElement,
  CheckboxProps
>;

interface RadioGroupProps {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  children: React.ReactNode;
  value?: string;
  name?: string;
  disabled?: boolean;
}

export declare class RadioGroup extends React.PureComponent<RadioGroupProps> {}

interface RadioItemProps {
  children: React.ReactNode;
  value: string;

  checked?: boolean;
  className?: string;
  disabled?: boolean;
  inputClassName?: string;
  isInvalid?: boolean;
  labelClassName?: string;
  name?: string;
  onChange?: (value: string) => void;
}

export declare const RadioItem: React.ForwardRefRenderFunction<
  HTMLButtonElement,
  RadioItemProps
>;

interface SearchInputProps {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
  placeholder?: string;
  className?: string;
  matchCount?: number;
  id?: string;
}

export declare class SearchInput extends React.PureComponent<SearchInputProps> {}

interface SearchValueListItem {
  value: unknown;
  isSelected: boolean;
  displayValue?: string;
}

interface SelectValueListProps {
  itemCount: number;
  offset: number;
  items: SearchValueListItem[];
  onSelect: (itemIndex: number, value: unknown) => void;
  onViewportChange: (top: number, bottom: number) => void;

  disabled?: boolean;
  rowHeight?: number;
}

export declare class SelectValueList extends React.PureComponent<SelectValueListProps> {}

// Range is inclusive of both indices
export type Range = number[];

export interface ItemListRenderItemProps<T> {
  item: T;
  itemIndex: number;
  isSelected: boolean;
}

export type ItemListRenderItem<T> = (
  props: ItemListRenderItemProps<T>
) => React.ReactNode;

interface ItemListProps<T> {
  items?: T[];
  itemCount: number;
  rowHeight?: number;
  offset?: number;
  className?: string;
  isDragSelect?: boolean;
  isMultiSelect?: boolean;
  isStickyBottom?: boolean;
  onKeyboardSelect?: (index: number) => void;
  onSelect?: (index: number) => void;
  onSelectionChange?: (ranges: Range[]) => void;
  onViewportChange?: (top: number, bottom: number) => void;
  overscanCount?: number;
  selectedRanges?: Range[];
  disableSelect?: boolean;
  renderItem?: ItemListRenderItem<T>;
  focusSelector?: string;
}
export declare class ItemList<T> extends React.PureComponent<ItemListProps<T>> {
  scrollToItem: (itemIndex: number) => void;
}

export interface DraggableRenderItemProps<T>
  extends ItemListRenderItemProps<T> {
  isClone: boolean;
  selectedCount: boolean;
}

export type DraggableRenderItem<T> = (
  props: DraggableRenderItemProps<T>
) => React.ReactNode;

interface DraggableItemListProps<T> {
  className?: string;
  draggingItemClassName?: string;
  itemCount: number;
  rowHeight?: number;
  offset?: number;
  items?: T[];
  isDropDisabled?: boolean;
  isDragDisabled?: boolean;
  isMultiSelect?: boolean;
  isStickyBottom?: boolean;
  onSelect?: (index: number) => void;
  onSelectionChange?: (ranges: Range[]) => void;
  onViewportChange?: (top: number, bottom: number) => void;
  selectedRanges?: Range[];
  disableSelect?: boolean;
  renderItem?: DraggableRenderItem<T>;
  style?: string | CSSProperties;
  draggablePrefix?: string;
  droppableId?: string;
}

export declare class DraggableItemList<T> extends React.PureComponent<
  DraggableItemListProps<T>
> {
  static renderHandle(): React.ReactNode;

  static renderBadge(item: { text?: string }): React.ReactNode;

  static renderTextItem(item: {
    text: string;
    badgeText?: string;
    className?: string;
  }): React.ReactNode;
}

export declare class DragUtils {
  static stopDragging(): void;

  static startDragging(): void;

  static reorder<T>(
    sourceList: T[],
    selectedRanges: Range[],
    destinationList: T[],
    destinationIndex: number
  ): T[];

  static adjustDestinationIndex(
    destinationIndex: number,
    ranges: Range[]
  ): number;
}
