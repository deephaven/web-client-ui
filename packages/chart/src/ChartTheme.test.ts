/// <reference types="./declaration" />

import { TestUtils } from '@deephaven/utils';
import { resolveCssVariablesInRecord } from '@deephaven/components';
import { defaultChartTheme } from './ChartTheme';
import chartThemeRaw from './ChartTheme.module.scss';

jest.mock('@deephaven/components', () => ({
  ...jest.requireActual('@deephaven/components'),
  resolveCssVariablesInRecord: jest.fn(),
}));

const { asMock } = TestUtils;

const mockChartTheme = new Proxy(
  {},
  { get: (_target, name) => `chartTheme['${String(name)}']` }
);

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();

  asMock(resolveCssVariablesInRecord)
    .mockName('resolveCssVariablesInRecord')
    .mockReturnValue(mockChartTheme);
});

describe('defaultChartTheme', () => {
  it('should create the default chart theme', () => {
    const actual = defaultChartTheme();

    expect(resolveCssVariablesInRecord).toHaveBeenCalledWith(chartThemeRaw);
    expect(actual).toMatchSnapshot();
  });
});
