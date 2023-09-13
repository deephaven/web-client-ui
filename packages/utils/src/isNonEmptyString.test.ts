import isNonEmptyString from './isNonEmptyString';

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('isNonEmptyString', () => {
  it.each([
    ['x', true],
    ['', false],
    [null, false],
    [undefined, false],
    [999, false],
    [{}, false],
  ])('should return true if given non-empty string: %s', (given, expected) => {
    expect(isNonEmptyString(given)).toEqual(expected);
  });
});
