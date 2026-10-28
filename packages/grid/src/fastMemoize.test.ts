import fastMemoize from './fastMemoize';

describe('fastMemoize', () => {
  it('returns the same value as the wrapped function', () => {
    const memoized = fastMemoize((value: number) => value * 2, 10);

    expect(memoized(2)).toBe(4);
    expect(memoized(3)).toBe(6);
  });

  it('calls the wrapped function once per distinct argument', () => {
    const fn = jest.fn((value: number) => value * 2);
    const memoized = fastMemoize(fn, 10);

    expect(memoized(2)).toBe(4);
    expect(memoized(2)).toBe(4);
    expect(fn).toHaveBeenCalledTimes(1);

    expect(memoized(3)).toBe(6);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('returns the cached result itself rather than a copy', () => {
    const memoized = fastMemoize((value: number) => ({ value }), 10);

    expect(memoized(1)).toBe(memoized(1));
  });

  it('keys on every argument', () => {
    const fn = jest.fn((a: number, b: number) => a + b);
    const memoized = fastMemoize(fn, 10);

    expect(memoized(1, 2)).toBe(3);
    expect(memoized(1, 3)).toBe(4);
    expect(fn).toHaveBeenCalledTimes(2);

    expect(memoized(1, 2)).toBe(3);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('treats argument order as significant', () => {
    const fn = jest.fn((a: number, b: number) => `${a}:${b}`);
    const memoized = fastMemoize(fn, 10);

    expect(memoized(1, 2)).toBe('1:2');
    expect(memoized(2, 1)).toBe('2:1');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('caches a call with no arguments', () => {
    const fn = jest.fn(() => 'result');
    const memoized = fastMemoize(fn, 10);

    expect(memoized()).toBe('result');
    expect(memoized()).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('caches an undefined result', () => {
    const fn = jest.fn((value: number) => (value > 0 ? value : undefined));
    const memoized = fastMemoize(fn, 10);

    expect(memoized(0)).toBeUndefined();
    expect(memoized(0)).toBeUndefined();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  describe('key collisions', () => {
    it('does not collide values of different types', () => {
      const fn = jest.fn((value: unknown) => typeof value);
      const memoized = fastMemoize(fn, 10);

      expect(memoized(1)).toBe('number');
      expect(memoized('1')).toBe('string');
      expect(memoized(true)).toBe('boolean');
      expect(memoized('true')).toBe('string');
      expect(memoized(undefined)).toBe('undefined');
      expect(memoized('undefined')).toBe('string');
      expect(memoized(null)).toBe('object');
      expect(memoized('null')).toBe('string');

      expect(fn).toHaveBeenCalledTimes(8);
    });

    it('does not collide when an argument contains the separator', () => {
      const fn = jest.fn((...args: string[]) => args.join('|'));
      const memoized = fastMemoize(fn, 10);

      expect(memoized('a\u0000b')).toBe('a\u0000b');
      expect(memoized('a', 'b')).toBe('a|b');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does not collide when arguments contain the separator and type tag', () => {
      const fn = jest.fn((...args: string[]) => args.join('|'));
      const memoized = fastMemoize(fn, 10);

      expect(memoized('a\u0000string\u0002b', 'c')).toBe(
        'a\u0000string\u0002b|c'
      );
      expect(memoized('a', 'b\u0000string\u0002c')).toBe(
        'a|b\u0000string\u0002c'
      );
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does not collide truncation calls whose text and truncation char contain key sequences', () => {
      const truncate = jest.fn(
        (
          _context: object,
          text: string,
          width: number,
          fontWidthLower: number,
          fontWidthUpper: number,
          truncationChar: string
        ) =>
          `${text}|${width}|${fontWidthLower}|${fontWidthUpper}|${truncationChar}`
      );
      const memoized = fastMemoize(truncate, 10);
      const context = {};
      const numberFragment = (value: number): string =>
        `\u0000number\u0002${value}`;
      const stringTag = '\u0000string\u0002';

      // The text of the first call spells out the numeric arguments of the
      // second, and the second's truncation char spells out the first's
      const firstText = `abc${numberFragment(100)}${numberFragment(
        5
      )}${numberFragment(9)}${stringTag}…`;
      const secondTruncationChar = `…${numberFragment(1)}${numberFragment(
        1
      )}${numberFragment(1)}${stringTag}…`;

      const first = memoized(context, firstText, 1, 1, 1, '…');
      const second = memoized(context, 'abc', 100, 5, 9, secondTruncationChar);

      expect(first).toBe(`${firstText}|1|1|1|…`);
      expect(second).toBe(`abc|100|5|9|${secondTruncationChar}`);
      expect(truncate).toHaveBeenCalledTimes(2);
    });

    it('does not collide a call with no arguments and an explicit undefined', () => {
      const fn = jest.fn((...args: unknown[]) => args.length);
      const memoized = fastMemoize(fn, 10);

      expect(memoized()).toBe(0);
      expect(memoized(undefined)).toBe(1);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('treats a missing argument as distinct from an explicit undefined', () => {
      const fn = jest.fn((a: string, b?: string) => `${a}/${b}`);
      const memoized = fastMemoize(fn, 10);

      expect(memoized('a')).toBe('a/undefined');
      expect(memoized('a', undefined)).toBe('a/undefined');
      // The argument count is part of the key, so this caches an extra entry
      // rather than risking a collision with a genuinely different call
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('object arguments', () => {
    it('keys objects by identity rather than contents', () => {
      const fn = jest.fn((target: { id: number }) => target.id);
      const memoized = fastMemoize(fn, 10);
      const first = { id: 1 };
      const second = { id: 1 };

      expect(memoized(first)).toBe(1);
      expect(memoized(first)).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);

      expect(memoized(second)).toBe(1);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('keys functions by identity', () => {
      const fn = jest.fn((callback: () => number) => callback());
      const memoized = fastMemoize(fn, 10);
      const first = (): number => 1;
      const second = (): number => 1;

      expect(memoized(first)).toBe(1);
      expect(memoized(first)).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);

      expect(memoized(second)).toBe(1);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does not collide an object with a primitive', () => {
      const fn = jest.fn((value: unknown) => typeof value);
      const memoized = fastMemoize(fn, 10);
      const target = {};

      expect(memoized(target)).toBe('object');
      expect(memoized(String(target))).toBe('string');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('keys symbols by identity rather than description', () => {
      const fn = jest.fn((value: symbol) => value);
      const memoized = fastMemoize(fn, 10);
      const first = Symbol('a');
      const second = Symbol('a');

      expect(memoized(first)).toBe(first);
      expect(memoized(second)).toBe(second);
      expect(memoized(first)).toBe(first);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  it('matches long strings by value', () => {
    const fn = jest.fn((text: string) => text.length);
    const memoized = fastMemoize(fn, 10);
    const text = 'x'.repeat(25000);

    expect(memoized(text)).toBe(25000);
    // Built separately so it is a different string instance with equal contents
    expect(memoized(['x'.repeat(12500), 'x'.repeat(12500)].join(''))).toBe(
      25000
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  describe('cache limit', () => {
    it('clears the whole cache once it fills', () => {
      const fn = jest.fn((value: number) => value * 2);
      const memoized = fastMemoize(fn, 2);

      memoized(1);
      memoized(2);
      expect(fn).toHaveBeenCalledTimes(2);

      // Still cached while at the limit
      expect(memoized(1)).toBe(2);
      expect(fn).toHaveBeenCalledTimes(2);

      // A third entry hits the limit and drops the earlier ones
      expect(memoized(3)).toBe(6);
      expect(fn).toHaveBeenCalledTimes(3);

      expect(memoized(1)).toBe(2);
      expect(fn).toHaveBeenCalledTimes(4);
    });

    it('keeps returning correct results after clearing', () => {
      const memoized = fastMemoize((value: number) => value * 2, 2);

      for (let i = 0; i < 10; i += 1) {
        expect(memoized(i)).toBe(i * 2);
      }
      for (let i = 0; i < 10; i += 1) {
        expect(memoized(i)).toBe(i * 2);
      }
    });
  });

  it('gives each memoized function its own cache', () => {
    const first = jest.fn((value: number) => value + 1);
    const second = jest.fn((value: number) => value + 2);
    const memoizedFirst = fastMemoize(first, 10);
    const memoizedSecond = fastMemoize(second, 10);

    expect(memoizedFirst(1)).toBe(2);
    expect(memoizedSecond(1)).toBe(3);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});
