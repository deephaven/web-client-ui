import GridRange from './GridRange';

class GridTestUtils {
  static makeRanges(count = 5, rangeSize = 10, rangeSpace = 10) {
    const ranges: GridRange[] = [];

    for (let i = 0; i < count; i += 1) {
      const range = new GridRange(
        null,
        i * (rangeSize + rangeSpace),
        null,
        i * (rangeSize + rangeSpace) + (rangeSize - 1)
      );
      ranges.push(range);
    }

    return ranges;
  }
}

export default GridTestUtils;
