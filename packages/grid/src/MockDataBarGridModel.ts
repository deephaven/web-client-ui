/* eslint-disable class-methods-use-this */
import { getOrThrow } from '@deephaven/utils';
import { CellRendererType } from './CellRenderer';
import { ModelIndex } from './GridMetrics';
import GridModel from './GridModel';
import GridTheme from './GridTheme';

const DEFAULT_AXIS: AxisOption = 'proportional';
const DEFAULT_POSITIVE_COLOR = GridTheme.positiveColor;
const DEFAULT_NEGATIVE_COLOR = GridTheme.negativeColor;
const DEFAULT_VALUE_PLACEMENT = 'beside';
const DEFAULT_DIRECTION = 'LTR';
const DEFAULT_TEXT_ALIGNMENT = 'right';

type Marker = { column: ModelIndex; color: string };

type AxisOption = 'proportional' | 'middle' | 'directional';
type ValuePlacementOption = 'beside' | 'overlap' | 'hide';
type DirectionOption = 'LTR' | 'RTL';
// Map from ModelIndex to the minimum number in the column
type MinMap = Map<ModelIndex, number>;
// Map from ModelIndex to the maximum number in the column
type MaxMap = Map<ModelIndex, number>;
// Map from ModelIndex to the axis option of the column
type ColumnAxisMap = Map<ModelIndex, AxisOption>;
/** Map from ModelIndex to a color */
type ColorMap = Map<ModelIndex, string>;
/** Map from ModelIndex to the value placement option of the column */
type ValuePlacementMap = Map<ModelIndex, ValuePlacementOption>;
/** Map from ModelIndex to the opacity of the column */
type OpacityMap = Map<ModelIndex, number>;
/** Map from ModelIndex to the direction of the column */
type DirectionMap = Map<ModelIndex, DirectionOption>;
/** Map from ModelIndex to the text alignment of the column */
type TextAlignmentMap = Map<ModelIndex, CanvasTextAlign>;
/** Map from column to the columns its markers are from */
type MarkerMap = Map<ModelIndex, Marker[]>;
/** Map from column to whether the bar has a gradient */
type GradientMap = Map<ModelIndex, boolean>;

function isArrayOfNumbers(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(item => typeof item === 'number');
}

export function isDataBarGridModel(
  model: GridModel
): model is MockDataBarGridModel {
  return (model as MockDataBarGridModel)?.columnAxes !== undefined;
}

class MockDataBarGridModel extends GridModel {
  private numberOfColumns;

  private numberOfRows;

  private data: unknown[][];

  private columnMin: MinMap;

  private columnMax: MaxMap;

  columnAxes: ColumnAxisMap;

  valuePlacements: ValuePlacementMap;

  directions: DirectionMap;

  positiveColors: ColorMap;

  negativeColors: ColorMap;

  // Opacities should be between 0 and 1
  opacities: OpacityMap;

  textAlignments: TextAlignmentMap;

  markers: MarkerMap;

  hasGradients: GradientMap;

  constructor(
    data: unknown[][],
    columnAxes = new Map(),
    positiveColors = new Map(),
    negativeColors = new Map(),
    valuePlacements = new Map(),
    opacities = new Map(),
    directions = new Map(),
    textAlignments = new Map(),
    markers: MarkerMap = new Map(),
    hasGradients: GradientMap = new Map()
  ) {
    super();

    this.positiveColors = positiveColors;
    this.negativeColors = negativeColors;
    this.data = data;
    this.columnAxes = columnAxes;
    this.valuePlacements = valuePlacements;
    this.opacities = opacities;
    this.directions = directions;
    this.textAlignments = textAlignments;
    this.markers = markers;
    this.numberOfRows = Math.max(...data.map(row => row.length));
    this.numberOfColumns = data.length;
    this.columnMin = new Map();
    this.columnMax = new Map();
    this.hasGradients = hasGradients;

    for (let i = 0; i < data.length; i += 1) {
      const column = data[i];
      if (isArrayOfNumbers(column)) {
        this.columnMin.set(i, Math.min(...column));
        this.columnMax.set(i, Math.max(...column));
      }
    }
  }

  minOfColumn(column: ModelIndex): number {
    return getOrThrow(this.columnMin, column);
  }

  maxOfColumn(column: ModelIndex): number {
    return getOrThrow(this.columnMax, column);
  }

  get rowCount() {
    return this.numberOfRows;
  }

  get columnCount() {
    return this.numberOfColumns;
  }

  textForCell(column: number, row: number): string {
    return `${this.data[column]?.[row]}`;
  }

  textForColumnHeader(column: number): string {
    return `${column}`;
  }

  textAlignForCell(column: number, row: number): CanvasTextAlign {
    return this.textAlignments.get(column) ?? DEFAULT_TEXT_ALIGNMENT;
  }

  rendererForCell(column: ModelIndex, row: ModelIndex): CellRendererType {
    return 'databar';
  }

  barColorForCell(column: ModelIndex, row: ModelIndex): string {
    const value = Number(this.data[column]?.[row]);
    if (value >= 0) {
      return this.positiveColorForCell(column, row);
    }
    return this.negativeColorForCell(column, row);
  }

  positiveColorForCell(column: ModelIndex, row: ModelIndex): string {
    return this.positiveColors.get(column) ?? DEFAULT_POSITIVE_COLOR;
  }

  negativeColorForCell(column: ModelIndex, row: ModelIndex): string {
    return this.negativeColors.get(column) ?? DEFAULT_NEGATIVE_COLOR;
  }

  axisForCell(column: ModelIndex, row: ModelIndex): AxisOption {
    return this.columnAxes.get(column) ?? DEFAULT_AXIS;
  }

  valuePlacementForCell(
    column: ModelIndex,
    row: ModelIndex
  ): ValuePlacementOption {
    return this.valuePlacements.get(column) ?? DEFAULT_VALUE_PLACEMENT;
  }

  opacityForCell(column: ModelIndex, row: ModelIndex): number {
    const opacity = this.opacities.get(column);
    if (opacity == null || opacity > 1) {
      return 1;
    }
    if (opacity < 0) {
      return 0;
    }
    return opacity;
  }

  directionForCell(column: ModelIndex, row: ModelIndex): DirectionOption {
    return this.directions.get(column) ?? DEFAULT_DIRECTION;
  }

  markersForColumn(column: ModelIndex): Marker[] {
    return this.markers.get(column) ?? [];
  }

  hasGradientForCell(column: ModelIndex, row: ModelIndex): boolean {
    return this.hasGradients.get(column) ?? false;
  }
}

export default MockDataBarGridModel;
