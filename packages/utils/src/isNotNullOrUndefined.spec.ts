import isNotNullOrUndefined from './isNotNullOrUndefined';

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('isNotNullOrUndefined', () => {
  it.each([
    ['', true],
    ['x', true],
    [999, true],
    [{}, true],
    [null, false],
    [undefined, false],
  ])(
    'should return true if value is not null or undefined: %s',
    (given, expected) => {
      expect(isNotNullOrUndefined(given)).toEqual(expected);
    }
  );
});
