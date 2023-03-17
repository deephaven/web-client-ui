/**
 * Takes an array of items and determines which ones to keep and which ones to
 * prune based on the given thresholds.
 * @param items items to keep or prune
 * @param maxItems maximum number of items to allow before pruning
 * @param pruneItemsCount if the maxItems count is exceeded, the number we want to keep
 */
// eslint-disable-next-line import/prefer-default-export
export function siftPrunableItems<T>(
  items: T[],
  maxItems: number,
  pruneItemsCount: number
): {
  toKeep: T[];
  toPrune: T[];
} {
  if (items.length > maxItems) {
    const pruneCount = items.length - pruneItemsCount;
    return {
      toKeep: items.slice(pruneCount),
      toPrune: items.slice(0, pruneCount),
    };
  }

  return {
    toKeep: items,
    toPrune: [],
  };
}
