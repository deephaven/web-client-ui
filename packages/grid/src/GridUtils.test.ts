import GridRange from './GridRange';
import GridUtils from './GridUtils';
import {
  GridMetrics,
  ModelIndex,
  MoveOperation,
  AxisRange,
  GridRangeIndex,
  BoundedAxisRange,
  Token,
  TokenBox,
} from './GridTypes';

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

const makeMockGridMetrics = (): GridMetrics =>
  ({
    gridX: 0,
    gridY: 30,
    width: 1000,
    height: 500,
    verticalBarWidth: 20,
    horizontalBarHeight: 20,
  } as GridMetrics);

describe('move items', () => {
  it('returns the proper model/visible index when one column is moved', () => {
    const movedItems = GridUtils.moveItem(2, 1, []);

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

  it('condenses moving 1 column multiple times in a row', () => {
    let movedItems = GridUtils.moveItem(0, 5, []);
    movedItems = GridUtils.moveItem(5, 10, movedItems);
    movedItems = GridUtils.moveItem(10, 3, movedItems);

    expect(movedItems.length).toBe(1);
    expectModelIndexes(movedItems, [1, 2, 3, 0, 4, 5]);
    expectVisibleIndexes(movedItems, [3, 0, 1, 2, 4, 5]);

    // Move back to start should result in no moves
    movedItems = GridUtils.moveItem(3, 0, movedItems);
    expect(movedItems.length).toBe(0);
  });

  it('skips moving an item to its original position', () => {
    const movedItems = GridUtils.moveItem(2, 2, []);

    expect(movedItems.length).toBe(0);
    expectModelIndexes(movedItems, [0, 1, 2, 3]);
    expectVisibleIndexes(movedItems, [0, 1, 2, 3]);
  });
});

describe('move ranges', () => {
  it('returns the proper model/visible index when one range is moved', () => {
    let movedItems = GridUtils.moveRange([3, 5], 1, []);

    expectModelIndexes(movedItems, [0, 3, 4, 5, 1, 2]);
    expectVisibleIndexes(movedItems, [0, 4, 5, 1, 2, 3]);

    movedItems = GridUtils.moveRange([3, 5], 1, [], true);

    expectModelIndexes(movedItems, [0, 3, 4, 5, 1, 2]);
    expectVisibleIndexes(movedItems, [0, 4, 5, 1, 2, 3]);

    movedItems = GridUtils.moveRange([2, 4], 3, [], false);

    expectModelIndexes(movedItems, [0, 1, 5, 2, 3, 4]);
    expectVisibleIndexes(movedItems, [0, 1, 3, 4, 5, 2]);

    // Pick up [2, 4] and drop on 5 is equivalent to above
    movedItems = GridUtils.moveRange([2, 4], 5, [], true);

    expectModelIndexes(movedItems, [0, 1, 5, 2, 3, 4]);
    expectVisibleIndexes(movedItems, [0, 1, 3, 4, 5, 2]);
  });

  it('returns the proper model/visible index when two ranges are moved', () => {
    let movedItems = GridUtils.moveRange([3, 5], 1, []);
    movedItems = GridUtils.moveRange([2, 4], 5, movedItems);

    expectModelIndexes(movedItems, [0, 3, 2, 6, 7, 4, 5, 1]);
    expectVisibleIndexes(movedItems, [0, 7, 2, 1, 5, 6, 3, 4]);
  });

  it('condenses moving 1 range multiple times in a row', () => {
    let movedItems = GridUtils.moveRange([0, 2], 5, []);
    movedItems = GridUtils.moveRange([5, 7], 10, movedItems);
    movedItems = GridUtils.moveRange([10, 12], 3, movedItems);

    expect(movedItems.length).toBe(1);
    expectModelIndexes(movedItems, [3, 4, 5, 0, 1, 2, 6]);
    expectVisibleIndexes(movedItems, [3, 4, 5, 0, 1, 2, 6]);

    // Move back to start should result in no moves
    movedItems = GridUtils.moveRange([3, 5], 0, movedItems);
    expect(movedItems.length).toBe(0);
  });

  it('skips moving an item to its original position', () => {
    const movedItems = GridUtils.moveRange([0, 2], 0, []);

    expect(movedItems.length).toBe(0);
    expectModelIndexes(movedItems, [0, 1, 2, 3]);
    expectVisibleIndexes(movedItems, [0, 1, 2, 3]);
  });

  it('converts a move range of 1 item to a move item', () => {
    const movedItems = GridUtils.moveRange([0, 0], 1, []);

    expectModelIndexes(movedItems, [1, 0, 2, 3]);
    expectVisibleIndexes(movedItems, [1, 0, 2, 3]);
  });
});

describe('move item or range', () => {
  it('returns the proper model/visible index when one item or range is moved', () => {
    let movedItems = GridUtils.moveItemOrRange([3, 5], 1, []);

    expectModelIndexes(movedItems, [0, 3, 4, 5, 1, 2]);
    expectVisibleIndexes(movedItems, [0, 4, 5, 1, 2, 3]);

    movedItems = GridUtils.moveItemOrRange([3, 5], 1, [], true);

    expectModelIndexes(movedItems, [0, 3, 4, 5, 1, 2]);
    expectVisibleIndexes(movedItems, [0, 4, 5, 1, 2, 3]);

    movedItems = GridUtils.moveItemOrRange(0, 1, []);

    expectModelIndexes(movedItems, [1, 0, 2, 3, 4, 5]);
    expectVisibleIndexes(movedItems, [1, 0, 2, 3, 4, 5]);
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
    expectedResult: AxisRange[] = [[start, end]]
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
    let movedItems = GridUtils.moveItem(2, 1, []);
    movedItems = GridUtils.moveItem(100, 200, movedItems);
    testRange(5, 10, movedItems);
    testRange(10, 20, movedItems);
  });
  it('handles items moved into the range', () => {
    testRange(5, 10, GridUtils.moveItem(1, 7, []), [
      [6, 7],
      [1, 1],
      [8, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(100, 7, []), [
      [5, 6],
      [100, 100],
      [7, 9],
    ]);

    testRange(5, 10, GridUtils.moveItem(1, 5, []), [
      [1, 1],
      [6, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(1, 10, []), [
      [6, 10],
      [1, 1],
    ]);

    testRange(5, 10, GridUtils.moveItem(100, 5, []), [
      [100, 100],
      [5, 9],
    ]);

    testRange(5, 10, GridUtils.moveItem(100, 10, []), [
      [5, 9],
      [100, 100],
    ]);
  });
  it('handles items moved outside the range', () => {
    testRange(5, 10, GridUtils.moveItem(7, 100, []), [
      [5, 6],
      [8, 11],
    ]);
  });
  it('handles items moved from before to after range', () => {
    const movedItems = GridUtils.moveItem(1, 100, []);
    testRange(5, 10, movedItems, [[6, 11]]);
  });
  it('handles items moved from after to before range', () => {
    testRange(5, 10, GridUtils.moveItem(100, 1, []), [[4, 9]]);
  });
  it('handles multiple operations', () => {
    let movedItems = GridUtils.moveItem(1, 100, []);
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
    testRange(5, 10, GridUtils.moveItem(9, 6, []), [
      [5, 5],
      [9, 9],
      [6, 8],
      [10, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(6, 9, []), [
      [5, 5],
      [7, 9],
      [6, 6],
      [10, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(9, 5, []), [
      [9, 9],
      [5, 8],
      [10, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(6, 10, []), [
      [5, 5],
      [7, 10],
      [6, 6],
    ]);

    testRange(5, 10, GridUtils.moveItem(5, 10, []), [
      [6, 10],
      [5, 5],
    ]);

    testRange(5, 10, GridUtils.moveItem(10, 5, []), [
      [10, 10],
      [5, 9],
    ]);
  });

  it('handles transforms with infinite ranges', () => {
    testRange(null, null, GridUtils.moveItem(1, 10, []), [
      [null, 0],
      [2, 10],
      [1, 1],
      [11, null],
    ]);

    testRange(null, null, GridUtils.moveItem(0, 10, []), [
      // We don't normally think of using negative indexes, but this is valid
      // We go from the start (null) to the element before index 0 since 0 is moved
      [null, -1],
      [1, 10],
      [0, 0],
      [11, null],
    ]);

    testRange(5, null, GridUtils.moveItem(1, 10, []), [
      [6, 10],
      [1, 1],
      [11, null],
    ]);

    testRange(5, null, GridUtils.moveItem(10, 1, []), [
      [4, 9],
      [11, null],
    ]);

    testRange(null, 10, GridUtils.moveItem(1, 15, []), [
      [null, 0],
      [2, 11],
    ]);

    testRange(null, 10, GridUtils.moveItem(15, 1, []), [
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
    expectedResult: AxisRange[] = [[start, end]]
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
    let movedItems = GridUtils.moveItem(2, 1, []);
    movedItems = GridUtils.moveItem(100, 200, movedItems);
    testRange(5, 10, movedItems);
    testRange(10, 20, movedItems);
  });
  it('handles items moved into the range', () => {
    testRange(5, 10, GridUtils.moveItem(1, 7, []), [
      [4, 6],
      [8, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(100, 7, []), [
      [5, 6],
      [8, 11],
    ]);

    testRange(5, 10, GridUtils.moveItem(1, 5, []), [
      [4, 4],
      [6, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(1, 10, []), [[4, 9]]);

    testRange(5, 10, GridUtils.moveItem(100, 5, []), [[6, 11]]);

    testRange(5, 10, GridUtils.moveItem(100, 10, []), [
      [5, 9],
      [11, 11],
    ]);
  });
  it('handles items moved outside the range', () => {
    testRange(5, 10, GridUtils.moveItem(7, 100, []), [
      [5, 6],
      [100, 100],
      [7, 9],
    ]);

    testRange(5, 10, GridUtils.moveItem(7, 1, []), [
      [6, 7],
      [1, 1],
      [8, 10],
    ]);
  });
  it('handles items moved from before to after range', () => {
    testRange(5, 10, GridUtils.moveItem(1, 100, []), [[4, 9]]);
  });
  it('handles items moved from after to before range', () => {
    testRange(5, 10, GridUtils.moveItem(100, 1, []), [[6, 11]]);
  });
  it('handles multiple operations', () => {
    let movedItems = GridUtils.moveItem(1, 100, []);
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
    testRange(5, 10, GridUtils.moveItem(9, 6, []), [
      [5, 5],
      [7, 9],
      [6, 6],
      [10, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(6, 9, []), [
      [5, 5],
      [9, 9],
      [6, 8],
      [10, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(9, 5, []), [
      [6, 9],
      [5, 5],
      [10, 10],
    ]);

    testRange(5, 10, GridUtils.moveItem(6, 10, []), [
      [5, 5],
      [10, 10],
      [6, 9],
    ]);

    testRange(5, 10, GridUtils.moveItem(5, 10, []), [
      [10, 10],
      [5, 9],
    ]);

    testRange(5, 10, GridUtils.moveItem(10, 5, []), [
      [6, 10],
      [5, 5],
    ]);
  });

  it('handles transforms with infinite ranges', () => {
    testRange(null, null, GridUtils.moveItem(1, 10, []), [
      [null, 0],
      [10, 10],
      [1, 9],
      [11, null],
    ]);

    testRange(null, null, GridUtils.moveItem(0, 10, []), [
      // We don't normally think of using negative indexes, but this is valid
      // We go from the start (null) to the element before index 0 since 0 is moved
      [null, -1],
      [10, 10],
      [0, 9],
      [11, null],
    ]);

    testRange(5, null, GridUtils.moveItem(1, 10, []), [
      [4, 9],
      [11, null],
    ]);

    testRange(5, null, GridUtils.moveItem(10, 1, []), [
      [6, 10],
      [1, 1],
      [11, null],
    ]);

    testRange(null, 10, GridUtils.moveItem(1, 15, []), [
      [null, 0],
      [15, 15],
      [1, 9],
    ]);

    testRange(null, 10, GridUtils.moveItem(15, 1, []), [
      [null, 0],
      [2, 11],
    ]);
  });
});

describe('Move ranges of items', () => {
  function testModelToVisible(
    start: GridRangeIndex,
    end: GridRangeIndex,
    movedItems: MoveOperation[] = [],
    expectedResult: AxisRange[] = [[start, end]]
  ) {
    expect(GridUtils.getVisibleRangeIndexes(start, end, movedItems)).toEqual(
      expectedResult
    );
  }

  function testVisibleToModel(
    start: GridRangeIndex,
    end: GridRangeIndex,
    movedItems: MoveOperation[] = [],
    expectedResult: AxisRange[] = [[start, end]]
  ) {
    expect(GridUtils.getModelRangeIndexes(start, end, movedItems)).toEqual(
      expectedResult
    );
  }

  it('handles transforms outside of range', () => {
    let movedItems = GridUtils.moveRange([2, 3], 1, []);
    movedItems = GridUtils.moveRange([100, 104], 200, movedItems);
    testModelToVisible(5, 10, movedItems);
    testVisibleToModel(5, 10, movedItems);
  });

  it('handles items moved into the range', () => {
    // Before to start
    let movedItems = GridUtils.moveRange([1, 3], 5, []);
    // 0 1 2 3 4 5 6 7 8 9 10 Before/Visible
    // 0 4 5 6 7 1 2 3 8 9 10 After/Model
    testModelToVisible(5, 10, movedItems, [
      [2, 4],
      [8, 10],
    ]);
    testVisibleToModel(5, 10, movedItems, [
      [1, 3],
      [8, 10],
    ]);

    // Before to within
    movedItems = GridUtils.moveRange([1, 3], 6, []);
    // 0 1 2 3 4 5 6 7 8 9 10 Before/Visible
    // 0 4 5 6 7 8 1 2 3 9 10 After/Model
    testModelToVisible(5, 10, movedItems, [
      [2, 5],
      [9, 10],
    ]);
    testVisibleToModel(5, 10, movedItems, [
      [8, 8],
      [1, 3],
      [9, 10],
    ]);

    // Before to end
    movedItems = GridUtils.moveRange([1, 3], 8, []);
    // 0 1 2 3 4 5 6 7  8 9 10 Before/Visible
    // 0 4 5 6 7 8 9 10 1 2 3 After/Model
    testModelToVisible(5, 10, movedItems, [[2, 7]]);
    testVisibleToModel(5, 10, movedItems, [
      [8, 10],
      [1, 3],
    ]);

    // Before to partially in start
    movedItems = GridUtils.moveRange([1, 3], 4, []);
    // 0 1 2 3 4 5 6 7 8 9 10 Before/Visible
    // 0 4 5 6 1 2 3 7 8 9 10 After/Model
    testModelToVisible(5, 10, movedItems, [
      [2, 3],
      [7, 10],
    ]);
    testVisibleToModel(5, 10, movedItems, [
      [2, 3],
      [7, 10],
    ]);

    // Before to partially in end
    movedItems = GridUtils.moveRange([1, 3], 9, []);
    // 0 1 2 3 4 5 6 7  8  9 10 11 Before/Visible
    // 0 4 5 6 7 8 9 10 11 1 2  3 After/Model
    testModelToVisible(5, 10, movedItems, [[2, 7]]);
    testVisibleToModel(5, 10, movedItems, [
      [8, 11],
      [1, 2],
    ]);

    // After to end
    movedItems = GridUtils.moveRange([12, 14], 8, []);
    // 5 6 7  8  9  10 11 12 13 Before/Visible
    // 5 6 7  12 13 14 8  9  10  After/Model
    testModelToVisible(5, 10, movedItems, [
      [5, 7],
      [11, 13],
    ]);
    testVisibleToModel(5, 10, movedItems, [
      [5, 7],
      [12, 14],
    ]);

    // After to within
    movedItems = GridUtils.moveRange([12, 14], 7, []);
    // 5 6 7  8  9  10 11 12 13 Before/Visible
    // 5 6 12 13 14 7  8  9  10 After/Model
    testModelToVisible(5, 10, movedItems, [
      [5, 6],
      [10, 13],
    ]);
    testVisibleToModel(5, 10, movedItems, [
      [5, 6],
      [12, 14],
      [7, 7],
    ]);
  });

  it('handles items moved outside the range', () => {
    // Within to before
    let movedItems = GridUtils.moveRange([6, 8], 2, []);
    // 0 1 2 3 4 5 6 7 8 9 10 Before/Visible
    // 0 1 6 7 8 2 3 4 5 9 10 After/Model
    testModelToVisible(5, 10, movedItems, [
      [8, 8],
      [2, 4],
      [9, 10],
    ]);
    testVisibleToModel(5, 10, movedItems, [
      [2, 5],
      [9, 10],
    ]);

    // Start to before
    movedItems = GridUtils.moveRange([5, 7], 2, []);
    // 0 1 2 3 4 5 6 7 8 9 10 Before/Visible
    // 0 1 5 6 7 2 3 4 8 9 10 After/Model
    testModelToVisible(5, 10, movedItems, [
      [2, 4],
      [8, 10],
    ]);
    testVisibleToModel(5, 10, movedItems, [
      [2, 4],
      [8, 10],
    ]);

    // End to before
    movedItems = GridUtils.moveRange([8, 10], 2, []);
    // 0 1 2 3 4  5 6 7 8 9 10 Before/Visible
    // 0 1 8 9 10 2 3 4 5 6 7 After/Model
    testModelToVisible(5, 10, movedItems, [
      [8, 10],
      [2, 4],
    ]);
    testVisibleToModel(5, 10, movedItems, [[2, 7]]);

    // Within to after
    movedItems = GridUtils.moveRange([6, 8], 11, []);
    // 5 6 7  8  9  10 11 12 13 Before/Visible
    // 5 9 10 11 12 13 6  7  8 After/Model
    testModelToVisible(5, 10, movedItems, [
      [5, 5],
      [11, 13],
      [6, 7],
    ]);
    testVisibleToModel(5, 10, movedItems, [
      [5, 5],
      [9, 13],
    ]);

    // Start to after
    movedItems = GridUtils.moveRange([5, 7], 11, []);
    // 5 6 7  8  9  10 11 12 13 Before/Visible
    // 8 9 10 11 12 13 5  6  7 After/Model
    testModelToVisible(5, 10, movedItems, [
      [11, 13],
      [5, 7],
    ]);
    testVisibleToModel(5, 10, movedItems, [[8, 13]]);

    // End to after
    movedItems = GridUtils.moveRange([8, 10], 11, []);
    // 5 6 7 8  9  10 11 12 13 Before/Visible
    // 5 6 7 11 12 13 8  9  10 After/Model
    testModelToVisible(5, 10, movedItems, [
      [5, 7],
      [11, 13],
    ]);
    testVisibleToModel(5, 10, movedItems, [
      [5, 7],
      [11, 13],
    ]);
  });

  it('handles ranges moved from before to after range', () => {
    // Before to after
    let movedItems = GridUtils.moveRange([2, 4], 11, []);
    // 2 3 4 5 6 7  8  9  10 11 12 13 Before/Visible
    // 5 6 7 8 9 10 11 12 13 2  3  4 After/Model
    testModelToVisible(5, 10, movedItems, [[2, 7]]);
    testVisibleToModel(5, 10, movedItems, [[8, 13]]);

    // After to before
    movedItems = GridUtils.moveRange([11, 13], 4, []);
    // 4  5  6  7 8 9 10 11 12 13 Before/Visible
    // 11 12 13 4 5 6 7  8  9  10 After/Model
    testModelToVisible(5, 10, movedItems, [[8, 13]]);
    testVisibleToModel(5, 10, movedItems, [
      [12, 13],
      [4, 7],
    ]);
  });

  it('handles ranges moved that contain the target range', () => {
    let movedItems = GridUtils.moveRange([4, 11], 6, []);
    // 2 3 4  5  6 7 8 9 10 11 12 13 Before/Visible
    // 2 3 12 13 4 5 6 7 8  9  10 11 After/Model
    testModelToVisible(5, 10, movedItems, [[7, 12]]);
    testVisibleToModel(5, 10, movedItems, [
      [13, 13],
      [4, 8],
    ]);

    movedItems = GridUtils.moveRange([5, 10], 3, []);
    // 2 3 4 5 6 7 8  9 10 11 Before/Visible
    // 2 5 6 7 8 9 10 3 4  11 After/Model
    testModelToVisible(5, 10, movedItems, [[3, 8]]);
    testVisibleToModel(5, 10, movedItems, [
      [7, 10],
      [3, 4],
    ]);
  });
  it('handles multiple operations', () => {
    let movedItems = GridUtils.moveRange([2, 4], 11, []);
    movedItems = GridUtils.moveRange([5, 10], 3, []);
    // 2 3 4 5 6 7  8  9  10 11 12 13 Before/Visible
    // 5 6 7 8 9 10 11 12 13 2  3  4 After 1st
    // 2 5 6 7 8 9  10 3  4  11 12 13 After 2nd/Model

    testModelToVisible(5, 10, movedItems, [[3, 8]]);
    testVisibleToModel(5, 10, movedItems, [
      [7, 10],
      [3, 4],
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
    let movedItems: MoveOperation[] = GridUtils.moveItem(2, 1, []);
    movedItems = GridUtils.moveItem(5, 0, movedItems);
    movedItems = GridUtils.moveItem(100, 110, movedItems);
    movedItems = GridUtils.moveItem(200, 220, movedItems);

    testRange(new GridRange(50, 55, 60, 65), movedItems, movedItems);
  });
  it('handles moving items into the range', () => {
    const movedColumns: MoveOperation[] = GridUtils.moveItem(25, 15, []);
    const movedRows: MoveOperation[] = GridUtils.moveItem(27, 17, []);
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
    const movedColumns = GridUtils.moveItem(25, 15, []);
    const movedRows = GridUtils.moveItem(27, 17, []);
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
    let movedItems: MoveOperation[] = GridUtils.moveItem(2, 1, []);
    movedItems = GridUtils.moveItem(5, 0, movedItems);
    movedItems = GridUtils.moveItem(100, 110, movedItems);
    movedItems = GridUtils.moveItem(200, 220, movedItems);

    testRange(new GridRange(50, 55, 60, 65), movedItems, movedItems);
  });
  it('handles moving items into the range', () => {
    const movedColumns: MoveOperation[] = GridUtils.moveItem(25, 15, []);
    const movedRows: MoveOperation[] = GridUtils.moveItem(27, 17, []);
    testRange(new GridRange(10, 15, 20, 25), movedColumns, movedRows, [
      new GridRange(10, 15, 14, 16),
      new GridRange(10, 18, 14, 26),
      new GridRange(16, 15, 21, 16),
      new GridRange(16, 18, 21, 26),
    ]);
  });
  it('handles multiple ranges', () => {
    const movedColumns = GridUtils.moveItem(25, 15, []);
    const movedRows = GridUtils.moveItem(27, 17, []);
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

describe('compareRange function works', () => {
  it("returns negative when first range's start is before the second", () => {
    const range1: AxisRange = [0, 5];
    const range2: AxisRange = [1, 3];
    expect(GridUtils.compareRanges(range1, range2) < 0).toBeTruthy();
    expect(GridUtils.compareRanges(range1, range2) > 0).toBeFalsy();
  });
  it("returns negative when first range's end is before the second", () => {
    const range1: AxisRange = [1, 2];
    const range2: AxisRange = [1, 3];
    expect(GridUtils.compareRanges(range1, range2) < 0).toBeTruthy();
    expect(GridUtils.compareRanges(range1, range2) > 0).toBeFalsy();
  });
  it('returns positive when first range is after the second', () => {
    const range1: AxisRange = [1, 5];
    const range2: AxisRange = [1, 3];
    expect(GridUtils.compareRanges(range1, range2) > 0).toBeTruthy();
    expect(GridUtils.compareRanges(range1, range2) < 0).toBeFalsy();
  });
  it('returns 0 when the ranges are the same', () => {
    const range1: AxisRange = [1, 3];
    const range2: AxisRange = [1, 3];
    expect(GridUtils.compareRanges(range1, range2) === 0).toBeTruthy();
  });
});

describe('for each', () => {
  it('works on a single array', () => {
    const ranges: BoundedAxisRange[] = [[1, 2]];
    expect(GridUtils.mergeSortedRanges(ranges)).toEqual(ranges);
  });

  it('works on a non-overlapping array', () => {
    const ranges: BoundedAxisRange[] = [
      [1, 2],
      [4, 5],
      [7, 8],
    ];
    expect(GridUtils.mergeSortedRanges(ranges)).toEqual(ranges);
  });

  it('works on a all overlapping array', () => {
    const ranges: BoundedAxisRange[] = [
      [1, 2],
      [3, 4],
      [5, 6],
    ];
    expect(GridUtils.mergeSortedRanges(ranges)).toEqual([[1, 6]]);
  });

  it('works on a partially overlapping array', () => {
    const ranges: BoundedAxisRange[] = [
      [1, 2],
      [3, 4],
      [7, 11],
    ];
    expect(GridUtils.mergeSortedRanges(ranges)).toEqual([
      [1, 4],
      [7, 11],
    ]);
  });
});

describe('translateTokenBox', () => {
  it('should translate coordinates that are relative to gridX/gridY to relative to the canvas', () => {
    const metrics = makeMockGridMetrics();
    const input: TokenBox = {
      x1: -20,
      y1: 10,
      x2: 50,
      y2: 30,
      token: {} as Token,
    };
    const expectedValue: TokenBox = {
      x1: 0,
      y1: 40,
      x2: 50,
      y2: 60,
      token: {} as Token,
    };

    expect(GridUtils.translateTokenBox(input, metrics)).toEqual(expectedValue);
  });
});
