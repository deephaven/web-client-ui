import { PanelMetadata } from '@deephaven/dashboard';

/**
 * @deprecated use `IrisGridPanelMetadata` instead
 */
export interface LegacyIrisGridPanelMetadata {
  table: string;
  type?: string;
}

export type IrisGridPanelMetadata = {
  name: string;
  type: string;
};

export function isLegacyIrisGridPanelMetadata(
  metadata?: PanelMetadata
): metadata is LegacyIrisGridPanelMetadata {
  if (metadata == null) return false;
  const irisGridPanelMetadata = metadata as LegacyIrisGridPanelMetadata;
  return typeof irisGridPanelMetadata.table === 'string';
}

export function isIrisGridPanelMetadata(
  metadata?: PanelMetadata
): metadata is IrisGridPanelMetadata {
  if (metadata == null) return false;
  const irisGridPanelMetadata = metadata as IrisGridPanelMetadata;
  return typeof irisGridPanelMetadata.name === 'string';
}
