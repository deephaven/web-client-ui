import GridRange from './GridRange';
import GridTestUtils from './GridTestUtils';

const { LEFT, RIGHT, UP, DOWN } = GridRange.SELECTION_DIRECTION;

describe('contains tests', () => {
  function checkContainsRange(range1Values, range2Values) {
    const range1 = new GridRange(...range1Values);
    const range2 = new GridRange(...range2Values);
    return range1.contains(range2);
  }
  it('should properly detect when a range contains another range', () => {
    expect(checkContainsRange([5, 5, 15, 15], [10, 10, 10, 10])).toBe(true);
    expect(checkContainsRange([5, 5, 15, 15], [5, 5, 15, 15])).toBe(true);
    expect(checkContainsRange([5, null, 15, null], [10, 10, 10, 10])).toBe(
      true
    );
    expect(checkContainsRange([null, 5, null, 15], [10, 10, 10, 10])).toBe(
      true
    );
  });

  it('should return false when it does not contain the other range', () => {
    expect(checkContainsRange([5, 5, 15, 15], [20, 20, 20, 20])).toBe(false);
    expect(checkContainsRange([5, 5, 15, 15], [10, 10, 20, 20])).toBe(false);
    expect(checkContainsRange([5, null, 15, null], [20, 10, 20, 10])).toBe(
      false
    );
    expect(checkContainsRange([5, 5, 15, 15], [null, 10, null, 10])).toBe(
      false
    );
  });
});

describe('touching tests', () => {
  function checkTouchesRange(range1Values, range2Values) {
    const range1 = new GridRange(...range1Values);
    const range2 = new GridRange(...range2Values);
    return range1.touches(range2);
  }

  it('should properly detect an axis range touching', () => {
    expect(GridRange.isAxisRangeTouching(5, 10, 8, 8)).toBe(true);
    expect(GridRange.isAxisRangeTouching(5, 10, 11, 15)).toBe(true);
    expect(GridRange.isAxisRangeTouching(8, 8, 5, 10)).toBe(true);
    expect(GridRange.isAxisRangeTouching(5, 10, 1, 4)).toBe(true);
    expect(GridRange.isAxisRangeTouching(5, 10, 1, 8)).toBe(true);
    expect(GridRange.isAxisRangeTouching(null, 10, null, 4)).toBe(true);
    expect(GridRange.isAxisRangeTouching(null, 10, 9, null)).toBe(true);
    expect(GridRange.isAxisRangeTouching(null, 10, 11, 12)).toBe(true);
    expect(GridRange.isAxisRangeTouching(15, 15, null, 14)).toBe(true);
    expect(GridRange.isAxisRangeTouching(15, 15, 16, null)).toBe(true);
    expect(GridRange.isAxisRangeTouching(null, null, 15, 15)).toBe(true);
  });

  it('should properly detect axis ranges not touching', () => {
    expect(GridRange.isAxisRangeTouching(5, 10, 12, 12)).toBe(false);
    expect(GridRange.isAxisRangeTouching(5, 10, 2, 3)).toBe(false);
    expect(GridRange.isAxisRangeTouching(null, 10, 20, null)).toBe(false);
    expect(GridRange.isAxisRangeTouching(20, null, 10, 15)).toBe(false);
    expect(GridRange.isAxisRangeTouching(20, null, null, 15)).toBe(false);
  });

  it('should properly detect when two ranges touch eachother', () => {
    expect(checkTouchesRange([5, 5, 15, 15], [10, 10, 10, 10])).toBe(true);
    expect(checkTouchesRange([5, 5, 15, 15], [5, 5, 15, 15])).toBe(true);
    expect(checkTouchesRange([5, null, 15, null], [10, 10, 10, 10])).toBe(true);
    expect(checkTouchesRange([null, 5, null, 15], [10, 10, 10, 10])).toBe(true);
    expect(checkTouchesRange([5, 5, 15, 15], [5, 16, 10, 20])).toBe(true);
    expect(checkTouchesRange([5, 5, 15, 15], [16, 5, 20, 15])).toBe(true);
  });

  it('should properly detect when two ranges do not touch eachother', () => {
    expect(checkTouchesRange([5, 5, 15, 15], [20, 20, 20, 20])).toBe(false);
    expect(checkTouchesRange([5, 5, 15, 15], [0, 0, 0, 0])).toBe(false);
    expect(checkTouchesRange([5, 5, 15, 15], [5, 0, 15, 3])).toBe(false);
  });
});

