import CsvTypeParser from './CsvTypeParser';

const NULL_STRING = '(null)';

const UNKNOWN = 'unknown';
const INTEGER = 'int';
const LONG = 'long';
const DOUBLE = 'double';
const BOOLEAN = 'bool';
const STRING = 'string';
const DATE_TIME = 'datetime';
const LOCAL_TIME = 'localtime';

const MAX_INT = 2147483647;
const MIN_INT = -2147483648;

// Integer is the most complicated case because it may be promoted to long or double
it('correctly checks for integer', () => {
  expect(CsvTypeParser.checkInteger('hello')).toBe(STRING);
  expect(CsvTypeParser.checkInteger('true')).toBe(STRING);
  expect(CsvTypeParser.checkInteger('false')).toBe(STRING);
  expect(CsvTypeParser.checkInteger('Infinity')).toBe(STRING);
  expect(CsvTypeParser.checkInteger('-Infinity')).toBe(STRING);
  expect(CsvTypeParser.checkInteger('123')).toBe(INTEGER);
  expect(CsvTypeParser.checkInteger('123,456')).toBe(INTEGER);
  expect(CsvTypeParser.checkInteger('-123')).toBe(INTEGER);
  expect(CsvTypeParser.checkInteger('-123,456')).toBe(INTEGER);
  expect(CsvTypeParser.checkInteger('123.4')).toBe(DOUBLE);
  expect(CsvTypeParser.checkInteger('-123.4')).toBe(DOUBLE);
  // Check the boundaries around long
  expect(CsvTypeParser.checkInteger(MAX_INT.toString())).toBe(INTEGER);
  expect(CsvTypeParser.checkInteger(MIN_INT.toString())).toBe(INTEGER);
  for (let i = 1; i <= 100; i += 1) {
    expect(CsvTypeParser.checkInteger((MAX_INT + i).toString())).toBe(LONG);
    expect(CsvTypeParser.checkInteger((MAX_INT - i).toString())).toBe(INTEGER);
    expect(CsvTypeParser.checkInteger((MIN_INT - i).toString())).toBe(LONG);
    expect(CsvTypeParser.checkInteger((MIN_INT + i).toString())).toBe(INTEGER);
  }
  expect(CsvTypeParser.checkInteger((MAX_INT * 2).toString())).toBe(LONG);
  expect(CsvTypeParser.checkInteger((MAX_INT * 10).toString())).toBe(LONG);
  expect(CsvTypeParser.checkInteger((MAX_INT * 100).toString())).toBe(LONG);
  expect(CsvTypeParser.checkInteger((MIN_INT * 2).toString())).toBe(LONG);
  expect(CsvTypeParser.checkInteger((MIN_INT * 10).toString())).toBe(LONG);
  expect(CsvTypeParser.checkInteger((MIN_INT * 100).toString())).toBe(LONG);
  expect(CsvTypeParser.checkInteger(Math.trunc(MAX_INT / 2).toString())).toBe(
    INTEGER
  );
  expect(CsvTypeParser.checkInteger(Math.trunc(MAX_INT / 10).toString())).toBe(
    INTEGER
  );
  expect(CsvTypeParser.checkInteger(Math.trunc(MAX_INT / 100).toString())).toBe(
    INTEGER
  );
  expect(CsvTypeParser.checkInteger(Math.trunc(MIN_INT / 2).toString())).toBe(
    INTEGER
  );
  expect(CsvTypeParser.checkInteger(Math.trunc(MIN_INT / 10).toString())).toBe(
    INTEGER
  );
  expect(CsvTypeParser.checkInteger(Math.trunc(MIN_INT / 100).toString())).toBe(
    INTEGER
  );
  expect(CsvTypeParser.checkInteger('1234567890123456789')).toBe(LONG);
  expect(CsvTypeParser.checkInteger('-1234567890123456789')).toBe(LONG);
});

