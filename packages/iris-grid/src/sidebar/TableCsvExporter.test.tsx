import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TableCsvExporter from './TableCsvExporter';
import IrisGridTestUtils from '../IrisGridTestUtils';

const COLUMN_NAMES = ['A', 'B', 'C', 'D'];

function makeTableCsvExporterWrapper({
  name = 'TEST',
  isDownloading = false,
  tableDownloadStatus = '',
  tableDownloadProgress = 0,
  tableDownloadEstimatedTime = undefined,
  onDownloadStart = () => null,
  onDownload = (
    fileName = null,
    frozenTable = null,
    tableSubscription = null,
    snapshotRanges = null
  ) => null,
  onCancel = () => null,
  selectedRanges = [],
  model = IrisGridTestUtils.makeModel(
    IrisGridTestUtils.makeTable(
      // eslint-disable-next-line @typescript-eslint/no-shadow
      COLUMN_NAMES.map(name => IrisGridTestUtils.makeColumn(name))
    )
  ),
} = {}) {
  return render(
    <TableCsvExporter
      name={name}
      isDownloading={isDownloading}
      tableDownloadStatus={tableDownloadStatus}
      tableDownloadProgress={tableDownloadProgress}
      tableDownloadEstimatedTime={tableDownloadEstimatedTime}
      onDownloadStart={onDownloadStart}
      onDownload={onDownload}
      onCancel={onCancel}
      selectedRanges={selectedRanges}
      model={model}
    />
  );
}

it('renders without crashing', () => {
  makeTableCsvExporterWrapper();
});

it('downloads properly with default settings', async () => {
  makeTableCsvExporterWrapper();
  userEvent.click(screen.getByRole('button', { name: 'Download' }));
  await new Promise(r => setTimeout(r, 2000));
  const successMessage = screen.getAllByText('Download Completed');
  expect(successMessage).toHaveLength(1);
});
