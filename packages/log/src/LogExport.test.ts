import { getReduxDataString } from './LogExport';

describe('getReduxDataString', () => {
  it('should return a JSON string of the redux data', () => {
    const reduxData = {
      key1: 'value1',
      key2: 2,
      key3: true,
    };
    const result = getReduxDataString(reduxData);
    const expected = JSON.stringify(reduxData, null, 2);
    expect(result).toBe(expected);
  });

  it('should handle circular references', () => {
    const reduxData: Record<string, unknown> = {
      key1: 'value1',
    };
    reduxData.key2 = reduxData;
    const result = getReduxDataString(reduxData);
    const expected = JSON.stringify(
      {
        key1: 'value1',
        key2: '[Circular]',
      },
      null,
      2
    );
    expect(result).toBe(expected);
  });

  it('should handle BigInt values', () => {
    const reduxData = { key1: BigInt('12345678901234567890') };
    const result = getReduxDataString(reduxData);
    // Hardcode expected value since JSON.stringify would throw
    const expected = `{
  "key1": 12345678901234567890
}`;
    expect(result).toBe(expected);
  });

  it('should apply ignore list paths', () => {
    const reduxData = {
      key1: 'should be ignored',
      key2: {
        'key2.1': 'should also be ignored',
      },
      key3: 'value',
    };
    const result = getReduxDataString(reduxData, [
      ['key1'],
      ['key2', 'key2.1'],
    ]);
    const expected = JSON.stringify(
      {
        key2: {},
        key3: 'value',
      },
      null,
      2
    );
    expect(result).toBe(expected);
  });

  it('should stringify Maps', () => {
    const reduxData = {
      key1: new Map([
        ['key1.1', 'value1.1'],
        ['key1.2', 'value1.2'],
      ]),
    };
    const result = getReduxDataString(reduxData);
    const expected = JSON.stringify(
      {
        key1: [
          ['key1.1', 'value1.1'],
          ['key1.2', 'value1.2'],
        ],
      },
      null,
      2
    );
    expect(result).toBe(expected);
  });

  it('should handle wildcards in ignore list paths', () => {
    const reduxData = {
      key1: 'not ignored',
      key2: {
        keyA: {
          key1: 'ignored',
        },
        keyB: {
          key1: 'ignored',
        },
        keyC: {
          key1: 'ignored',
        },
      },
    };
    const result = getReduxDataString(reduxData, [['key2', '*', 'key1']]);
    const expected = JSON.stringify(
      {
        key1: 'not ignored',
        key2: {
          keyA: {},
          keyB: {},
          keyC: {},
        },
      },
      null,
      2
    );
    expect(result).toBe(expected);
  });

  it('should handle nested wildcards in ignore list paths', () => {
    const reduxData = {
      key1: 'not ignored',
      key2: {
        keyA: {
          key1: 'ignored',
          key2: {
            key3: 'ignored',
          },
        },
        keyB: {
          key1: 'ignored',
          key2: {
            key3: 'ignored',
            key4: 'ignored',
          },
        },
      },
    };
    const result = getReduxDataString(reduxData, [['key2', '*', '*']]);
    const expected = JSON.stringify(
      {
        key1: 'not ignored',
        key2: {
          keyA: {},
          keyB: {},
        },
      },
      null,
      2
    );
    expect(result).toBe(expected);
  });

  it('should handle wildcard ignore list paths with no matches', () => {
    const reduxData = {
      key1: 'not ignored',
      key2: {
        keyA: {
          key1: 'not ignored',
          key2: {
            key3: 'not ignored',
          },
        },
      },
    };
    const result = getReduxDataString(reduxData, [['*', '*', '*', '*', '*']]); // Matching more than the depth of the object
    const expected = JSON.stringify(reduxData, null, 2);
    expect(result).toBe(expected);
  });

  it('root wildcard should ignore all', () => {
    const reduxData = {
      key1: 'should be ignored',
    };
    const result = getReduxDataString(reduxData, [['*']]);
    expect(result).toBe('{}');
  });

  it('should respect maximum depth', () => {
    const reduxData = {
      key1: {
        key2: {
          key3: 'too deep',
        },
        key4: ['too deep'],
      },
    };
    const result = getReduxDataString(reduxData, [], 2);
    const expected = JSON.stringify(
      {
        key1: {
          key2: '[Object]',
          key4: '[Array]',
        },
      },
      null,
      2
    );
    expect(result).toBe(expected);
  });
});