// Simpler than integer, a long can only be promted to a double (it cannot be demoted to int)
it('correctly checks for long', () => {
  expect(CsvTypeParser.checkLong('hello')).toBe(STRING);
  expect(CsvTypeParser.checkLong('true')).toBe(STRING);
  expect(CsvTypeParser.checkLong('false')).toBe(STRING);
  expect(CsvTypeParser.checkLong('Infinity')).toBe(STRING);
  expect(CsvTypeParser.checkLong('-Infinity')).toBe(STRING);
  expect(CsvTypeParser.checkLong('123')).toBe(LONG);
  expect(CsvTypeParser.checkLong('123,456')).toBe(LONG);
  expect(CsvTypeParser.checkLong('-123')).toBe(LONG);
  expect(CsvTypeParser.checkLong('-123,456')).toBe(LONG);
  expect(CsvTypeParser.checkLong('123.4')).toBe(DOUBLE);
  expect(CsvTypeParser.checkLong('-123.4')).toBe(DOUBLE);
  // Check the boundaries around long
  expect(CsvTypeParser.checkLong(MAX_INT.toString())).toBe(LONG);
  expect(CsvTypeParser.checkLong(MIN_INT.toString())).toBe(LONG);
  for (let i = 1; i <= 100; i += 1) {
    expect(CsvTypeParser.checkLong((MAX_INT + i).toString())).toBe(LONG);
    expect(CsvTypeParser.checkLong((MAX_INT - i).toString())).toBe(LONG);
    expect(CsvTypeParser.checkLong((MIN_INT - i).toString())).toBe(LONG);
    expect(CsvTypeParser.checkLong((MIN_INT + i).toString())).toBe(LONG);
  }
  expect(CsvTypeParser.checkLong((MAX_INT * 2).toString())).toBe(LONG);
  expect(CsvTypeParser.checkLong((MAX_INT * 10).toString())).toBe(LONG);
  expect(CsvTypeParser.checkLong((MAX_INT * 100).toString())).toBe(LONG);
  expect(CsvTypeParser.checkLong((MIN_INT * 2).toString())).toBe(LONG);
  expect(CsvTypeParser.checkLong((MIN_INT * 10).toString())).toBe(LONG);
  expect(CsvTypeParser.checkLong((MIN_INT * 100).toString())).toBe(LONG);
  expect(CsvTypeParser.checkLong(Math.trunc(MAX_INT / 2).toString())).toBe(
    LONG
  );
  expect(CsvTypeParser.checkLong(Math.trunc(MAX_INT / 10).toString())).toBe(
    LONG
  );
  expect(CsvTypeParser.checkLong(Math.trunc(MAX_INT / 100).toString())).toBe(
    LONG
  );
  expect(CsvTypeParser.checkLong(Math.trunc(MIN_INT / 2).toString())).toBe(
    LONG
  );
  expect(CsvTypeParser.checkLong(Math.trunc(MIN_INT / 10).toString())).toBe(
    LONG
  );
  expect(CsvTypeParser.checkLong(Math.trunc(MIN_INT / 100).toString())).toBe(
    LONG
  );
});

// Simpler than long, a double can only be demoted to a string
it('correctly checks for double', () => {
  expect(CsvTypeParser.checkDouble('hello')).toBe(STRING);
  expect(CsvTypeParser.checkDouble('true')).toBe(STRING);
  expect(CsvTypeParser.checkDouble('false')).toBe(STRING);
  expect(CsvTypeParser.checkDouble('Infinity')).toBe(STRING);
  expect(CsvTypeParser.checkDouble('-Infinity')).toBe(STRING);
  expect(CsvTypeParser.checkDouble('123')).toBe(DOUBLE);
  expect(CsvTypeParser.checkDouble('123,456')).toBe(DOUBLE);
  expect(CsvTypeParser.checkDouble('-123')).toBe(DOUBLE);
  expect(CsvTypeParser.checkDouble('-123,456')).toBe(DOUBLE);
  expect(CsvTypeParser.checkDouble('123.4')).toBe(DOUBLE);
  expect(CsvTypeParser.checkDouble('-123.4')).toBe(DOUBLE);
  expect(CsvTypeParser.checkDouble(MAX_INT.toString())).toBe(DOUBLE);
  expect(CsvTypeParser.checkDouble(MIN_INT.toString())).toBe(DOUBLE);
  expect(CsvTypeParser.checkDouble((MAX_INT * 2).toString())).toBe(DOUBLE);
  expect(CsvTypeParser.checkDouble((MIN_INT * 2).toString())).toBe(DOUBLE);
  expect(CsvTypeParser.checkDouble('0.0000')).toBe(DOUBLE);
  expect(CsvTypeParser.checkDouble('0.0001')).toBe(DOUBLE);
  expect(CsvTypeParser.checkDouble('-0.0001')).toBe(DOUBLE);
  expect(CsvTypeParser.checkDouble('123e5')).toBe(DOUBLE);
  expect(CsvTypeParser.checkDouble('123e-5')).toBe(DOUBLE);
});

