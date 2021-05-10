class TimeUtils {
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
   * @param {integer} time in seconds
   */
  static formatElapsedTime(time: number): string {
    if (!Number.isInteger(time)) {
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
   * @param {integer} timeInSeconds in seconds
   */
  static formatTime(timeInSeconds: number): string {
    if (!Number.isInteger(timeInSeconds) || timeInSeconds < 0) {
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

  /**
   * Parse time in seconds from the provided time string
   * @param {string} timeString Time string in hh:mm:ss format
   */
  static parseTime(timeString: string): number {
    if (!timeString || typeof timeString !== 'string') {
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
}

export default TimeUtils;
