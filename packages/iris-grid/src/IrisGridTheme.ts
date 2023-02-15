import type { GridThemeType } from '@deephaven/grid';
import { GridColor, NullableGridColor } from '@deephaven/grid/src/GridTheme';
import IrisGridTheme from './IrisGridTheme.module.scss';

export type IrisGridThemeType = GridThemeType & {
  filterBarCollapsedHeight: number;
  filterBarHeight: number;
  reverseHeaderBarHeight: number;
  filterIconColor: string;
  filterBarActiveColor: GridColor;
  contextMenuSortIconColor: GridColor;
  contextMenuReverseIconColor: GridColor;
  minScrimTransitionTime: number;
  maxScrimTransitionTime: number;
  nullStringColor: GridColor;
  pendingTextColor: GridColor;
  dateColor: GridColor;
  positiveNumberColor: GridColor;
  negativeNumberColor: GridColor;
  zeroNumberColor: GridColor;
  errorTextColor: GridColor;
  groupedColumnDividerColor: GridColor;
  linkerColumnHoverBackgroundColor: GridColor;
  scrimBlurSize: number;
  scrimColor: GridColor;
  headerReverseBarColor: GridColor;
  sortHeaderBarHeight: number;
  headerSortBarColor: GridColor;
  headerBarCasingColor: GridColor;
  filterBarExpandedActiveBackgroundColor: GridColor;
  filterBarExpandedBackgroundColor: GridColor;
  filterBarSeparatorColor: GridColor;
  filterBarExpandedActiveCellBackgroundColor: GridColor;
  filterBarErrorColor: GridColor;
  filterBarHorizontalPadding: number;
  filterBarActiveBackgroundColor: GridColor;
  overflowButtonColor: GridColor;
  overflowButtonHoverColor: GridColor;
  floatingGridRowColor: NullableGridColor;
};

