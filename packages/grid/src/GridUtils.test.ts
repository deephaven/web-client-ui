import GridMetrics, { ModelIndex, MoveOperation } from './GridMetrics';
import GridRange, { GridRangeIndex } from './GridRange';
import GridUtils, { AxisRange } from './GridUtils';

function expectModelIndexes(
  movedItems: MoveOperation[],
  indexes: ModelIndex[]
) {
  for (let i = 0; i < indexes.length; i += 1) {
    expect(GridUtils.getModelIndex(i, movedItems)).toBe(indexes[i]);
  }
}

function expectVisibleIndexes(
  movedItems: MoveOperation[],
  indexes: ModelIndex[]
) {
  for (let i = 0; i < indexes.length; i += 1) {
    expect(GridUtils.getVisibleIndex(i, movedItems)).toBe(indexes[i]);
  }
}

describe('move items', () => {
  it('returns the proper model/visible index when one column is moved', () => {
    const movedItems = GridUtils.moveItem(2, 1);

    expectModelIndexes(movedItems, [0, 2, 1, 3]);
    expectVisibleIndexes(movedItems, [0, 2, 1, 3]);
  });

  it('returns the proper model/visible index when one column is moved', () => {
    const movedItems = GridUtils.moveItem(5, 2, []);

    expectModelIndexes(movedItems, [0, 1, 5, 2, 3, 4, 6, 7]);
    expectVisibleIndexes(movedItems, [0, 1, 3, 4, 5, 2, 6, 7]);
  });

  it('returns the proper model/visible index when two columns are moved', () => {
    let movedItems = GridUtils.moveItem(5, 2, []);
    movedItems = GridUtils.moveItem(7, 0, movedItems);

    expectModelIndexes(movedItems, [7, 0, 1, 5, 2, 3, 4, 6]);
    expectVisibleIndexes(movedItems, [1, 2, 4, 5, 6, 3, 7, 0]);
  });

  it('handles moving the last column to the front repeatedly', () => {
    const itemCount = 3;
    let movedItems: MoveOperation[] = [];

    for (let i = 0; i < itemCount; i += 1) {
      movedItems = GridUtils.moveItem(itemCount - 1, 0, movedItems);

      for (let j = 0; j < itemCount; j += 1) {
        expect(GridUtils.getModelIndex(j, movedItems)).toBe(
          (j - i - 1 + itemCount) % itemCount
        );
        expect(GridUtils.getVisibleIndex(j, movedItems)).toBe(
          (j + i + 1) % itemCount
        );
      }
    }
  });
});

describe('iterate floating tests', () => {
  function testCallbackCalledWithRange(
    callback: (a: unknown) => unknown,
    low: number,
    high: number,
    callIndex = 0
  ) {
    for (let i = low; i <= high; i += 1) {
      expect(callback).toHaveBeenNthCalledWith(callIndex + i - low + 1, i);
    }
  }

  it('does not iterate if no floating items', () => {
    const callback = jest.fn();
    GridUtils.iterateFloating(0, 0, 100, callback);
    expect(callback).not.toHaveBeenCalled();
  });

  it('iterates floating items correctly', () => {
    const callback = jest.fn();
    GridUtils.iterateFloating(3, 5, 10, callback);
    expect(callback).toHaveBeenCalledTimes(8);
    testCallbackCalledWithRange(callback, 0, 2);
    testCallbackCalledWithRange(callback, 5, 9, 3);
  });

  it('iterates visible items correctly', () => {
    const callback = jest.fn();
    GridUtils.iterateAllItems(0, 5, 0, 0, 20, callback);
    expect(callback).toHaveBeenCalledTimes(6);
    testCallbackCalledWithRange(callback, 0, 5);
    callback.mockClear();

    GridUtils.iterateAllItems(5, 10, 0, 0, 20, callback);
    expect(callback).toHaveBeenCalledTimes(6);
    testCallbackCalledWithRange(callback, 5, 10);
    callback.mockClear();
  });

  it('iterates visible and floating items correctly, floating first', () => {
    const callback = jest.fn();
    GridUtils.iterateAllItems(4, 7, 2, 3, 20, callback);
    expect(callback).toHaveBeenCalledTimes(9);
    testCallbackCalledWithRange(callback, 0, 1);
    testCallbackCalledWithRange(callback, 17, 19, 2);
    testCallbackCalledWithRange(callback, 4, 7, 5);
  });

  it('stops when a value is returned from the callback', () => {
    const result = 'TEST';
    const callback = jest.fn(x => (x === 28 ? result : undefined));
    expect(GridUtils.iterateAllItems(8, 13, 3, 5, 30, callback)).toBe(result);
    expect(callback).toHaveBeenCalledTimes(7);
    testCallbackCalledWithRange(callback, 0, 2);
    testCallbackCalledWithRange(callback, 25, 28, 3);
  });
});