describe('intersection tests', () => {
  const maxRange = new GridRange(null, null, null, null);

  function testIntersection(range1, range2, expectedRange = range1) {
    // Test with params flipped both ways as the result should be the same
    expect(GridRange.intersection(range1, range2)).toEqual(expectedRange);
    expect(GridRange.intersection(range2, range1)).toEqual(expectedRange);
  }
  it('returns the full range if the same', () => {
    const range = new GridRange(5, 5, 15, 15);
    testIntersection(range, range);
  });

  it('returns the smaller range if entirely within a bigger range', () => {
    const range = new GridRange(5, 5, 15, 15);
    const biggerRange = new GridRange(0, 0, 20, 20);
    testIntersection(range, biggerRange);
    testIntersection(range, maxRange);
    testIntersection(biggerRange, maxRange);
  });

  it('returns the partially intersecting part', () => {
    const range = new GridRange(5, 5, 15, 15);
    const topLeft = new GridRange(0, 0, 10, 10);
    const topRight = new GridRange(10, 0, 20, 10);
    const bottomLeft = new GridRange(0, 10, 10, 20);
    const bottomRight = new GridRange(10, 10, 20, 20);
    testIntersection(range, topLeft, new GridRange(5, 5, 10, 10));
    testIntersection(range, topRight, new GridRange(10, 5, 15, 10));
    testIntersection(range, bottomLeft, new GridRange(5, 10, 10, 15));
    testIntersection(range, bottomRight, new GridRange(10, 10, 15, 15));
  });

  it('returns intersection of entire row selections', () => {
    const range = new GridRange(null, 5, null, 15);
    const insideRange = new GridRange(null, 10, null, 12);
    const overlapBefore = new GridRange(null, 0, null, 10);
    const overlapAfter = new GridRange(null, 10, null, 15);
    testIntersection(insideRange, range);
    testIntersection(overlapBefore, range, new GridRange(null, 5, null, 10));
    testIntersection(overlapAfter, range, new GridRange(null, 10, null, 15));
  });

  it('returns intersection of entire column selections', () => {
    const range = new GridRange(5, null, 15, null);
    const insideRange = new GridRange(10, null, 12, null);
    const overlapBefore = new GridRange(0, null, 10, null);
    const overlapAfter = new GridRange(10, null, 15, null);
    testIntersection(insideRange, range);
    testIntersection(overlapBefore, range, new GridRange(5, null, 10, null));
    testIntersection(overlapAfter, range, new GridRange(10, null, 15, null));
  });

  it('returns intersection of entire row/column selections', () => {
    const range = new GridRange(null, 5, null, 15);
    const otherRange = new GridRange(6, null, 16, null);
    testIntersection(range, otherRange, new GridRange(6, 5, 16, 15));
  });

  it('returns full range if entire grid selection', () => {
    const range = new GridRange(6, 5, 16, 15);
    testIntersection(range, maxRange);
  });

  it('returns null if they do not intersect at all', () => {
    const range = new GridRange(5, 5, 15, 15);
    const otherRange = new GridRange(20, 20, 30, 30);
    testIntersection(range, otherRange, null);
  });

  it('returns full grid if both are full grid selection', () => {
    testIntersection(maxRange, maxRange);
  });
});

