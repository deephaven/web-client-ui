import TextUtils from './TextUtils';

describe('join string array', () => {
  function testJoin(
    items: string[] | null,
    expectedValue: string,
    conjunction?: string
  ) {
    expect(TextUtils.join(items, conjunction)).toBe(expectedValue);
  }

  it('handles the null case', () => {
    testJoin(null, '');
  });

  it('handles an empty array', () => {
    testJoin([], '');
  });

  it('handles a one element array', () => {
    testJoin(['A'], 'A');
  });

  it('handles a two element array', () => {
    testJoin(['A', 'B'], 'A and B');
  });

  it('handles a three element array', () => {
    // US list conjunctions should have a comma before the 'and'
    testJoin(['A', 'B', 'C'], 'A, B, and C');
  });

  it('handles a 5 element array', () => {
    testJoin(['A', 'B', 'C', 'D', 'E'], 'A, B, C, D, and E');
  });

  it('handles optional conjunction', () => {
    testJoin(['A', 'B', 'C'], 'A, B, or C', 'or');
  });
});

describe('toLower text', () => {
  function testLower(
    text: string | null,
    expectedValue: string,
    isNullAllowed = true
  ) {
    expect(TextUtils.toLower(text, isNullAllowed)).toBe(expectedValue);
  }

  it('handles null', () => {
    testLower(null, '');
  });

  it('throws if null and null not allowed', () => {
    expect(() => TextUtils.toLower(null, false)).toThrow();
  });

  it('handles lower case strs', () => {
    const words = ['hello', 'world', 'simple', 'test'];
    for (let i = 0; i < words.length; i += 1) {
      testLower(words[i], words[i]);
    }
  });

  it('handles other words', () => {
    const words = ['HELLO', 'WoRlD', 'SiMpLe', 'tEsT'];
    const expected = ['hello', 'world', 'simple', 'test'];
    for (let i = 0; i < words.length; i += 1) {
      testLower(words[i], expected[i]);
    }
  });
});

describe('sort text', () => {
  it('sorts ascending', () => {
    expect(TextUtils.sort('A', 'B')).toBe(-1);
    expect(TextUtils.sort('B', 'A')).toBe(1);
    expect(TextUtils.sort('A', 'A')).toBe(0);
  });

  it('sorts descending', () => {
    expect(TextUtils.sort('A', 'B', false)).toBe(1);
    expect(TextUtils.sort('B', 'A', false)).toBe(-1);
    expect(TextUtils.sort('A', 'A', false)).toBe(0);
  });
});

describe('outdent code', () => {
  test.each([
    { input: '\n\n\n', output: '\n\n\n', case: 'empty lines' },
    {
      input: 'a\n  b\n  c\nd',
      output: 'a\n  b\n  c\nd',
      case: 'some lines not indented',
    },
    {
      input: '  a\n  b\n  c',
      output: 'a\nb\nc',
      case: 'all lines same indent',
    },
    {
      input: '\n\n  a\n\n    b\n  c',
      output: '\n\na\n\n  b\nc',
      case: 'blank lines in the code',
    },
    {
      input: '',
      output: '',
      case: 'empty string',
    },
  ])('outdentCode with $case', ({ input, output }) => {
    expect(TextUtils.outdentCode(input)).toBe(output);
  });
});
