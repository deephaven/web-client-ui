class RangeUtils {
  static isValidRange(range: [number, number]): boolean {
    return (
      range != null &&
      range.length === 2 &&
      Number.isInteger(range[0]) &&
      Number.isInteger(range[1]) &&
      range[0] <= range[1]
    );
  }

  static validateRange(range: [number, number]): void {
    if (!RangeUtils.isValidRange(range)) {
      throw new Error(`Invalid range! ${range}`);
    }
  }

  static isSelected(selectedRanges: number[][], index: number): boolean {
    for (let i = 0; i < selectedRanges.length; i += 1) {
      const range = selectedRanges[i];
      const start = range[0];
      const end = range[1];
      if (start <= index && index <= end) {
        return true;
      }
    }

    return false;
  }

  static selectRange(
    selectedRanges: number[][],
    range: [number, number]
  ): number[][] {
    let [start, end] = range;
    const ranges = [...selectedRanges];

    // Need to consolidate the range with previous ranges
    for (let i = ranges.length - 1; i >= 0; i -= 1) {
      const selectedRange = ranges[i];
      const selectedStart = selectedRange[0];
      const selectedEnd = selectedRange[1];

      if (selectedStart <= start && end <= selectedEnd) {
        // Already contained within a range
        return ranges;
      }

      if (start <= selectedEnd && selectedStart <= end) {
        // Overlaps the previous range, remove this range and update the new range
        start = Math.min(start, selectedStart);
        end = Math.max(end, selectedEnd);
        ranges.splice(i, 1);
      }
    }

    ranges.push([start, end]);

    return ranges;
  }

  static deselectRange(
    selectedRanges: number[][],
    range: [number, number]
  ): number[][] {
    const [start, end] = range;
    const ranges = [...selectedRanges];
    // Need to consolidate the range with previous ranges
    for (let i = ranges.length - 1; i >= 0; i -= 1) {
      const selectedRange = ranges[i];
      const selectedStart = selectedRange[0];
      const selectedEnd = selectedRange[1];

      if (end < selectedStart || selectedEnd < start) {
        // Outside of the selected range
      } else if (selectedStart < start && end < selectedEnd) {
        // Contained within the range, split the range
        ranges[i] = [selectedStart, start - 1];
        ranges.splice(i + 1, 0, [end + 1, selectedEnd]);
        break;
      } else if (start <= selectedStart && selectedEnd <= end) {
        // Entire range should be deselected, remove from selected ranges
        ranges.splice(i, 1);
      } else if (selectedStart < start) {
        // Overlaps end of the previous range, update the end
        ranges[i] = [selectedStart, start - 1];
      } else {
        // Overlaps the start of the previous range, update the start
        ranges[i] = [end + 1, selectedEnd];
      }
    }
    return ranges;
  }

  /**
   * Count the sum total of items in the ranges provided
   *
   * @param {Array} ranges The ranges to count
   */
  static count(ranges: number[][]): number {
    return ranges.reduce((sum, range) => sum + (range[1] - range[0] + 1), 0);
  }
}

export default RangeUtils;
