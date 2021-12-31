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
