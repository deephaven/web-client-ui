/** A color parsed as CSS color value, eg. '#FF0000' */
export type GridColor = string;

/** A nullable color, eg. pass `null` to skip drawing this item */
export type NullableGridColor = GridColor | null;

/** One or more colors parsed as CSS color value separated by space, eg. '#FF0000 #00FF00' */
export type GridColorWay = string;

/** A font parsed as CSS font value */
export type GridFont = string;

export type GridTheme = {
  // Allow column/row resizing
  allowColumnResize: boolean;
  allowRowResize: boolean;

  // Select the full row/column upon selection
  autoSelectRow: boolean;
  autoSelectColumn: boolean;

  // Automatically size rows/columns to fit contents
  autoSizeColumns: boolean;
  autoSizeRows: boolean;

  // The background color for the whole grid
  backgroundColor: GridColor;

  // Color to draw text
  textColor: GridColor;
  hyperlinkColor: GridColor;

  // Black and white to use if needed
  black: GridColor;
  white: GridColor;

  // Amount of padding within a cell and header
  cellHorizontalPadding: number;
  headerHorizontalPadding: number;

  // The font to use in the grid
  font: GridFont;

  // Colors to draw grid lines between columns and rows
  gridColumnColor: NullableGridColor;
  gridRowColor: NullableGridColor;

  // Colors for drawing the column and row headers
  headerBackgroundColor: GridColor;
  headerSeparatorColor: GridColor;
  headerSeparatorHoverColor: GridColor;
  headerSeparatorHandleSize: number;
  headerHiddenSeparatorSize: number;
  headerHiddenSeparatorHoverColor: GridColor;
  headerColor: GridColor;
  headerFont: GridFont;

  // Background color to highlight entire column/row if set
  columnHoverBackgroundColor: NullableGridColor;
  selectedColumnHoverBackgroundColor: NullableGridColor;
  rowHoverBackgroundColor: NullableGridColor;
  selectedRowHoverBackgroundColor: NullableGridColor;

  // Background colors to draw for each row, cycling through each value (eg. alternating stripes)
  rowBackgroundColors: GridColorWay;

  // Scroll bar look and sizing
  minScrollHandleSize: number;
  scrollBarBackgroundColor: GridColor;
  scrollBarHoverBackgroundColor: GridColor;
  scrollBarCasingColor: GridColor;
  scrollBarCornerColor: GridColor;
  scrollBarColor: GridColor;
  scrollBarHoverColor: GridColor;
  scrollBarActiveColor: GridColor;
  scrollBarSize: number;
  scrollBarHoverSize: number;
  scrollBarCasingWidth: number;
  scrollSnapToColumn: boolean;
  scrollSnapToRow: boolean;

  scrollBarSelectionTick: boolean;
  scrollBarSelectionTickColor: NullableGridColor;
  scrollBarActiveSelectionTickColor: NullableGridColor;

  // Look of the current selection
  selectionColor: GridColor;
  selectionOutlineColor: GridColor;
  selectionOutlineCasingColor: GridColor;

  // Shadows to draw when representing a hierarchy, eg. when one row is a higher "depth" than the row above it
  shadowBlur: number;
  shadowColor: GridColor;
  maxDepth: number; // max depth of the shadowing

  // Other tree table metrics
  treeDepthIndent: number;
  treeHorizontalPadding: number;
  treeLineColor: GridColor;
  treeMarkerColor: GridColor;
  treeMarkerHoverColor: GridColor;

  // Default row height/column width
  rowHeight: number;
  columnWidth: number;
  minRowHeight: number;
  minColumnWidth: number;

  // Default row/column header/footers width/height
  columnHeaderHeight: number;
  rowHeaderWidth: number;
  rowFooterWidth: number;

  // When resizing the header, will snap to the auto size of the header within this threshold
  headerResizeSnapThreshold: number;
  headerResizeHiddenSnapThreshold: number;

  // Allow moving/reordering columns/rows
  allowColumnReorder: boolean;
  allowRowReorder: boolean;

  // The number of pixels to offset a column/row while it is being dragged to move
  reorderOffset: number;

  // Colors for the grid in floating sections
  floatingGridColumnColor: NullableGridColor;
  floatingGridRowColor: NullableGridColor;

  // Background row colors for grid in the floating sections
  floatingRowBackgroundColors: GridColorWay;

  // Divider colors between the floating parts and the grid
  floatingDividerOuterColor: GridColor;
  floatingDividerInnerColor: GridColor;

  zeroLineColor: GridColor;
  positiveBarColor: GridColor;
  negativeBarColor: GridColor;
};

