import hasRequiredString from './hasRequiredString';

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('hasRequiredString', () => {
  interface TestValue {
    s1?: string;
    s2?: string;
    s3?: string;
    n1?: number;
  }

  const nonEmpty = 'non-empty';
  const expectedNonEmptyStringProps = ['s1', 's2', 's3'] as const;

  const value: Record<string, TestValue> = {
    all: {
      s1: nonEmpty,
      s2: nonEmpty,
      s3: nonEmpty,
    },
    allWithNumber: {
      s1: nonEmpty,
      s2: nonEmpty,
      s3: nonEmpty,
      n1: 999,
    },
    empty1: {
      s1: nonEmpty,
      s2: nonEmpty,
      s3: '',
    },
    empty2: {
      s1: nonEmpty,
      s2: '',
      s3: '',
    },
    empty3: {
      s1: '',
      s2: '',
      s3: '',
    },
    missing1: {
      s1: nonEmpty,
      s2: nonEmpty,
    },
    missing2: {
      s1: nonEmpty,
    },
    missing3: {},
  };

  it.each([value.all, value.allWithNumber])(
    'should return true if all listed props are non-empty strings: %s',
    validValue => {
      expect(
        hasRequiredString(validValue, ...expectedNonEmptyStringProps)
      ).toBeTruthy();
    }
  );

  it.each([
    value.empty1,
    value.empty2,
    value.empty3,
    value.missing1,
    value.missing2,
    value.missing3,
  ])(
    'should return false if any listed property is not an non-empty string: %s',
    invalidValue => {
      expect(
        hasRequiredString(invalidValue, ...expectedNonEmptyStringProps)
      ).toBeFalsy();
    }
  );
});
