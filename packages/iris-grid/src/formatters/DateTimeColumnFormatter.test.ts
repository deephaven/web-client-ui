import dh from '@deephaven/jsapi-shim';
import DateTimeColumnFormatter from './DateTimeColumnFormatter';

function makeFormatter({
  timeZone,
  showTimeZone,
  showTSeparator,
  defaultDateTimeFormatString,
}: {
  timeZone?: string;
  showTimeZone?: boolean;
  showTSeparator?: boolean;
  defaultDateTimeFormatString?: string;
} = {}) {
  return new DateTimeColumnFormatter({
    timeZone,
    showTimeZone,
    showTSeparator,
    defaultDateTimeFormatString,
  });
}

function makeIrisTimeZone(id = 'default') {
  return {
    id,
  };
}

const {
  DEFAULT_DATETIME_FORMAT_STRING,
  DEFAULT_TIME_ZONE_ID,
} = DateTimeColumnFormatter;

it('should not throw if constructor called with no arguments', () => {
  expect(makeFormatter).not.toThrow();
});

it('should have default format in the formats list', () => {
  expect(DateTimeColumnFormatter.getFormats()).toContain(
    DEFAULT_DATETIME_FORMAT_STRING
  );
});

it('should add time zone pattern by default', () => {
  const dateTimeColumnFormatter = makeFormatter();
  expect(
    dateTimeColumnFormatter.getEffectiveFormatString(
      DEFAULT_DATETIME_FORMAT_STRING
    )
  ).toMatch(/.* z$/);
});

it('should not add time zone pattern if showTimeZone is false', () => {
  const dateTimeColumnFormatter = makeFormatter({ showTimeZone: false });
  expect(
    dateTimeColumnFormatter.getEffectiveFormatString(
      DEFAULT_DATETIME_FORMAT_STRING
    )
  ).not.toMatch(/.* z$/);
});

it('should not add T separator by default', () => {
  const dateTimeColumnFormatter = makeFormatter();
  expect(
    dateTimeColumnFormatter.getEffectiveFormatString(
      DEFAULT_DATETIME_FORMAT_STRING
    )
  ).not.toMatch(/.*'T'.*/);
});

it('should add T separator when showTSeparator is true', () => {
  const dateTimeColumnFormatter = makeFormatter({ showTSeparator: true });
  expect(
    dateTimeColumnFormatter.getEffectiveFormatString(
      DEFAULT_DATETIME_FORMAT_STRING
    )
  ).toMatch(/.*'T'.*/);
});

describe('calls to iris format and time zone functions', () => {
  const formatMock: jest.Mock<Record<string, unknown>> = jest.fn();
  const getTimeZoneMock = jest.fn(makeIrisTimeZone);
  const originalFormat = dh.i18n.DateTimeFormat.format;
  const originalGetTimeZone = dh.i18n.TimeZone.getTimeZone;

  beforeAll(() => {
    dh.i18n.DateTimeFormat.format = formatMock;
    dh.i18n.TimeZone.getTimeZone = getTimeZoneMock;
  });

  afterEach(() => {
    formatMock.mockClear();
    getTimeZoneMock.mockClear();
  });

  afterAll(() => {
    dh.i18n.DateTimeFormat.format = originalFormat;
    dh.i18n.TimeZone.getTimeZone = originalGetTimeZone;
  });

  it('should pass custom formatString to the format method', () => {
    const formatString = 'custom-format-string';
    const customFormat = DateTimeColumnFormatter.makeFormat(
      'Custom Format',
      formatString
    );
    const formatter = makeFormatter({
      showTimeZone: false,
    });
    const timestamp = Date.now();
    formatter.format(timestamp, customFormat);

    expect(formatMock.mock.calls[0][0]).toBe(formatString);
  });

  it('should fall back to the format specified in the constructor args if custom formatString is empty string or undefined', () => {
    const fallbackFormat = 'custom-format-string';
    const formatter = makeFormatter({
      showTimeZone: false,
      defaultDateTimeFormatString: fallbackFormat,
    });
    const timestamp = Date.now();
    formatter.format(timestamp);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatter.format(timestamp, '' as any);

    expect(formatMock.mock.calls.length).toBe(2);
    expect(formatMock.mock.calls[0][0]).toBe(fallbackFormat);
    expect(formatMock.mock.calls[1][0]).toBe(fallbackFormat);
  });

  it('should fall back to the default format if empty string or undefined format specified in the constructor args', () => {
    const formatter = makeFormatter({
      showTimeZone: false,
    });

    const timestamp = Date.now();
    formatter.format(timestamp);

    expect(formatMock.mock.calls[0][0]).toBe(DEFAULT_DATETIME_FORMAT_STRING);
  });

  it('should pass correct TimeZone object to the format function', () => {
    const timeZone1 = makeIrisTimeZone('time zone 1');
    const timeZone2 = makeIrisTimeZone('time zone 2');
    const timestamp = Date.now();

    const formatterTimeZone1 = makeFormatter({ timeZone: timeZone1.id });
    const formatterTimeZone2 = makeFormatter({ timeZone: timeZone2.id });

    formatterTimeZone1.format(timestamp);
    formatterTimeZone2.format(timestamp);

    expect(formatMock.mock.calls.length).toBe(2);
    expect(formatMock.mock.calls[0][2]).toMatchObject(timeZone1);
    expect(formatMock.mock.calls[1][2]).toMatchObject(timeZone2);
  });

  it('should fall back to the default time zone if empty string or undefined passed in the constructor args', () => {
    const defaultTimeZone = makeIrisTimeZone(DEFAULT_TIME_ZONE_ID);
    const formatter1 = makeFormatter({ showTimeZone: false });
    const formatter2 = makeFormatter({ timeZone: '', showTimeZone: false });

    const timestamp = Date.now();
    formatter1.format(timestamp);
    formatter2.format(timestamp);

    expect(formatMock.mock.calls.length).toBe(2);
    expect(formatMock.mock.calls[0][2]).toMatchObject(defaultTimeZone);
    expect(formatMock.mock.calls[1][2]).toMatchObject(defaultTimeZone);
  });
});