/**
 * Default theme for a Grid.
 */
const defaultTheme: GridTheme = Object.freeze({
  allowColumnResize: true,
  allowRowResize: true,
  autoSelectRow: false, // Select the full row upon selection
  autoSelectColumn: false, // Select the full column upon selection
  autoSizeColumns: true, // Automatically size the columns to fit content
  autoSizeRows: true,
  backgroundColor: '#000000',
  black: '#000000',
  white: '#ffffff',
  cellHorizontalPadding: 5,
  headerHorizontalPadding: 5,
  font: '12px Arial, sans serif',
  gridColumnColor: '#8f8f8f66',
  gridRowColor: '#8f8f8f66',
  headerBackgroundColor: '#222222',
  headerSeparatorColor: '#000000',
  headerSeparatorHoverColor: '#888888',
  headerSeparatorHandleSize: 5,
  headerHiddenSeparatorSize: 5,
  headerHiddenSeparatorHoverColor: '#8888FF',
  headerColor: '#d5d5d5',
  headerFont: '10px Arial, sans serif',
  columnHoverBackgroundColor: '#444444',
  selectedColumnHoverBackgroundColor: '#494949',
  rowBackgroundColors: '#333333 #222222',
  rowHoverBackgroundColor: '#444444',
  selectedRowHoverBackgroundColor: '#494949',
  minScrollHandleSize: 50,
  scrollBarBackgroundColor: '#111111',
  scrollBarHoverBackgroundColor: '#333333',
  scrollBarCasingColor: '#000000',
  scrollBarCornerColor: '#000000',
  scrollBarColor: '#555555',
  scrollBarHoverColor: '#888888',
  scrollBarActiveColor: '#AAAAAA',
  scrollBarSize: 12,
  scrollBarHoverSize: 16,
  scrollBarCasingWidth: 1,
  scrollSnapToColumn: false,
  scrollSnapToRow: false,
  selectionColor: '#4286f433',
  selectionOutlineColor: '#4286f4',
  selectionOutlineCasingColor: '#222222',
  scrollBarSelectionTick: true,
  scrollBarSelectionTickColor: '#4286f433',
  scrollBarActiveSelectionTickColor: '#4286f480',
  shadowBlur: 8,
  shadowColor: '#000000',
  textColor: '#ffffff',
  hyperlinkColor: '#4878ea',
  maxDepth: 6,
  treeDepthIndent: 10,
  treeHorizontalPadding: 5,
  treeLineColor: '#888888',
  treeMarkerColor: '#cccccc',
  treeMarkerHoverColor: '#ffffff',

  rowHeight: 20,
  columnWidth: 100,
  minRowHeight: 20,
  minColumnWidth: 55,
  columnHeaderHeight: 20,
  rowHeaderWidth: 30,
  rowFooterWidth: 0,

  // When resizing the header, will snap to the auto size of the header within this threshold
  headerResizeSnapThreshold: 10,
  headerResizeHiddenSnapThreshold: 8,

  allowColumnReorder: true,
  allowRowReorder: true,
  reorderOffset: 2,

  // Colors for the grid in floating sections
  floatingGridColumnColor: '#8f8f8f66',
  floatingGridRowColor: '#8f8f8f66',

  // Background row colors for grid in the floating sections
  floatingRowBackgroundColors: '#393939 #292929',

  // Divider colors between the floating parts and the grid
  floatingDividerOuterColor: '#000000',
  floatingDividerInnerColor: '#cccccc',

  // Databar
  zeroLineColor: '#888888',
  positiveBarColor: '#00ff00',
  negativeBarColor: '#ff0000',
});

export default defaultTheme;