const theme: Partial<IrisGridThemeType> = Object.freeze({
  backgroundColor: IrisGridTheme['grid-bg'],
  white: IrisGridTheme.white,
  black: IrisGridTheme.black,
  primary: IrisGridTheme.primary,
  font: IrisGridTheme.font,
  headerBackgroundColor: IrisGridTheme['header-bg'],
  headerColor: IrisGridTheme['header-color'],
  headerSeparatorColor: IrisGridTheme['header-separator-color'],
  headerSeparatorHoverColor: IrisGridTheme['header-separator-hover-color'],
  headerHiddenSeparatorHoverColor:
    IrisGridTheme['header-hidden-separator-hover-color'],
  headerSortBarColor: IrisGridTheme['header-sort-bar-color'],
  headerReverseBarColor: IrisGridTheme['header-reverse-bar-color'],
  headerBarCasingColor: IrisGridTheme['header-bar-casing-color'],
  headerFont: IrisGridTheme['header-font'],
  rowBackgroundColors: IrisGridTheme['row-background-colors'],
  rowHoverBackgroundColor: IrisGridTheme['row-hover-bg'],
  selectionColor: IrisGridTheme['selection-color'],
  selectionOutlineColor: IrisGridTheme['selection-outline-color'],
  selectionOutlineCasingColor: IrisGridTheme['selection-outline-casing-color'],
  selectedRowHoverBackgroundColor: IrisGridTheme['selected-row-hover-bg'],
  scrollBarBackgroundColor: IrisGridTheme['scroll-bar-bg'],
  scrollBarHoverBackgroundColor: IrisGridTheme['scroll-bar-hover-bg'],
  scrollBarCasingColor: IrisGridTheme['scroll-bar-casing-color'],
  scrollBarCornerColor: IrisGridTheme['scroll-bar-corner-color'],
  scrollBarColor: IrisGridTheme['scroll-bar-color'],
  scrollBarHoverColor: IrisGridTheme['scroll-bar-hover-color'],
  scrollBarActiveColor: IrisGridTheme['scroll-bar-active-color'],
  scrollBarSelectionTickColor: IrisGridTheme['selected-row-hover-bg'],
  scrollBarActiveSelectionTickColor:
    IrisGridTheme['scroll-bar-active-selection-tick-color'],
  textColor: IrisGridTheme['text-color'],
  positiveNumberColor: IrisGridTheme['positive-number-color'],
  negativeNumberColor: IrisGridTheme['negative-number-color'],
  zeroNumberColor: IrisGridTheme['zero-number-color'],
  dateColor: IrisGridTheme['date-color'],
  pendingTextColor: IrisGridTheme['pending-text-color'],
  errorTextColor: IrisGridTheme['error-text-color'],
  nullStringColor: IrisGridTheme['null-string-color'],
  filterBarActiveBackgroundColor: IrisGridTheme['filter-bar-active-bg'],
  filterBarExpandedBackgroundColor: IrisGridTheme['filter-bar-expanded-bg'],
  filterBarExpandedActiveBackgroundColor:
    IrisGridTheme['filter-bar-expanded-active-bg'],
  filterBarExpandedActiveCellBackgroundColor:
    IrisGridTheme['filter-bar-expanded-active-cell-bg'],
  filterBarSeparatorColor: IrisGridTheme['filter-bar-separator-color'],
  filterBarActiveColor: IrisGridTheme['filter-bar-active-color'],
  filterBarErrorColor: IrisGridTheme['filter-bar-error-color'],
  filterIconColor: IrisGridTheme['filter-icon-color'],
  scrimColor: IrisGridTheme['scrim-color'],
  contextMenuSortIconColor: IrisGridTheme['context-menu-sort-icon-color'],
  contextMenuReverseIconColor: IrisGridTheme['context-menu-reverse-icon-color'],

  allowRowResize: false,
  autoSelectRow: true,
  gridColumnColor: null,
  gridRowColor: null,
  groupedColumnDividerColor: IrisGridTheme['grouped-column-divider-color'],
  columnHoverBackgroundColor: null,
  headerHorizontalPadding: 12,
  scrollBarSize: 13,
  scrollBarHoverSize: 16, // system default scrollbar width is 17
  minScrollHandleSize: 24,
  rowHeight: parseInt(IrisGridTheme['row-height'], 10) || 19, // IrisGrid test breaks without the fallback value
  columnWidth: 100,
  rowHeaderWidth: 0,
  rowFooterWidth: 60,
  columnHeaderHeight: parseInt(IrisGridTheme['header-height'], 10) || 30,
  filterBarHeight: 30, // includes 1px casing at bottom
  filterBarCollapsedHeight: 5, // includes 1px casing at bottom
  sortHeaderBarHeight: 2,
  reverseHeaderBarHeight: 4,
  filterBarHorizontalPadding: 4,

  // Amount of blur to apply to the bottom of the scrim while animating in
  scrimBlurSize: 25,
  minScrimTransitionTime: 150,
  maxScrimTransitionTime: 350,

  scrollSnapToRow: true,

  linkerColumnHoverBackgroundColor: IrisGridTheme['linker-column-hover-bg'],

  treeLineColor: IrisGridTheme['tree-line-color'],
  treeMarkerColor: IrisGridTheme['tree-marker-color'],
  treeMarkerHoverColor: IrisGridTheme['tree-marker-hover-color'],

  floatingGridColumnColor: null,
  floatingGridRowColor: IrisGridTheme['floating-grid-row-color'],
  floatingRowBackgroundColors: IrisGridTheme['floating-row-background-colors'],
  floatingDividerInnerColor: IrisGridTheme['floating-divider-inner-color'],
  floatingDividerOuterColor: IrisGridTheme['floating-divider-outer-color'],

  overflowButtonColor: IrisGridTheme['overflow-button-color'],
  overflowButtonHoverColor: IrisGridTheme['overflow-button-hover-color'],
});

export default theme;