describe('consolidation tests', () => {
  it('should consolidate adjacent column ranges', () => {
    const ranges = [new GridRange(5, 5, 15, 15), new GridRange(16, 5, 20, 15)];
    const expectedResult = [new GridRange(5, 5, 20, 15)];

    expect(GridRange.consolidate(ranges)).toEqual(expectedResult);
  });

  it('should consolidate adjacent row ranges', () => {
    const ranges = [new GridRange(5, 5, 15, 15), new GridRange(5, 16, 15, 20)];
    const expectedResult = [new GridRange(5, 5, 15, 20)];

    expect(GridRange.consolidate(ranges)).toEqual(expectedResult);
  });

  it('should consolidate overlapping ranges', () => {
    const ranges = [new GridRange(5, 5, 15, 15), new GridRange(10, 10, 10, 10)];
    const expectedResult = [new GridRange(5, 5, 15, 15)];

    expect(GridRange.consolidate(ranges)).toEqual(expectedResult);
  });

  it('should not consolidate ranges not adjacent', () => {
    const ranges = [new GridRange(5, 5, 15, 15), new GridRange(5, 20, 15, 25)];
    const expectedResult = ranges;

    expect(GridRange.consolidate(ranges)).toEqual(expectedResult);
  });

  it('should consolidate more than 2 adjacent ranges', () => {
    const ranges = [
      new GridRange(5, 5, 10, 15),
      new GridRange(10, 5, 15, 15),
      new GridRange(15, 5, 20, 15),
      new GridRange(20, 5, 25, 15),
    ];
    const expectedResult = [new GridRange(5, 5, 25, 15)];

    expect(GridRange.consolidate(ranges)).toEqual(expectedResult);
  });

  it('should consolidate more than 2 adjacent ranges out of order', () => {
    const ranges = [
      new GridRange(15, 5, 20, 15),
      new GridRange(5, 5, 10, 15),
      new GridRange(20, 5, 25, 15),
      new GridRange(10, 5, 15, 15),
    ];
    const expectedResult = [new GridRange(5, 5, 25, 15)];

    expect(GridRange.consolidate(ranges)).toEqual(expectedResult);
  });

  it('should consolidate more than 2 adjacent ranges, and not consolidate one not adjact', () => {
    const ranges = [
      new GridRange(5, 5, 10, 15),
      new GridRange(10, 5, 15, 15),
      new GridRange(100, 100, 105, 105),
      new GridRange(15, 5, 20, 15),
      new GridRange(20, 5, 25, 15),
    ];
    const expectedResult = [
      new GridRange(5, 5, 25, 15),
      new GridRange(100, 100, 105, 105),
    ];

    expect(GridRange.consolidate(ranges)).toEqual(expectedResult);
  });
});

