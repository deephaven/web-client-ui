import { createDefaultIrisGridTheme } from './IrisGridTheme';

jest.mock('@deephaven/components', () => ({
  ...jest.requireActual('@deephaven/components'),
  resolveCssVariablesInRecord: jest.fn(
    () =>
      new Proxy(
        {},
        {
          get(_target, name) {
            return `IrisGridTheme['${String(name)}']`;
          },
        }
      )
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('createDefaultIrisGridTheme', () => {
  it('should derive the default Iris grid theme', () => {
    const theme = createDefaultIrisGridTheme();
    expect(theme).toMatchSnapshot();
  });
});
