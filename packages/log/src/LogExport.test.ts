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

  it('should apply blacklist paths', () => {
    const reduxData = {
      key1: 'should be blacklisted',
      key2: {
        'key2.1': 'should also be blacklisted',
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

  it('should handle wildcards in blacklist paths', () => {
    const reduxData = {
      key1: 'not blacklisted',
      key2: {
        keyA: {
          key1: 'blacklisted',
        },
        keyB: {
          key1: 'blacklisted',
        },
        keyC: {
          key1: 'blacklisted',
        },
      },
    };
    const result = getReduxDataString(reduxData, [['key2', '*', 'key1']]);
    const expected = JSON.stringify(
      {
        key1: 'not blacklisted',
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

  it('should handle nested wildcards in blacklist paths', () => {
    const reduxData = {
      key1: 'not blacklisted',
      key2: {
        keyA: {
          key1: 'blacklisted',
          key2: {
            key3: 'blacklisted',
          },
        },
        keyB: {
          key1: 'blacklisted',
          key2: {
            key3: 'blacklisted',
            key4: 'blacklisted',
          },
        },
      },
    };
    const result = getReduxDataString(reduxData, [['key2', '*', '*']]);
    const expected = JSON.stringify(
      {
        key1: 'not blacklisted',
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

  it('should handle wildcard blacklist paths with no matches', () => {
    const reduxData = {
      key1: 'not blacklisted',
      key2: {
        keyA: {
          key1: 'not blacklisted',
          key2: {
            key3: 'not blacklisted',
          },
        },
      },
    };
    const result = getReduxDataString(reduxData, [['*', '*', '*', '*', '*']]); // Matching more than the depth of the object
    const expected = JSON.stringify(reduxData, null, 2);
    expect(result).toBe(expected);
  });

  it('root wildcard should blacklist all', () => {
    const reduxData = {
      key1: 'should not be blacklisted',
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