describe('subtracting ranges tests', () => {
  function testSubtract(range, subtractRange, expectedResult) {
    expect(range.subtract(subtractRange)).toEqual(expectedResult);
  }

  it('should handle subtracting one cell from the middle', () => {
    const outerRange = new GridRange(5, 5, 15, 15);
    const innerRange = new GridRange(10, 10, 10, 10);
    const expectedResult = [
      new GridRange(5, 5, 15, 9),
      new GridRange(5, 10, 9, 10),
      new GridRange(11, 10, 15, 10),
      new GridRange(5, 11, 15, 15),
    ];

    testSubtract(outerRange, innerRange, expectedResult);
  });

  it('should handle subtracting the entire middle row', () => {
    const outerRange = new GridRange(5, 5, 15, 15);
    const innerRange = new GridRange(5, 10, 15, 10);
    const expectedResult = [
      new GridRange(5, 5, 15, 9),
      new GridRange(5, 11, 15, 15),
    ];

    testSubtract(outerRange, innerRange, expectedResult);
  });

  it('should handle subtracting a bounded column', () => {
    const outerRange = new GridRange(5, 5, 15, 15);
    const innerRange = new GridRange(10, 5, 10, 15);
    const expectedResult = [
      new GridRange(5, 5, 9, 15),
      new GridRange(11, 5, 15, 15),
    ];

    testSubtract(outerRange, innerRange, expectedResult);
  });

  it('should handle subtracting an unbounded middle column', () => {
    const outerRange = new GridRange(5, 5, 15, 15);
    const innerRange = new GridRange(10, null, 10, null);
    const expectedResult = [
      new GridRange(5, 5, 9, 15),
      new GridRange(11, 5, 15, 15),
    ];

    testSubtract(outerRange, innerRange, expectedResult);
  });

  it('should handle subtracting the entire region', () => {
    const outerRange = new GridRange(5, 5, 15, 15);
    const innerRange = new GridRange(5, 5, 15, 15);
    const expectedResult = [];

    testSubtract(outerRange, innerRange, expectedResult);
  });

  it('should handle subtracting with a partially overlapping piece', () => {
    const outerRange = new GridRange(5, 5, 15, 15);
    const innerRange = new GridRange(10, 10, 20, 20);
    const expectedResult = [
      new GridRange(5, 5, 15, 9),
      new GridRange(5, 10, 9, 15),
    ];

    testSubtract(outerRange, innerRange, expectedResult);
  });

  it('handles subtracting a partially overlapping piece at the top left', () => {
    const outerRange = new GridRange(5, 5, 15, 15);
    const innerRange = new GridRange(0, 0, 10, 10);
    const expectedResult = [
      new GridRange(11, 5, 15, 10),
      new GridRange(5, 11, 15, 15),
    ];

    testSubtract(outerRange, innerRange, expectedResult);
  });

  it('should handle subtracting from a full column selection', () => {
    const outerRange = new GridRange(5, null, 15, null);
    const innerRange = new GridRange(8, 8, 12, 12);
    const expectedResult = [
      new GridRange(5, null, 15, 7),
      new GridRange(5, 8, 7, 12),
      new GridRange(13, 8, 15, 12),
      new GridRange(5, 13, 15, null),
    ];

    testSubtract(outerRange, innerRange, expectedResult);
  });

  it('should handle subtracting from a full row selection', () => {
    const outerRange = new GridRange(null, 5, null, 15);
    const innerRange = new GridRange(8, 8, 12, 12);
    const expectedResult = [
      new GridRange(null, 5, null, 7),
      new GridRange(null, 8, 7, 12),
      new GridRange(13, 8, null, 12),
      new GridRange(null, 13, null, 15),
    ];

    testSubtract(outerRange, innerRange, expectedResult);
  });

  it('should handle subtracting the entire first row', () => {
    const outerRange = new GridRange(5, 5, 15, 15);
    const innerRange = new GridRange(5, 5, 15, 5);
    const unboundedInnerRange = GridRange.makeRow(5);
    const expectedResult = [new GridRange(5, 6, 15, 15)];

    testSubtract(outerRange, innerRange, expectedResult);
    testSubtract(outerRange, unboundedInnerRange, expectedResult);
  });

  it('should handle subtracting the entire first column', () => {
    const outerRange = new GridRange(5, 5, 15, 15);
    const innerRange = new GridRange(5, 5, 5, 15);
    const unboundedInnerRange = GridRange.makeColumn(5);
    const expectedResult = [new GridRange(6, 5, 15, 15)];

    testSubtract(outerRange, innerRange, expectedResult);
    testSubtract(outerRange, unboundedInnerRange, expectedResult);
  });

  it('should handle subtracting the entire last row', () => {
    const outerRange = new GridRange(5, 5, 15, 15);
    const innerRange = new GridRange(5, 15, 15, 15);
    const unboundedInnerRange = GridRange.makeRow(15);
    const expectedResult = [new GridRange(5, 5, 15, 14)];

    testSubtract(outerRange, innerRange, expectedResult);
    testSubtract(outerRange, unboundedInnerRange, expectedResult);
  });

  it('should handle subtracting the entire last column', () => {
    const outerRange = new GridRange(5, 5, 15, 15);
    const innerRange = new GridRange(15, 5, 15, 15);
    const unboundedInnerRange = GridRange.makeColumn(15);
    const expectedResult = [new GridRange(5, 5, 14, 15)];

    testSubtract(outerRange, innerRange, expectedResult);
    testSubtract(outerRange, unboundedInnerRange, expectedResult);
  });

  it('subtracting from outside the range has no effect', () => {
    const range = new GridRange(5, 5, 15, 15);
    const subtractRange = new GridRange(100, 10, 200, 20);
    const expectedResult = [range];

    testSubtract(range, subtractRange, expectedResult);
  });

  it('static handles subtracting one range from multiple ranges', () => {
    const ranges = [new GridRange(5, 5, 15, 15), new GridRange(30, 35, 32, 37)];
    const subtractRange = GridRange.makeColumn(10);
    const expectedResult = [
      new GridRange(5, 5, 9, 15),
      new GridRange(11, 5, 15, 15),
      new GridRange(30, 35, 32, 37),
    ];

    expect(GridRange.subtractFromRanges(ranges, subtractRange)).toEqual(
      expectedResult
    );
  });

  it('handles subtracting multiple ranges from multiple ranges', () => {
    const ranges = [new GridRange(5, 5, 15, 15), new GridRange(30, 35, 32, 37)];
    const subtractRanges = [GridRange.makeColumn(10), GridRange.makeRow(10)];
    const expectedResult = [
      new GridRange(5, 5, 9, 9),
      new GridRange(5, 11, 9, 15),
      new GridRange(11, 5, 15, 9),
      new GridRange(11, 11, 15, 15),
      new GridRange(30, 35, 32, 37),
    ];

    expect(GridRange.subtractRangesFromRanges(ranges, subtractRanges)).toEqual(
      expectedResult
    );
  });
});