describe('floating item checks', () => {
  function makeMetrics(
    floatingTopRowCount = 0,
    floatingBottomRowCount = 0,
    rowCount = 10,
    floatingLeftColumnCount = 0,
    floatingRightColumnCount = 0,
    columnCount = 10
  ): GridMetrics {
    // We just return a partial metrics object but force it to GridMetrics for the tests
    return {
      floatingTopRowCount,
      floatingBottomRowCount,
      rowCount,
      floatingLeftColumnCount,
      floatingRightColumnCount,
      columnCount,
    } as GridMetrics;
  }

  it('checks floating rows correctly', () => {
    expect(GridUtils.isFloatingRow(3, makeMetrics())).toBe(false);
    expect(GridUtils.isFloatingRow(3, makeMetrics(5))).toBe(true);
    expect(GridUtils.isFloatingRow(3, makeMetrics(0, 5))).toBe(false);
    expect(GridUtils.isFloatingRow(8, makeMetrics())).toBe(false);
    expect(GridUtils.isFloatingRow(8, makeMetrics(5))).toBe(false);
    expect(GridUtils.isFloatingRow(8, makeMetrics(0, 5))).toBe(true);
    expect(GridUtils.isFloatingRow(8, makeMetrics(0, 0, 10, 5, 5, 20))).toBe(
      false
    );
  });

  it('checks floating rows correctly', () => {
    expect(GridUtils.isFloatingColumn(3, makeMetrics())).toBe(false);
    expect(GridUtils.isFloatingColumn(3, makeMetrics(0, 0, 10, 5))).toBe(true);
    expect(GridUtils.isFloatingColumn(3, makeMetrics(0, 0, 10, 0, 5))).toBe(
      false
    );
    expect(GridUtils.isFloatingColumn(8, makeMetrics())).toBe(false);
    expect(GridUtils.isFloatingColumn(8, makeMetrics(0, 0, 10, 5))).toBe(false);
    expect(GridUtils.isFloatingColumn(8, makeMetrics(0, 0, 10, 0, 5))).toBe(
      true
    );
  });
});

