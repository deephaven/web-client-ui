import dh from '@deephaven/jsapi-shim';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { Formatter } from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/test-utils';
import TableSaver from './TableSaver';
import IrisGridTestUtils from '../IrisGridTestUtils';

const irisGridTestUtils = new IrisGridTestUtils(dh);
const COLUMNS = [
  irisGridTestUtils.makeColumn('A', 'java.lang.String', 0),
  irisGridTestUtils.makeColumn('B', 'java.lang.String', 1),
];
const ROWS = [0, 1, 2];
const EXPECTED_CSV = '"0-A","0-B"\n"1-A","1-B"\n"2-A","2-B"\n';

function makeTableSaver(): TableSaver {
  const tableSaver = new TableSaver({
    dh,
    getDownloadWorker: jest.fn(),
    isDownloading: false,
    onDownloadCompleted: jest.fn(),
    onDownloadCanceled: jest.fn(),
    onDownloadProgressUpdate: jest.fn(),
    formatter: new Formatter(dh),
  });
  tableSaver.columns = COLUMNS;
  tableSaver.useUnformattedValues = true;
  return tableSaver;
}

function makeSnapshot(iterator: unknown): DhType.SubscriptionTableData {
  return TestUtils.createMockProxy<DhType.SubscriptionTableData>({
    added: TestUtils.createMockProxy<DhType.RangeSet>({
      iterator: () => iterator as ReturnType<DhType.RangeSet['iterator']>,
    }),
    getData: jest.fn(
      (row: unknown, column: DhType.Column) => `${row}-${column.name}`
    ),
  });
}

describe('convertSnapshotIntoCsv', () => {
  it('reads rows from an iterator with hasNext', () => {
    let index = 0;
    // Older JS API iterators report `done` incorrectly, so only `hasNext` can be trusted
    const iterator = {
      hasNext: () => index < ROWS.length,
      next: () => {
        const value = ROWS[index];
        index += 1;
        return { value, done: index < ROWS.length };
      },
    };

    expect(
      makeTableSaver().convertSnapshotIntoCsv(makeSnapshot(iterator))
    ).toBe(EXPECTED_CSV);
  });

  it('reads rows from a standard JS iterator without hasNext', () => {
    expect(
      makeTableSaver().convertSnapshotIntoCsv(
        makeSnapshot(ROWS[Symbol.iterator]())
      )
    ).toBe(EXPECTED_CSV);
  });
});