describe('offset tests', () => {
  function testOffset(range, x, y, expectedRange) {
    // Test both ways, since the opposite offset should hold true as well
    expect(GridRange.offset(range, x, y)).toEqual(expectedRange);
    expect(GridRange.offset(expectedRange, -x, -y)).toEqual(range);
  }
  it('handles offsetting a cell', () => {
    testOffset(GridRange.makeCell(3, 5), 4, 10, GridRange.makeCell(7, 15));
  });
  it('handles offsetting a range', () => {
    testOffset(new GridRange(3, 5, 6, 9), 4, 10, new GridRange(7, 15, 10, 19));
  });
  it('handles offsetting a column', () => {
    testOffset(GridRange.makeColumn(3), 4, 0, GridRange.makeColumn(7));
    testOffset(GridRange.makeColumn(3), 4, 10, GridRange.makeColumn(7));
  });
  it('handles offsetting a row', () => {
    testOffset(GridRange.makeRow(3), 0, 4, GridRange.makeRow(7));
    testOffset(GridRange.makeRow(3), 10, 4, GridRange.makeRow(7));
  });
});

describe('rowCount tests', () => {
  function testRowCount(ranges, expectedCount) {
    expect(GridRange.rowCount(ranges)).toBe(expectedCount);
  }
  it('returns 0 for empty set', () => {
    const result = GridRange.rowCount([]);
    expect(result).toBe(0);
  });

  it('sums bounded ranges properly', () => {
    function testRangeSize(count, rangeSize) {
      const ranges = GridTestUtils.makeRanges(count, rangeSize);
      testRowCount(ranges, count * rangeSize);
    }

    testRangeSize(1, 1);
    testRangeSize(10, 10);
    testRangeSize(1, 1000000);
    testRangeSize(1000000, 1);
    testRangeSize(10000, 10000);
    testRangeSize(4834, 92384);
  });

  it('returns NaN for unbounded ranges properly', () => {
    const rowRange = new GridRange(null, 0, null, 4);
    const columnRange = new GridRange(0, null, 4, null);
    const boundedRange = new GridRange(0, 0, 4, 4);

    testRowCount([rowRange], 5);
    testRowCount([columnRange], NaN);
    testRowCount([rowRange, columnRange], NaN);
    testRowCount([boundedRange, columnRange], NaN);
  });
});