it('correctly checks for boolean', () => {
  expect(CsvTypeParser.checkBoolean('hello')).toBe(STRING);
  expect(CsvTypeParser.checkBoolean('true')).toBe(BOOLEAN);
  expect(CsvTypeParser.checkBoolean('false')).toBe(BOOLEAN);
  expect(CsvTypeParser.checkBoolean('TRUE')).toBe(BOOLEAN);
  expect(CsvTypeParser.checkBoolean('FALSE')).toBe(BOOLEAN);
  expect(CsvTypeParser.checkBoolean('123')).toBe(STRING);
  expect(CsvTypeParser.checkBoolean('123.45')).toBe(STRING);
});

it('correctly checks for date time', () => {
  expect(CsvTypeParser.checkDateTime('hello')).toBe(STRING);
  expect(CsvTypeParser.checkDateTime('true')).toBe(STRING);
  expect(CsvTypeParser.checkDateTime('false')).toBe(STRING);
  expect(CsvTypeParser.checkDateTime('123')).toBe(STRING);
  expect(CsvTypeParser.checkDateTime('123.45')).toBe(STRING);

  // valid date times
  expect(CsvTypeParser.checkDateTime('2020-01-02T03:04:05.123456789 UTC')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('2020-01-02 03:04:05.123456789 UTC')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('2020-01-02T03:04:05.123456789')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('2020-01-02 03:04:05.123456789')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('2020-01-02T03:04:05 UTC')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('2020-01-02 03:04:05 UTC')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('2020-01-02 03:04:05')).toBe(DATE_TIME);
  expect(CsvTypeParser.checkDateTime('2020-01-02T03:04:05.123456789 UTC')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('2020-01-02T03:04:05.12345678 GMT')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('2020-01-02T03:04:05.1234567 NY')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('2020-01-02T03:04:05.123456 EST')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('2020-01-02T03:04:05.12345 EDT')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('2020-01-02T03:04:05.1234 CE')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('2020-01-02T03:04:05.123 CET')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('2020-01-02T03:04:05.12 CEST')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('2020-01-02T03:04:05.1 LON')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('2020-01-02T03:04:05 AEST')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('1990-01-01T00:00:00.123456789 UTC')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('2010-02-02T01:01:01 UTC')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('2015-12-31 12:35:45.123456789 UTC')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('1900-12-31T12:35:45.123456789')).toBe(
    DATE_TIME
  );
  expect(CsvTypeParser.checkDateTime('1945-06-15 24:59:59')).toBe(DATE_TIME);

  // invalid
  expect(
    CsvTypeParser.checkDateTime('2020-01-02T03:04:05.1234567890 UTC')
  ).toBe(STRING);
  expect(CsvTypeParser.checkDateTime('2020-01-02T03:04:05.1234567890')).toBe(
    STRING
  );
  expect(CsvTypeParser.checkDateTime('2020-01-02')).toBe(STRING);
  expect(CsvTypeParser.checkDateTime('03:04:05')).toBe(STRING);
  expect(CsvTypeParser.checkDateTime('03:04:05.123456789 UTC')).toBe(STRING);
  expect(CsvTypeParser.checkDateTime('03:04:05.123456789')).toBe(STRING);
  expect(CsvTypeParser.checkDateTime('1990-20-01T00:00:00.123456789 UTC')).toBe(
    STRING
  );
  expect(CsvTypeParser.checkDateTime('1990-01-40T00:00:00.123456789 UTC')).toBe(
    STRING
  );
  expect(CsvTypeParser.checkDateTime('1990-01-01T30:00:00.123456789 UTC')).toBe(
    STRING
  );
  expect(CsvTypeParser.checkDateTime('1990-01-01T00:60:00.123456789 UTC')).toBe(
    STRING
  );
  expect(CsvTypeParser.checkDateTime('1990-01-01T00:00:70.123456789 UTC')).toBe(
    STRING
  );
  expect(CsvTypeParser.checkDateTime('1990-01-0100:00:00.123456789 UTC')).toBe(
    STRING
  );
  expect(CsvTypeParser.checkDateTime('1990-01-01T0000:00.123456789 UTC')).toBe(
    STRING
  );
});

