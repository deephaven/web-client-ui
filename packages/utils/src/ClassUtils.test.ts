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
  it('should return all method names in the prototype chain', () => {
    const instance = new Ccc();

    const methodNames = getAllMethodNames(instance);

    expect(methodNames).toEqual(['getAaa', 'getBbb', 'getCcc', 'getCcc2']);
  });
});

describe('bindAllMethods', () => {
  it('should bind all methods in the prototype chain', () => {
    const instance = new Ccc();

    bindAllMethods(instance);

    const { getAaa, getBbb, getCcc, getCcc2 } = instance;

    expect(getAaa()).toEqual('Aaa');
    expect(getBbb()).toEqual('Bbb');
    expect(getCcc()).toEqual('Ccc');
    expect(getCcc2()).toEqual('Ccc');
  });
});
