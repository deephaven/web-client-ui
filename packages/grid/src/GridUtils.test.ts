import GridMetrics, { ModelIndex, MoveOperation } from './GridMetrics';
import GridRange, { GridRangeIndex } from './GridRange';
import GridUtils from './GridUtils';

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

describe('start/end range adjustment in one dimension visible to model', () => {
  function testRange(
    start: GridRangeIndex,
    end: GridRangeIndex,
    movedItems: MoveOperation[] = [],
    expectedResult = [[start, end]]
  ) {
    expect(GridUtils.getModelRangeIndexes(start, end, movedItems)).toEqual(
      expectedResult
    );
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
    testRange(5, 10, GridUtils.moveItem(1, 7), [
      [6, 7],
      [1, 1],
      [8, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(100, 7), [
      [5, 6],
      [100, 100],
      [7, 9],
    ]);

    testRange(5, 10, GridUtils.moveItem(1, 5), [
      [1, 1],
      [6, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(1, 10), [
      [6, 10],
      [1, 1],
    ]);

    testRange(5, 10, GridUtils.moveItem(100, 5), [
      [100, 100],
      [5, 9],
    ]);

    testRange(5, 10, GridUtils.moveItem(100, 10), [
      [5, 9],
      [100, 100],
    ]);
  });
  it('handles items moved outside the range', () => {
    testRange(5, 10, GridUtils.moveItem(7, 100), [
      [5, 6],
      [8, 11],
    ]);
  });
  it('handles items moved from before to after range', () => {
    const movedItems = GridUtils.moveItem(1, 100);
    testRange(5, 10, movedItems, [[6, 11]]);
  });
  it('handles items moved from after to before range', () => {
    testRange(5, 10, GridUtils.moveItem(100, 1), [[4, 9]]);
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
      [9, 10],
      [52, 52],
      [11, 11],
    ]);
  });
  it('handles moves within the range', () => {
    testRange(5, 10, GridUtils.moveItem(9, 6), [
      [5, 5],
      [9, 9],
      [6, 8],
      [10, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(6, 9), [
      [5, 5],
      [7, 9],
      [6, 6],
      [10, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(9, 5), [
      [9, 9],
      [5, 8],
      [10, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(6, 10), [
      [5, 5],
      [7, 10],
      [6, 6],
    ]);

    testRange(5, 10, GridUtils.moveItem(5, 10), [
      [6, 10],
      [5, 5],
    ]);

    testRange(5, 10, GridUtils.moveItem(10, 5), [
      [10, 10],
      [5, 9],
    ]);
  });

  it('handles transforms with infinite ranges', () => {
    testRange(null, null, GridUtils.moveItem(1, 10), [
      [null, 0],
      [2, 10],
      [1, 1],
      [11, null],
    ]);

    testRange(null, null, GridUtils.moveItem(0, 10), [
      // We don't normally think of using negative indexes, but this is valid
      // We go from the start (null) to the element before index 0 since 0 is moved
      [null, -1],
      [1, 10],
      [0, 0],
      [11, null],
    ]);

    testRange(5, null, GridUtils.moveItem(1, 10), [
      [6, 10],
      [1, 1],
      [11, null],
    ]);

    testRange(5, null, GridUtils.moveItem(10, 1), [
      [4, 9],
      [11, null],
    ]);

    testRange(null, 10, GridUtils.moveItem(1, 15), [
      [null, 0],
      [2, 11],
    ]);

    testRange(null, 10, GridUtils.moveItem(15, 1), [
      [null, 0],
      [15, 15],
      [1, 9],
    ]);
  });
});

describe('start/end range adjustment in one dimension model to visible', () => {
  function testRange(
    start: GridRangeIndex,
    end: GridRangeIndex,
    movedItems: MoveOperation[] = [],
    expectedResult = [[start, end]]
  ) {
    expect(GridUtils.getVisibleRangeIndexes(start, end, movedItems)).toEqual(
      expectedResult
    );
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
    testRange(5, 10, GridUtils.moveItem(1, 7), [
      [4, 6],
      [8, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(100, 7), [
      [5, 6],
      [8, 11],
    ]);

    testRange(5, 10, GridUtils.moveItem(1, 5), [
      [4, 4],
      [6, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(1, 10), [[4, 9]]);

    testRange(5, 10, GridUtils.moveItem(100, 5), [[6, 11]]);

    testRange(5, 10, GridUtils.moveItem(100, 10), [
      [5, 9],
      [11, 11],
    ]);
  });
  it('handles items moved outside the range', () => {
    testRange(5, 10, GridUtils.moveItem(7, 100), [
      [5, 6],
      [100, 100],
      [7, 9],
    ]);

    testRange(5, 10, GridUtils.moveItem(7, 1), [
      [6, 7],
      [1, 1],
      [8, 10],
    ]);
  });
  it('handles items moved from before to after range', () => {
    testRange(5, 10, GridUtils.moveItem(1, 100), [[4, 9]]);
  });
  it('handles items moved from after to before range', () => {
    testRange(5, 10, GridUtils.moveItem(100, 1), [[6, 11]]);
  });
  it('handles multiple operations', () => {
    let movedItems = GridUtils.moveItem(1, 100);
    testRange(5, 10, movedItems, [[4, 9]]);
    movedItems = GridUtils.moveItem(7, 100, movedItems);
    testRange(5, 10, movedItems, [
      [4, 6],
      [100, 100],
      [7, 8],
    ]);
    movedItems = GridUtils.moveItem(50, 8, movedItems);
    testRange(5, 10, movedItems, [
      [4, 6],
      [100, 100],
      [7, 7],
      [9, 9],
    ]);
  });

  it('handles moves within the range', () => {
    testRange(5, 10, GridUtils.moveItem(9, 6), [
      [5, 5],
      [7, 9],
      [6, 6],
      [10, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(6, 9), [
      [5, 5],
      [9, 9],
      [6, 8],
      [10, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(9, 5), [
      [6, 9],
      [5, 5],
      [10, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(6, 10), [
      [5, 5],
      [10, 10],
      [6, 9],
    ]);

    testRange(5, 10, GridUtils.moveItem(5, 10), [
      [10, 10],
      [5, 9],
    ]);

    testRange(5, 10, GridUtils.moveItem(10, 5), [
      [6, 10],
      [5, 5],
    ]);
  });

  it('handles transforms with infinite ranges', () => {
    testRange(null, null, GridUtils.moveItem(1, 10), [
      [null, 0],
      [10, 10],
      [1, 9],
      [11, null],
    ]);

    testRange(null, null, GridUtils.moveItem(0, 10), [
      // We don't normally think of using negative indexes, but this is valid
      // We go from the start (null) to the element before index 0 since 0 is moved
      [null, -1],
      [10, 10],
      [0, 9],
      [11, null],
    ]);

    testRange(5, null, GridUtils.moveItem(1, 10), [
      [4, 9],
      [11, null],
    ]);

    testRange(5, null, GridUtils.moveItem(10, 1), [
      [6, 10],
      [1, 1],
      [11, null],
    ]);

    testRange(null, 10, GridUtils.moveItem(1, 15), [
      [null, 0],
      [15, 15],
      [1, 9],
    ]);

    testRange(null, 10, GridUtils.moveItem(15, 1), [
      [null, 0],
      [2, 11],
    ]);
  });
});

describe('grid range transforms with moved items in both dimensions visible to model', () => {
  function testRanges(
    ranges: GridRange[],
    movedColumns: MoveOperation[] = [],
    movedRows: MoveOperation[] = [],
    expectedRanges = ranges
  ) {
    expect(GridUtils.getModelRanges(ranges, movedColumns, movedRows)).toEqual(
      expectedRanges
    );
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
      new GridRange(10, 15, 14, 16),
      new GridRange(10, 27, 14, 27),
      new GridRange(10, 17, 14, 24),
      new GridRange(25, 15, 25, 16),
      new GridRange(25, 27, 25, 27),
      new GridRange(25, 17, 25, 24),
      new GridRange(15, 15, 19, 16),
      new GridRange(15, 27, 19, 27),
      new GridRange(15, 17, 19, 24),
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
        new GridRange(10, 15, 14, 16),
        new GridRange(10, 27, 14, 27),
        new GridRange(10, 17, 14, 24),
        new GridRange(25, 15, 25, 16),
        new GridRange(25, 27, 25, 27),
        new GridRange(25, 17, 25, 24),
        new GridRange(15, 15, 19, 16),
        new GridRange(15, 27, 19, 27),
        new GridRange(15, 17, 19, 24),
        new GridRange(30, 35, 40, 45),
      ]
    );
  });
});

describe('grid range transforms with moved items in both dimensions model to visible', () => {
  function testRanges(
    ranges: GridRange[],
    movedColumns: MoveOperation[] = [],
    movedRows: MoveOperation[] = [],
    expectedRanges = ranges
  ) {
    expect(GridUtils.getVisibleRanges(ranges, movedColumns, movedRows)).toEqual(
      expectedRanges
    );
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
      new GridRange(10, 15, 14, 16),
      new GridRange(10, 18, 14, 26),
      new GridRange(16, 15, 21, 16),
      new GridRange(16, 18, 21, 26),
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
        new GridRange(10, 15, 14, 16),
        new GridRange(10, 18, 14, 26),
        new GridRange(16, 15, 21, 16),
        new GridRange(16, 18, 21, 26),
        new GridRange(30, 35, 40, 45),
      ]
    );
  });
});