it('correctly checks for local time', () => {
  expect(CsvTypeParser.checkLocalTime('hello')).toBe(STRING);
  expect(CsvTypeParser.checkLocalTime('true')).toBe(STRING);
  expect(CsvTypeParser.checkLocalTime('false')).toBe(STRING);
  expect(CsvTypeParser.checkLocalTime('123')).toBe(STRING);
  expect(CsvTypeParser.checkLocalTime('123.45')).toBe(STRING);

  // valid local times
  expect(CsvTypeParser.checkLocalTime('03:04:05')).toBe(LOCAL_TIME);
  expect(CsvTypeParser.checkLocalTime('03:04:05.1')).toBe(LOCAL_TIME);
  expect(CsvTypeParser.checkLocalTime('03:04:05.12')).toBe(LOCAL_TIME);
  expect(CsvTypeParser.checkLocalTime('03:04:05.123')).toBe(LOCAL_TIME);
  expect(CsvTypeParser.checkLocalTime('03:04:05.1234')).toBe(LOCAL_TIME);
  expect(CsvTypeParser.checkLocalTime('03:04:05.12345')).toBe(LOCAL_TIME);
  expect(CsvTypeParser.checkLocalTime('03:04:05.123456')).toBe(LOCAL_TIME);
  expect(CsvTypeParser.checkLocalTime('03:04:05.1234567')).toBe(LOCAL_TIME);
  expect(CsvTypeParser.checkLocalTime('03:04:05.12345678')).toBe(LOCAL_TIME);
  expect(CsvTypeParser.checkLocalTime('03:04:05.123456789')).toBe(LOCAL_TIME);
  expect(CsvTypeParser.checkLocalTime('03:04')).toBe(LOCAL_TIME);

  // invalid
  expect(CsvTypeParser.checkLocalTime('03:04:05.1234567890')).toBe(STRING);
});

it('does not change type on null', () => {
  const typeArray = [
    UNKNOWN,
    INTEGER,
    LONG,
    DOUBLE,
    BOOLEAN,
    STRING,
    DATE_TIME,
    LOCAL_TIME,
  ];
  typeArray.forEach(type => {
    expect(CsvTypeParser.determineType(null, type, NULL_STRING)).toBe(type);
    expect(CsvTypeParser.determineType('', type, NULL_STRING)).toBe(type);
    expect(CsvTypeParser.determineType(NULL_STRING, type, NULL_STRING)).toBe(
      type
    );
  });
});

