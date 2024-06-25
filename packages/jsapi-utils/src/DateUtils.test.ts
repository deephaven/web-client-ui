import dh from '@deephaven/jsapi-shim';
import DateUtils from './DateUtils';

describe('month parsing tests', () => {
  function testMonthString(monthString, expectedResult) {
    const result = DateUtils.parseMonth(monthString);
    if (Number.isNaN(expectedResult)) {
      expect(Number.isNaN(result)).toBe(true);
    } else {
      expect(result).toBe(expectedResult);
    }
  }

  it('parses months passed as numbers properly', () => {
    testMonthString('2', 1);
    testMonthString('04', 3);
  });

  it('parses months passed as strings properly', () => {
    testMonthString('Sept', 8);
    testMonthString('december', 11);
  });

  it('returns NaN for invalid cases', () => {
    testMonthString('0', NaN);
    testMonthString('13', NaN);
    testMonthString('-1', NaN);
    testMonthString('ja', NaN);
    testMonthString('wednesday', NaN);
    testMonthString('xjij', NaN);
    testMonthString('39842', NaN);
  });
});

describe('dateTimeString parsing tests', () => {
  function testDateTimeString(
    text: string,
    {
      year,
      month,
      date,
      hours,
      minutes,
      seconds,
      nanos,
      overflow,
    }: {
      year?: string;
      month?: string;
      date?: string;
      hours?: string;
      minutes?: string;
      seconds?: string;
      nanos?: string;
      overflow?: string;
    },
    allowOverflow = false
  ) {
    const expected = {
      year,
      month,
      date,
      hours,
      minutes,
      seconds,
      nanos,
    };

    expect(DateUtils.parseDateTimeString(text, allowOverflow)).toMatchObject(
      allowOverflow ? { ...expected, overflow } : expected
    );
  }

  function testDateTimeStringThrows(text) {
    expect(() => {
      DateUtils.parseDateTimeString(text);
    }).toThrow();
  }

  it('handles YYYY', () => {
    testDateTimeString('2012', {
      year: '2012',
    });

    testDateTimeString(
      '2012 overflow',
      {
        year: '2012',
        overflow: ' overflow',
      },
      true
    );
  });

  it('handles YYYY-mm', () => {
    testDateTimeString('2012-04', {
      year: '2012',
      month: '04',
    });

    testDateTimeString(
      '2012-04 overflow',
      {
        year: '2012',
        month: '04',
        overflow: ' overflow',
      },
      true
    );
  });

  it('handles YYYY-xxx', () => {
    testDateTimeString('2012-mar', {
      year: '2012',
      month: 'mar',
    });

    testDateTimeString('2012-march', {
      year: '2012',
      month: 'march',
    });
  });

  it('handles YYYY-m-d', () => {
    testDateTimeString('2012-4-6', {
      year: '2012',
      month: '4',
      date: '6',
    });

    testDateTimeString(
      '2012-04-20 overflow',
      {
        year: '2012',
        month: '04',
        date: '20',
        overflow: ' overflow',
      },
      true
    );
  });

  it('handles YYYY-mm-dd', () => {
    testDateTimeString('2012-04-20', {
      year: '2012',
      month: '04',
      date: '20',
    });

    testDateTimeString(
      '2012-04-20 overflow',
      {
        year: '2012',
        month: '04',
        date: '20',
        overflow: ' overflow',
      },
      true
    );
  });

  it('handles YYYY-mm-ddTHH', () => {
    testDateTimeString('2012-04-20T12', {
      year: '2012',
      month: '04',
      date: '20',
      hours: '12',
    });

    testDateTimeString(
      '2012-04-20T12 overflow',
      {
        year: '2012',
        month: '04',
        date: '20',
        hours: '12',
        overflow: ' overflow',
      },
      true
    );
  });

  it('handles YYYY-mm-ddTHH:mm', () => {
    testDateTimeString('2012-04-20T12:13', {
      year: '2012',
      month: '04',
      date: '20',
      hours: '12',
      minutes: '13',
    });

    testDateTimeString(
      '2012-04-20T12:13 overflow',
      {
        year: '2012',
        month: '04',
        date: '20',
        hours: '12',
        minutes: '13',
        overflow: ' overflow',
      },
      true
    );
  });

  it('handles YYYY-mm-ddTHH:mm:ss', () => {
    testDateTimeString('2012-04-20T12:13:14', {
      year: '2012',
      month: '04',
      date: '20',
      hours: '12',
      minutes: '13',
      seconds: '14',
    });

    testDateTimeString(
      '2012-04-20T12:13:14 overflow',
      {
        year: '2012',
        month: '04',
        date: '20',
        hours: '12',
        minutes: '13',
        seconds: '14',
        overflow: ' overflow',
      },
      true
    );
  });

  it('handles YYYY-mm-ddTHH:mm:ss.SSS', () => {
    testDateTimeString('2012-04-20T12:13:14.321', {
      year: '2012',
      month: '04',
      date: '20',
      hours: '12',
      minutes: '13',
      seconds: '14',
      nanos: '321',
    });

    testDateTimeString(
      '2012-04-20T12:13:14.321 overflow',
      {
        year: '2012',
        month: '04',
        date: '20',
        hours: '12',
        minutes: '13',
        seconds: '14',
        nanos: '321',
        overflow: ' overflow',
      },
      true
    );
  });
  it('handles YYYY-mm-dd HH:mm:ss.SSSSSS', () => {
    testDateTimeString('2012-04-20 12:13:14.654321', {
      year: '2012',
      month: '04',
      date: '20',
      hours: '12',
      minutes: '13',
      seconds: '14',
      nanos: '654321',
    });

    testDateTimeString(
      '2012-04-20 12:13:14.654321 overflow',
      {
        year: '2012',
        month: '04',
        date: '20',
        hours: '12',
        minutes: '13',
        seconds: '14',
        nanos: '654321',
        overflow: ' overflow',
      },
      true
    );
  });
  it('handles YYYY-mm-dd HH:mm:ss.SSSSSS', () => {
    testDateTimeString('2012-04-20 12:13:14.654321', {
      year: '2012',
      month: '04',
      date: '20',
      hours: '12',
      minutes: '13',
      seconds: '14',
      nanos: '654321',
    });

    testDateTimeString(
      '2012-04-20 12:13:14.654321 overflow',
      {
        year: '2012',
        month: '04',
        date: '20',
        hours: '12',
        minutes: '13',
        seconds: '14',
        nanos: '654321',
        overflow: ' overflow',
      },
      true
    );
  });
  it('handles YYYY-mm-dd HH:mm:ss.SSSSSSSSS', () => {
    testDateTimeString('2012-04-20 12:13:14.987654321', {
      year: '2012',
      month: '04',
      date: '20',
      hours: '12',
      minutes: '13',
      seconds: '14',
      nanos: '987654321',
    });

    testDateTimeString(
      '2012-04-20 12:13:14.987654321 overflow',
      {
        year: '2012',
        month: '04',
        date: '20',
        hours: '12',
        minutes: '13',
        seconds: '14',
        nanos: '987654321',
        overflow: ' overflow',
      },
      true
    );
  });

  it('throws an error for invalid dates', () => {
    testDateTimeStringThrows('not a date');
    testDateTimeStringThrows('2013-231-04');
    testDateTimeStringThrows('20133-23-04');
    testDateTimeStringThrows('2013-23-043');
    testDateTimeStringThrows('2013-23-34zzz');
    testDateTimeStringThrows('2012-04-20 12:13:14.321Overflow');
  });
});

