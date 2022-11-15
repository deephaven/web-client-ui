import RangeUtils from './RangeUtils';

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
