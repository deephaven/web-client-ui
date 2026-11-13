import { removeDefaultValues, restoreDefaultValues } from './ObjectUtils';

type TestObject = {
  flag: boolean;
  name: string;
  list: string[];
  nested: { a: number[]; b: boolean };
  other?: string;
};

const DEFAULTS: Partial<TestObject> = Object.freeze({
  flag: false,
  name: '',
  list: [],
  nested: { a: [], b: false },
});

function makeObject(): TestObject {
  return {
    flag: false,
    name: 'name',
    list: [],
    nested: { a: [], b: false },
    other: 'other',
  };
}

describe('removeDefaultValues', () => {
  it('removes keys whose values deep-equal their defaults', () => {
    expect(removeDefaultValues(makeObject(), DEFAULTS)).toEqual({
      name: 'name',
      other: 'other',
    });
  });

  it('keeps values that differ from their defaults', () => {
    const obj: TestObject = {
      flag: true,
      name: 'name',
      list: ['a'],
      nested: { a: [1], b: false },
    };
    expect(removeDefaultValues(obj, DEFAULTS)).toEqual(obj);
  });

  it('does not modify the input', () => {
    const obj = makeObject();
    removeDefaultValues(obj, DEFAULTS);
    expect(obj).toEqual(makeObject());
  });
});

describe('restoreDefaultValues', () => {
  it('restores an object without defaults to its original value', () => {
    expect(
      restoreDefaultValues(
        removeDefaultValues(makeObject(), DEFAULTS),
        DEFAULTS
      )
    ).toEqual(makeObject());
  });

  it('fills in undefined values but keeps other values', () => {
    expect(
      restoreDefaultValues<TestObject>(
        { flag: undefined, name: 'name', list: ['a'] },
        DEFAULTS
      )
    ).toEqual({
      flag: false,
      name: 'name',
      list: ['a'],
      nested: { a: [], b: false },
    });
  });

  it('leaves an object with every key unchanged', () => {
    expect(restoreDefaultValues(makeObject(), DEFAULTS)).toEqual(makeObject());
  });

  it('does not share default values between results', () => {
    const restored = restoreDefaultValues<TestObject>({}, DEFAULTS);
    expect(restored.list).not.toBe(DEFAULTS.list);
    expect(restored.nested).not.toBe(DEFAULTS.nested);
    expect(restored.nested.a).not.toBe(DEFAULTS.nested?.a);
  });

  it('does not modify the input', () => {
    const obj = { name: 'name' };
    restoreDefaultValues<TestObject>(obj, DEFAULTS);
    expect(obj).toEqual({ name: 'name' });
  });
});
