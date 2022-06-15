import { TestUtils } from '@deephaven/utils';
import { TreeTable } from '@deephaven/jsapi-shim';
import { Formatter } from '@deephaven/jsapi-utils';
import IrisGridModel from './IrisGridModel';
import IrisGridTestUtils from './IrisGridTestUtils';

jest.useFakeTimers();

describe('viewport and subscription tests', () => {
  let table = null;
  let subscription = null;
  let model = null;

  beforeEach(() => {
    table = IrisGridTestUtils.makeTable();
    subscription = IrisGridTestUtils.makeSubscription(table);
    table.setViewport = jest.fn(() => subscription);
    table.applyFilter = jest.fn(val => val);
    table.applySort = jest.fn(val => val);
    table.applyCustomColumns = jest.fn(val => val);
    subscription.setViewport = jest.fn();
    subscription.close = jest.fn();
    model = IrisGridTestUtils.makeModel(table);
  });

  it('applies viewport to existing subscription', () => {
    expect(table.setViewport).not.toHaveBeenCalled();

    model.setViewport(0, 100, 0, 10);
    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscription.setViewport).not.toHaveBeenCalled();

    jest.runAllTimers();
    expect(table.setViewport).toHaveBeenCalledTimes(1);
    expect(subscription.setViewport).not.toHaveBeenCalled();
  });

  it('applies a new viewport only if there is a change', () => {
    expect(table.setViewport).toHaveBeenCalledTimes(0);
    model.setViewport(0, 100, 0, 10);
    jest.runAllTimers();
    expect(table.setViewport).toHaveBeenCalledTimes(1);
    expect(subscription.setViewport).not.toHaveBeenCalled();
    jest.clearAllMocks();

    model.setViewport(0, 100, 0, 10);
    jest.runAllTimers();
    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscription.setViewport).not.toHaveBeenCalled();

    // The existing subscription gets updated
    model.setViewport(10, 110, 0, 10);
    jest.runAllTimers();
    expect(table.setViewport).not.toHaveBeenCalled();
    expect(subscription.setViewport).toHaveBeenCalledTimes(1);
  });

  it('makes a new subscription if filters/sorts/custom columns have changed, batches requests', () => {
    model.setViewport(0, 100, 0, 10);
    jest.runAllTimers();
    expect(table.setViewport).toHaveBeenCalledTimes(1);
    expect(subscription.setViewport).not.toHaveBeenCalled();
    expect(subscription.close).not.toHaveBeenCalled();
    jest.clearAllMocks();

    model.filter = [IrisGridTestUtils.makeFilter()];
    jest.runAllTimers();
    expect(table.setViewport).toHaveBeenCalledTimes(1);
    expect(subscription.setViewport).not.toHaveBeenCalled();
    expect(subscription.close).toHaveBeenCalled();

    jest.clearAllMocks();
    model.filter = [IrisGridTestUtils.makeFilter()];
    model.sort = [IrisGridTestUtils.makeSort()];
    model.customColumns = ['A=i'];
    jest.runAllTimers();
    expect(subscription.close).toHaveBeenCalled();
    expect(subscription.setViewport).not.toHaveBeenCalled();
    expect(table.setViewport).toHaveBeenCalledTimes(1);
  });

  it('queues multiple updates made rapidly', () => {
    model.setViewport(100, 150, 0, 10);
    model.setViewport(125, 175, 0, 10);
    jest.advanceTimersByTime(500);

    expect(table.setViewport).toHaveBeenCalledTimes(1);
    expect(subscription.setViewport).toHaveBeenCalledTimes(1);
    expect(subscription.close).not.toHaveBeenCalled();
    jest.advanceTimersByTime(5);

    model.setViewport(150, 200, 0, 10);
    model.setViewport(175, 225, 0, 10);

    jest.advanceTimersByTime(500);
    expect(table.setViewport).toHaveBeenCalledTimes(1);
    expect(subscription.setViewport).toHaveBeenCalledTimes(3);
  });

  it('runs all updates if spaced apart', () => {
    model.setViewport(100, 150, 0, 10);
    jest.advanceTimersByTime(500);

    model.setViewport(125, 175, 0, 10);
    jest.advanceTimersByTime(500);

    model.setViewport(150, 200, 0, 10);
    jest.advanceTimersByTime(500);

    expect(table.setViewport).toHaveBeenCalledTimes(1);
    expect(subscription.setViewport).toHaveBeenCalledTimes(2);
    jest.clearAllMocks();
    jest.runAllTimers(); // Check no pending timers
    expect(table.setViewport).toHaveBeenCalledTimes(0);
    expect(subscription.setViewport).toHaveBeenCalledTimes(0);
  });
});

