import { getOrThrow, trimMap } from './GridMetricCalculator';

describe('trimMap', () => {
  function makeMap(low = 0, high = 10): Map<number, number> {
    const map = new Map();
    for (let i = low; i <= high; i += 1) {
      map.set(i, i);
    }
    return map;
  }

  function expectResult(
    map: Map<number, number>,
    expectedMap: Map<number, number>,
    cacheSize = 10,
    targetSize = 5
  ) {
    trimMap(map, cacheSize, targetSize);
    expect(map.size).toEqual(expectedMap.size);
    const iter = map.entries();
    const expectedIter = expectedMap.entries();
    let iterValue = iter.next();
    let expectedIterValue = expectedIter.next();
    while (iterValue.done === undefined) {
      expect(iterValue.value[0]).toEqual(expectedIterValue.value[0]);
      expect(iterValue.value[1]).toEqual(expectedIterValue.value[1]);
      iterValue = iter.next();
      expectedIterValue = expectedIter.next();
    }
  }

  it('does not change map if within trim size', () => {
    expectResult(new Map(), new Map());
    expectResult(makeMap(0, 0), makeMap(0, 0));
    expectResult(makeMap(0, 9), makeMap(0, 9));
  });

  it('trims map if larger than cache size', () => {
    expectResult(makeMap(0, 10), makeMap(6, 10));
    expectResult(makeMap(0, 100), makeMap(96, 100));
    expectResult(makeMap(0, 100), makeMap(51, 100), 100, 50);
  });
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
