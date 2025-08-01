import Dashboard from './Dashboard';

export default Dashboard;

export * from './Dashboard';
export * from './DashboardConstants';
export * from './DashboardEvents';
export * from './DashboardPlugin';
export * from './DashboardLayout';
export * from './DashboardUtils';
export { default as DashboardUtils } from './DashboardUtils';
export * from './LazyDashboard';
export * from './layout';
export * from './redux';
export {
  type BasePanelProps,
  default as BasePanel,
  // Alias for BasePanel
  default as Panel,
} from './BasePanel';
export * from './PanelManager';
export * from './PanelEvent';
export * from './NavigationEvent';
export { default as PanelErrorBoundary } from './PanelErrorBoundary';
export { default as PanelManager } from './PanelManager';
export { default as TabEvent } from './TabEvent';
export * from './useDashboardId';
export * from './useDhId';
export * from './usePanelId';
