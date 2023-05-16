import dh from '@deephaven/jsapi-shim';
import type { TimeZone } from '@deephaven/jsapi-types';
import DateTimeColumnFormatter from './DateTimeColumnFormatter';
import { TableColumnFormat } from './TableColumnFormatter';

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
  return new DateTimeColumnFormatter(dh, {
    timeZone,
    showTimeZone,
    showTSeparator,
    defaultDateTimeFormatString,
  });
}

function makeIrisTimeZone(id = 'default'): TimeZone {
  return {
    id,
    adjustments: [],
    standardOffset: 0,
    timeZoneID: '',
    transitionPoints: [],
    tzNames: [],
  };
}

const {
  DEFAULT_DATETIME_FORMAT_STRING,
  DEFAULT_TIME_ZONE_ID,
} = DateTimeColumnFormatter;

const VALID_FORMATS = [
  DEFAULT_DATETIME_FORMAT_STRING,
  'yyyy-MM-dd HH:mm:ss',
  'yyyy-MM-dd HH:mm:ss.SSSSSSSSS',
  'yyyy-MM-dd',
  'MM-dd-yyyy',
  'HH:mm:ss',
  'HH:mm:ss.SSS',
  'HH:mm:ss.SSSSSSSSS',
];

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
  const formatMock = jest.fn(
    (pattern: string, date: unknown, timeZone?: unknown) => ''
  );

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
    formatter.format(timestamp, {
      formatString: '',
      label: '',
      type: 'type-context-custom',
    });

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

describe('isValid', () => {
  it('should return true if a format is valid', () => {
    for (let i = 0; i < VALID_FORMATS.length; i += 1) {
      expect(
        DateTimeColumnFormatter.isValid(dh, {
          formatString: VALID_FORMATS[i],
        })
      ).toBe(true);
    }
  });
});

describe('isSameFormat', () => {
  it('should return true if two formats are the same excluding label', () => {
    const format1: TableColumnFormat = {
      label: 'format1',
      formatString: 'yyyy-MM-dd HH:mm:ss',
      type: 'type-context-custom',
    };
    const format2: TableColumnFormat = {
      label: 'format2',
      formatString: 'yyyy-MM-dd HH:mm:ss',
      type: 'type-context-custom',
    };

    expect(DateTimeColumnFormatter.isSameFormat(format1, format2)).toBe(true);
  });

  it('should return false if two formats are different excluding label', () => {
    const format1: TableColumnFormat = {
      label: 'format1',
      formatString: 'yyyy-MM-dd HH:mm:ss',
      type: 'type-context-preset',
    };
    const format2: TableColumnFormat = {
      label: 'format2',
      formatString: 'yyyy-MM-dd HH:mm:ss',
      type: 'type-context-custom',
    };

    expect(DateTimeColumnFormatter.isSameFormat(format1, format2)).toBe(false);
  });
});

describe('makeGlobalFormatStringMap', () => {
  const mapsAreEqual = (m1, m2) =>
    m1.size === m2.size &&
    Array.from(m1.keys()).every(key => m1.get(key) === m2.get(key));

  it('should return a global format string map without showing Timezone or Tseparator', () => {
    const expectedMap = new Map([
      ['yyyy-MM-dd HH:mm:ss', `yyyy-MM-dd HH:mm:ss`],
      ['yyyy-MM-dd HH:mm:ss.SSS', `yyyy-MM-dd HH:mm:ss.SSS`],
      ['yyyy-MM-dd HH:mm:ss.SSSSSSSSS', `yyyy-MM-dd HH:mm:ss.SSSSSSSSS`],
    ]);

    expect(
      mapsAreEqual(
        DateTimeColumnFormatter.makeGlobalFormatStringMap(false, false),
        expectedMap
      )
    ).toBe(true);
  });

  it('should return a global format string map showing Timezone but not Tseparator', () => {
    const expectedMap = new Map([
      ['yyyy-MM-dd HH:mm:ss', `yyyy-MM-dd HH:mm:ss z`],
      ['yyyy-MM-dd HH:mm:ss.SSS', `yyyy-MM-dd HH:mm:ss.SSS z`],
      ['yyyy-MM-dd HH:mm:ss.SSSSSSSSS', `yyyy-MM-dd HH:mm:ss.SSSSSSSSS z`],
    ]);

    expect(
      mapsAreEqual(
        DateTimeColumnFormatter.makeGlobalFormatStringMap(true, false),
        expectedMap
      )
    ).toBe(true);
  });

  it('should return a global format string map showing Tseparator but not Timezone', () => {
    const expectedMap = new Map([
      ['yyyy-MM-dd HH:mm:ss', `yyyy-MM-dd'T'HH:mm:ss`],
      ['yyyy-MM-dd HH:mm:ss.SSS', `yyyy-MM-dd'T'HH:mm:ss.SSS`],
      ['yyyy-MM-dd HH:mm:ss.SSSSSSSSS', `yyyy-MM-dd'T'HH:mm:ss.SSSSSSSSS`],
    ]);

    expect(
      mapsAreEqual(
        DateTimeColumnFormatter.makeGlobalFormatStringMap(false, true),
        expectedMap
      )
    ).toBe(true);
  });

  it('should return a global format string map show Tseparator and Timezone', () => {
    const expectedMap = new Map([
      ['yyyy-MM-dd HH:mm:ss', `yyyy-MM-dd'T'HH:mm:ss z`],
      ['yyyy-MM-dd HH:mm:ss.SSS', `yyyy-MM-dd'T'HH:mm:ss.SSS z`],
      ['yyyy-MM-dd HH:mm:ss.SSSSSSSSS', `yyyy-MM-dd'T'HH:mm:ss.SSSSSSSSS z`],
    ]);

    expect(
      mapsAreEqual(
        DateTimeColumnFormatter.makeGlobalFormatStringMap(true, true),
        expectedMap
      )
    ).toBe(true);
  });
});

describe('getGlobalFormats', () => {
  it('should get global formats', () => {
    const expectedArray = [
      'yyyy-MM-dd HH:mm:ss',
      'yyyy-MM-dd HH:mm:ss.SSS',
      'yyyy-MM-dd HH:mm:ss.SSSSSSSSS',
    ];

    expect(DateTimeColumnFormatter.getGlobalFormats(false, false)).toEqual(
      expectedArray
    );
    expect(DateTimeColumnFormatter.getGlobalFormats(true, false)).toEqual(
      expectedArray
    );
    expect(DateTimeColumnFormatter.getGlobalFormats(false, true)).toEqual(
      expectedArray
    );
    expect(DateTimeColumnFormatter.getGlobalFormats(true, true)).toEqual(
      expectedArray
    );
  });
});

// getGlobalFormats parameters doesn't change anything
// Not sure how to test the catch statements
