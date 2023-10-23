import { resolveCssVariablesInRecord } from '@deephaven/components';
import { TestUtils } from '@deephaven/utils';
import { createDefaultIrisGridTheme } from './IrisGridTheme';

const { asMock } = TestUtils;

jest.mock('@deephaven/components', () => ({
  ...jest.requireActual('@deephaven/components'),
  resolveCssVariablesInRecord: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('createDefaultIrisGridTheme', () => {
  // Proxy for IrisGridTheme
  const identityProxy = new Proxy(
    {},
    {
      get(_target, name) {
        return `IrisGridTheme['${String(name)}']`;
      },
    }
  );

  beforeEach(() => {
    asMock(resolveCssVariablesInRecord)
      .mockName('resolveCssVariablesInRecord')
      .mockReturnValue(identityProxy);
  });

  it('should derive the default Iris grid theme', () => {
    const theme = createDefaultIrisGridTheme();
    expect(resolveCssVariablesInRecord).toHaveBeenCalled();
    expect(theme).toMatchSnapshot();
  });
});
