/**
 * Converts a time difference in seconds to a human-readable string.
 * @param diff The time difference in seconds.
 * @returns A string representing the time difference.
 */
export const convertedDiff = (diff: number): string => {
  if (diff < 60) {
    return `${diff.toFixed(2)}s`;
  }
  if (diff < 3600) {
    return `${(diff / 60).toFixed(2)}m`;
  }
  return `${(diff / 3600).toFixed(2)}h`;
};

/**
 * Gets a human-readable time string for the difference between two times.
 * @param startTime The start time.
 * @param endTime The end time.
 * @param conversion The conversion type ('ms' or 'ns')
 * @returns A string representing the time difference, or null if invalid.
 */
export const getTimeString = (
  startTime: string | number | undefined,
  endTime: string | number | undefined,
  conversion = 'ms'
): string | null => {
  if (startTime == null || endTime === '' || endTime === 0 || endTime == null) {
    return null;
  }

  let conversionFactor = 1;
  let start = null;
  let end = null;
  if (conversion === 'ms') {
    conversionFactor = 1000;
    start = new Date(startTime).valueOf();
    end = new Date(endTime).valueOf();
  } else if (conversion === 'ns') {
    // can only handle dates that are already nanosecond epochs
    conversionFactor = 1e9;
    start = Number(startTime);
    end = Number(endTime);
  } else {
    // can only handle dates that are milliseconds or nanoseconds
    return null;
  }

  const deltaTime = (end - start) / conversionFactor;

  return convertedDiff(deltaTime);
};
