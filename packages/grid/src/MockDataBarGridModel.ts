/* eslint-disable class-methods-use-this */
import { getOrThrow } from '@deephaven/utils';
import { CellRenderType } from './CellRenderer';
import {
  AxisOption,
  ColorMap,
  ColumnAxisMap,
  DataBarGridModel,
  DataBarOptions,
  DirectionMap,
  MarkerMap,
  MaxMap,
  MinMap,
  OpacityMap,
  TextAlignmentMap,
  ValuePlacementMap,
} from './DataBarGridModel';
import { ModelIndex } from './GridMetrics';
import GridModel from './GridModel';
import GridTheme from './GridTheme';

const DEFAULT_AXIS: AxisOption = 'proportional';
const DEFAULT_POSITIVE_COLOR = GridTheme.positiveBarColor;
const DEFAULT_NEGATIVE_COLOR = GridTheme.negativeBarColor;
const DEFAULT_VALUE_PLACEMENT = 'beside';
const DEFAULT_DIRECTION = 'LTR';
const DEFAULT_TEXT_ALIGNMENT = 'right';

function isArrayOfNumbers(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(item => typeof item === 'number');
}

class MockDataBarGridModel extends GridModel implements DataBarGridModel {
  private numberOfColumns;

  private numberOfRows;

  private data: unknown[][];

  columnMins: MinMap;

  columnMaxs: MaxMap;

  columnAxes: ColumnAxisMap;

  valuePlacements: ValuePlacementMap;

  directions: DirectionMap;

  positiveColors: ColorMap;

  negativeColors: ColorMap;

  // Opacities should be between 0 and 1
  opacities: OpacityMap;

  textAlignments: TextAlignmentMap;

  markers: MarkerMap;

  constructor(
    data: unknown[][],
    columnAxes = new Map(),
    positiveColors = new Map(),
    negativeColors = new Map(),
    valuePlacements = new Map(),
    opacities = new Map(),
    directions = new Map(),
    textAlignments = new Map(),
    markers: MarkerMap = new Map()
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
    this.columnMins = new Map();
    this.columnMaxs = new Map();

    for (let i = 0; i < data.length; i += 1) {
      const column = data[i];
      if (isArrayOfNumbers(column)) {
        this.columnMins.set(i, Math.min(...column));
        this.columnMaxs.set(i, Math.max(...column));
      }
    }
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

  renderTypeForCell(column: ModelIndex, row: ModelIndex): CellRenderType {
    if (column < 20) {
      return 'dataBar';
    }
    return column % 2 === row % 2 ? 'dataBar' : 'text';
  }

  dataBarOptionsForCell(column: ModelIndex, row: ModelIndex): DataBarOptions {
    const columnMin = getOrThrow(this.columnMins, column);
    const columnMax = getOrThrow(this.columnMaxs, column);
    const axis = this.columnAxes.get(column) ?? DEFAULT_AXIS;
    const valuePlacement =
      this.valuePlacements.get(column) ?? DEFAULT_VALUE_PLACEMENT;
    let opacity = this.opacities.get(column);
    if (opacity == null || opacity > 1) {
      opacity = 1;
    } else if (opacity < 0) {
      opacity = 0;
    }
    const direction = this.directions.get(column) ?? DEFAULT_DIRECTION;
    const positiveColor =
      this.positiveColors.get(column) ?? DEFAULT_POSITIVE_COLOR;
    const negativeColor =
      this.negativeColors.get(column) ?? DEFAULT_NEGATIVE_COLOR;

    const value = Number(this.data[column]?.[row]);
    const color = value >= 0 ? positiveColor : negativeColor;
    const markers = this.markers.get(column) ?? [];

    return {
      columnMin,
      columnMax,
      axis,
      color,
      valuePlacement,
      opacity,
      markers,
      direction,
      value,
    };
  }
}

export default MockDataBarGridModel;
