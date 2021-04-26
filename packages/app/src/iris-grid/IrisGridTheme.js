import IrisGridTheme from './IrisGridTheme.module.scss';

export default Object.freeze({
  backgroundColor: IrisGridTheme['grid-bg'],
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
  textColor: IrisGridTheme['text-color'],
  positiveNumberColor: IrisGridTheme['positive-number-color'],
  negativeNumberColor: IrisGridTheme['negative-number-color'],
  zeroNumberColor: IrisGridTheme['zero-number-color'],
  dateColor: IrisGridTheme['date-color'],
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
  scrollBarSize: 11,
  scrollBarHoverSize: 15, // system default scrollbar width is 17
  minScrollHandleSize: 24,
  rowHeight: 19,
  columnWidth: 100,
  rowHeaderWidth: 0,
  rowFooterWidth: 60,
  columnHeaderHeight: 30,
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
});
