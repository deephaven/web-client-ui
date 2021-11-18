/** A grid coordinate value */
export type Coordinate = number;

/** Coordinates of a box */
export type BoxCoordinates = {
  x1: Coordinate;
  y1: Coordinate;
  x2: Coordinate;
  y2: Coordinate;
};

/** The visible index of the item, eg. after moves are applied */
export type Index = number;

/** The model index of the item, eg. moves are not applied */
export type ModelIndex = number;

/** Map from an item index to it's coordinate */
export type CoordinateMap = Map<Index, Coordinate>;

/** Map from an item index to it's size */
export type SizeMap = Map<Index, number>;

/** Map from a ModelIndex to it's size */
export type ModelSizeMap = Map<ModelIndex, number>;

/** Map from visible Index to ModelIndex */
export type IndexModelMap = Map<Index, ModelIndex>;

/** Represents a move operation from one index to another */
export type MoveOperation = {
  from: Index;
  to: Index;
};

export type GridMetrics = {
  // Row/Column metrics from model
  rowHeight: number;
  rowHeaderWidth: number;
  rowFooterWidth: number;
  rowCount: number;
  columnWidth: number;
  columnCount: number;
  columnHeaderHeight: number;

  // Floating row and column counts
  floatingTopRowCount: number;
  floatingBottomRowCount: number;
  floatingLeftColumnCount: number;
  floatingRightColumnCount: number;

  // The grid offset from the top left
  gridX: Coordinate;
  gridY: Coordinate;

  // Index of non-hidden row/columns
  firstRow: Index;
  firstColumn: Index;

  // The amount of padding for tree (if applicable)
  treePaddingX: number;
  treePaddingY: number;

  // What viewport is currently visible, limited by data size
  left: Index;
  top: Index;
  bottom: Index;
  right: Index;
  topOffset: Coordinate;
  leftOffset: Coordinate;

  // Bottom and right that are fully visible, not overlapped by scroll bars or anything
  topVisible: Index;
  leftVisible: Index;
  bottomVisible: Index;
  rightVisible: Index;

  // Bottom and right of the viewport, not limited by data size
  bottomViewport: Index;
  rightViewport: Index;

  // Canvas width/height
  width: number;
  height: number;

  // Max x/y coordinate of the grid (does not include headers)
  maxX: Coordinate;
  maxY: Coordinate;

  // Last valid column/row that can be the left/top of the grid
  lastLeft: Index;
  lastTop: Index;

  // Scroll bar metrics
  barHeight: number;
  barWidth: number;
  handleHeight: number;
  handleWidth: number;
  hasHorizontalBar: boolean;
  hasVerticalBar: boolean;
  verticalBarWidth: number;
  horizontalBarHeight: number;

  // The vertical x/y scroll amount
  scrollX: number;
  scrollY: number;

  // Array of visible rows/columns, by grid index
  visibleRows: Index[];
  visibleColumns: Index[];

  // Array of floating rows/columns, by grid index
  floatingRows: Index[];
  floatingColumns: Index[];

  // Array of all rows/columns, visible and floating, by grid index
  allRows: Index[];
  allColumns: Index[];

  // Map of the height/width of visible rows/columns
  visibleRowHeights: SizeMap;
  visibleColumnWidths: SizeMap;

  // Floating metrics
  floatingTopHeight: number;
  floatingBottomHeight: number;
  floatingLeftWidth: number;
  floatingRightWidth: number;

  // Map of the X/Y coordinates of the rows/columns, from the top left of the grid
  visibleRowYs: CoordinateMap;
  visibleColumnXs: CoordinateMap;

  // The boxes user can click on for expanding/collapsing tree rows
  visibleRowTreeBoxes: Map<Index, BoxCoordinates>;

  // Mapping from visible row indexes to the model row/columns they pull from
  modelRows: IndexModelMap;
  modelColumns: IndexModelMap;

  // Map of the width of the fonts
  fontWidths: Map<string, number>;

  // Map of user set column/row width/height
  userColumnWidths: ModelSizeMap;
  userRowHeights: ModelSizeMap;

  // Map of calculated row/column height/width
  calculatedRowHeights: ModelSizeMap;
  calculatedColumnWidths: ModelSizeMap;
};

export default GridMetrics;
