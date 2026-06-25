import dh from '@deephaven/jsapi-shim';
import IrisGridModel from './IrisGridModel';
import IrisGridProxyModel from './IrisGridProxyModel';
import IrisGridTestUtils from './IrisGridTestUtils';
import { type PartitionConfig } from './PartitionedGridModel';

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

  describe('has trap', () => {
    it('resolves `in` checks against the inner model', () => {
      Object.defineProperty(underlyingModel, 'testUnderlyingMember', {
        value: 'underlying',
        writable: true,
        configurable: true,
      });
      expect('testUnderlyingMember' in proxyModel).toBe(true);
    });

    it('returns false for properties on neither the proxy nor inner model', () => {
      expect('someUndefinedProperty' in proxyModel).toBe(false);
    });
  });

  describe('setModel', () => {
    it('dispatches SCHEMA_CHANGED when swapping to a different inner model', () => {
      const handleSchemaChanged = jest.fn();
      proxyModel.addEventListener(
        IrisGridModel.EVENT.SCHEMA_CHANGED,
        handleSchemaChanged
      );
      const newModel = irisGridTestUtils.makeModel();
      proxyModel.setModel(newModel);
      expect(handleSchemaChanged).toHaveBeenCalledTimes(1);
      expect(handleSchemaChanged.mock.calls[0][0].detail).toBe(newModel);
    });

    it('does not dispatch SCHEMA_CHANGED when setting the same model', () => {
      const handleSchemaChanged = jest.fn();
      proxyModel.addEventListener(
        IrisGridModel.EVENT.SCHEMA_CHANGED,
        handleSchemaChanged
      );
      proxyModel.setModel(proxyModel.model);
      expect(handleSchemaChanged).not.toHaveBeenCalled();
    });
  });

  describe('set partitionConfig', () => {
    const mockPartitionedTable = {
      getMergedTable: jest.fn(() =>
        Promise.resolve(irisGridTestUtils.makeTable())
      ),
      getKeyTable: jest.fn(() =>
        Promise.resolve(irisGridTestUtils.makeTable())
      ),
      getKeys: jest.fn(() => Promise.resolve([])),
      getTable: jest.fn(() => Promise.resolve(irisGridTestUtils.makeTable())),
      keyColumns: [],
      columns: [],
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    let setNextModelSpy: jest.SpyInstance;

    beforeEach(() => {
      setNextModelSpy = jest
        .spyOn(IrisGridProxyModel.prototype, 'setNextModel')
        .mockImplementation(() => null);
    });

    afterEach(() => {
      setNextModelSpy.mockRestore();
    });

    function makePartitionedModel() {
      return irisGridTestUtils.makeModel(
        mockPartitionedTable as unknown as Parameters<
          typeof irisGridTestUtils.makeModel
        >[0]
      );
    }

    it('does not swap model when the same config reference is set again', () => {
      const model = makePartitionedModel();
      const config: PartitionConfig = { mode: 'partition', partitions: ['a'] };
      model.partitionConfig = config;
      setNextModelSpy.mockClear();
      model.partitionConfig = config;
      expect(setNextModelSpy).not.toHaveBeenCalled();
    });

    it('does not swap model when a structurally equal config is set', () => {
      const model = makePartitionedModel();
      model.partitionConfig = { mode: 'partition', partitions: ['a'] };
      setNextModelSpy.mockClear();
      model.partitionConfig = { mode: 'partition', partitions: ['a'] };
      expect(setNextModelSpy).not.toHaveBeenCalled();
    });

    it('swaps model when mode changes', () => {
      const model = makePartitionedModel();
      model.partitionConfig = { mode: 'partition', partitions: ['a'] };
      setNextModelSpy.mockClear();
      model.partitionConfig = { mode: 'merged', partitions: ['a'] };
      expect(setNextModelSpy).toHaveBeenCalled();
    });

    it('swaps model when partition values change', () => {
      const model = makePartitionedModel();
      model.partitionConfig = { mode: 'partition', partitions: ['a'] };
      setNextModelSpy.mockClear();
      model.partitionConfig = { mode: 'partition', partitions: ['b'] };
      expect(setNextModelSpy).toHaveBeenCalled();
    });
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
