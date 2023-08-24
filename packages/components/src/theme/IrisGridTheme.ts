// TODO NEEDS TYPE DEFINITIONS WITHOUT CREATING A CYCLIC DEPENDENCY

const IrisGridTheme = Object.freeze({
  backgroundColor: '--spectrum-gray-50',
  white: '--spectrum-global-color-static-white',
  black: '--spectrum-global-color-static-black',
  font: '12px Fira Sans, Helvetica, Arial, sans-serif',

  headerBackgroundColor: '--spectrum-gray-100',
  headerColor: '--spectrum-alias-heading-text-color',
  headerSeparatorColor: '--spectrum-gray-50',
  headerSeparatorHoverColor: '--spectrum-gray-600',
  headerHiddenSeparatorHoverColor: '--spectrum-accent-color-700',
  headerSortBarColor: '--spectrum-purple-visual-color',
  headerReverseBarColor: '--spectrum-green-visual-color',
  headerBarCasingColor: '--spectrum-gray-50',
  headerFont: '600 12px Fira Sans, Helvetica, Arial, sans-serif',

  rowBackgroundColors: '--spectrum-gray-200 --spectrum-gray-100',
  rowHoverBackgroundColor: '--spectrum-alias-highlight-hover',
  selectionColor: '--spectrum-alias-highlight-selected',
  selectionOutlineColor: '--spectrum-accent-color-900',
  selectionOutlineCasingColor: '--spectrum-gray-50',
  selectedRowHoverBackgroundColor: '--spectrum-alias-highlight-selected-hover',

  scrollBarBackgroundColor: '--spectrum-gray-100',
  scrollBarHoverBackgroundColor: '--spectrum-gray-200',
  scrollBarCasingColor: '--spectrum-gray-400',
  scrollBarCornerColor: '--spectrum-gray-100',
  scrollBarColor: '--spectrum-gray-500',
  scrollBarHoverColor: '--spectrum-gray-600',
  scrollBarActiveColor: '--spectrum-gray-700',
  scrollBarSelectionTickColor: '--spectrum-alias-highlight-selected-hover',
  scrollBarActiveSelectionTickColor: '--spectrum-accent-color-400',

  textColor: '--spectrum-alias-text-color',
  hyperlinkColor: '--spectrum-accent-color-1000',
  positiveNumberColor: '--spectrum-positive-visual-color',
  negativeNumberColor: '--spectrum-negative-visual-color',
  zeroNumberColor: '--spectrum-notice-visual-color',
  dateColor: '--spectrum-notice-visual-color',
  pendingTextColor: '--spectrum-yellow-1300',
  errorTextColor: '--spectrum-negative-visual-color',
  nullStringColor: '--spectrum-alias-text-color-disabled',

  filterBarActiveBackgroundColor: '--spectum-accent-color-300',
  filterBarExpandedBackgroundColor: '--spectrum-gray-200',
  filterBarExpandedActiveBackgroundColor: '--spectum-accent-color-100',
  filterBarExpandedActiveCellBackgroundColor: '--spectum-accent-color-200',
  filterBarSeparatorColor: '--spectrum-gray-600',
  filterBarActiveColor: '--spectrum-accent-color-600',
  filterBarErrorColor: '--spectrum-negative-visual-color',
  filterIconColor: '--spectrum-accent-color-600',

  scrimColor: '--spectrum-gray-50',
  contextMenuSortIconColor: '--spectrum-purple-visual-color',
  contextMenuReverseIconColor: '--spectrum-green-visual-color',

  allowRowResize: false,
  autoSelectRow: true,
  gridColumnColor: null,
  gridRowColor: null,
  groupedColumnDividerColor: '--spectrum-gray-50',
  columnHoverBackgroundColor: null,
  headerHorizontalPadding: 12,
  scrollBarSize: 13,
  scrollBarHoverSize: 16, // system default scrollbar width is 17
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

  linkerColumnHoverBackgroundColor: '--spectrum-alias-highlight-selected-hover',

  treeLineColor: '--spectrum-gray-700',
  treeMarkerColor: '--spectrum-gray-800',
  treeMarkerHoverColor: '--spectrum-gray-900',

  floatingGridColumnColor: null,
  floatingGridRowColor: '--spectrum-gray-300',
  floatingRowBackgroundColors: '--spectrum-gray-200',
  floatingDividerInnerColor: '--spectrum-gray-200',
  floatingDividerOuterColor: '--spectrum-gray-50',

  overflowButtonColor: '--spectrum-gray-700',
  overflowButtonHoverColor: '--spectrum-gray-900',

  zeroLineColor: '--spectrum-gray-300',
  positiveBarColor: '--spectrum-positive-visual-color',
  negativeBarColor: '--spectrum-negative-visual-color',
});

export default IrisGridTheme;
