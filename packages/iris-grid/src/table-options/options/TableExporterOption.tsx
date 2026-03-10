import React, { useCallback } from 'react';
import { vsCloudDownload } from '@deephaven/icons';
import type { GridRange } from '@deephaven/grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { TableCsvExporter } from '../../sidebar';
import { useTableOptionsHost } from '../TableOptionsHostContext';
import type {
  TableOption,
  TableOptionPanelProps,
  GridStateSnapshot,
} from '../TableOption';

/**
 * Panel component for Table CSV Exporter option.
 * Wraps the existing TableCsvExporter component.
 *
 * Download state (isDownloading, progress, status) is managed by IrisGrid
 * and passed through gridState. This keeps the state management centralized.
 */
function TableExporterPanel(_props: TableOptionPanelProps): JSX.Element {
  const { gridState, dispatch } = useTableOptionsHost();
  const {
    model,
    name = '',
    userColumnWidths = new Map(),
    movedColumns,
    isTableDownloading = false,
    tableDownloadStatus = '',
    tableDownloadProgress = 0,
    tableDownloadEstimatedTime,
    selectedRanges = [],
  } = gridState;

  const handleDownloadStart = useCallback(() => {
    dispatch({ type: 'START_DOWNLOAD' });
  }, [dispatch]);

  const handleDownload = useCallback(
    (
      fileName: string,
      frozenTable: DhType.Table,
      tableSubscription: DhType.TableViewportSubscription,
      snapshotRanges: readonly GridRange[],
      modelRanges: readonly GridRange[],
      includeColumnHeaders: boolean,
      useUnformattedValues: boolean
    ) => {
      dispatch({
        type: 'DOWNLOAD_TABLE',
        fileName,
        frozenTable,
        tableSubscription,
        snapshotRanges,
        modelRanges,
        includeColumnHeaders,
        useUnformattedValues,
      });
    },
    [dispatch]
  );

  const handleCancel = useCallback(() => {
    dispatch({ type: 'CANCEL_DOWNLOAD' });
  }, [dispatch]);

  return (
    <TableCsvExporter
      model={model}
      name={name}
      userColumnWidths={userColumnWidths}
      movedColumns={movedColumns}
      isDownloading={isTableDownloading}
      tableDownloadStatus={tableDownloadStatus}
      tableDownloadProgress={tableDownloadProgress}
      tableDownloadEstimatedTime={tableDownloadEstimatedTime ?? 0}
      onDownload={handleDownload}
      onDownloadStart={handleDownloadStart}
      onCancel={handleCancel}
      selectedRanges={selectedRanges as readonly GridRange[]}
    />
  );
}

/**
 * Table Exporter option configuration.
 * Shows when export is available and user has download CSV permission.
 */
export const TableExporterOption: TableOption = {
  type: 'table-exporter',

  menuItem: {
    title: 'Download CSV',
    icon: vsCloudDownload,
    isAvailable: (gridState: GridStateSnapshot) =>
      gridState.model.isExportAvailable,
    order: 50,
  },

  Panel: TableExporterPanel,
};

export default TableExporterOption;
