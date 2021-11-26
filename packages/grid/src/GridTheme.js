/**
 * Default theme for a Grid.
 */
export default Object.freeze({
  allowColumnResize: true,
  allowRowResize: true,
  autoSelectRow: false, // Select the full row upon selection
  autoSelectColumn: false, // Select the full column upon selection
  autoSizeColumns: true, // Automatically size the columns to fit content
  autoSizeRows: true,
  backgroundColor: '#000000',
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
  shadowBlur: 8,
  shadowColor: '#000000',
  textColor: '#ffffff',
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
});
