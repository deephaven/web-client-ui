import ScriptEditorUtils from './ScriptEditorUtils';

describe('normalize script language', () => {
  test.each([
    ['groovy', 'Groovy'],
    ['python', 'Python'],
    ['scala', 'Scala'],
    ['other', null],
  ])('%s', (param, expected) =>
    expect(ScriptEditorUtils.normalizeScriptLanguage(param as 'python')).toBe(
      expected
    )
  );
});

describe('get disabled run tooltip', () => {
  test('not connected', () =>
    expect(
      ScriptEditorUtils.getDisabledRunTooltip(false, false, 'lang', 'test')
    ).toMatch('not connected'));

  test('session language does not match', () =>
    expect(
      ScriptEditorUtils.getDisabledRunTooltip(true, false, 'lang', 'test')
    ).toMatch("lang doesn't match"));

  test('not disabled', () =>
    expect(
      ScriptEditorUtils.getDisabledRunTooltip(true, true, 'lang', 'test')
    ).toBeNull());
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
    {
      input: '\ta\n\t\tb\n\tc',
      output: 'a\n\tb\nc',
      case: 'tab indents',
    },
    {
      input: 'a\nb\nc\n',
      output: 'a\nb\nc\n',
      case: 'no indents',
    },
  ])('outdentCode with $case', ({ input, output }) => {
    expect(ScriptEditorUtils.outdentCode(input)).toBe(output);
  });
});
