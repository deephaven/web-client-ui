import { useApi } from '@deephaven/jsapi-bootstrap';
import { bindAllMethods, TestUtils } from '@deephaven/utils';
import {
  createFormatterFromSettings,
  Formatter,
  Settings,
} from '@deephaven/jsapi-utils';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { renderHook } from '@testing-library/react-hooks';
import { useFormatter } from './useFormatter';

jest.mock('@deephaven/jsapi-bootstrap');
jest.mock('@deephaven/jsapi-utils', () => {
  const actual = jest.requireActual('@deephaven/jsapi-utils');
  return {
    ...actual,
    createFormatterFromSettings: jest.fn(),
  };
});
jest.mock('@deephaven/utils', () => ({
  ...jest.requireActual('@deephaven/utils'),
  bindAllMethods: jest.fn(),
}));

const { asMock, createMockProxy } = TestUtils;

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('useFormatter', () => {
  const mock = {
    dh: createMockProxy<typeof DhType>(),
    formatter: createMockProxy<Formatter>(),
    settings: createMockProxy<Settings>(),
  };

  beforeEach(() => {
    asMock(useApi).mockReturnValue(mock.dh);

    asMock(bindAllMethods)
      .mockName('bindAllMethods')
      .mockImplementation(a => a);

    asMock(createFormatterFromSettings)
      .mockName('createFormatterFromSettings')
      .mockReturnValue(mock.formatter);
  });

  it('should return members of a `Formatter` instance based on settings', () => {
    const { result } = renderHook(() => useFormatter(mock.settings));

    expect(createFormatterFromSettings).toHaveBeenCalledWith(
      mock.dh,
      mock.settings
    );

    expect(bindAllMethods).toHaveBeenCalledWith(mock.formatter);

    expect(result.current).toEqual({
      getColumnFormat: mock.formatter.getColumnFormat,
      getColumnFormatMapForType: mock.formatter.getColumnFormatMapForType,
      getColumnTypeFormatter: mock.formatter.getColumnTypeFormatter,
      getFormattedString: mock.formatter.getFormattedString,
      timeZone: mock.formatter.timeZone,
    });
  });
});
