import dh from '@deephaven/jsapi-shim';
import type IrisGridModel from './IrisGridModel';
import type IrisGridProxyModel from './IrisGridProxyModel';
import IrisGridTestUtils from './IrisGridTestUtils';

const irisGridTestUtils = new IrisGridTestUtils(dh);

type TestUnderlyingModel = IrisGridModel & {
  testUnderlyingMember: string;
  testUnderlyingFunction: () => void;
  get testUnderlyingGetter(): string;
  set testUnderlyingSetter(value: string);
  testMember: string;
  testFunction: () => void;
  get testGetter(): string;
  set testSetter(value: string);
};

type TestProxyModel = IrisGridProxyModel & TestUnderlyingModel;

describe('IrisGridProxyModel', () => {
  let proxyModel: TestProxyModel;
  let underlyingModel: TestUnderlyingModel;

  beforeEach(() => {
    proxyModel = irisGridTestUtils.makeModel() as TestProxyModel;
    underlyingModel = proxyModel.model as TestUnderlyingModel;
  });

  // Getters must be set on prototype
  test('Proxies getting members when necessary', () => {
    Object.defineProperty(proxyModel, 'testMember', {
      value: 'proxy',
      writable: true,
    });
    Object.defineProperty(underlyingModel, 'testMember', {
      value: 'underlying',
      writable: true,
    });
    Object.defineProperty(underlyingModel, 'testUnderlyingMember', {
      value: 'underlying',
      writable: true,
    });

    expect(proxyModel.testMember).toBe('proxy');
    expect(proxyModel.testUnderlyingMember).toBe('underlying');
    expect(underlyingModel.testMember).toBe('underlying');
  });

  test('Proxies getters when necessary', () => {
    const testGetter = jest.fn(() => 'proxy');
    const testUnderlyingGetter = jest.fn(() => 'underlying');
    Object.defineProperty(Object.getPrototypeOf(proxyModel), 'testGetter', {
      get() {
        return testGetter();
      },
    });
    Object.defineProperty(
      Object.getPrototypeOf(underlyingModel),
      'testGetter',
      {
        get() {
          return testUnderlyingGetter();
        },
      }
    );
    Object.defineProperty(
      Object.getPrototypeOf(underlyingModel),
      'testUnderlyingGetter',
      {
        get() {
          return testUnderlyingGetter();
        },
      }
    );

    expect(proxyModel.testGetter).toBe('proxy');
    expect(proxyModel.testUnderlyingGetter).toBe('underlying');
    expect(underlyingModel.testGetter).toBe('underlying');
    expect(testGetter).toHaveBeenCalledTimes(1);
    expect(testUnderlyingGetter).toHaveBeenCalledTimes(2);
  });

  test('Proxies setting members when necessary', () => {
    Object.defineProperty(proxyModel, 'testMember', {
      value: 'proxy',
      writable: true,
    });
    Object.defineProperty(underlyingModel, 'testMember', {
      value: 'underlying',
      writable: true,
    });
    Object.defineProperty(underlyingModel, 'testUnderlyingMember', {
      value: 'underlying',
      writable: true,
    });

    proxyModel.testMember = 'proxy2';
    proxyModel.testUnderlyingMember = 'underlying2';

    expect(
      Object.getOwnPropertyDescriptor(proxyModel, 'testMember')?.value
    ).toBe('proxy2');
    expect(underlyingModel.testUnderlyingMember).toBe('underlying2');
    expect(underlyingModel.testMember).toBe('underlying');
  });

  // Setters must be set on prototype
  test('Proxies setters when necessary', () => {
    const testSetter = jest.fn();
    const testUnderlyingSetter = jest.fn();
    Object.defineProperty(Object.getPrototypeOf(proxyModel), 'testSetter', {
      set: testSetter,
    });
    Object.defineProperty(
      Object.getPrototypeOf(underlyingModel),
      'testSetter',
      {
        set: testUnderlyingSetter,
      }
    );
    Object.defineProperty(
      Object.getPrototypeOf(underlyingModel),
      'testUnderlyingSetter',
      {
        set: testUnderlyingSetter,
      }
    );

    proxyModel.testSetter = 'proxy';
    proxyModel.testUnderlyingSetter = 'underlying';

    expect(testSetter).toHaveBeenCalledWith('proxy');
    expect(testSetter).toHaveBeenCalledTimes(1);
    expect(testUnderlyingSetter).toHaveBeenCalledWith('underlying');
    expect(testUnderlyingSetter).toHaveBeenCalledTimes(1);
  });

  // Functions must be set on prototype
  test('Proxies functions when necessary', () => {
    const testFn = jest.fn();
    const testUnderlyingFn = jest.fn();
    Object.defineProperty(Object.getPrototypeOf(proxyModel), 'testFunction', {
      value: testFn,
    });
    Object.defineProperty(
      Object.getPrototypeOf(underlyingModel),
      'testFunction',
      {
        value: testUnderlyingFn,
      }
    );
    Object.defineProperty(
      Object.getPrototypeOf(underlyingModel),
      'testUnderlyingFunction',
      {
        value: testUnderlyingFn,
      }
    );

    proxyModel.testFunction();
    proxyModel.testUnderlyingFunction();

    expect(testFn).toHaveBeenCalledTimes(1);
    expect(testUnderlyingFn).toHaveBeenCalledTimes(1);
  });
});