describe('cellCount tests', () => {
  function testCellCount(ranges, expectedCount) {
    expect(GridRange.cellCount(ranges)).toBe(expectedCount);
  }

  it('returns 0 for empty set', () => {
    testCellCount([], 0);
  });

  it('sums bounded ranges properly', () => {
    const smallRange = new GridRange(0, 0, 4, 4);
    const mediumRange = new GridRange(5, 5, 14, 14);
    const bigRange = new GridRange(100, 100, 199, 199);
    testCellCount([smallRange], 25);
    testCellCount([mediumRange], 100);
    testCellCount([bigRange], 10000);
    testCellCount([smallRange, mediumRange], 125);
    testCellCount([smallRange, bigRange], 10025);
    testCellCount([mediumRange, bigRange], 10100);
    testCellCount([smallRange, mediumRange, bigRange], 10125);
  });

  it('returns NaN for unbounded ranges', () => {
    const rowRange = new GridRange(null, 0, null, 4);
    const columnRange = new GridRange(0, null, 4, null);
    const boundedRange = new GridRange(0, 0, 4, 4);

    testCellCount([rowRange], NaN);
    testCellCount([columnRange], NaN);
    testCellCount([rowRange, columnRange], NaN);

    // Adding unbounded to bounded should be NaN
    testCellCount([boundedRange, columnRange], NaN);
    testCellCount([boundedRange, rowRange], NaN);
    testCellCount([boundedRange, rowRange, columnRange], NaN);
  });
});

describe('next cell', () => {
  function cell(column, row) {
    return { column, row };
  }

  function testRanges(ranges, currentFocus, direction, result) {
    const { column = null, row = null } = currentFocus ?? {};
    expect(GridRange.nextCell(ranges, column, row, direction)).toEqual(result);
  }

  const RANGES = [
    new GridRange(5, 7, 20, 21),
    new GridRange(105, 107, 120, 121),
  ];
  const FIRST_CELL_DOWN = [cell(5, 7), cell(105, 107)];
  const FIRST_CELL_UP = [cell(20, 21), cell(120, 121)];
  const CELL_OUTSIDE_RANGES = cell(1, 3);

  it('throws if no ranges passed', () => {
    expect(() => GridRange.nextCell(null)).toThrow();
  });

  it('returns null for no ranges', () => {
    expect(GridRange.nextCell([], null)).toBe(null);
    expect(
      GridRange.nextCell(
        [],
        CELL_OUTSIDE_RANGES.column,
        CELL_OUTSIDE_RANGES.row
      )
    ).toBe(null);
  });

  it('returns the first cell if no previous cell', () => {
    testRanges(RANGES, null, DOWN, FIRST_CELL_DOWN[0]);
    testRanges(RANGES, null, RIGHT, FIRST_CELL_DOWN[0]);
    testRanges(RANGES, null, UP, FIRST_CELL_UP[1]);
    testRanges(RANGES, null, LEFT, FIRST_CELL_UP[1]);
  });

  it('returns first cell if focus is outside of all ranges', () => {
    testRanges(RANGES, CELL_OUTSIDE_RANGES, DOWN, FIRST_CELL_DOWN[0]);
    testRanges(RANGES, CELL_OUTSIDE_RANGES, RIGHT, FIRST_CELL_DOWN[0]);
    testRanges(RANGES, CELL_OUTSIDE_RANGES, UP, FIRST_CELL_UP[1]);
    testRanges(RANGES, CELL_OUTSIDE_RANGES, LEFT, FIRST_CELL_UP[1]);
  });

  describe('returns the next cell in current range', () => {
    it('handles down', () => {
      testRanges(RANGES, FIRST_CELL_DOWN[0], DOWN, cell(5, 8));
      testRanges(RANGES, cell(8, 15), DOWN, cell(8, 16));
    });

    it('handles right', () => {
      testRanges(RANGES, FIRST_CELL_DOWN[0], RIGHT, cell(6, 7));
      testRanges(RANGES, cell(8, 15), RIGHT, cell(9, 15));
    });

    it('handles up', () => {
      testRanges(RANGES, FIRST_CELL_UP[0], UP, cell(20, 20));
      testRanges(RANGES, cell(8, 15), UP, cell(8, 14));
    });

    it('handles left', () => {
      testRanges(RANGES, FIRST_CELL_UP[0], LEFT, cell(19, 21));
      testRanges(RANGES, cell(8, 15), LEFT, cell(7, 15));
    });
  });

  it('wraps at end of one dimension', () => {
    testRanges(RANGES, cell(5, 21), DOWN, cell(6, 7));
    testRanges(RANGES, cell(20, 10), RIGHT, cell(5, 11));
    testRanges(RANGES, cell(20, 7), UP, cell(19, 21));
    testRanges(RANGES, cell(5, 21), LEFT, cell(20, 20));
  });

  it('wraps at end of both dimensions', () => {
    testRanges([RANGES[0]], FIRST_CELL_UP[0], DOWN, FIRST_CELL_DOWN[0]);
    testRanges([RANGES[0]], FIRST_CELL_UP[0], RIGHT, FIRST_CELL_DOWN[0]);
    testRanges([RANGES[0]], FIRST_CELL_DOWN[0], UP, FIRST_CELL_UP[0]);
    testRanges([RANGES[0]], FIRST_CELL_DOWN[0], LEFT, FIRST_CELL_UP[0]);
  });

  it('goes to start of next range if at end of current range', () => {
    testRanges(RANGES, FIRST_CELL_UP[0], DOWN, FIRST_CELL_DOWN[1]);
    testRanges(RANGES, FIRST_CELL_UP[0], RIGHT, FIRST_CELL_DOWN[1]);
    testRanges(RANGES, FIRST_CELL_DOWN[1], UP, FIRST_CELL_UP[0]);
    testRanges(RANGES, FIRST_CELL_DOWN[1], LEFT, FIRST_CELL_UP[0]);
  });

  it('throws if range is unbounded', () => {
    const rowRange = new GridRange(null, 0, null, 4);
    const columnRange = new GridRange(0, null, 4, null);
    expect(() =>
      rowRange.nextCell(0, 0, GridRange.SELECTION_DIRECTION.DOWN)
    ).toThrow();
    expect(() =>
      columnRange.nextCell(0, 0, GridRange.SELECTION_DIRECTION.DOWN)
    ).toThrow();
  });
});

