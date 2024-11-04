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
        key2: 'Circular ref to root',
      },
      null,
      2
    );
    expect(result).toBe(expected);
  });

  it('should handle BigInt values', () => {
    const reduxData = {
      key1: BigInt('12345678901234567890'),
    };
    const result = getReduxDataString(reduxData);
    const expected = JSON.stringify(
      {
        key1: '12345678901234567890',
      },
      null,
      2
    );
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
});
