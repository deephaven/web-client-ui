import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestUtils } from '@deephaven/utils';
import TableCsvExporter from './TableCsvExporter';
import IrisGridTestUtils from '../IrisGridTestUtils';

const COLUMN_NAMES = ['A', 'B', 'C', 'D'];
const TABLE = IrisGridTestUtils.makeTable(
  COLUMN_NAMES.map(name => IrisGridTestUtils.makeColumn(name)),
  100
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BAD_TABLE = new (dh as any).Table({});

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
  model = IrisGridTestUtils.makeModel(TABLE),
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
  const onDownloadStart = jest.fn();
  const onDownload = jest.fn();
  const onCancel = jest.fn();
  makeTableCsvExporterWrapper({ onDownloadStart, onDownload, onCancel });

  userEvent.click(screen.getByRole('button', { name: 'Download' }));
  expect(onDownloadStart).toHaveBeenCalledTimes(1);
  await TestUtils.flushPromises();
  expect(onDownload).toHaveBeenCalledTimes(1);
  expect(onCancel).not.toHaveBeenCalled();
});

it('cancels download when something goes wrong', async () => {
  const onDownloadStart = jest.fn();
  const onDownload = jest.fn();
  const onCancel = jest.fn();
  const model = IrisGridTestUtils.makeModel(BAD_TABLE);
  makeTableCsvExporterWrapper({
    onDownloadStart,
    onDownload,
    onCancel,
    model,
  });

  userEvent.click(screen.getByRole('button', { name: 'Download' }));
  expect(onDownloadStart).toHaveBeenCalled();
  await TestUtils.flushPromises();
  expect(onDownload).not.toHaveBeenCalled();
  expect(onCancel).toHaveBeenCalled();
});