it('updates the model correctly when adding and removing a rollup config', async () => {
  const table = IrisGridTestUtils.makeTable();
  const rollupTable = IrisGridTestUtils.makeTable();
  const rollupConfig = IrisGridTestUtils.makeRollupTableConfig();

  const mock = jest.fn(() =>
    Promise.resolve((rollupTable as unknown) as TreeTable)
  );

  table.rollup = mock;
  const model = IrisGridTestUtils.makeModel(table);

  expect(mock).not.toHaveBeenCalled();

  model.rollupConfig = rollupConfig;
  await TestUtils.flushPromises();

  expect(mock).toHaveBeenCalledWith(rollupConfig);

  mock.mockClear();

  model.rollupConfig = null;
  await TestUtils.flushPromises();

  expect(table.rollup).not.toHaveBeenCalled();
});

it('closes the table correctly when the model is closed', () => {
  const table = IrisGridTestUtils.makeTable();
  table.close = jest.fn();
  const model = IrisGridTestUtils.makeModel(table);

  model.close();

  expect(table.close).toHaveBeenCalled();
});

describe('totals table tests', () => {
  const TOTALS_CONFIG = { operationMap: { 1: ['Max', 'Min'] } };

  let table = null;
  let totalsTable = null;
  let model = null;

  beforeEach(() => {
    table = IrisGridTestUtils.makeTable();
    totalsTable = IrisGridTestUtils.makeTable();

    table.close = jest.fn();
    table.getTotalsTable = jest.fn(() => Promise.resolve(totalsTable));
    totalsTable.close = jest.fn();

    model = IrisGridTestUtils.makeModel(table);
  });

  it('opens a totals table correctly and closes it when done', async () => {
    model.totalsConfig = TOTALS_CONFIG;
    expect(table.getTotalsTable).toHaveBeenCalledWith(TOTALS_CONFIG);
    await TestUtils.flushPromises();

    model.close();

    expect(table.close).toHaveBeenCalled();
    expect(totalsTable.close).toHaveBeenCalled();
  });

  it('closes the totals table correctly after nulling the config', async () => {
    model.totalsConfig = TOTALS_CONFIG;
    await TestUtils.flushPromises();

    model.totalsConfig = null;

    expect(table.close).not.toHaveBeenCalled();
    expect(totalsTable.close).toHaveBeenCalled();
  });

  it('handles totals table loading error', async () => {
    const listener = jest.fn();
    model.addEventListener(IrisGridModel.EVENT.REQUEST_FAILED, listener);
    table.getTotalsTable = jest.fn(() =>
      Promise.reject(new Error('TEST ERROR'))
    );

    model.totalsConfig = TOTALS_CONFIG;
    await TestUtils.flushPromises();

    expect(listener).toHaveBeenCalled();
  });
});

describe('pending new rows tests', () => {
  const TABLE_SIZE = 100;
  const PENDING_ROW_COUNT = 50;
  let table = null;
  let inputTable = null;
  let model = null;

  beforeEach(() => {
    table = IrisGridTestUtils.makeTable(
      IrisGridTestUtils.makeColumns(),
      TABLE_SIZE
    );
    table.close = jest.fn();

    inputTable = IrisGridTestUtils.makeInputTable(table.columns.slice(0, 3));

    model = IrisGridTestUtils.makeModel(table, new Formatter(), inputTable);
    model.pendingRowCount = PENDING_ROW_COUNT;
  });

  it('has the correct number of total rows', () => {
    expect(model.rowCount).toBe(TABLE_SIZE + PENDING_ROW_COUNT);
    model.pendingRowCount = 250;
    expect(model.rowCount).toBe(TABLE_SIZE + 250);
  });

  describe('setting values', () => {
    const x = 3;
    const pendingY = 4;
    const y = TABLE_SIZE + pendingY;
    const value = 'Testing';

    beforeEach(() => {
      model.setValueForCell(x, y, value);
    });

    it('updates the pending data map when setting pending ranges', () => {
      expect(model.pendingDataMap.get(pendingY).data.get(x)).toEqual({ value });
    });

    it('writes pending data to the input table', async () => {
      inputTable.addRows = jest.fn();
      await model.commitPending();
      expect(inputTable.addRows).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ 3: value })])
      );
      expect(model.pendingDataMap.size).toBe(0);
    });
  });

  it('validates pendingDataMap when being set', () => {
    expect(() => {
      model.pendingDataMap = new Map();
    }).not.toThrow();
    expect(() => {
      model.pendingDataMap = new Map([[4, { data: new Map([[5, 'value']]) }]]);
    }).not.toThrow();
    expect(() => {
      model.pendingDataMap = new Map([['invalid', 'data']]);
    }).toThrow();
  });
});