describe('for each', () => {
  const fn = jest.fn();
  const x = 10;
  const y = 20;
  const w = 30;
  const h = 40;
  const range = new GridRange(x, y, x + w - 1, y + h - 1);

  beforeEach(() => {
    fn.mockClear();
  });

  it('handles DOWN', () => {
    range.forEach(fn, DOWN);
    for (let i = 0; i < w * h; i += 1) {
      const c = x + Math.floor(i / h);
      const r = y + (i % h);
      expect(fn).toHaveBeenNthCalledWith(i + 1, c, r, i);
    }
  });

  it('handles RIGHT', () => {
    range.forEach(fn, RIGHT);
    for (let i = 0; i < w * h; i += 1) {
      const c = x + (i % w);
      const r = y + Math.floor(i / w);
      expect(fn).toHaveBeenNthCalledWith(i + 1, c, r, i);
    }
  });

  it('handles UP', () => {
    range.forEach(fn, UP);
    for (let i = 0; i < w * h; i += 1) {
      const c = x + w - 1 - Math.floor(i / h);
      const r = y + h - 1 - (i % h);
      expect(fn).toHaveBeenNthCalledWith(i + 1, c, r, i);
    }
  });

  it('handles LEFT', () => {
    range.forEach(fn, LEFT);
    for (let i = 0; i < w * h; i += 1) {
      const c = x + w - 1 - (i % w);
      const r = y + h - 1 - Math.floor(i / w);
      expect(fn).toHaveBeenNthCalledWith(i + 1, c, r, i);
    }
  });
});
