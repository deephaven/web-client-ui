import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GridTestUtils } from '@deephaven/grid';
import { TestUtils } from '@deephaven/utils';
import { ContextActionUtils } from '@deephaven/components';
import IrisGridTestUtils from './IrisGridTestUtils';
import IrisGridCopyHandler from './IrisGridCopyHandler';

jest.useFakeTimers();

const DEFAULT_EXPECTED_TEXT = `0,0\t0,1\t0,2\t0,3\t0,4
1,0\t1,1\t1,2\t1,3\t1,4
2,0\t2,1\t2,2\t2,3\t2,4
3,0\t3,1\t3,2\t3,3\t3,4
4,0\t4,1\t4,2\t4,3\t4,4`;

function makeSnapshotFn() {
  return jest.fn(() => Promise.resolve(DEFAULT_EXPECTED_TEXT));
}

function makeCopyOperation(
  ranges = GridTestUtils.makeRanges(),
  includeHeaders = false,
  movedColumns = [],
  userColumnWidths = IrisGridTestUtils.makeUserColumnWidths()
) {
  return {
    ranges,
    includeHeaders,
    movedColumns,
    userColumnWidths,
  };
}

function makeModel() {
  const model = IrisGridTestUtils.makeModel();
  model.textSnapshot = makeSnapshotFn();
  return model;
}

function mountCopySelection({
  model = makeModel(),
  copyOperation = makeCopyOperation(),
} = {}) {
  return render(
    <IrisGridCopyHandler model={model} copyOperation={copyOperation} />
  );
}

let copyToClipboard = null;
let copyPromise = null;

beforeEach(() => {
  ({ copyToClipboard } = ContextActionUtils);
  copyPromise = Promise.resolve(DEFAULT_EXPECTED_TEXT);
  ContextActionUtils.copyToClipboard = jest.fn(() => copyPromise);
});

afterEach(() => {
  ContextActionUtils.copyToClipboard = copyToClipboard;
});

it('renders without crashing', () => {
  mountCopySelection();
});

it('copies immediately if less than 10,000 rows of data', async () => {
  const ranges = GridTestUtils.makeRanges(1, 10000);
  const copyOperation = makeCopyOperation(ranges);
  const model = makeModel();
  mountCopySelection({ copyOperation, model });

  expect(screen.getAllByRole('img', { hidden: true }).length).toBe(2);
  expect(screen.getByText('Fetching 10,000 rows for clipboard...'));
  expect(model.textSnapshot).toHaveBeenCalled();

  await TestUtils.flushPromises();

  expect(ContextActionUtils.copyToClipboard).toHaveBeenCalledWith(
    DEFAULT_EXPECTED_TEXT
  );
});

it('prompts to copy if more than 10,000 rows of data', async () => {
  const model = makeModel();
  const ranges = GridTestUtils.makeRanges(1, 10001);
  const copyOperation = makeCopyOperation(ranges);
  mountCopySelection({ copyOperation, model });
  const copyBtn = screen.getByText('Copy');
  expect(copyBtn).toBeTruthy();
  expect(
    screen.getByText(
      'Are you sure you want to copy 10,001 rows to your clipboard?'
    )
  );
  expect(model.textSnapshot).not.toHaveBeenCalled();
  expect(ContextActionUtils.copyToClipboard).not.toHaveBeenCalled();

  userEvent.click(copyBtn);

  expect(screen.getByText('Fetching 10,001 rows for clipboard...'));
  expect(model.textSnapshot).toHaveBeenCalled();

  await TestUtils.flushPromises();

  expect(ContextActionUtils.copyToClipboard).toHaveBeenCalledWith(
    DEFAULT_EXPECTED_TEXT
  );
});

it('shows click to copy if async copy fails', async () => {
  const error = new Error('Test copy error');
  copyPromise = Promise.reject(error);
  ContextActionUtils.copyToClipboard = jest.fn(() => copyPromise);

  const ranges = GridTestUtils.makeRanges();
  const copyOperation = makeCopyOperation(ranges);
  mountCopySelection({ copyOperation });

  await TestUtils.flushPromises();

  expect(ContextActionUtils.copyToClipboard).toHaveBeenCalledWith(
    DEFAULT_EXPECTED_TEXT
  );

  expect(screen.getByText('Fetched 50 rows!')).toBeTruthy();

  const btn = screen.getByText('Click to Copy');
  expect(btn).toBeTruthy();

  copyPromise = Promise.resolve(DEFAULT_EXPECTED_TEXT);
  ContextActionUtils.copyToClipboard = jest.fn(() => copyPromise);

  userEvent.click(btn);

  await TestUtils.flushPromises();

  expect(ContextActionUtils.copyToClipboard).toHaveBeenCalledWith(
    DEFAULT_EXPECTED_TEXT
  );

  expect(screen.getByText('Copied to Clipboard!')).toBeTruthy();
});

it('retry option available if fetching fails', async () => {
  const ranges = GridTestUtils.makeRanges();
  const copyOperation = makeCopyOperation(ranges);
  const model = makeModel();
  model.textSnapshot = jest.fn(() => Promise.reject());

  mountCopySelection({ copyOperation, model });

  expect(model.textSnapshot).toHaveBeenCalled();
  expect(ContextActionUtils.copyToClipboard).not.toHaveBeenCalled();

  await TestUtils.flushPromises();

  const btn = screen.getByRole('button', { name: 'Retry' });
  expect(btn).toBeTruthy();
  expect(screen.getByText('Unable to copy data.')).toBeTruthy();

  model.textSnapshot = makeSnapshotFn();

  userEvent.click(btn);

  await TestUtils.flushPromises();

  expect(model.textSnapshot).toHaveBeenCalled();
  expect(ContextActionUtils.copyToClipboard).toHaveBeenCalled();
  expect(screen.getByText('Copied to Clipboard!')).toBeTruthy();
});
