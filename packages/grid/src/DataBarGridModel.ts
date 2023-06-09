import { ModelIndex } from './GridMetrics';
import GridModel from './GridModel';
import { GridColor } from './GridTheme';

export type Marker = { column: ModelIndex; color: string };
export type AxisOption = 'proportional' | 'middle' | 'directional';
export type ValuePlacementOption = 'beside' | 'overlap' | 'hide';
export type DirectionOption = 'LTR' | 'RTL';
/** Map from ModelIndex to the axis option of the column */
export type ColumnAxisMap = Map<ModelIndex, AxisOption>;
/** Map from ModelIndex to a color or an array of colors
 * If given an array, then the bar will be a gradient
 * The colors should be given left to right (e.g. it should be like ['yellow', 'green'] for positive color and ['red', 'yellow'] for negative color)
 */
export type ColorMap = Map<ModelIndex, GridColor | GridColor[]>;
/** Map from ModelIndex to the value placement option of the column */
export type ValuePlacementMap = Map<ModelIndex, ValuePlacementOption>;
/** Map from ModelIndex to the opacity of the column */
export type OpacityMap = Map<ModelIndex, number>;
/** Map from ModelIndex to the direction of the column */
export type DirectionMap = Map<ModelIndex, DirectionOption>;
/** Map from ModelIndex to the text alignment of the column */
export type TextAlignmentMap = Map<ModelIndex, CanvasTextAlign>;
/** Map from column to the columns its markers are from */
export type MarkerMap = Map<ModelIndex, Marker[]>;
/** Map from column to whether the bar has a gradient */
export type GradientMap = Map<ModelIndex, boolean>;
// Map from ModelIndex to the minimum number in the column
export type MinMap = Map<ModelIndex, number>;
// Map from ModelIndex to the maximum number in the column
export type MaxMap = Map<ModelIndex, number>;

export interface DataBarOptions {
  columnMin: number;
  columnMax: number;
  axis: AxisOption;
  color: GridColor | GridColor[];
  valuePlacement: ValuePlacementOption;
  opacity: number;
  markers: Marker[];
  direction: DirectionOption;
  value: number;
}

export function isDataBarGridModel(
  model: GridModel
): model is DataBarGridModel {
  return (model as DataBarGridModel)?.dataBarOptionsForCell !== undefined;
}

export interface DataBarGridModel extends GridModel {
  dataBarOptionsForCell(column: ModelIndex, row: ModelIndex): DataBarOptions;
}
