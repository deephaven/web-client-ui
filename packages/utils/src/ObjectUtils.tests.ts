import { getChangedKeys } from './ObjectUtils';

describe('getChangedKeys', () => {
  it('should get changed keys', () => {
    const oldObject = {
      foo: 'bar',
      baz: 'qux',
      quux: 'corge',
    };
    const newObject = {
      foo: 'bar',
      baz: 'quux',
      quux: 'corge',
    };
    expect(getChangedKeys(oldObject, newObject)).toEqual(['baz']);
  });
  it('should get changed keys when old object is empty', () => {
    const oldObject = {};
    const newObject = {
      foo: 'bar',
      baz: 'qux',
      quux: 'corge',
    };
    expect(getChangedKeys(oldObject, newObject)).toEqual([
      'foo',
      'baz',
      'quux',
    ]);
  });
  it('should get changed keys when new object is empty', () => {
    const oldObject = {
      foo: 'bar',
      baz: 'qux',
      quux: 'corge',
    };
    const newObject = {};
    expect(getChangedKeys(oldObject, newObject)).toEqual([
      'foo',
      'baz',
      'quux',
    ]);
  });
  it('should get no changed keys when both objects are empty', () => {
    const oldObject = {};
    const newObject = {};
    expect(getChangedKeys(oldObject, newObject)).toEqual([]);
  });
  it('should get no changed keys when both objects are the same', () => {
    const oldObject = {
      foo: 'bar',
      baz: 'qux',
      quux: 'corge',
    };
    const newObject = {
      foo: 'bar',
      baz: 'qux',
      quux: 'corge',
    };
    expect(getChangedKeys(oldObject, newObject)).toEqual([]);
  });
});
