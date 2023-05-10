import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dh from '@deephaven/jsapi-shim';
import TableCsvExporter from './TableCsvExporter';
import IrisGridTestUtils from '../IrisGridTestUtils';

const irisGridTestUtils = new IrisGridTestUtils(dh);
const COLUMN_NAMES = ['A', 'B', 'C', 'D'];
const TABLE = irisGridTestUtils.makeTable({
  columns: COLUMN_NAMES.map(name => irisGridTestUtils.makeColumn(name)),
  size: 100,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BAD_TABLE = irisGridTestUtils.makeTable({
  columns: COLUMN_NAMES.map(name => irisGridTestUtils.makeColumn(name)),
  size: 100,
});
BAD_TABLE.freeze = jest.fn(() =>
  Promise.reject(new Error('Test invalid error'))
);

function makeTableCsvExporterWrapper({
  name = 'TEST',
  isDownloading = false,
  tableDownloadStatus = '',
  tableDownloadProgress = 0,
  tableDownloadEstimatedTime = undefined,
  onDownloadStart = jest.fn(),
  onDownload = jest.fn(),
  onCancel = jest.fn(),
  selectedRanges = [],
  userColumnWidths = IrisGridTestUtils.makeUserColumnWidths(),
  movedColumns = [],
  model = irisGridTestUtils.makeModel(TABLE),
} = {}) {
  return render(
    <TableCsvExporter
      dh={dh}
      name={name}
      isDownloading={isDownloading}
      tableDownloadStatus={tableDownloadStatus}
      tableDownloadProgress={tableDownloadProgress}
      tableDownloadEstimatedTime={tableDownloadEstimatedTime}
      onDownloadStart={onDownloadStart}
      onDownload={onDownload}
      onCancel={onCancel}
      selectedRanges={selectedRanges}
      userColumnWidths={userColumnWidths}
      movedColumns={movedColumns}
      model={model}
    />
  );
}

it('renders without crashing', () => {
  makeTableCsvExporterWrapper();
});

it('downloads properly with default settings', async () => {
  const user = userEvent.setup();
  const onDownloadStart = jest.fn();
  const onDownload = jest.fn();
  const onCancel = jest.fn();
  makeTableCsvExporterWrapper({ onDownloadStart, onDownload, onCancel });

  await user.click(screen.getByRole('button', { name: 'Download' }));
  expect(onDownloadStart).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(onDownload).toHaveBeenCalledTimes(1));
  expect(onCancel).not.toHaveBeenCalled();
});

it('cancels download when something goes wrong', async () => {
  const user = userEvent.setup();
  const onDownloadStart = jest.fn();
  const onDownload = jest.fn();
  const onCancel = jest.fn();
  const model = irisGridTestUtils.makeModel(BAD_TABLE);
  makeTableCsvExporterWrapper({
    onDownloadStart,
    onDownload,
    onCancel,
    model,
  });

  await user.click(screen.getByRole('button', { name: 'Download' }));
  expect(onDownloadStart).toHaveBeenCalled();
  expect(onDownload).not.toHaveBeenCalled();
  await waitFor(() => expect(onCancel).toHaveBeenCalled());
});
