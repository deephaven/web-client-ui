type TimeInSeconds = number;
export type TimeString = `${string}:${string}:${string}`;

class TimeUtils {
  static TIME_PATTERN = '([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]';

  static MILLIS_PER_SECOND = 1000;

  static NANOS_PER_SECOND = 1e9;

  static NANOS_PER_MIN = 60 * TimeUtils.NANOS_PER_SECOND;

  static NANOS_PER_HOUR = 60 * TimeUtils.NANOS_PER_MIN;

  static MILLIS_PER_MIN = 60 * TimeUtils.MILLIS_PER_SECOND;

  static MILLIS_PER_HOUR = 60 * TimeUtils.MILLIS_PER_MIN;

  static TIME_ZONES = Object.freeze([
    { label: 'Tokyo UTC+9 No DST', value: 'Asia/Tokyo' },
    { label: 'Seoul UTC+9 No DST', value: 'Asia/Seoul' },
    { label: 'Hong Kong UTC+8 No DST', value: 'Asia/Hong_Kong' },
    { label: 'Singapore UTC+8 No DST', value: 'Asia/Singapore' },
    { label: 'Kolkata UTC+5:30 No DST', value: 'Asia/Kolkata' },
    { label: 'Berlin UTC+1', value: 'Europe/Berlin' },
    { label: 'UTC UTC±0 No DST', value: 'UTC' },
    { label: 'London UTC±0', value: 'Europe/London' },
    { label: 'Sao Paulo UTC-2', value: 'America/Sao_Paulo' },
    { label: 'Newfoundland  UTC-3:30', value: 'America/St_Johns' },
    { label: 'Halifax UTC-4', value: 'America/Halifax' },
    { label: 'New York UTC−5', value: 'America/New_York' },
    { label: 'Chicago UTC-6', value: 'America/Chicago' },
    { label: 'Denver UTC-7', value: 'America/Denver' },
    { label: 'Los Angeles UTC-8', value: 'America/Los_Angeles' },
    { label: 'Anchorage UTC-9', value: 'America/Anchorage' },
    { label: 'Honolulu UTC-10 No DST', value: 'Pacific/Honolulu' },
    { label: 'Zurich UTC+1', value: 'Europe/Zurich' },
    { label: 'Amsterdam UTC+1', value: 'Europe/Amsterdam' },
    { label: 'Taipei UTC+8 No DST', value: 'Asia/Taipei' },
    { label: 'Sydney UTC+10', value: 'Australia/Sydney' },
  ]);

  /**
   * Pretty prints a time in seconds as a format like "1h 3m 23s", "32s"
   * Seconds are padded after 60s, has elapsed to reduce width changes
   * Minutes aren't paded, as thats a slower change
   * @param time in seconds
   */
  static formatElapsedTime(time: unknown): string {
    if (typeof time !== 'number' || !Number.isInteger(time)) {
      throw new Error(
        `${time} is not a number that can be expressed as a formatted time`
      );
    }

    const hours = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const seconds = time % 60;

    return (
      `${hours > 0 ? `${hours}h ` : ''}` +
      `${mins > 0 || hours > 0 ? `${mins}m ` : ''}` +
      `${time >= 60 ? `${seconds}s`.padStart(3, '0') : `${seconds}s`}`
    );
  }

  /**
   * Format the time into hh:mm:ss format, eg. '12:34:56'
   * @param timeInSeconds in seconds
   */
  static formatTime(timeInSeconds: unknown): string {
    if (
      typeof timeInSeconds !== 'number' ||
      !Number.isInteger(timeInSeconds) ||
      timeInSeconds < 0
    ) {
      throw new Error(
        `${timeInSeconds} is not a number that can be expressed as a formatted time`
      );
    }

    const hours = String(Math.floor(timeInSeconds / (60 * 60))).padStart(
      2,
      '0'
    );

    const divisorForMinutes = timeInSeconds % (60 * 60);
    const minutes = String(Math.floor(divisorForMinutes / 60)).padStart(2, '0');

    const divisorForSeconds = divisorForMinutes % 60;
    const seconds = String(Math.ceil(divisorForSeconds)).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  }

  static isTimeString(s: string): s is TimeString {
    return new RegExp(TimeUtils.TIME_PATTERN).test(s);
  }

  /**
   * Parse time in seconds from the provided time string
   * @param timeString Time string in hh:mm:ss format
   */
  static parseTime(timeString: unknown): TimeInSeconds {
    if (timeString == null || typeof timeString !== 'string') {
      throw new Error(`${timeString} is not a valid string`);
    }

    const components = timeString.split(':');

    if (components.length !== 3) {
      throw new Error(`${timeString} is not a time string that can be parsed`);
    }

    return (
      Number(components[0]) * 60 * 60 +
      Number(components[1]) * 60 +
      Number(components[2])
    );
  }

  /**
   * Converts a time difference in seconds to a human-readable string.
   * @param time The time difference in seconds.
   * @returns A string representing the time difference.
   */
  static formatDuration(time: number): string {
    const hours = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const seconds = time % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m ${seconds}s`;
    }
    if (mins > 0) {
      return `${mins}m ${seconds.toFixed(1)}s`;
    }
    return `${seconds.toFixed(2)}s`;
  }

  /**
   * Gets a human-readable time string for the difference between two times.
   * Generally meant for informational tooltips.
   * @param startTime The start time in milliseconds or nanoseconds.
   * @param endTime The end time in milliseconds or nanoseconds.
   * @param conversion The conversion type ('ms' or 'ns')
   * @returns A string representing the time difference, or null if invalid.
   */
  static formatConvertedDuration(
    startTime: string | number | undefined,
    endTime: string | number | undefined,
    conversion = 'ms'
  ): string | null {
    if (
      startTime == null ||
      endTime === '' ||
      endTime === 0 ||
      endTime == null
    ) {
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

    return this.formatDuration(deltaTime);
  }
}

export default TimeUtils;