describe('start/end range adjustment in one dimension', () => {
  function testRange(
    start: GridRangeIndex,
    end: GridRangeIndex,
    movedItems: MoveOperation[] = [],
    expectedResult = [[start, end]]
  ) {
    expect(
      GridUtils.getModelRangeIndexes(start, end, movedItems).sort(
        (a, b) => (a as AxisRange)[0] - (b as AxisRange)[0]
      )
    ).toEqual(expectedResult);
  }
  it('handles no transforms', () => {
    testRange(0, 0);
    testRange(100, 100);
  });
  it('handles transforms outside of range', () => {
    let movedItems = GridUtils.moveItem(2, 1);
    movedItems = GridUtils.moveItem(100, 200, movedItems);
    testRange(5, 10, movedItems);
    testRange(10, 20, movedItems);
  });
  it('handles items moved into the range', () => {
    const movedItems = GridUtils.moveItem(100, 7);
    testRange(5, 10, movedItems, [
      [5, 9],
      [100, 100],
    ]);
  });
  it('handles items moved outside the range', () => {
    const movedItems = GridUtils.moveItem(7, 100);
    testRange(5, 10, movedItems, [
      [5, 6],
      [8, 11],
    ]);
  });
  it('handles items moved from before to after range', () => {
    const movedItems = GridUtils.moveItem(1, 100);
    testRange(5, 10, movedItems, [[6, 11]]);
  });
  it('handles items moved from after to before range', () => {
    const movedItems = GridUtils.moveItem(100, 1);
    testRange(5, 10, movedItems, [[4, 9]]);
  });
  it('handles multiple operations', () => {
    let movedItems = GridUtils.moveItem(1, 100);
    testRange(5, 10, movedItems, [[6, 11]]);
    movedItems = GridUtils.moveItem(7, 100, movedItems);
    testRange(5, 10, movedItems, [
      [6, 7],
      [9, 12],
    ]);
    movedItems = GridUtils.moveItem(50, 9, movedItems);
    testRange(5, 10, movedItems, [
      [6, 7],
      [9, 11],
      [52, 52],
    ]);
  });
});

describe('grid range transforms with moved items in both dimensions', () => {
  function testRanges(
    ranges: GridRange[],
    movedColumns: MoveOperation[] = [],
    movedRows: MoveOperation[] = [],
    expectedRanges = ranges
  ) {
    expect(
      GridUtils.getModelRanges(ranges, movedColumns, movedRows).sort((a, b) =>
        a.startColumn !== b.startColumn
          ? (a.startColumn as ModelIndex) - (b.startColumn as ModelIndex)
          : (a.startRow as ModelIndex) - (b.endRow as ModelIndex)
      )
    ).toEqual(expectedRanges);
  }
  function testRange(
    range: GridRange,
    movedColumns: MoveOperation[] = [],
    movedRows: MoveOperation[] = [],
    expectedRanges = [range]
  ) {
    testRanges([range], movedColumns, movedRows, expectedRanges);
  }
  it('handles no transformations', () => {
    testRange(new GridRange(0, 0, 0, 0));
    testRange(new GridRange(1, 4, 2, 6));
  });
  it('handles transformations that do not affect the range', () => {
    let movedItems: MoveOperation[] = GridUtils.moveItem(2, 1);
    movedItems = GridUtils.moveItem(5, 0, movedItems);
    movedItems = GridUtils.moveItem(100, 110, movedItems);
    movedItems = GridUtils.moveItem(200, 220, movedItems);

    testRange(new GridRange(50, 55, 60, 65), movedItems, movedItems);
  });
  it('handles moving items into the range', () => {
    const movedColumns: MoveOperation[] = GridUtils.moveItem(25, 15);
    const movedRows: MoveOperation[] = GridUtils.moveItem(27, 17);
    testRange(new GridRange(10, 15, 20, 25), movedColumns, movedRows, [
      new GridRange(10, 15, 19, 24),
      new GridRange(10, 27, 19, 27),
      new GridRange(25, 15, 25, 24),
      new GridRange(25, 27, 25, 27),
    ]);
  });
  it('handles multiple ranges', () => {
    const movedColumns = GridUtils.moveItem(25, 15);
    const movedRows = GridUtils.moveItem(27, 17);
    testRanges(
      [new GridRange(10, 15, 20, 25), new GridRange(30, 35, 40, 45)],
      movedColumns,
      movedRows,
      [
        new GridRange(10, 15, 19, 24),
        new GridRange(10, 27, 19, 27),
        new GridRange(25, 15, 25, 24),
        new GridRange(25, 27, 25, 27),
        new GridRange(30, 35, 40, 45),
      ]
    );
  });
});
