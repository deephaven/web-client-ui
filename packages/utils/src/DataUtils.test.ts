import { removeNullAndUndefined } from './DataUtils';

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
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
