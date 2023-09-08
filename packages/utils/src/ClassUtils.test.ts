/* eslint-disable max-classes-per-file */
import { bindAllMethods, getAllMethodNames } from './ClassUtils';

class Aaa {
  nameA = 'Aaa';

  getAaa() {
    return this.nameA;
  }
}

class Bbb extends Aaa {
  nameB = 'Bbb';

  getBbb() {
    return this.nameB;
  }
}

class Ccc extends Bbb {
  nameC = 'Ccc';

  getCcc() {
    return this.nameC;
  }

  getCcc2 = () => this.nameC;
}

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('getAllMethodNames', () => {
  it.each([true, false])(
    'should return all method names: %s',
    traversePrototypeChain => {
      const instance = new Ccc();

      const methodNames = getAllMethodNames(
        instance,
        traversePrototypeChain
      ).sort();

      if (traversePrototypeChain) {
        expect(methodNames).toEqual(['getAaa', 'getBbb', 'getCcc', 'getCcc2']);
      } else {
        expect(methodNames).toEqual(['getCcc', 'getCcc2']);
      }
    }
  );
});

describe('bindAllMethods', () => {
  it.each([true, false, undefined])(
    'should bind all methods: %s',
    traversePrototypeChain => {
      const instance = new Ccc();

      bindAllMethods(instance, traversePrototypeChain);

      const { getAaa, getBbb, getCcc, getCcc2 } = instance;

      if (traversePrototypeChain === true) {
        expect(getAaa()).toEqual('Aaa');
        expect(getBbb()).toEqual('Bbb');
      } else {
        expect(() => getAaa()).toThrow(
          "Cannot read properties of undefined (reading 'nameA')"
        );
        expect(() => getBbb()).toThrow(
          "Cannot read properties of undefined (reading 'nameB')"
        );
      }

      expect(getCcc()).toEqual('Ccc');
      expect(getCcc2()).toEqual('Ccc');
    }
  );
});
