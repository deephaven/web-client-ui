import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dh from '@deephaven/jsapi-shim';
import { ThemeProvider } from '@deephaven/components';
import type { dh as DhType } from '@deephaven/jsapi-types';
import TableCsvExporter from './TableCsvExporter';
import IrisGridTestUtils from '../IrisGridTestUtils';
import { KeyedSelection, type GetKeyedModel } from '../KeyedSelection';
import type IrisGridModel from '../IrisGridModel';

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
  selection = null,
  userColumnWidths = IrisGridTestUtils.makeUserColumnWidths(),
  movedColumns = [],
  model = irisGridTestUtils.makeModel(TABLE),
} = {}) {
  return render(
    <ThemeProvider themes={[]}>
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
        selection={selection}
        userColumnWidths={userColumnWidths}
        movedColumns={movedColumns}
        model={model}
      />
    </ThemeProvider>
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

// ─── KeyedSelection export path ──────────────────────────────────────────────

const KEYED_MODEL_STUB = {
  selectionKeyColumnIndices: [0] as readonly number[],
  hasUniqueSelectionKeys: true,
  columnCount: COLUMN_NAMES.length,
  rowCount: 100,
  valueForCell: () => null,
  viewport: null,
};
const getKeyedModel: GetKeyedModel = () => KEYED_MODEL_STUB as never;

/** Minimal frozen-table stub covering the calls handleDownloadClick makes on it. */
function makeFrozenTableStub(
  size: number
): DhType.Table & { close: jest.Mock; setViewport: jest.Mock } {
  const subscription = {
    getViewportData: jest.fn().mockResolvedValue({}),
  } as unknown as DhType.TableViewportSubscription;
  return {
    size,
    close: jest.fn(),
    setViewport: jest.fn(() => subscription),
  } as unknown as DhType.Table & { close: jest.Mock; setViewport: jest.Mock };
}

/** Minimal staging-table stub for `createFilteredByKeysTable` return value. */
function makeStagingTableStub(
  frozenTable: DhType.Table
): DhType.Table & { close: jest.Mock; freeze: jest.Mock } {
  return {
    close: jest.fn(),
    freeze: jest.fn().mockResolvedValue(frozenTable),
  } as unknown as DhType.Table & { close: jest.Mock; freeze: jest.Mock };
}

/**
 * Returns a model whose type asserts as `IrisGridModel & KeyedGridModel`, with
 * enough surface for the exporter's KeyedSelection branch and initial render.
 */
function makeKeyedModel(
  overrides: Partial<{
    createFilteredByKeysTable: jest.Mock;
    export: jest.Mock;
  }> = {}
): IrisGridModel {
  return {
    dh,
    rowCount: 100,
    columnCount: COLUMN_NAMES.length,
    selectionKeyColumnIndices: [0],
    hasUniqueSelectionKeys: true,
    createFilteredByKeysTable: jest.fn(),
    export: jest.fn(),
    ...overrides,
  } as unknown as IrisGridModel;
}

async function pickSelectedRowsThenDownload(
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  await user.click(screen.getByTestId('radio-csv-exporter-only-selected'));
  await user.click(screen.getByRole('button', { name: 'Download' }));
}

it('filters, freezes, and hands off frozenTable for a KeyedSelection', async () => {
  const user = userEvent.setup();
  const frozenTable = makeFrozenTableStub(3);
  const stagingTable = makeStagingTableStub(frozenTable);
  const createFilteredByKeysTable = jest.fn().mockResolvedValue(stagingTable);
  const model = makeKeyedModel({ createFilteredByKeysTable });

  const selectedKeyValues = new Map<string, readonly unknown[]>([
    ['[1]', [1]],
    ['[2]', [2]],
    ['[3]', [3]],
  ]);
  const selection = new KeyedSelection({
    getModel: getKeyedModel,
    selectedKeys: new Set(selectedKeyValues.keys()),
    selectedKeyValues,
  });

  const onDownload = jest.fn();
  const onDownloadStart = jest.fn();
  const onCancel = jest.fn();
  makeTableCsvExporterWrapper({
    model,
    selection,
    onDownload,
    onDownloadStart,
    onCancel,
  });

  await pickSelectedRowsThenDownload(user);

  expect(onDownloadStart).toHaveBeenCalled();
  await waitFor(() => expect(onDownload).toHaveBeenCalledTimes(1));
  expect(createFilteredByKeysTable).toHaveBeenCalledWith(
    selectedKeyValues,
    false
  );
  expect(stagingTable.freeze).toHaveBeenCalled();
  expect(onDownload).toHaveBeenCalledWith(
    expect.any(String),
    frozenTable,
    expect.anything(),
    expect.any(Array),
    expect.any(Array),
    expect.any(Boolean),
    expect.any(Boolean)
  );
  // Staging table is always closed; frozenTable is now owned by TableSaver.
  expect(stagingTable.close).toHaveBeenCalled();
  expect(frozenTable.close).not.toHaveBeenCalled();
  expect(onCancel).not.toHaveBeenCalled();
});

it('passes invertedSelection through to createFilteredByKeysTable', async () => {
  const user = userEvent.setup();
  const frozenTable = makeFrozenTableStub(97);
  const stagingTable = makeStagingTableStub(frozenTable);
  const createFilteredByKeysTable = jest.fn().mockResolvedValue(stagingTable);
  const model = makeKeyedModel({ createFilteredByKeysTable });

  const selectedKeyValues = new Map<string, readonly unknown[]>([
    ['[1]', [1]],
    ['[2]', [2]],
    ['[3]', [3]],
  ]);
  const selection = new KeyedSelection({
    getModel: getKeyedModel,
    selectedKeys: new Set(selectedKeyValues.keys()),
    selectedKeyValues,
    invertedSelection: true,
  });

  const onDownload = jest.fn();
  makeTableCsvExporterWrapper({ model, selection, onDownload });
  await pickSelectedRowsThenDownload(user);

  await waitFor(() => expect(onDownload).toHaveBeenCalled());
  expect(createFilteredByKeysTable).toHaveBeenCalledWith(
    selectedKeyValues,
    true
  );
});

it('cancels and closes both staging tables when the filter yields zero rows', async () => {
  const user = userEvent.setup();
  const frozenTable = makeFrozenTableStub(0);
  const stagingTable = makeStagingTableStub(frozenTable);
  const createFilteredByKeysTable = jest.fn().mockResolvedValue(stagingTable);
  const model = makeKeyedModel({ createFilteredByKeysTable });

  const selection = new KeyedSelection({
    getModel: getKeyedModel,
    selectedKeys: new Set(['[1]']),
    selectedKeyValues: new Map([['[1]', [1]]]),
  });

  const onDownload = jest.fn();
  const onCancel = jest.fn();
  makeTableCsvExporterWrapper({ model, selection, onDownload, onCancel });
  await pickSelectedRowsThenDownload(user);

  await waitFor(() => expect(onCancel).toHaveBeenCalled());
  expect(onDownload).not.toHaveBeenCalled();
  // Neither table was handed off — both must close.
  expect(stagingTable.close).toHaveBeenCalled();
  expect(frozenTable.close).toHaveBeenCalled();
});

it('cancels and closes the staging table when freeze rejects', async () => {
  const user = userEvent.setup();
  const stagingTable = makeStagingTableStub(makeFrozenTableStub(3));
  stagingTable.freeze.mockRejectedValue(new Error('freeze failed'));
  const createFilteredByKeysTable = jest.fn().mockResolvedValue(stagingTable);
  const model = makeKeyedModel({ createFilteredByKeysTable });

  const selection = new KeyedSelection({
    getModel: getKeyedModel,
    selectedKeys: new Set(['[1]']),
    selectedKeyValues: new Map([['[1]', [1]]]),
  });

  const onDownload = jest.fn();
  const onCancel = jest.fn();
  makeTableCsvExporterWrapper({ model, selection, onDownload, onCancel });
  await pickSelectedRowsThenDownload(user);

  await waitFor(() => expect(onCancel).toHaveBeenCalled());
  expect(onDownload).not.toHaveBeenCalled();
  expect(stagingTable.close).toHaveBeenCalled();
});

it('cancels and closes the staging table when createFilteredByKeysTable rejects', async () => {
  const user = userEvent.setup();
  const createFilteredByKeysTable = jest
    .fn()
    .mockRejectedValue(new Error('filter failed'));
  const model = makeKeyedModel({ createFilteredByKeysTable });

  const selection = new KeyedSelection({
    getModel: getKeyedModel,
    selectedKeys: new Set(['[1]']),
    selectedKeyValues: new Map([['[1]', [1]]]),
  });

  const onDownload = jest.fn();
  const onCancel = jest.fn();
  makeTableCsvExporterWrapper({ model, selection, onDownload, onCancel });
  await pickSelectedRowsThenDownload(user);

  await waitFor(() => expect(onCancel).toHaveBeenCalled());
  expect(onDownload).not.toHaveBeenCalled();
  expect(createFilteredByKeysTable).toHaveBeenCalled();
});
