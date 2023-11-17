import { DehydratedDashboardPanelProps } from '@deephaven/dashboard';
import type {
  ChartPanelMetadata,
  ChartPanelTableMetadata,
  ChartPanelFigureMetadata,
  GLChartPanelState,
} from './ChartPanel';

export function isChartPanelTableMetadata(
  metadata: ChartPanelMetadata
): metadata is ChartPanelTableMetadata {
  return (metadata as ChartPanelTableMetadata).settings !== undefined;
}

export function isChartPanelFigureMetadata(
  metadata: ChartPanelMetadata
): metadata is ChartPanelFigureMetadata {
  return (metadata as ChartPanelFigureMetadata).figure !== undefined;
}

export type DehydratedChartPanelProps = DehydratedDashboardPanelProps & {
  panelState?: GLChartPanelState;
};

export function isGLChartPanelState(
  panelState: unknown
): panelState is GLChartPanelState {
  if (panelState == null) return false;
  const { settings, tableSettings } = panelState as GLChartPanelState;
  return typeof settings === 'object' && typeof tableSettings === 'object';
}

export function isChartPanelDehydratedProps(
  props: DehydratedDashboardPanelProps
): props is DehydratedChartPanelProps {
  return (
    props != null &&
    isGLChartPanelState((props as DehydratedChartPanelProps).panelState)
  );
}
