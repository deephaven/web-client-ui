import { ensureArray, removeNullAndUndefined } from './DataUtils';

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('ensureArray', () => {
  it('should return the same array if an array is passed', () => {
    const array = [1, 2, 3];
    expect(ensureArray(array)).toBe(array);
  });

  it('should return an array with the passed value if a non-array value is passed', () => {
    const value = 'test';
    expect(ensureArray(value)).toEqual([value]);
  });
});

describe('removeNullAndUndefined', () => {
  it.each([null, undefined])(
    'should remove null and undefined items from array: %s',
    nullOrUndefined => {
      const given = [
        nullOrUndefined,
        1,
        2,
        nullOrUndefined,
        nullOrUndefined,
        3,
        nullOrUndefined,
      ];

      const expected = [1, 2, 3];
      const actual: number[] = removeNullAndUndefined(...given);

      expect(actual).toEqual(expected);
    }
  );
});
