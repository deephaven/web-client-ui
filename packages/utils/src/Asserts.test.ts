import { assertNever, assertNotNull, getOrThrow } from './Asserts';

describe('assertNever', () => {
  it.each([undefined, 'mock.name'])('should throw if called', name => {
    const value = 'mock.value';

    expect(() => assertNever(value as never, name)).toThrow(
      name == null
        ? `Unexpected value: ${value}`
        : `Unexpected '${name}': ${value}`
    );
  });
});

it('throws an error when a value is null', () => {
  expect(() => assertNotNull(null)).toThrowError('Value is null or undefined');
  expect(() => assertNotNull(null, 'Custom error message')).toThrowError(
    'Custom error message'
  );
});

describe('getOrThrow', () => {
  const MAP = new Map([
    [5, 10],
    [6, 16],
    [10, 50],
    [100, 250],
  ]);

  it('gets the value if it exists', () => {
    expect(getOrThrow(MAP, 5)).toBe(10);
    expect(getOrThrow(MAP, 6)).toBe(16);
    expect(getOrThrow(MAP, 10)).toBe(50);
    expect(getOrThrow(MAP, 100)).toBe(250);
  });

  it('gets the value if it exists even if default provided', () => {
    expect(getOrThrow(MAP, 5, 7)).toBe(10);
    expect(getOrThrow(MAP, 6, 7)).toBe(16);
    expect(getOrThrow(MAP, 10, 7)).toBe(50);
    expect(getOrThrow(MAP, 100, 7)).toBe(250);
  });

  it('throws if no value set', () => {
    expect(() => getOrThrow(MAP, 0)).toThrow();
  });

  it('returns default value if provided', () => {
    expect(getOrThrow(MAP, 0, 7)).toBe(7);
  });
});
