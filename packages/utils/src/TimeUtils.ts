type TimeInSeconds = number;
export type TimeString = `${string}:${string}:${string}`;

const TIME_ZONE_DEFINITIONS = [
  { name: 'Tokyo', value: 'Asia/Tokyo', noDst: true },
  { name: 'Seoul', value: 'Asia/Seoul', noDst: true },
  { name: 'Hong Kong', value: 'Asia/Hong_Kong', noDst: true },
  { name: 'Singapore', value: 'Asia/Singapore', noDst: true },
  { name: 'Kolkata', value: 'Asia/Kolkata', noDst: true },
  { name: 'Berlin', value: 'Europe/Berlin', noDst: false },
  { name: 'UTC', value: 'UTC', noDst: true },
  { name: 'London', value: 'Europe/London', noDst: false },
  { name: 'Sao Paulo', value: 'America/Sao_Paulo', noDst: true },
  { name: 'Newfoundland', value: 'America/St_Johns', noDst: false },
  { name: 'Halifax', value: 'America/Halifax', noDst: false },
  { name: 'New York', value: 'America/New_York', noDst: false },
  { name: 'Chicago', value: 'America/Chicago', noDst: false },
  { name: 'Denver', value: 'America/Denver', noDst: false },
  { name: 'Los Angeles', value: 'America/Los_Angeles', noDst: false },
  { name: 'Anchorage', value: 'America/Anchorage', noDst: false },
  { name: 'Honolulu', value: 'Pacific/Honolulu', noDst: true },
  { name: 'Zurich', value: 'Europe/Zurich', noDst: false },
  { name: 'Amsterdam', value: 'Europe/Amsterdam', noDst: false },
  { name: 'Taipei', value: 'Asia/Taipei', noDst: true },
  { name: 'Sydney', value: 'Australia/Sydney', noDst: false },
] as const;

let cachedTimeZones: readonly { label: string; value: string }[] = [];
let cachedTimeZonesMinute = '';

class TimeUtils {
  static TIME_PATTERN = '([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]';

  static MILLIS_PER_SECOND = 1000;

  static NANOS_PER_SECOND = 1e9;

  static NANOS_PER_MIN = 60 * TimeUtils.NANOS_PER_SECOND;

  static NANOS_PER_HOUR = 60 * TimeUtils.NANOS_PER_MIN;

  static MILLIS_PER_MIN = 60 * TimeUtils.MILLIS_PER_SECOND;

  static MILLIS_PER_HOUR = 60 * TimeUtils.MILLIS_PER_MIN;

  static get TIME_ZONES(): readonly { label: string; value: string }[] {
    const date = new Date();
    const minuteKey = date.toISOString().slice(0, 16);

    if (cachedTimeZonesMinute !== minuteKey) {
      cachedTimeZonesMinute = minuteKey;
      cachedTimeZones = Object.freeze(
        TIME_ZONE_DEFINITIONS.map(({ name, value, noDst }) => ({
          label: `${name} ${TimeUtils.getTimeZoneOffset(value, date)}${
            noDst ? ' No DST' : ''
          }`,
          value,
        }))
      );
    }

    return cachedTimeZones;
  }

  /**
   * Returns the time zone offset as a string in the format "UTC±X"
   * Part-hour offsets are supported as "UTC±X:YY"
   * @param timeZone the IANA time zone identifier string (e.g. 'America/New_York')
   * @param date the Date object for which to get the time zone offset, default now
   */
  static getTimeZoneOffset(timeZone: string, date = new Date()): string {
    const offset = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    })
      .formatToParts(date)
      .find(part => part.type === 'timeZoneName')?.value;

    if (
      offset == null ||
      offset === 'GMT' ||
      /^GMT[+-]0(?::00)?$/.test(offset)
    ) {
      return 'UTC±0';
    }
    return offset.replace('GMT', 'UTC');
  }

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
