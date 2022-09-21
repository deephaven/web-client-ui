import { SelectionSegment } from './MaskedInput';

export function getNextNumberSegmentValue(
  delta: number,
  segmentValue: string,
  lowerBound: number,
  upperBound: number,
  length: number
): string {
  const modValue = upperBound - lowerBound + 1;
  const newSegmentValue =
    ((((parseInt(segmentValue, 10) - delta - lowerBound) % modValue) +
      modValue) %
      modValue) +
    lowerBound;
  return `${newSegmentValue}`.padStart(length, '0');
}

export function getNextSegmentValue(
  range: SelectionSegment,
  delta: number,
  segmentValue: string
): string {
  const { selectionStart } = range;
  if (selectionStart === 0) {
    return getNextNumberSegmentValue(delta, segmentValue, 1900, 2099, 4);
  }
  if (selectionStart === 5) {
    return getNextNumberSegmentValue(delta, segmentValue, 1, 12, 2);
  }
  if (selectionStart === 8) {
    return getNextNumberSegmentValue(delta, segmentValue, 1, 31, 2);
  }
  if (selectionStart === 11) {
    // Hours input
    return getNextNumberSegmentValue(delta, segmentValue, 0, 23, 2);
  }
  if (selectionStart === 17 || selectionStart === 14) {
    // Minutes/seconds input
    return getNextNumberSegmentValue(delta, segmentValue, 0, 59, 2);
  }
  if (selectionStart === 20 || selectionStart === 24 || selectionStart === 28) {
    // Milli, micro, and nanosecond input
    return getNextNumberSegmentValue(delta, segmentValue, 0, 999, 3);
  }

  return segmentValue;
}
