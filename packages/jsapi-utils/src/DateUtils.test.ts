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
    }: {
      year?: string;
      month?: string;
      date?: string;
      hours?: string;
      minutes?: string;
      seconds?: string;
      nanos?: string;
    }
  ) {
    expect(DateUtils.parseDateTimeString(text)).toMatchObject({
      year,
      month,
      date,
      hours,
      minutes,
      seconds,
      nanos,
    });
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
  });

  it('handles YYYY-mm', () => {
    testDateTimeString('2012-04', {
      year: '2012',
      month: '04',
    });
  });

  it('handles YYYY-mm-dd', () => {
    testDateTimeString('2012-04-20', {
      year: '2012',
      month: '04',
      date: '20',
    });
  });

  it('handles YYYY-mm-ddTHH', () => {
    testDateTimeString('2012-04-20T12', {
      year: '2012',
      month: '04',
      date: '20',
      hours: '12',
    });
  });

  it('handles YYYY-mm-ddTHH:mm', () => {
    testDateTimeString('2012-04-20T12:13', {
      year: '2012',
      month: '04',
      date: '20',
      hours: '12',
      minutes: '13',
    });
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
  });

  it('throws an error for invalid dates', () => {
    testDateTimeStringThrows('not a date');
    testDateTimeStringThrows('20133-23-04');
    testDateTimeStringThrows('2013-23-043');
    testDateTimeStringThrows('2013-23-34zzz');
    testDateTimeStringThrows('2012-04-20 12:13:14.321Overflow');
  });
});

describe('makeDateWrapper', () => {
  xit('should use default values if not given arguments', () => {
    const expectedDate = new Date(2022, 0, 1, 0, 0, 0, 0);

    expect(
      DateUtils.makeDateWrapper('Asia/Dubai', 2022).valueOf()
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

xdescribe('parseDateRange', () => {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  function dateDiffInMillisseconds(a: Date, b: Date) {
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor(utc2 - utc1);
  }

  it('should throw an error if the text is empty', () => {
    expect(() => DateUtils.parseDateRange('', 'America/New_York')).toThrowError(
      'Cannot parse date range from empty string'
    );
  });

  it('should return a range of null values if text is "null"', () => {
    expect(DateUtils.parseDateRange('null', 'America/New_York')).toEqual([
      null,
      null,
    ]);
  });

  xit('should return a range from today to tomorrow if text is "today"', () => {
    const range = DateUtils.parseDateRange('today', 'America/New_York');
    const start = range[0];
    const end = range[1];
    if (start && end) {
      const startDate = start?.asDate();
      const endDate = end?.asDate();
      expect(dateDiffInMillisseconds(startDate, endDate)).toBe(MS_PER_DAY);
    }
  });

  xit('should return null as the end range if text is "now"', () => {
    const range = DateUtils.parseDateRange('now', 'America/New_York');
    expect(range[1]).toBeNull();
  });

  xit('should throw an error if a value in text is invalid', () => {
    expect(() =>
      DateUtils.parseDateRange('9999-99-99', 'America/New_York')
    ).toThrowError(/Unable to extract date values from/i);
  });
});

describe('getJsDate', () => {
  it('returns a date object given that input is a number', () => {
    const expectedDate = new Date(10000);
    expect(DateUtils.getJsDate(10000)).toEqual(expectedDate);
  });

  xit('returns a date object given a DateWrapper', () => {
    const dateWrapper = DateUtils.makeDateWrapper('America/New_York', 2022);
    expect(DateUtils.getJsDate(dateWrapper)).toEqual(dateWrapper.asDate());
  });
});
