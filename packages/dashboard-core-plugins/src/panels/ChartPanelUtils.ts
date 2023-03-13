import type { ChartPanelMetadata, ChartPanelTableMetadata } from './ChartPanel';

// eslint-disable-next-line import/prefer-default-export
export function isChartPanelTableMetadata(
  metadata: ChartPanelMetadata
): metadata is ChartPanelTableMetadata {
  return (metadata as ChartPanelTableMetadata).settings !== undefined;
}
