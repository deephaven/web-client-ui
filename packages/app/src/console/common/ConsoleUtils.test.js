import ConsoleUtils from './ConsoleUtils';

describe('parsing shell arguments from text', () => {
  function testStr(str, expectedArgs) {
    expect(ConsoleUtils.parseArguments(str)).toEqual(expectedArgs);
  }
  it('handles empty and blank strings properly', () => {
    testStr(undefined, []);
    testStr(null, []);
    testStr('', []);
    testStr(' ', []);
  });

  it('handles basic cases', () => {
    testStr('A', ['A']);
    testStr('A B C', ['A', 'B', 'C']);
    testStr('A\tB\nC', ['A', 'B', 'C']);
    testStr('   A  \t  B   \n   C   ', ['A', 'B', 'C']);
    testStr('A=1 B=2 C=3', ['A=1', 'B=2', 'C=3']);
  });

  it('handles shell quoting rules', () => {
    testStr('A="1 2 3"', ['A=1 2 3']);
    testStr('A="1\t2\n3"\tB="1\t2\n3"', ['A=1\t2\n3', 'B=1\t2\n3']);
    testStr("A='1\t2\n3'\tB='1\t2\n3'", ['A=1\t2\n3', 'B=1\t2\n3']);
    expect(
      ConsoleUtils.parseArguments('A="This is a long string" B="Next String"')
    ).toEqual(['A=This is a long string', 'B=Next String']);
  });

  it('handles glob patterns', () => {
    testStr('foo=*.so', ['foo=*.so']);
  });

  it('handls ops', () => {
    testStr('beep || boop > /byte', ['beep', '||', 'boop', '>', '/byte']);
  });

  it('filters out comments', () => {
    testStr('foo # bar', ['foo']);
  });
});
