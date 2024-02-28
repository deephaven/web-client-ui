import createMockProxy, { MockProxySymbol } from './MockProxy';

describe('createMockProxy', () => {
  it('should proxy property access as jest.fn() unless explicitly set', () => {
    const mock = createMockProxy<Record<string, unknown>>({
      name: 'mock.name',
    });

    expect(mock.name).toEqual('mock.name');
    expect(mock.propA).toBeInstanceOf(jest.fn().constructor);
    expect(mock.propB).toBeInstanceOf(jest.fn().constructor);
  });

  it('should not interfere with `await` by not proxying `then` property', async () => {
    const mock = createMockProxy<Record<string, unknown>>({});
    expect(mock.then).toBeUndefined();

    const result = await mock;

    expect(result).toBe(mock);
  });

  it('should only show `in` for explicit properties', () => {
    const mock = createMockProxy<Record<string, unknown>>({
      name: 'mock.name',
      age: 42,
    });

    expect('name' in mock).toBeTruthy();
    expect('age' in mock).toBeTruthy();
    expect('blah' in mock).toBeFalsy();
  });

  it.each([
    Symbol.iterator,
    'then',
    'asymmetricMatch',
    'hasAttribute',
    'nodeType',
    'ref',
    'tagName',
    'toJSON',
  ])('should return undefined for default props', prop => {
    const mock = createMockProxy();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((mock as any)[prop]).toBeUndefined();
  });

  it('should return custom Symbol.toStringTag', () => {
    const mock = createMockProxy();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((mock as any)[Symbol.toStringTag]).toEqual('Mock Proxy');
  });

  it('should return internal storage by name', () => {
    const overrides = {
      name: 'mock.name',
      age: 42,
    };

    const mock = createMockProxy<{
      name: string;
      age: number;
      testMethod: () => void;
    }>(overrides);

    mock.testMethod();

    expect(mock[MockProxySymbol.defaultProps]).toEqual({
      then: undefined,
      asymmetricMatch: undefined,
      hasAttribute: undefined,
      nodeType: undefined,
      ref: undefined,
      tagName: undefined,
      toJSON: undefined,
      [Symbol.iterator]: undefined,
    });

    expect(mock[MockProxySymbol.overrides]).toEqual(overrides);

    expect(mock[MockProxySymbol.proxies]).toEqual({
      testMethod: expect.any(Function),
    });
    expect(mock.testMethod).toBeInstanceOf(jest.fn().constructor);
  });

  it.each([undefined, 'some label'])('should be spreadable: %s', label => {
    const overrides = {
      name: 'mock.name',
      age: 42,
    };

    const mock = createMockProxy<{
      name: string;
      age: number;
      testMethod: () => void;
    }>(overrides, { label });

    expect({ ...mock }).toEqual({
      [MockProxySymbol.labelSymbol]: label ?? 'Mock Proxy',
      name: 'mock.name',
      age: 42,
    });
  });

  it.each([undefined, true, false])(
    'should include accessed auto proxy props if includeAutoProxiesInOwnKeys is true: %s',
    includeAutoProxiesInOwnKeys => {
      const overrides = {
        name: 'mock.name',
        age: 42,
      };

      const mock = createMockProxy<{
        name: string;
        age: number;
        testMethod: () => void;
      }>(overrides, { includeAutoProxiesInOwnKeys });

      const expectedBase = {
        [MockProxySymbol.labelSymbol]: 'Mock Proxy',
        name: 'mock.name',
        age: 42,
      };

      expect({ ...mock }).toEqual(expectedBase);

      mock.testMethod();

      if (includeAutoProxiesInOwnKeys === true) {
        expect({ ...mock }).toEqual({
          ...expectedBase,
          testMethod: expect.any(Function),
        });
      } else {
        expect({ ...mock }).toEqual(expectedBase);
      }
    }
  );
});
