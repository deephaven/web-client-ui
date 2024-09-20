import type ChartModel from './ChartModel';
import type FigureChartModel from './FigureChartModel';

export default function isFigureChartModel(
  model: ChartModel
): model is FigureChartModel {
  return (model as FigureChartModel).setFigure !== undefined;
}
