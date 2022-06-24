import { GridRangeIndex, VisibleIndex } from '.';

export type Range<T> = [start: T, end: T];

export type AxisRange = Range<GridRangeIndex>;
export type BoundedAxisRange = Range<VisibleIndex>;

export function isAxisRange(range: unknown): range is AxisRange {
  return (
    Array.isArray(range) &&
    range.length === 2 &&
    (range[0] === null || typeof range[0] === 'number') &&
    (range[1] === null || typeof range[1] === 'number')
  );
}

export function assertAxisRange(range: unknown): asserts range is AxisRange {
  if (!isAxisRange(range)) {
    throw new Error(`Expected axis range. Received: ${range}`);
  }
}

export function isBoundedAxisRange(range: unknown): range is BoundedAxisRange {
  return isAxisRange(range) && range[0] != null && range[1] != null;
}

export function assertBoundedAxisRange(
  range: unknown
): asserts range is BoundedAxisRange {
  if (!isBoundedAxisRange(range)) {
    throw new Error(`Expected bounded axis range. Received: ${range}`);
  }
}