describe('makeDateWrapper', () => {
  it('should use default values if not given arguments', () => {
    const expectedDate = new Date(2022, 0, 1, 0, 0, 0, 0);

    expect(
      DateUtils.makeDateWrapper(dh, 'Asia/Dubai', 2022).valueOf()
    ).toStrictEqual(expectedDate.valueOf().toString());
  });
});

describe('parseDateValues', () => {
  it('should return null if any value is invalid', () => {
    expect(
      DateUtils.parseDateValues(
        'test',
        'test',
        'test',
        'test',
        'test',
        'test',
        'test'
      )
    ).toBe(null);
  });
});

describe('parseDateRange', () => {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  function dateDiffInMillisseconds(a: Date, b: Date) {
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor(utc2 - utc1);
  }

  it('should throw an error if the text is empty', () => {
    expect(() =>
      DateUtils.parseDateRange(dh, '', 'America/New_York')
    ).toThrowError('Cannot parse date range from empty string');
  });

  it('should return a range of null values if text is "null"', () => {
    expect(DateUtils.parseDateRange(dh, 'null', 'America/New_York')).toEqual([
      null,
      null,
    ]);
  });

  describe('a range from today to tomorrow if text is keyword "today"', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test.each([
      [new Date(2023, 4, 15)],
      [new Date(2023, 4, 1)],
      [new Date(2023, 4, 31)],
      [new Date(2023, 0, 1)],
      [new Date(2023, 11, 31)],
    ])('should work with keyword "today" for date %s', date => {
      jest.setSystemTime(date);
      const range = DateUtils.parseDateRange(dh, 'today', 'America/New_York');
      const start = range[0];
      const end = range[1];
      const startDate = start?.asDate();
      const endDate = end?.asDate();
      expect(startDate).toEqual(date);
      expect(endDate).toEqual(
        new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      );
      expect(dateDiffInMillisseconds(startDate, endDate)).toBe(MS_PER_DAY);
    });
  });

  describe('a range from yesterday to today if text is keyword "yesterday"', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test.each([
      [new Date(2023, 4, 15)],
      [new Date(2023, 4, 1)],
      [new Date(2023, 4, 31)],
      [new Date(2023, 0, 1)],
      [new Date(2023, 11, 31)],
    ])('should work with keyword "yesterday" for date %s', date => {
      jest.setSystemTime(date);
      const range = DateUtils.parseDateRange(
        dh,
        'yesterday',
        'America/New_York'
      );
      const start = range[0];
      const end = range[1];
      const startDate = start?.asDate();
      const endDate = end?.asDate();
      expect(startDate).toEqual(
        new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1)
      );
      expect(endDate).toEqual(date);
      expect(dateDiffInMillisseconds(startDate, endDate)).toBe(MS_PER_DAY);
    });
  });

  it('should return null as the end range if text is "now"', () => {
    const range = DateUtils.parseDateRange(dh, 'now', 'America/New_York');
    expect(range[1]).toBeNull();
  });

  it('should throw an error if a value in text is invalid', () => {
    expect(() =>
      DateUtils.parseDateRange(dh, '9999-99-99', 'America/New_York')
    ).toThrowError(/Unable to extract date values from/i);
  });
});

