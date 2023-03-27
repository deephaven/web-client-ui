import { siftPrunableItems } from './pouchCommandHistoryUtils';

describe('siftPrunableItems', () => {
  const fiveItems = [1, 2, 3, 4, 5];

  it.each([5, 6, 7, 8, 9, 10])(
    'should keep all items if size is <= maxItems: %s',
    maxItems => {
      const expected = { toKeep: fiveItems, toPrune: [] };

      const actual = siftPrunableItems(fiveItems, maxItems, 3);
      expect(actual).toEqual(expected);
    }
  );

  it.each([
    [1, { toKeep: [5], toPrune: [1, 2, 3, 4] }],
    [2, { toKeep: [4, 5], toPrune: [1, 2, 3] }],
    [3, { toKeep: [3, 4, 5], toPrune: [1, 2] }],
  ])(
    'should sift items if size is > maxItems: %s, %s',
    (pruneItemsCount, expected) => {
      const actual = siftPrunableItems(fiveItems, 4, pruneItemsCount);
      expect(actual).toEqual(expected);
    }
  );
});
