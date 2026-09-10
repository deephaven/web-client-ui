import TimeUtils, { type TimeString } from './TimeUtils';

const {
  MILLIS_PER_SECOND,
  NANOS_PER_SECOND,
  NANOS_PER_MIN,
  NANOS_PER_HOUR,
  MILLIS_PER_MIN,
  MILLIS_PER_HOUR,
} = TimeUtils;

// Northern hemisphere winter, standard time in US/Europe
const WINTER_DATE = new Date('2024-01-15T12:00:00Z');

// Northern hemisphere summer, daylight savings time in US/Europe
const SUMMER_DATE = new Date('2024-07-15T12:00:00Z');

describe('getTimeZoneOffset tests', () => {
  it('returns UTC±0 for zones with no offset', () => {
    expect(TimeUtils.getTimeZoneOffset('UTC', WINTER_DATE)).toBe('UTC±0');
    expect(TimeUtils.getTimeZoneOffset('Europe/London', WINTER_DATE)).toBe(
      'UTC±0'
    );
  });

  it('returns whole hour offsets', () => {
    expect(TimeUtils.getTimeZoneOffset('Asia/Tokyo', WINTER_DATE)).toBe(
      'UTC+9'
    );
    expect(TimeUtils.getTimeZoneOffset('America/New_York', WINTER_DATE)).toBe(
      'UTC-5'
    );
  });

  it('returns part-hour offsets', () => {
    expect(TimeUtils.getTimeZoneOffset('Asia/Kolkata', WINTER_DATE)).toBe(
      'UTC+5:30'
    );
    expect(TimeUtils.getTimeZoneOffset('America/St_Johns', WINTER_DATE)).toBe(
      'UTC-3:30'
    );
  });

  it('keeps the same offset year round for zones without DST', () => {
    [
      'UTC',
      'Asia/Tokyo',
      'Asia/Kolkata',
      'Pacific/Honolulu',
      'America/Sao_Paulo',
    ].forEach(timeZone => {
      expect(TimeUtils.getTimeZoneOffset(timeZone, SUMMER_DATE)).toBe(
        TimeUtils.getTimeZoneOffset(timeZone, WINTER_DATE)
      );
    });
  });

  it('changes the offset for zones observing DST', () => {
    [
      'America/New_York',
      'Europe/London',
      'Europe/Berlin',
      'America/St_Johns',
      'Australia/Sydney',
    ].forEach(timeZone => {
      expect(TimeUtils.getTimeZoneOffset(timeZone, SUMMER_DATE)).not.toBe(
        TimeUtils.getTimeZoneOffset(timeZone, WINTER_DATE)
      );
    });
  });

  it('defaults to the current date', () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(SUMMER_DATE);
      expect(TimeUtils.getTimeZoneOffset('America/New_York')).toBe('UTC-4');

      jest.setSystemTime(WINTER_DATE);
      expect(TimeUtils.getTimeZoneOffset('America/New_York')).toBe('UTC-5');
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('TIME_ZONES tests', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  function getTimeZone(value: string): { label: string; value: string } {
    const timeZone = TimeUtils.TIME_ZONES.find(tz => tz.value === value);
    if (timeZone == null) {
      throw new Error(`No time zone found for ${value}`);
    }
    return timeZone;
  }

  it('returns a frozen list of unique time zones', () => {
    const { TIME_ZONES } = TimeUtils;
    expect(Object.isFrozen(TIME_ZONES)).toBe(true);
    expect(TIME_ZONES.length).toBeGreaterThan(0);
    expect(new Set(TIME_ZONES.map(({ value }) => value)).size).toBe(
      TIME_ZONES.length
    );
  });

  it('labels each time zone with its name and current offset', () => {
    jest.useFakeTimers();
    jest.setSystemTime(WINTER_DATE);

    TimeUtils.TIME_ZONES.forEach(({ label, value }) => {
      expect(label).toContain(TimeUtils.getTimeZoneOffset(value, WINTER_DATE));
    });

    expect(getTimeZone('America/New_York').label).toBe('New York UTC-5');
    expect(getTimeZone('Asia/Kolkata').label).toBe('Kolkata UTC+5:30 No DST');
    expect(getTimeZone('UTC').label).toBe('UTC UTC±0 No DST');
  });

  it('marks zones that do not observe DST', () => {
    jest.useFakeTimers();
    jest.setSystemTime(WINTER_DATE);

    expect(getTimeZone('Asia/Tokyo').label).toContain('No DST');
    expect(getTimeZone('Pacific/Honolulu').label).toContain('No DST');
    expect(getTimeZone('America/New_York').label).not.toContain('No DST');
    expect(getTimeZone('Europe/London').label).not.toContain('No DST');
  });

  it('updates labels across a DST transition', () => {
    jest.useFakeTimers();

    jest.setSystemTime(WINTER_DATE);
    expect(getTimeZone('America/New_York').label).toBe('New York UTC-5');
    expect(getTimeZone('Europe/London').label).toBe('London UTC±0');
    expect(getTimeZone('Asia/Tokyo').label).toBe('Tokyo UTC+9 No DST');

    jest.setSystemTime(SUMMER_DATE);
    expect(getTimeZone('America/New_York').label).toBe('New York UTC-4');
    expect(getTimeZone('Europe/London').label).toBe('London UTC+1');
    expect(getTimeZone('Asia/Tokyo').label).toBe('Tokyo UTC+9 No DST');
  });

  it('updates labels on the minute a DST transition takes effect', () => {
    jest.useFakeTimers();

    // US Eastern moves to DST at 2024-03-10 02:00 local, i.e. 07:00 UTC
    jest.setSystemTime(new Date('2024-03-10T06:59:00Z'));
    expect(getTimeZone('America/New_York').label).toBe('New York UTC-5');

    jest.setSystemTime(new Date('2024-03-10T07:00:00Z'));
    expect(getTimeZone('America/New_York').label).toBe('New York UTC-4');

    // London moves to BST at 2024-03-31 01:00 UTC
    jest.setSystemTime(new Date('2024-03-31T00:59:00Z'));
    expect(getTimeZone('Europe/London').label).toBe('London UTC±0');

    jest.setSystemTime(new Date('2024-03-31T01:00:00Z'));
    expect(getTimeZone('Europe/London').label).toBe('London UTC+1');
  });

  it('reuses the cached list until the minute changes', () => {
    jest.useFakeTimers();
    jest.setSystemTime(WINTER_DATE);

    const timeZones = TimeUtils.TIME_ZONES;

    jest.setSystemTime(new Date(WINTER_DATE.getTime() + MILLIS_PER_MIN - 1));
    expect(TimeUtils.TIME_ZONES).toBe(timeZones);

    jest.setSystemTime(new Date(WINTER_DATE.getTime() + MILLIS_PER_MIN));
    expect(TimeUtils.TIME_ZONES).not.toBe(timeZones);
  });
});

describe('formatElapsedTime parsing tests', () => {
  function testFormatElapsedTime(time: number, expectedResult: string) {
    const result = TimeUtils.formatElapsedTime(time);
    expect(result).toBe(expectedResult);
  }

  function testFormatElapsedTimeThrows(time: unknown) {
    expect(() => {
      TimeUtils.formatElapsedTime(time);
    }).toThrow();
  }

  it('handles 0', () => {
    testFormatElapsedTime(0, '0s');
  });

  it('handles 5', () => {
    testFormatElapsedTime(5, '5s');
  });

  it('handles 10', () => {
    testFormatElapsedTime(10, '10s');
  });

  it('handles 60', () => {
    testFormatElapsedTime(60, '1m 00s');
  });

  it('handles 61', () => {
    testFormatElapsedTime(61, '1m 01s');
  });

  it('handles 3600', () => {
    testFormatElapsedTime(3600, '1h 0m 00s');
  });

  it('handles 3624', () => {
    testFormatElapsedTime(3624, '1h 0m 24s');
  });

  it('handles 4210', () => {
    testFormatElapsedTime(4210, '1h 10m 10s');
  });

  it('handles 10000', () => {
    testFormatElapsedTime(10000, '2h 46m 40s');
  });

  it('handles 100000', () => {
    testFormatElapsedTime(100000, '27h 46m 40s');
  });

  it('throws an error for invalid dates', () => {
    testFormatElapsedTimeThrows('not a time');
    testFormatElapsedTimeThrows('10');
    testFormatElapsedTimeThrows(10.5);
  });
});

describe('formatTime tests', () => {
  function testFormatTime(time: number, expectedResult: TimeString) {
    const result = TimeUtils.formatTime(time);
    expect(result).toBe(expectedResult);
  }

  function testFormatTimeThrows(time: unknown) {
    expect(() => {
      TimeUtils.formatTime(time);
    }).toThrow();
  }

  it('handles 0', () => {
    testFormatTime(0, '00:00:00');
  });

  it('handles 5', () => {
    testFormatTime(5, '00:00:05');
  });

  it('handles 10', () => {
    testFormatTime(10, '00:00:10');
  });

  it('handles 59', () => {
    testFormatTime(59, '00:00:59');
  });

  it('handles 60', () => {
    testFormatTime(60, '00:01:00');
  });

  it('handles 61', () => {
    testFormatTime(61, '00:01:01');
  });

  it('handles 3600', () => {
    testFormatTime(3600, '01:00:00');
  });

  it('handles 3624', () => {
    testFormatTime(3624, '01:00:24');
  });

  it('handles 4210', () => {
    testFormatTime(4210, '01:10:10');
  });

  it('handles 100000', () => {
    testFormatTime(100000, '27:46:40');
  });

  it('throws an error for invalid dates', () => {
    testFormatTimeThrows('not a time');
    testFormatTimeThrows('10');
    testFormatTimeThrows(10.5);
    testFormatTimeThrows(-5);
  });
});

describe('parseTime tests', () => {
  function testParseTime(time: TimeString, expectedResult: number) {
    const result = TimeUtils.parseTime(time);
    expect(result).toBe(expectedResult);
  }

  function testParseTimeThrows(time: unknown) {
    expect(() => {
      TimeUtils.parseTime(time);
    }).toThrow();
  }

  it('handles 00:00:00', () => {
    testParseTime('00:00:00', 0);
  });

  it('handles 00:00:05', () => {
    testParseTime('00:00:05', 5);
  });

  it('handles 00:01:00', () => {
    testParseTime('00:01:00', 60);
  });

  it('handles 00:01:01', () => {
    testParseTime('00:01:01', 61);
  });

  it('handles 01:00:00', () => {
    testParseTime('01:00:00', 3600);
  });

  it('handles 01:00:24', () => {
    testParseTime('01:00:24', 3624);
  });

  it('handles 01:10:10', () => {
    testParseTime('01:10:10', 4210);
  });

  it('handles 27:46:40', () => {
    testParseTime('27:46:40', 100000);
  });

  it('throws an error for invalid dates', () => {
    testParseTimeThrows(1234);
    testParseTimeThrows('10');
    testParseTimeThrows('not a time');
  });
});

describe('formatConvertedDuration converts as expected', () => {
  it('returns null for invalid inputs', () => {
    expect(TimeUtils.formatConvertedDuration(undefined, 1000)).toBeNull();
    expect(TimeUtils.formatConvertedDuration(1000, undefined)).toBeNull();
    expect(TimeUtils.formatConvertedDuration(1000, '')).toBeNull();
    expect(TimeUtils.formatConvertedDuration(1000, 0)).toBeNull();
    expect(TimeUtils.formatConvertedDuration(1000, 1000, 'invalid')).toBeNull();
  });

  it('returns correct seconds for nano conversion', () => {
    expect(
      TimeUtils.formatConvertedDuration(0, 59.99 * NANOS_PER_SECOND, 'ns')
    ).toBe('59.99s');
    expect(
      TimeUtils.formatConvertedDuration(
        59 * NANOS_PER_SECOND,
        60 * NANOS_PER_SECOND,
        'ns'
      )
    ).toBe('1.00s');
  });

  it('returns correct minutes for nano conversion', () => {
    expect(TimeUtils.formatConvertedDuration(0, 59 * NANOS_PER_MIN, 'ns')).toBe(
      '59m 0.0s'
    );
    expect(
      TimeUtils.formatConvertedDuration(
        59 * NANOS_PER_MIN,
        60 * NANOS_PER_MIN,
        'ns'
      )
    ).toBe('1m 0.0s');
    expect(
      TimeUtils.formatConvertedDuration(
        0,
        59 * NANOS_PER_MIN + 59.9 * NANOS_PER_SECOND,
        'ns'
      )
    ).toBe('59m 59.9s');
  });

  it('returns correct hours for nano conversion', () => {
    expect(
      TimeUtils.formatConvertedDuration(0, 59 * NANOS_PER_HOUR, 'ns')
    ).toBe('59h 0m 0s');
    expect(
      TimeUtils.formatConvertedDuration(
        0,
        59 * NANOS_PER_HOUR + 59 * NANOS_PER_MIN + 59 * NANOS_PER_SECOND,
        'ns'
      )
    ).toBe('59h 59m 59s');
    expect(
      TimeUtils.formatConvertedDuration(
        59 * NANOS_PER_HOUR,
        60 * NANOS_PER_HOUR,
        'ns'
      )
    ).toBe('1h 0m 0s');
  });

  it('returns correct seconds for milli conversion', () => {
    expect(
      TimeUtils.formatConvertedDuration(0, 59.99 * MILLIS_PER_SECOND)
    ).toBe('59.99s');
    expect(
      TimeUtils.formatConvertedDuration(
        59 * MILLIS_PER_SECOND,
        60 * MILLIS_PER_SECOND
      )
    ).toBe('1.00s');
  });

  it('returns correct minutes for milli conversion', () => {
    expect(TimeUtils.formatConvertedDuration(0, 59 * MILLIS_PER_MIN)).toBe(
      '59m 0.0s'
    );
    expect(
      TimeUtils.formatConvertedDuration(
        59 * MILLIS_PER_MIN,
        60 * MILLIS_PER_MIN
      )
    ).toBe('1m 0.0s');
    expect(
      TimeUtils.formatConvertedDuration(
        0,
        59 * MILLIS_PER_MIN + 59.9 * MILLIS_PER_SECOND
      )
    ).toBe('59m 59.9s');
  });

  it('returns correct hours for milli conversion', () => {
    expect(TimeUtils.formatConvertedDuration(0, 59 * MILLIS_PER_HOUR)).toBe(
      '59h 0m 0s'
    );
    expect(
      TimeUtils.formatConvertedDuration(
        0,
        59 * MILLIS_PER_HOUR + 59 * MILLIS_PER_MIN + 59 * MILLIS_PER_SECOND
      )
    ).toBe('59h 59m 59s');
    expect(
      TimeUtils.formatConvertedDuration(
        59 * MILLIS_PER_HOUR,
        60 * MILLIS_PER_HOUR
      )
    ).toBe('1h 0m 0s');
  });
});