describe('getJsDate', () => {
  it('returns a date object given that input is a number', () => {
    const expectedDate = new Date(10000);
    expect(DateUtils.getJsDate(10000)).toEqual(expectedDate);
  });

  it('returns a date object given a DateWrapper', () => {
    const dateWrapper = DateUtils.makeDateWrapper(dh, 'America/New_York', 2022);
    expect(DateUtils.getJsDate(dateWrapper)).toEqual(dateWrapper.asDate());
  });
});

describe('trimDateTimeStringTimeZone', () => {
  const dateTimeTexts = [
    '2024',
    '2012-04',
    '2012-04-20',
    '2012-04-20T12',
    '2012-04-20T12:13',
    '2012-04-20T12:13:14',
    '2012-04-20T12:13:14.321',
  ];

  it.each(dateTimeTexts)(
    'should return given string if no overflow: %s',
    given => {
      const actual = DateUtils.trimDateTimeStringTimeZone(given);
      expect(actual).toEqual(given);
    }
  );

  it.each(dateTimeTexts)(
    'should trim date time string overflow: %s',
    expected => {
      const given = `${expected} overflow`;
      const actual = DateUtils.trimDateTimeStringTimeZone(given);
      expect(actual).toEqual(expected);
    }
  );

  it.each([
    '2024overflow',
    '2012-04overflow',
    '2012-04-20overflow',
    '2012-04-20T12overflow',
    '2012-04-20T12:13overflow',
    '2012-04-20T12:13:14overflow',
    '2012-04-20T12:13:14.321overflow',
    '2024overflow',
    '2012-04  overflow',
    '2012-04-20  overflow',
    '2012-04-20T12  overflow',
    '2012-04-20T12:13  overflow',
    '2012-04-20T12:13:14  overflow',
    '2012-04-20T12:13:14.321  overflow',
  ])('should throw for invalid timezone overflow: %s', invalidOverflow => {
    expect(() => DateUtils.trimDateTimeStringTimeZone(invalidOverflow)).toThrow(
      `Unexpected timezone format in overflow: '${invalidOverflow}'`
    );
  });
});
