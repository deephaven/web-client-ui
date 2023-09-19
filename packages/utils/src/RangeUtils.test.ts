import RangeUtils, { generateRange } from './RangeUtils';

describe('getItemsInRanges', () => {
  it('handles edge cases', () => {
    expect(RangeUtils.getItemsInRanges([], [])).toEqual([]);
    expect(RangeUtils.getItemsInRanges([1, 2, 3], [])).toEqual([]);
    expect(RangeUtils.getItemsInRanges([1, 2, 3], [[-1, 1]])).toEqual([
      undefined,
      1,
      2,
    ]);
  });

  it('returns correct items in provided valid ranges', () => {
    expect(
      RangeUtils.getItemsInRanges(
        [1, 2, 3, 4],
        [
          [0, 0],
          [2, 3],
        ]
      )
    ).toEqual([1, 3, 4]);
  });
});

describe('isValidRange', () => {
  it('returns true if the range is valid', () => {
    expect(RangeUtils.isValidRange([0, 10])).toBe(true);
  });

  it('returns false if the range is invalid', () => {
    expect(RangeUtils.isValidRange([10, 0])).toBe(false);
  });
});

describe('validateRange', () => {
  it('throws an error if a range is invalid', () => {
    expect(() => RangeUtils.validateRange([10, 0])).toThrowError(
      'Invalid range! 10,0'
    );
  });
});

describe('isSelected', () => {
  it('returns true if the index is within the selected ranges', () => {
    expect(
      RangeUtils.isSelected(
        [
          [0, 2],
          [3, 4],
        ],
        1
      )
    ).toBe(true);
  });

  it('returns false if the index is not within one of the selected ranges', () => {
    expect(
      RangeUtils.isSelected(
        [
          [0, 2],
          [3, 4],
        ],
        5
      )
    ).toBe(false);
  });
});

describe('selectRange', () => {
  it('returns the same selected ranges if the given range is already within a range', () => {
    expect(
      RangeUtils.selectRange(
        [
          [0, 2],
          [3, 4],
          [5, 7],
        ],
        [0, 1]
      )
    ).toEqual([
      [0, 2],
      [3, 4],
      [5, 7],
    ]);
  });

  it('consolidates the previous ranges if they overlap', () => {
    expect(
      RangeUtils.selectRange(
        [
          [50, 60],
          [10, 20],
          [30, 40],
        ],
        [15, 35]
      )
    ).toEqual([
      [50, 60],
      [10, 40],
    ]);
  });
});

describe('deselectRanges', () => {
  it('returns the same selected ranges if the given range is not selected', () => {
    expect(
      RangeUtils.deselectRange(
        [
          [50, 60],
          [10, 20],
          [30, 40],
        ],
        [0, 1]
      )
    ).toEqual([
      [50, 60],
      [10, 20],
      [30, 40],
    ]);
  });

  it('splits a range if the given range is fully contained within another range', () => {
    expect(
      RangeUtils.deselectRange(
        [
          [50, 60],
          [10, 20],
          [30, 40],
        ],
        [55, 57]
      )
    ).toEqual([
      [50, 54],
      [58, 60],
      [10, 20],
      [30, 40],
    ]);
  });

  it('removes a range if the given range fully engulfs the range', () => {
    expect(
      RangeUtils.deselectRange(
        [
          [50, 60],
          [10, 20],
          [30, 40],
        ],
        [5, 25]
      )
    ).toEqual([
      [50, 60],
      [30, 40],
    ]);
  });

  it('trims a range if the given range overlaps the start or end of a range', () => {
    expect(
      RangeUtils.deselectRange(
        [
          [50, 60],
          [10, 20],
          [30, 40],
        ],
        [15, 35]
      )
    ).toEqual([
      [50, 60],
      [10, 14],
      [36, 40],
    ]);
  });
});

describe('count', () => {
  it('should return the total number of items in the given ranges', () => {
    expect(
      RangeUtils.count([
        [50, 60],
        [10, 20],
        [30, 40],
      ])
    ).toEqual(33);
  });
});

it.each([
  [2, 1, []],
  [-1, 1, [-1, 0, 1]],
  [0, 0, [0]],
  [0, 1, [0, 1]],
  [1, 2, [1, 2]],
  [1, 5, [1, 2, 3, 4, 5]],
] as const)(
  'should generate a range based on given start and end indices: %s, %s, %s',
  (start, end, expected) => {
    expect([...generateRange(start, end)]).toEqual(expected);
  }
);