it('correctly determines type', () => {
  expect(CsvTypeParser.determineType('hello', UNKNOWN, NULL_STRING)).toBe(
    STRING
  );
  expect(CsvTypeParser.determineType('123a', UNKNOWN, NULL_STRING)).toBe(
    STRING
  );
  expect(CsvTypeParser.determineType('123.4a', UNKNOWN, NULL_STRING)).toBe(
    STRING
  );
  expect(CsvTypeParser.determineType('truea', UNKNOWN, NULL_STRING)).toBe(
    STRING
  );
  expect(CsvTypeParser.determineType('falsea', UNKNOWN, NULL_STRING)).toBe(
    STRING
  );

  expect(CsvTypeParser.determineType('true', UNKNOWN, NULL_STRING)).toBe(
    BOOLEAN
  );
  expect(CsvTypeParser.determineType('false', UNKNOWN, NULL_STRING)).toBe(
    BOOLEAN
  );
  expect(CsvTypeParser.determineType('TRUE', UNKNOWN, NULL_STRING)).toBe(
    BOOLEAN
  );
  expect(CsvTypeParser.determineType('FALSE', UNKNOWN, NULL_STRING)).toBe(
    BOOLEAN
  );

  expect(CsvTypeParser.determineType('0', UNKNOWN, NULL_STRING)).toBe(INTEGER);
  expect(CsvTypeParser.determineType('123', UNKNOWN, NULL_STRING)).toBe(
    INTEGER
  );
  expect(CsvTypeParser.determineType('-123', UNKNOWN, NULL_STRING)).toBe(
    INTEGER
  );

  // Check the boundaries around long
  expect(
    CsvTypeParser.determineType(MAX_INT.toString(), UNKNOWN, NULL_STRING)
  ).toBe(INTEGER);
  expect(
    CsvTypeParser.determineType(MIN_INT.toString(), UNKNOWN, NULL_STRING)
  ).toBe(INTEGER);
  for (let i = 1; i <= 100; i += 1) {
    expect(
      CsvTypeParser.determineType(
        (MAX_INT + i).toString(),
        UNKNOWN,
        NULL_STRING
      )
    ).toBe(LONG);
    expect(
      CsvTypeParser.determineType(
        (MAX_INT - i).toString(),
        UNKNOWN,
        NULL_STRING
      )
    ).toBe(INTEGER);
    expect(
      CsvTypeParser.determineType(
        (MIN_INT - i).toString(),
        UNKNOWN,
        NULL_STRING
      )
    ).toBe(LONG);
    expect(
      CsvTypeParser.determineType(
        (MIN_INT + i).toString(),
        UNKNOWN,
        NULL_STRING
      )
    ).toBe(INTEGER);
  }
  expect(
    CsvTypeParser.determineType((MAX_INT * 2).toString(), UNKNOWN, NULL_STRING)
  ).toBe(LONG);
  expect(
    CsvTypeParser.determineType((MAX_INT * 10).toString(), UNKNOWN, NULL_STRING)
  ).toBe(LONG);
  expect(
    CsvTypeParser.determineType(
      (MAX_INT * 100).toString(),
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(LONG);
  expect(
    CsvTypeParser.determineType((MIN_INT * 2).toString(), UNKNOWN, NULL_STRING)
  ).toBe(LONG);
  expect(
    CsvTypeParser.determineType((MIN_INT * 10).toString(), UNKNOWN, NULL_STRING)
  ).toBe(LONG);
  expect(
    CsvTypeParser.determineType(
      (MIN_INT * 100).toString(),
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(LONG);
  expect(
    CsvTypeParser.determineType(
      Math.trunc(MAX_INT / 2).toString(),
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(INTEGER);
  expect(
    CsvTypeParser.determineType(
      Math.trunc(MAX_INT / 10).toString(),
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(INTEGER);
  expect(
    CsvTypeParser.determineType(
      Math.trunc(MAX_INT / 100).toString(),
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(INTEGER);
  expect(
    CsvTypeParser.determineType(
      Math.trunc(MIN_INT / 2).toString(),
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(INTEGER);
  expect(
    CsvTypeParser.determineType(
      Math.trunc(MIN_INT / 10).toString(),
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(INTEGER);
  expect(
    CsvTypeParser.determineType(
      Math.trunc(MIN_INT / 100).toString(),
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(INTEGER);

  expect(CsvTypeParser.determineType('0.0', UNKNOWN, NULL_STRING)).toBe(DOUBLE);
  expect(CsvTypeParser.determineType('123.0', UNKNOWN, NULL_STRING)).toBe(
    DOUBLE
  );
  expect(CsvTypeParser.determineType('-123.0', UNKNOWN, NULL_STRING)).toBe(
    DOUBLE
  );

  expect(
    CsvTypeParser.determineType(
      '2020-01-02T03:04:05.123456789 UTC',
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(DATE_TIME);
  expect(
    CsvTypeParser.determineType(
      '2020-01-02 03:04:05.123456789 UTC',
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(DATE_TIME);
  expect(
    CsvTypeParser.determineType(
      '2020-01-02T03:04:05.123456789',
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(DATE_TIME);
  expect(
    CsvTypeParser.determineType(
      '2020-01-02 03:04:05.123456789',
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(DATE_TIME);
  expect(
    CsvTypeParser.determineType('2020-01-02T03:04:05 UTC', UNKNOWN, NULL_STRING)
  ).toBe(DATE_TIME);
  expect(
    CsvTypeParser.determineType('2020-01-02 03:04:05 UTC', UNKNOWN, NULL_STRING)
  ).toBe(DATE_TIME);
  expect(
    CsvTypeParser.determineType('2020-01-02 03:04:05', UNKNOWN, NULL_STRING)
  ).toBe(DATE_TIME);
  expect(
    CsvTypeParser.determineType(
      '2020-01-02T03:04:05.123456789 UTC',
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(DATE_TIME);
  expect(
    CsvTypeParser.determineType(
      '2020-01-02T03:04:05.12345678 GMT',
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(DATE_TIME);
  expect(
    CsvTypeParser.determineType(
      '2020-01-02T03:04:05.1234567 NY',
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(DATE_TIME);
  expect(
    CsvTypeParser.determineType(
      '2020-01-02T03:04:05.123456 EST',
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(DATE_TIME);
  expect(
    CsvTypeParser.determineType(
      '2020-01-02T03:04:05.12345 EDT',
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(DATE_TIME);
  expect(
    CsvTypeParser.determineType(
      '2020-01-02T03:04:05.1234 CE',
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(DATE_TIME);
  expect(
    CsvTypeParser.determineType(
      '2020-01-02T03:04:05.123 CET',
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(DATE_TIME);
  expect(
    CsvTypeParser.determineType(
      '2020-01-02T03:04:05.12 CEST',
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(DATE_TIME);
  expect(
    CsvTypeParser.determineType(
      '2020-01-02T03:04:05.1 LON',
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(DATE_TIME);
  expect(
    CsvTypeParser.determineType(
      '2020-01-02T03:04:05 AEST',
      UNKNOWN,
      NULL_STRING
    )
  ).toBe(DATE_TIME);

  expect(CsvTypeParser.determineType('03:04:05', UNKNOWN, NULL_STRING)).toBe(
    LOCAL_TIME
  );
  expect(CsvTypeParser.determineType('03:04:05.1', UNKNOWN, NULL_STRING)).toBe(
    LOCAL_TIME
  );
  expect(CsvTypeParser.determineType('03:04:05.12', UNKNOWN, NULL_STRING)).toBe(
    LOCAL_TIME
  );
  expect(
    CsvTypeParser.determineType('03:04:05.123', UNKNOWN, NULL_STRING)
  ).toBe(LOCAL_TIME);
  expect(
    CsvTypeParser.determineType('03:04:05.1234', UNKNOWN, NULL_STRING)
  ).toBe(LOCAL_TIME);
  expect(
    CsvTypeParser.determineType('03:04:05.12345', UNKNOWN, NULL_STRING)
  ).toBe(LOCAL_TIME);
  expect(
    CsvTypeParser.determineType('03:04:05.123456', UNKNOWN, NULL_STRING)
  ).toBe(LOCAL_TIME);
  expect(
    CsvTypeParser.determineType('03:04:05.1234567', UNKNOWN, NULL_STRING)
  ).toBe(LOCAL_TIME);
  expect(
    CsvTypeParser.determineType('03:04:05.12345678', UNKNOWN, NULL_STRING)
  ).toBe(LOCAL_TIME);
  expect(
    CsvTypeParser.determineType('03:04:05.123456789', UNKNOWN, NULL_STRING)
  ).toBe(LOCAL_TIME);
});
