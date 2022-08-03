// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import ChartModel from './ChartModel';
import FigureChartModel from './FigureChartModel';

export default function isFigureChartModel(
  model: ChartModel
): model is FigureChartModel {
  return (model as FigureChartModel).setFigure !== undefined;
}
